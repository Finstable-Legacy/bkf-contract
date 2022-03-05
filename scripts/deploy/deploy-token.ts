// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { formatEther, parseEther } from "ethers/lib/utils";
import hre, { config, ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Token__factory } from "../../typechain";
import addressUtils from "../../utils/addressUtils";
import { saveContract } from "../../utils/saveContract";

export default async function deployToken() {
  const addressPath = path.join(__dirname, "../addresses/token.ts");
  if (fs.existsSync(addressPath)) {
    fs.unlinkSync(addressPath);
  }

  // We get the contract to deploy
  const [owner] = await ethers.getSigners();
  const ownerAddr = owner.address;
  console.log("owner address", ownerAddr);

  const TokenFactory = (await ethers.getContractFactory(
    "Token",
    owner
  )) as Token__factory;
  const tokenContract = await TokenFactory.deploy(
    "FINSTABLE",
    "FIN",
    parseEther("100000")
  );
  await tokenContract.deployed();
  console.log("FIN deployed to:", tokenContract.address);

  // -----
  const BUSDFactory = (await ethers.getContractFactory(
    "Token",
    owner
  )) as Token__factory;
  const busdContract = await BUSDFactory.deploy(
    "BUSD",
    "BUSD",
    parseEther("100000")
  );
  await busdContract.deployed();

  await addressUtils.saveAddresses(hre.network.name, {
    busd: busdContract.address,
  });
  saveContract(busdContract, "BUSD");

  console.log("BUSD deployed to:", busdContract.address);
}
