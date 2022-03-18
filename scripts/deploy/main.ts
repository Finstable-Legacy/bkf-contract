import addresses from "../../utils/addresses";
import deployBridge from "./deploy-bridge";
import deployBroker from "./deploy-broker";
import { deployKWRAP } from "./deploy-kwrap";
import { deployDealer } from "./deploy-otc";
import { deployToken } from "./deploy-token";

import hre from "hardhat";

async function main() {
  const addressList = await addresses.getAddressList(hre.network.name);
  // await deployToken('Bitkub-Pegged USDT', 'KUSDT');
  // await deployToken('Bitkub-Pegged USDC', 'KUSDC');
  // await deployToken('Bitkub-Pegged DAI', 'KDAI');
  // await deployBridge();
  // await deployBroker();
  // await deployDealer();

  await deployKWRAP(
    "Fin USDC",
    "FUSDC",
    18,
    addressList["KYC"],
    addressList["Committee"],
    addressList["TransferRouter"],
    addressList["KUSDC"]
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
