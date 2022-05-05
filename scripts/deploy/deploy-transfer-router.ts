import hre, { ethers } from "hardhat";
import { TestNextTransferRouter__factory } from "../../typechain";
import addressUtils from "../../utils/addresses";

export async function deployTransferRouter() {
  const addressList = await addressUtils.getAddressList(hre.network.name);

  const TransferRouter = (await ethers.getContractFactory(
    "TestNextTransferRouter"
  )) as TestNextTransferRouter__factory;

  const committee = addressList["Committee"];
  const adminProjectRouter = addressList["AdminProjectRouter"];
  const adminKAP20Router = addressList["AdminKAP20Router"];
  const kkub = addressList["KKUB"];
  const kusdt = addressList["KUSDT"];
  const kyc = addressList["KYC"];
  const bitkubNextLevel = 0;

  // ----- TransferRouter -------
  const transferRouter = await TransferRouter.deploy(
    adminProjectRouter,
    adminKAP20Router,
    kkub,
    committee,
    [kusdt]
  );

  await transferRouter.deployTransaction.wait();
  console.log("Deployed NextTransferRouter at: ", transferRouter.address);

  await addressUtils.saveAddresses(hre.network.name, {
    TransferRouter: transferRouter.address,
  });
}
