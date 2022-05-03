import hre from "hardhat";
import addresses from "../../utils/addresses";
import { deployKWRAP } from "./deploy-kwrap";
import { deployToken } from "./deploy-token";
import { deployAdminKAP20 } from "./deploy-admin-kap20";
import { deployBKF } from "./deploy-bkf";

async function main() {
  const addressList = await addresses.getAddressList(hre.network.name);
  // await deployToken("Bitkub-Pegged USDT", "KUSDT");
  // await deployToken('Bitkub-Pegged USDC', 'KUSDC');
  // await deployToken("Bitkub-Pegged DAI", "KDAI");
  // await deployAdminKAP20();

  await deployBKF();

  // await deployKWRAP(
  //   "Fin DAI",
  //   "FDAI",
  //   18,
  //   addressList["KYC"],
  //   addressList["Committee"],
  //   addressList["TransferRouter"],
  //   addressList["KDAI"]
  // );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
