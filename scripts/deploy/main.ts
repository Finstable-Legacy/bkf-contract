import deployBridge from "./deploy-bridge";
import deployBroker from "./deploy-broker";
import deployToken from "./deploy-token";

async function main() {
  // await deployToken()
  // await deployBroker();
  await deployBridge();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
