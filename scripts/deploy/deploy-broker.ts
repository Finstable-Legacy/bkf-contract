import hre, { config, ethers } from "hardhat";
import { Broker__factory } from "../../typechain";
import addressUtils from "../../utils/addresses";

export default async function deployBroker() {
  const addressList = await addressUtils.getAddressList(hre.network.name);
  const [owner] = await ethers.getSigners();

  const BrokerFactory = (await ethers.getContractFactory(
    "Broker"
  )) as Broker__factory;

  const brokerContract = await BrokerFactory.deploy(addressList['SwapRouter'], owner.address, owner.address);

  await brokerContract.deployTransaction.wait();

  await addressUtils.saveAddresses(hre.network.name, {
    Broker: brokerContract.address,
  });
  console.log("Broker deployed to:", brokerContract.address);
}
