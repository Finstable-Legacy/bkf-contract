import {
  DealerKAP20,
  DealerKAP20__factory,
  TestAdminKAP20Router,
  TestAdminKAP20Router__factory,
  TestAdminProjectRouter,
  TestAdminProjectRouter__factory,
  TestERC20,
  TestERC20__factory,
  TestKKUB,
  TestKKUB__factory,
  TestKYCBitkubChainV2,
  TestKYCBitkubChainV2__factory,
  TestNextTransferRouter,
  TestNextTransferRouter__factory,
} from "../../typechain";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { formatEther, parseEther, parseUnits } from "ethers/lib/utils";
import { constants } from "ethers";
import { expect } from "chai";
import timeUtils from "../../utils/time";

describe("Dealer", function () {
  let rootAdmin: SignerWithAddress;
  let admin: SignerWithAddress;
  let buyer: SignerWithAddress;
  let seller: SignerWithAddress;
  let feeClaimer: SignerWithAddress;
  let callHelper: SignerWithAddress;

  let dealer: DealerKAP20;
  let busd: TestERC20;
  let kkub: TestKKUB;
  let kyc: TestKYCBitkubChainV2;
  let transferRouter: TestNextTransferRouter;
  let adminProjectRouter: TestAdminProjectRouter;
  let adminKAP20Router: TestAdminKAP20Router;

  let initialBalance = parseEther("100");
  let sellAmount = parseEther("10");

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    rootAdmin = signers[0];
    admin = signers[1];
    buyer = signers[2];
    seller = signers[3];
    feeClaimer = signers[4];
    callHelper = signers[5];

    const committee = rootAdmin.address;
    const accecptedKYCLevel = 0;

    const KKUB = (await ethers.getContractFactory(
      "TestKKUB"
    )) as TestKKUB__factory;
    kkub = await KKUB.deploy();

    const TestERC20 = (await ethers.getContractFactory(
      "TestERC20"
    )) as TestERC20__factory;
    busd = await TestERC20.deploy("Binance USD", "BUSD", [rootAdmin.address]);

    const KYC = (await ethers.getContractFactory(
      "TestKYCBitkubChainV2"
    )) as TestKYCBitkubChainV2__factory;
    kyc = await KYC.deploy();

    const AdminProjectRouter = (await ethers.getContractFactory(
      "TestAdminProjectRouter"
    )) as TestAdminProjectRouter__factory;
    adminProjectRouter = await AdminProjectRouter.deploy();

    const AdminKAP20Router = (await ethers.getContractFactory(
      "TestAdminKAP20Router"
    )) as TestAdminKAP20Router__factory;
    adminKAP20Router = await AdminKAP20Router.deploy(
      adminProjectRouter.address,
      committee,
      kkub.address,
      kyc.address,
      accecptedKYCLevel
    );

    const NextTransferRouter = (await ethers.getContractFactory(
      "TestNextTransferRouter"
    )) as TestNextTransferRouter__factory;
    transferRouter = await NextTransferRouter.deploy(
      adminProjectRouter.address,
      adminKAP20Router.address,
      kkub.address,
      committee,
      [busd.address]
    );

    const Dealer = (await ethers.getContractFactory(
      "DealerKAP20"
    )) as DealerKAP20__factory;
    dealer = await Dealer.deploy(
      rootAdmin.address,
      feeClaimer.address,
      kyc.address,
      committee,
      transferRouter.address,
      callHelper.address,
      accecptedKYCLevel
    );

    await busd.transfer(seller.address, initialBalance);

    await dealer.addAdmin(admin.address);
  });

  describe("Sell", () => {
    it("Should be able to complete sell order", async function () {
      await busd.connect(seller).approve(dealer.address, constants.MaxUint256);
      const receipt = await dealer
        .connect(seller)
        .createOrderSell(
          busd.address,
          sellAmount,
          buyer.address,
          seller.address
        )
        .then((tx) => tx.wait());

      const sellCreatedEvent = receipt.events?.find(
        (e) => e.event === "OrderCreated"
      );
      const [_buyer, _sellet, _tokenAddress, _orderId] =
        sellCreatedEvent?.args || [];

      await dealer.connect(buyer).confirmPayOrderSell(_orderId, buyer.address);
      await dealer.connect(seller).releaseToken(_orderId, seller.address);
      await dealer
        .connect(feeClaimer)
        .collectFee(busd.address, constants.MaxUint256, feeClaimer.address);

      const buyerBalance = await busd.balanceOf(buyer.address);
      const claimerBalance = await busd.balanceOf(feeClaimer.address);

      const fee = await dealer.fee();
      const shifter = await dealer.shifter();

      const collectedFee = sellAmount.mul(fee).div(shifter);
      const output = sellAmount.sub(collectedFee);

      expect(buyerBalance).eq(output);
      expect(claimerBalance).eq(collectedFee);
    });

    it("Should not be able to cancel order before timeout", async function () {
      await busd.connect(seller).approve(dealer.address, constants.MaxUint256);
      const receipt = await dealer
        .connect(seller)
        .createOrderSell(
          busd.address,
          sellAmount,
          buyer.address,
          seller.address
        )
        .then((tx) => tx.wait());

      const sellCreatedEvent = receipt.events?.find(
        (e) => e.event === "OrderCreated"
      );
      const [_buyer, _sellet, _tokenAddress, _orderId] =
        sellCreatedEvent?.args || [];

      await expect(
        dealer.connect(seller).cancelOrderSell(_orderId, seller.address)
      ).to.revertedWith("only expired order");
    });

    it("Should be able to cancel order after timeout", async function () {
      await busd.connect(seller).approve(dealer.address, constants.MaxUint256);
      const receipt = await dealer
        .connect(seller)
        .createOrderSell(
          busd.address,
          sellAmount,
          buyer.address,
          seller.address
        )
        .then((tx) => tx.wait());

      const sellCreatedEvent = receipt.events?.find(
        (e) => e.event === "OrderCreated"
      );
      const [_buyer, _sellet, _tokenAddress, _orderId] =
        sellCreatedEvent?.args || [];

      const order = await dealer.orderSells(_orderId);

      const timeDiff = order.deadline.sub(timeUtils.now().toString());

      await timeUtils.increase(
        timeDiff.add(timeUtils.duration.minutes(10).toString()).toNumber()
      );

      await dealer.connect(seller).cancelOrderSell(_orderId, seller.address);

      expect(await busd.balanceOf(seller.address)).to.eq(initialBalance);
    });
  });

  describe("Root Admin", () => {
    it("Should correctly change fee", async function () {
      const feeDecimals = await dealer.feeDecimals();
      const newFee = "0.3";

      const parsedFee = parseUnits(newFee, feeDecimals);

      await dealer.setFee(parsedFee);

      const fee = await dealer.fee();

      expect(fee).to.eq(parsedFee);
    });

    it("Should correctly change timeout period", async function () {
      const newTimeoutPeriod = timeUtils.duration.minutes(10);
      await dealer.setTimeoutPeriod(newTimeoutPeriod);

      expect(await dealer.timeoutPeriod()).to.eq(newTimeoutPeriod);
    });

    it("Should correctly change fee claimer", async function () {
      const newClaimer = admin.address;
      await dealer.setFeeClaimer(newClaimer);

      expect(await dealer.feeClaimer()).to.eq(newClaimer);
    });

    it("Should correctly change root", async function () {
      const newRoot = admin.address;
      await dealer.changeRootAdmin(newRoot);

      expect(await dealer.rootAdmin()).to.eq(newRoot);
    });

    it("Should correctly remove admin", async function () {
      await dealer.addAdmin(admin.address);
      await dealer.removeAdmin(admin.address);

      expect(await dealer.isAdmin(admin.address)).to.eq(0);
    });
  });

  describe("Appeal", () => {
    it("Admin should be able to handle appeal ", async function () {
      await busd.connect(seller).approve(dealer.address, constants.MaxUint256);
      const receipt = await dealer
        .connect(seller)
        .createOrderSell(
          busd.address,
          sellAmount,
          buyer.address,
          seller.address
        )
        .then((tx) => tx.wait());

      const sellCreatedEvent = receipt.events?.find(
        (e) => e.event === "OrderCreated"
      );
      const [_buyer, _sellet, _tokenAddress, _orderId] =
        sellCreatedEvent?.args || [];

      await dealer.connect(buyer).confirmPayOrderSell(_orderId, buyer.address);
      await dealer.connect(seller).appealOrderSell(_orderId, seller.address);

      await dealer
        .connect(admin)
        .handleAppealOrder(_orderId, seller.address, admin.address);

      expect(await busd.balanceOf(seller.address)).eq(initialBalance);
    });

    it("Admin should not be able to handle appeal if user doesn't allow", async function () {
      await busd.connect(seller).approve(dealer.address, constants.MaxUint256);
      const receipt = await dealer
        .connect(seller)
        .createOrderSell(
          busd.address,
          sellAmount,
          buyer.address,
          seller.address
        )
        .then((tx) => tx.wait());

      const sellCreatedEvent = receipt.events?.find(
        (e) => e.event === "OrderCreated"
      );
      const [_buyer, _sellet, _tokenAddress, _orderId] =
        sellCreatedEvent?.args || [];

      await dealer.connect(buyer).confirmPayOrderSell(_orderId, buyer.address);

      expect(
        dealer
          .connect(admin)
          .handleAppealOrder(_orderId, seller.address, admin.address)
      ).to.revertedWith("only appealed order");
    });
  });
});
