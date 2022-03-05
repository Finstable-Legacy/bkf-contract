import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { constants } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { BlockSwapFactory, BlockSwapFactory__factory, BlockSwapRouter, BlockSwapRouter__factory, Broker, Broker__factory, TestERC20__factory, WETH, WETH__factory } from "../../typechain";
import { TestERC20 } from "../../typechain/TestERC20";
import timeUtils from '../../utils/time';

describe("Broker", function () {

  let rootAdmin: SignerWithAddress;
  let admin: SignerWithAddress;
  let customer: SignerWithAddress;
  let merchant: SignerWithAddress;
  let feeClaimer: SignerWithAddress;

  let weth: WETH;
  let swapFactory: BlockSwapFactory;
  let swapRouter: BlockSwapRouter;

  let broker: Broker;
  let busd: TestERC20;
  let dai: TestERC20;

  let initialBalance = parseEther('100');
  let poolAmount = parseEther('1000');
  let productPrice = parseEther('1');

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    rootAdmin = signers[0];
    admin = signers[1];
    customer = signers[2];
    merchant = signers[3];
    feeClaimer = signers[4];

    const WETH = await ethers.getContractFactory("WETH") as WETH__factory;
    weth = await WETH.deploy();

    const SwapFactory = await ethers.getContractFactory("BlockSwapFactory") as BlockSwapFactory__factory;
    swapFactory = await SwapFactory.deploy(rootAdmin.address);

    // console.log("INIT: ", await swapFactory.INIT_CODE_PAIR_HASH());

    const SwapRouter = await ethers.getContractFactory("BlockSwapRouter") as BlockSwapRouter__factory;
    swapRouter = await SwapRouter.deploy(swapFactory.address, weth.address);

    const Broker = await ethers.getContractFactory("Broker") as Broker__factory;
    broker = await Broker.deploy(swapRouter.address, rootAdmin.address, feeClaimer.address);

    const TestERC20 = await ethers.getContractFactory("TestERC20") as TestERC20__factory;
    busd = await TestERC20.deploy("Binance USD", "BUSD", [rootAdmin.address]);
    dai = await TestERC20.deploy("DAI Stable coin", "DAI", [rootAdmin.address]);

    await busd.connect(rootAdmin).approve(swapRouter.address, ethers.constants.MaxUint256);
    await dai.connect(rootAdmin).approve(swapRouter.address, ethers.constants.MaxUint256);

    await busd.connect(rootAdmin).transfer(customer.address, initialBalance);
    await dai.connect(rootAdmin).transfer(customer.address, initialBalance);

    const deadline = timeUtils.now() + timeUtils.duration.minutes(5);
    await swapRouter.connect(rootAdmin).addLiquidity(busd.address, dai.address, poolAmount, poolAmount, 0, 0, rootAdmin.address, deadline);
  })

  it("Should purchase same token successfully", async function () {
    const deadline = timeUtils.now() + timeUtils.duration.minutes(5);

    const merchantInitialBalance = await busd.balanceOf(merchant.address);

    await busd.connect(customer).approve(broker.address, constants.MaxUint256);

    await broker.connect(customer).purchase(
      0,
      merchant.address,
      busd.address,
      busd.address,
      productPrice,
      productPrice,
      deadline
    );

    const merchantEndBalance = await busd.balanceOf(merchant.address);

    const fee = await broker.fee();
    const shifter = await broker.shifter();

    const collectedFee = productPrice.mul(fee).div(shifter);
    const calculatedOut = productPrice.sub(collectedFee);

    expect(merchantEndBalance.sub(merchantInitialBalance)).to.eq(calculatedOut);
  });

  it("Should purchase differ token successfully", async function () {
    const deadline = timeUtils.now() + timeUtils.duration.minutes(5);

    const merchantInitialBalance = await busd.balanceOf(merchant.address);

    await dai.connect(customer).approve(broker.address, constants.MaxUint256);

    const inputAmount = await swapRouter.getAmountsIn(productPrice, [dai.address, busd.address]);

    await broker.connect(customer).purchase(
      0,
      merchant.address,
      dai.address,
      busd.address,
      inputAmount[0],
      productPrice,
      deadline
    );

    const merchantEndBalance = await busd.balanceOf(merchant.address);

    const fee = await broker.fee();
    const shifter = await broker.shifter();

    const collectedFee = productPrice.mul(fee).div(shifter);
    const calculatedOut = productPrice.sub(collectedFee);

    expect(merchantEndBalance.sub(merchantInitialBalance)).to.eq(calculatedOut);
  });

});
