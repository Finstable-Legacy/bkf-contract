import {
  BKF,
  BKFToken,
  BKF__factory,
  TestAdminKAP20Router,
  TestAdminProjectRouter,
  TestDiamonFactory,
  TestDiamonRouter,
  TestERC20,
  TestKKUB,
  TestKUSDT,
  TestKYCBitkubChainV2,
  TestNextTransferRouter,
} from "../typechain";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { formatEther, parseEther, parseUnits } from "ethers/lib/utils";
import { constants } from "ethers";
import { expect } from "chai";
import timeUtils from "../utils/time";
import {
  deployBKFToken,
  deployTestAdminKAP20Router,
  deployTestAdminProjectRouter,
  deployTestERC20,
  deployTestKKUB,
  deployTestKUSDT,
  deployTestKYC,
  deployTestNextTransferRouter,
  deployTestSwapFactory,
  deployTestSwapRouter,
} from "./shared/deployer";

describe("BKF", function () {
  let rootAdmin: SignerWithAddress;
  let customer: SignerWithAddress;
  let merchant: SignerWithAddress;
  let feeClaimer: SignerWithAddress;
  let callHelper: SignerWithAddress;

  let bkf: BKF;

  let busd: TestERC20;
  let dai: TestERC20;
  let kkub: TestKKUB;
  let kusdt: TestKUSDT;
  let bkfToken: BKFToken;

  let kyc: TestKYCBitkubChainV2;
  let transferRouter: TestNextTransferRouter;
  let adminProjectRouter: TestAdminProjectRouter;
  let adminKAP20Router: TestAdminKAP20Router;

  let swapFactory: TestDiamonFactory;
  let swapRouter: TestDiamonRouter;

  let initialBalance = parseEther("1000");
  let poolAmount = parseEther("1000");
  let productPrice = parseEther("1");

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    rootAdmin = signers[0];
    customer = signers[1];
    merchant = signers[2];
    feeClaimer = signers[3];
    callHelper = signers[4];

    const committee = rootAdmin.address;
    const acceptedKYCLevel = 0;

    kyc = await deployTestKYC();
    adminProjectRouter = await deployTestAdminProjectRouter();

    kkub = await deployTestKKUB();
    kusdt = await deployTestKUSDT(
      adminProjectRouter.address,
      committee,
      kyc.address,
      acceptedKYCLevel
    );

    adminKAP20Router = await deployTestAdminKAP20Router(
      adminProjectRouter.address,
      committee,
      kkub.address,
      kyc.address,
      acceptedKYCLevel
    );

    transferRouter = await deployTestNextTransferRouter(
      adminProjectRouter.address,
      adminKAP20Router.address,
      committee,
      kkub.address,
      [kusdt.address]
    );

    bkfToken = await deployBKFToken(
      undefined,
      committee,
      kyc.address,
      transferRouter.address,
      acceptedKYCLevel
    );

    busd = await deployTestERC20("Binance USD", "BUSD", [rootAdmin.address]);
    dai = await deployTestERC20("DAI", "DAI", [rootAdmin.address]);

    swapFactory = await deployTestSwapFactory();

    // console.log("INIT_CODE_PAIR_HASH", await swapFactory.INIT_CODE_PAIR_HASH());

    swapRouter = await deployTestSwapRouter(swapFactory.address, kkub.address);

    const BKF = (await ethers.getContractFactory("BKF")) as BKF__factory;
    bkf = await BKF.deploy(
      swapRouter.address,
      rootAdmin.address,
      feeClaimer.address,
      kyc.address,
      committee,
      transferRouter.address,
      callHelper.address,
      acceptedKYCLevel
    );

    await busd.connect(rootAdmin).transfer(customer.address, initialBalance);
    await dai.connect(rootAdmin).transfer(customer.address, initialBalance);
    await kusdt.connect(rootAdmin).transfer(customer.address, initialBalance);
    await bkfToken
      .connect(rootAdmin)
      .transfer(customer.address, initialBalance);

    // AMM
    await busd
      .connect(rootAdmin)
      .approve(swapRouter.address, constants.MaxUint256);
    await dai
      .connect(rootAdmin)
      .approve(swapRouter.address, constants.MaxUint256);
    await kusdt
      .connect(rootAdmin)
      .approve(swapRouter.address, constants.MaxUint256);
    await bkfToken
      .connect(rootAdmin)
      .approve(swapRouter.address, constants.MaxUint256);

    const deadline = timeUtils.now() + timeUtils.duration.minutes(5);
    await swapRouter
      .connect(rootAdmin)
      .addLiquidity(
        bkfToken.address,
        kusdt.address,
        poolAmount,
        poolAmount,
        0,
        0,
        rootAdmin.address,
        deadline
      );
    await swapRouter
      .connect(rootAdmin)
      .addLiquidity(
        busd.address,
        dai.address,
        poolAmount,
        poolAmount,
        0,
        0,
        rootAdmin.address,
        deadline
      );
  });

  describe("Purchase on same token", () => {
    it("Should purchase on metamask successfully", async function () {
      const deadline = timeUtils.now() + timeUtils.duration.minutes(5);

      const merchantInitialBalance = await kusdt.balanceOf(merchant.address);

      await kusdt.connect(customer).approve(bkf.address, constants.MaxUint256);

      await bkf
        .connect(customer)
        .purchase(
          0,
          merchant.address,
          [kusdt.address, kusdt.address],
          productPrice,
          productPrice,
          deadline,
          customer.address
        );

      const merchantEndBalance = await kusdt.balanceOf(merchant.address);

      const fee = await bkf.fee();
      const shifter = await bkf.shifter();

      const collectedFee = productPrice.mul(fee).div(shifter);
      const calculatedOut = productPrice.sub(collectedFee);

      expect(merchantEndBalance.sub(merchantInitialBalance)).to.eq(
        calculatedOut
      );
    });

    it("Should purchase on bitkub next successfully", async function () {
      const deadline = timeUtils.now() + timeUtils.duration.minutes(5);

      const merchantInitialBalance = await kusdt.balanceOf(merchant.address);

      await kusdt.connect(customer).approve(bkf.address, constants.MaxUint256);

      await bkf
        .connect(callHelper)
        .purchase(
          0,
          merchant.address,
          [kusdt.address, kusdt.address],
          productPrice,
          productPrice,
          deadline,
          customer.address
        );

      const merchantEndBalance = await kusdt.balanceOf(merchant.address);

      const fee = await bkf.fee();
      const shifter = await bkf.shifter();

      const collectedFee = productPrice.mul(fee).div(shifter);
      const calculatedOut = productPrice.sub(collectedFee);

      expect(merchantEndBalance.sub(merchantInitialBalance)).to.eq(
        calculatedOut
      );
    });
  });

  describe("Purchase on different token", () => {
    it("Should purchase on metamask successfully", async function () {
      const deadline = timeUtils.now() + timeUtils.duration.minutes(5);

      const merchantInitialBalance = await busd.balanceOf(merchant.address);

      await dai.connect(customer).approve(bkf.address, constants.MaxUint256);

      const inputAmount = await swapRouter.getAmountsIn(productPrice, [
        dai.address,
        busd.address,
      ]);

      await bkf
        .connect(customer)
        .purchase(
          0,
          merchant.address,
          [dai.address, busd.address],
          inputAmount[0],
          productPrice,
          deadline,
          customer.address
        );

      const merchantEndBalance = await busd.balanceOf(merchant.address);

      const fee = await bkf.fee();
      const shifter = await bkf.shifter();

      const collectedFee = productPrice.mul(fee).div(shifter);
      const calculatedOut = productPrice.sub(collectedFee);

      expect(merchantEndBalance.sub(merchantInitialBalance)).to.eq(
        calculatedOut
      );
    });

    it("Should purchase on bitkub next successfully", async function () {
      const deadline = timeUtils.now() + timeUtils.duration.minutes(5);

      const merchantInitialBalance = await kusdt.balanceOf(merchant.address);

      const inputAmount = await swapRouter.getAmountsIn(productPrice, [
        bkfToken.address,
        kusdt.address,
      ]);

      await bkf
        .connect(callHelper)
        .purchase(
          0,
          merchant.address,
          [bkfToken.address, kusdt.address],
          inputAmount[0],
          productPrice,
          deadline,
          customer.address
        );

      const merchantEndBalance = await kusdt.balanceOf(merchant.address);

      const fee = await bkf.fee();
      const shifter = await bkf.shifter();

      const collectedFee = productPrice.mul(fee).div(shifter);
      const calculatedOut = productPrice.sub(collectedFee);

      expect(merchantEndBalance.sub(merchantInitialBalance)).to.eq(
        calculatedOut
      );
    });
  });

  describe("Collect Fee", () => {
    it("Should collect fee successfully", async function () {
      const deadline = timeUtils.now() + timeUtils.duration.minutes(5);

      const feeClaimerInitialBalance = await busd.balanceOf(feeClaimer.address);

      await busd.connect(customer).approve(bkf.address, constants.MaxUint256);

      await bkf
        .connect(customer)
        .purchase(
          0,
          merchant.address,
          [busd.address, busd.address],
          productPrice,
          productPrice,
          deadline,
          customer.address
        );

      const fee = await bkf.fee();
      const shifter = await bkf.shifter();
      const collectedFee = productPrice.mul(fee).div(shifter);

      await bkf
        .connect(feeClaimer)
        .collectFee(busd.address, collectedFee, feeClaimer.address);

      const feeClaimerEndlBalance = await busd.balanceOf(feeClaimer.address);

      expect(feeClaimerEndlBalance.sub(feeClaimerInitialBalance)).to.eq(
        collectedFee
      );
    });
  });

  describe("Admin", () => {
    it("Should correctly change root admin", async function () {
      const newRootAdmin = feeClaimer.address;
      await bkf.changeRootAdmin(newRootAdmin);

      expect(await bkf.rootAdmin()).to.eq(newRootAdmin);
    });

    it("Should correctly change fee", async function () {
      const feeDecimals = await bkf.feeDecimals();
      const newFee = "1";

      const parsedFee = parseUnits(newFee, feeDecimals);

      await bkf.setFee(parsedFee);

      const fee = await bkf.fee();

      expect(fee).to.eq(parsedFee);
    });

    it("Should correctly change fee clamer", async function () {
      const newClaimer = rootAdmin.address;
      await bkf.setFeeClaimer(newClaimer);

      expect(await bkf.feeClaimer()).to.eq(newClaimer);
    });

    it("Should collectly change swap router", async function () {
      const newSwapRouter = rootAdmin.address;
      await bkf.setSwapRouter(newSwapRouter);

      expect(await bkf.swapRouter()).to.eq(newSwapRouter);
    });
  });
});
