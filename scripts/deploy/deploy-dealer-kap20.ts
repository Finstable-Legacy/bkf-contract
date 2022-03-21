import hre, { ethers } from "hardhat";
import { DealerKAP20__factory } from "../../typechain";
import addressUtils from "../../utils/addresses";

export async function deployDealerKAP20() {
  const addressList = await addressUtils.getAddressList(hre.network.name);
  const [owner] = await ethers.getSigners();
  const DealerKAP20 = (await ethers.getContractFactory(
    "DealerKAP20"
  )) as DealerKAP20__factory;

  const rootAdmin = owner.address;
  const feeClaimer = owner.address;
  const kyc = addressList["KYC"];
  const committee = addressList["Committee"];
  const transferRouter = addressList["AdminKAP20Router"];
  // const callHelper = addressList["CallHelper"];
  const callHelper = owner.address;
  const acceptedKYCLevel = 4;

  const dealer = await DealerKAP20.deploy(
    rootAdmin,
    feeClaimer,
    kyc,
    committee,
    transferRouter,
    callHelper,
    acceptedKYCLevel
  );

  await dealer.deployTransaction.wait();

  console.log("Deployed Dealer at: ", dealer.address);

  await addressUtils.saveAddresses(hre.network.name, {
    DealerKAP20: dealer.address,
  });
}
