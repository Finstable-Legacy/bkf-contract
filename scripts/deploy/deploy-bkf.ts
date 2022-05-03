import hre, { ethers } from "hardhat";
import { BKF__factory } from "../../typechain";
import addressUtils from "../../utils/addresses";

export async function deployBKF() {
  const addressList = await addressUtils.getAddressList(hre.network.name);
  const [owner] = await ethers.getSigners();
  const BKF = (await ethers.getContractFactory("BKF")) as BKF__factory;

  const rootAdmin = owner.address;
  const feeClaimer = owner.address;
  const swapRouter = addressList["SwapRouter"];
  const kyc = addressList["KYC"];
  const committee = addressList["Committee"];
  const transferRouter = addressList["AdminKAP20Router"];
  const callHelper = addressList["CallHelper"];
  // const callHelper = owner.address;
  const acceptedKYCLevel = 0; // 4 for mainnet

  const bkf = await BKF.deploy(
    swapRouter,
    rootAdmin,
    feeClaimer,
    kyc,
    committee,
    transferRouter,
    callHelper,
    acceptedKYCLevel
  );
  await bkf.deployTransaction.wait();

  await addressUtils.saveAddresses(hre.network.name, {
    BKF: bkf.address,
  });

  console.log("Deployed BKF at: ", bkf.address);
}
