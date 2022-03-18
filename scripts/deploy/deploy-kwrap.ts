import hre, { ethers } from "hardhat";
import { KWRAP__factory } from "../../typechain";
import addressUtils from "../../utils/addresses";

export async function deployKWRAP(
  name: string,
  symbol: string,
  decimals: number,
  kyc: string,
  committee: string,
  transferRouter: string,
  underlying: string
) {
  const KWRAP = (await ethers.getContractFactory("KWRAP")) as KWRAP__factory;
  const token = await KWRAP.deploy(
    name,
    symbol,
    decimals,
    kyc,
    committee,
    transferRouter,
    underlying
  );

  await token.deployTransaction.wait();

  console.log(`Deployed ${symbol} at: `, token.address);

  await addressUtils.saveAddresses(hre.network.name, {
    [symbol]: token.address,
  });
}
