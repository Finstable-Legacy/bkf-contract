// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { constants, Contract } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { config, ethers } from "hardhat";
import fs from "fs";
import { Broker__factory, ERC20__factory } from "../../typechain";
import { broker } from "../../addressList/bsc_test.json";

const logger = (action: string, resp: any): void => {
  console.log({ action, response: resp });
};

export default async function getData() {
  const [owner] = await ethers.getSigners();

  const BROKER_PAYMENT_BSC_TEST = broker;
  const tokens = {
    NBA: "0x6f1622984491ac580B8B2f712027f8E6D7E7b33b",
    NBB: "0x14Bdc4bDDd8d36A80AeBb607f26B8887b8B5821E",
    FIN: "0xA7f2363B9Ee97f569A348bD858C722a5006B765f",
  };

  const brokerContract = Broker__factory.connect(
    BROKER_PAYMENT_BSC_TEST,
    owner
  );

  const feeReserves = await brokerContract.feeReserves(tokens.FIN);
  console.log(formatEther(feeReserves));

  const orders = await brokerContract.orders(1);
  console.log("orders", orders);
}
