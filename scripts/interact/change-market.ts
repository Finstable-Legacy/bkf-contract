import hre, { ethers } from "hardhat";
import addresses from "../../utils/addresses";
import { BKF__factory } from "../../typechain";

export default async function changeMarket() {
  const [owner] = await ethers.getSigners();
  const addressList = await addresses.getAddressList(hre.network.name);
  const bkf = BKF__factory.connect(addressList["BKF"], owner);

  await bkf.setSwapRouter(addressList["SwapRouter"]).then((tx) => tx.wait());

  console.log("Set SwapRouter to: ", await bkf.swapRouter());
}
