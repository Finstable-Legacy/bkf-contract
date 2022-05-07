import hre, { ethers } from "hardhat";
import addresses from "../../utils/addresses";
import { BKF__factory } from "../../typechain";

async function main() {
  const [owner] = await ethers.getSigners();
  const addressList = await addresses.getAddressList(hre.network.name);
  const bkf = BKF__factory.connect(addressList["BKF"], owner);

  await bkf.setCallHelper(addressList["CallHelper"]).then((tx) => tx.wait());

  console.log("Set callhelper to: ", await bkf.callHelper());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
