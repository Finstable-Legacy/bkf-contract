import changeBridge from "./change-bridge";
import changeFee from "./change-fee";
import changeMarket from "./change-market";

async function main() {
  // await changeMarket();
  // await changeFee();
  await changeBridge();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
