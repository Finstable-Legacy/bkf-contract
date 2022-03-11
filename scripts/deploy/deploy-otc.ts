import hre, { ethers } from "hardhat";
import { Dealer__factory } from "../../typechain";
import addressUtils from "../../utils/addresses";

export async function deployDealer() {
  const [owner] = await ethers.getSigners();
  const Dealer = (await ethers.getContractFactory("Dealer")) as Dealer__factory;

  const dealer = await Dealer.deploy(owner.address, owner.address);

  await dealer.deployTransaction.wait();

  console.log('Deployed Dealer at: ', dealer.address);


  await addressUtils.saveAddresses(hre.network.name, { OTC: dealer.address });
}
