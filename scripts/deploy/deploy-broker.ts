// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import hre, { config, ethers } from "hardhat";
import { Broker__factory } from "../../typechain";
import addressUtils from "../../utils/addressUtils";
import { saveContract } from "../../utils/saveContract";
const addressDir = "../addresses/broker-bsc.ts";

export default async function deployBroker() {
  // We get the contract to deploy
  const [owner] = await ethers.getSigners();
  const ownerAddr = owner.address;

  const BrokerFactory = (await ethers.getContractFactory(
    "Broker"
  )) as Broker__factory;

  const finStableBSC = "0xA7f2363B9Ee97f569A348bD858C722a5006B765f"; // FIN

  const pancakeRouter = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"; // PANCAKE TESTNET

  const brokerContract = await BrokerFactory.deploy(pancakeRouter, ownerAddr);

  await brokerContract.deployTransaction.wait();

  await addressUtils.saveAddresses(hre.network.name, {
    broker: brokerContract.address,
  });
  saveContract(brokerContract, "Broker");

  console.log("Broker deployed to:", brokerContract.address);
}
