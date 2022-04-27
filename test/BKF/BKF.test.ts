import {
  BKF,
  BKF__factory,
  BlockSwapFactory,
  BlockSwapFactory__factory,
  BlockSwapRouter,
  BlockSwapRouter__factory,
  TestAdminKAP20Router,
  TestAdminProjectRouter,
  TestDiamonFactory,
  TestDiamonRouter,
  TestERC20,
  TestKKUB,
  TestKUSDT,
  TestKYCBitkubChainV2,
  TestNextTransferRouter,
  WETH,
  WETH__factory,
} from "../../typechain";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { formatEther, parseEther, parseUnits } from "ethers/lib/utils";
import { constants } from "ethers";
import { expect } from "chai";
import timeUtils from "../../utils/time";
import {
  deployTestAdminKAP20Router,
  deployTestAdminProjectRouter,
  deployTestERC20,
  deployTestKKUB,
  deployTestKUSDT,
  deployTestKYC,
  deployTestNextTransferRouter,
  deployTestSwapFactory,
  deployTestSwapRouter,
} from "../shared/deployer";

describe("BKF", function () {
  let rootAdmin: SignerWithAddress;
  let admin: SignerWithAddress;
  let customer: SignerWithAddress;
  let merchant: SignerWithAddress;
  let feeClaimer: SignerWithAddress;
  let callHelper: SignerWithAddress;

  let bkf: BKF;
  let busd: TestERC20;
  let kkub: TestKKUB;
  let kusdt: TestKUSDT;
  let kyc: TestKYCBitkubChainV2;
  let transferRouter: TestNextTransferRouter;
  let adminProjectRouter: TestAdminProjectRouter;
  let adminKAP20Router: TestAdminKAP20Router;

  let weth: WETH;
  let swapFactory: TestDiamonFactory;
  let swapRouter: TestDiamonRouter;

  let initialBalance = parseEther("100");
  let poolAmount = parseEther("1000");
  let productPrice = parseEther("1");

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    rootAdmin = signers[0];
    admin = signers[1];
    customer = signers[2];
    merchant = signers[3];
    feeClaimer = signers[4];
    callHelper = signers[5];

    const committee = rootAdmin.address;
    const accecptedKYCLevel = 0;

    // --- BLOCK SWAP ---

    // const WETH = (await ethers.getContractFactory("WETH")) as WETH__factory;
    // weth = await WETH.deploy();

    // const SwapFactory = (await ethers.getContractFactory(
    //   "BlockSwapFactory"
    // )) as BlockSwapFactory__factory;
    // swapFactory = await SwapFactory.deploy(rootAdmin.address);

    // // console.log("INIT: ", await swapFactory.INIT_CODE_PAIR_HASH());

    // const SwapRouter = (await ethers.getContractFactory(
    //   "BlockSwapRouter"
    // )) as BlockSwapRouter__factory;
    // swapRouter = await SwapRouter.deploy(swapFactory.address, weth.address);

    // --- BLOCK SWAP ---
    kyc = await deployTestKYC();
    adminProjectRouter = await deployTestAdminProjectRouter();

    busd = await deployTestERC20("Binance USD", "BUSD", [rootAdmin.address]);
    kkub = await deployTestKKUB();
    kusdt = await deployTestKUSDT(
      adminProjectRouter.address,
      committee,
      kyc.address,
      accecptedKYCLevel
    );

    adminKAP20Router = await deployTestAdminKAP20Router(
      adminProjectRouter.address,
      committee,
      kkub.address,
      kyc.address,
      accecptedKYCLevel
    );
    transferRouter = await deployTestNextTransferRouter(
      adminProjectRouter.address,
      adminKAP20Router.address,
      committee,
      kkub.address,
      [kusdt.address]
    );

    swapFactory = await deployTestSwapFactory();
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
      accecptedKYCLevel
    );

    await busd.transfer(customer.address, initialBalance);
    await kusdt.transfer(customer.address, initialBalance);

    // AMM
    // await kusdt.approve(swapRouter.address, constants.MaxUint256);

    // const deadline = timeUtils.now() + timeUtils.duration.minutes(5);
    // await swapRouter.addLiquidityETH(
    //   kusdt.address,
    //   poolAmount,
    //   poolAmount,
    //   poolAmount,
    //   rootAdmin.address,
    //   deadline,
    //   { value: poolAmount }
    // );
    // await swapRouter
    //   .connect(rootAdmin)
    //   .addLiquidity(
    //     busd.address,
    //     kkub.address,
    //     poolAmount,
    //     poolAmount,
    //     0,
    //     0,
    //     rootAdmin.address,
    //     deadline
    //   );
  });

  describe("Purchase", () => {
    it("Should purchase same token on metamask successfully", async function () {
      const deadline = timeUtils.now() + timeUtils.duration.minutes(5);

      const merchantInitialBalance = await busd.balanceOf(merchant.address);

      await busd.connect(customer).approve(bkf.address, constants.MaxUint256);

      await bkf
        .connect(customer)
        .purchase(
          0,
          merchant.address,
          busd.address,
          busd.address,
          productPrice,
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

    it("Should purchase same token on bitkub next successfully", async function () {
      const deadline = timeUtils.now() + timeUtils.duration.minutes(5);

      const merchantInitialBalance = await kusdt.balanceOf(merchant.address);

      await kusdt.connect(customer).approve(bkf.address, constants.MaxUint256);

      await bkf
        .connect(callHelper)
        .purchase(
          0,
          merchant.address,
          kusdt.address,
          kusdt.address,
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
});
