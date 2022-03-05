// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { constants, Contract, ContractTransaction } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { config, ethers } from "hardhat";
import fs from "fs";
import { Broker__factory, ERC20__factory } from "../../typechain";
import { broker } from "../../addressList/bsc_test.json";
const logger = (action: string, resp: any): void => {
  console.log({ action, response: resp });
};

export default async function payment({ sameToken }: { sameToken: boolean }) {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const [owner] = await ethers.getSigners();
  const ownerAddr = owner.address;

  const BROKER_PAYMENT_BSC_TEST = broker;
  const tokens = {
    NBA: "0x6f1622984491ac580B8B2f712027f8E6D7E7b33b",
    NBB: "0x14Bdc4bDDd8d36A80AeBb607f26B8887b8B5821E",
    FIN: "0xA7f2363B9Ee97f569A348bD858C722a5006B765f",
  };

  const wantFin = parseEther("1");

  const brokerContract = Broker__factory.connect(
    BROKER_PAYMENT_BSC_TEST,
    owner
  );

  const now = new Date();
  const deadline = Math.floor(now.setMinutes(now.getMinutes() + 5) / 1000);
  const orderId = Math.floor(Math.random() * 10 ** 10);
  console.log("payment orderId", orderId);

  if (sameToken) {
    const tx = await brokerContract.purchase(
      orderId,
      "0x3664e69cb319b161f52a3e8da5a28e91e28cb7b5", // merchant
      tokens.FIN,
      tokens.FIN,
      wantFin,
      wantFin,
      deadline
    );
    const receipt = await tx.wait();
    const event = receipt.events?.find((event) => event.event === "Purchase");
    if (event?.args) {
      // const [orderId, amount, merchant, deadline, isReceiveFiat, rate] =
      //   event.args;
      console.log(event.args);
    }
    console.log("receipt", receipt.transactionHash);
  } else {
    // ---- AMOUNTIN
    const amountIn = await brokerContract.getAmountsIn(
      tokens.NBA,
      tokens.FIN,
      wantFin
    );

    logger("get amountIn ? NBA -> 1 FIN", formatEther(amountIn));

    const tx = await brokerContract.purchase(
      orderId,
      "0x3664e69cb319b161f52a3e8da5a28e91e28cb7b5", // merchant
      tokens.NBA,
      tokens.FIN,
      amountIn,
      wantFin,
      deadline
    );
    const receipt = await tx.wait();
    const event = receipt.events?.find((event) => event.event === "Purchase");
    if (event?.args) {
      console.log(event.args);
    }
    console.log("receipt", receipt.transactionHash);
  }
}
