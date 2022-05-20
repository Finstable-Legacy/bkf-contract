import hre, { ethers } from "hardhat";
import addresses from "../../utils/addresses";
import { BKF__factory, TestDiamonRouter__factory } from "../../typechain";
import time from "../../utils/time";
import { parseEther } from "ethers/lib/utils";

export default async function purchaseBKNext() {
  const [owner] = await ethers.getSigners();
  const addressList = await addresses.getAddressList(hre.network.name);

  const orderId = 12311115;
  const merchant = owner.address;
  const tokenA = addressList["KUSDT"];
  const tokenB = addressList["KDAI"];
  const bkfAddress = addressList["BKF"];
  const routes = [tokenA, tokenB];
  const amountOut = parseEther("1");
  const deadline = time.now() + time.duration.hours(10);

  const bkf = BKF__factory.connect(bkfAddress, owner);

  const swapRouter = TestDiamonRouter__factory.connect(
    addressList["SwapRouter"],
    owner
  );

  const inputAmount = await swapRouter.getAmountsIn(amountOut, [
    tokenA,
    tokenB,
  ]);

  await bkf
    .connect(owner)
    .purchase(
      orderId,
      merchant,
      routes,
      inputAmount[0],
      amountOut,
      deadline,
      "0xcdCc562088F99f221B0C3BB1EDcFD5A9646D0B25"
    )
    .then((tx) => tx.wait());

  let orderStatus = await bkf.orderStatus(orderId);
  console.log("order", Number(orderStatus), "was purchased!");
}
