import hre, { ethers } from "hardhat";
import addresses from "../../utils/addresses";
import { BKF__factory } from "../../typechain";
import time from "../../utils/time";

export default async function purchaseBKNext() {
  const [owner] = await ethers.getSigners();
  const addressList = await addresses.getAddressList(hre.network.name);
  const bkf = BKF__factory.connect(addressList["BKF"], owner);

  const orderId = 1;
  const merchant = owner.address;
  const routes = ["0xD7c71ef1181Fdc6886A8A431Ebdb7D9A6701ab01"];
  const amountInMax = 10;
  const amountOut = 10;
  const deadline = time.now() + time.duration.hours(10);

  await bkf
    .purchase(
      orderId,
      merchant,
      routes,
      amountInMax,
      amountOut,
      deadline,
      owner.address
    )
    .then((tx) => tx.wait());
}
