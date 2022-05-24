import hre, { ethers } from "hardhat";
import { TestERC20__factory } from "../../typechain";
import addressUtils from "../../utils/addresses";

export async function deployToken(name: string, symbol: string) {
  const [owner] = await ethers.getSigners();
  const TestERC20 = (await ethers.getContractFactory(
    "TestERC20"
  )) as TestERC20__factory;

  const token = await TestERC20.deploy(name, symbol, [owner.address]);

  await token.deployTransaction.wait();

  console.log(`Deployed ${symbol} at: `, token.address);

  await addressUtils.saveAddresses(hre.network.name, {
    [symbol]: token.address,
  });
}
