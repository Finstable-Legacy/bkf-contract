// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { constants, Contract } from "ethers";
import { formatEther, parseEther } from "ethers/lib/utils";
import { config, ethers } from "hardhat";
import fs from "fs";
import { ERC20__factory } from "../../typechain";
import { broker } from "../../addressList/bsc_test.json";
const logger = (action: string, resp: any): void => {
  console.log({ action, response: resp });
};

export default async function approveToken() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const [owner] = await ethers.getSigners();
  const ownerAddr = owner.address;

  const approveTo = broker;
  const tokens = {
    NBA: "0x6f1622984491ac580B8B2f712027f8E6D7E7b33b",
    NBB: "0x14Bdc4bDDd8d36A80AeBb607f26B8887b8B5821E",
    FIN: "0xA7f2363B9Ee97f569A348bD858C722a5006B765f",
  };

  const nba = ERC20__factory.connect(tokens.NBA, owner);
  const nbb = ERC20__factory.connect(tokens.NBB, owner);
  const fin = ERC20__factory.connect(tokens.FIN, owner);

  // approve owner's tokens to broker contract

  // ---- APPROVE
  const tx1 = await fin.approve(approveTo, constants.MaxUint256);
  await tx1.wait();
  const tx2 = await nba.approve(approveTo, constants.MaxUint256);
  await tx2.wait();

  console.log("approve token successfully");
  // const tx3 = await nbb.approve(approveTo, constants.MaxUint256);
  // await tx2.wait();
  // await Promise.all([tx1, tx2, tx3]);

  // ---- ALLOWANCE
  // const finAllowance = await fin.allowance(ownerAddr, approveTo);
  // logger("get fin allowance", formatEther(finAllowance));

  // const allowance = await nba.allowance(ownerAddr, approveTo);
  // logger("get nba allowance", formatEther(allowance));

  // const NBBallowance = await nbb.allowance(ownerAddr, approveTo);
  // logger("get nbb allowance", formatEther(NBBallowance));

  // const finBalance = await fin.balanceOf(
  //   "0x8c3040a773D6900ca6C8eD787cb4348f195f8e3f"
  // );
  // logger("get fin balance", formatEther(finBalance));
  // const finBalance2 = await fin.balanceOf(approveTo);
  // logger("get fin balance", formatEther(finBalance2));
}
