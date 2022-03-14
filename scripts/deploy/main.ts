import deployBridge from "./deploy-bridge";
import deployBroker from "./deploy-broker";
import { deployDealer } from "./deploy-otc";
import { deployToken } from "./deploy-token";

async function main() {
  // await deployToken('Bitkub-Pegged USDT', 'KUSDT');
  // await deployToken('Bitkub-Pegged USDC', 'KUSDC');
  // await deployToken('Bitkub-Pegged DAI', 'KDAI');
  // await deployBridge();
  await deployBroker();
  // await deployDealer();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
