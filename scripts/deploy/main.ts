import deployBridge from "./deploy-bridge";
import deployBroker from "./deploy-broker";
import { deployDealer } from "./deploy-otc";

async function main() {
  await deployBridge();
  await deployBroker();
  await deployDealer();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
