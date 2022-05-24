import changeFee from "./change-fee";
import changeMarket from "./change-market";
import purchaseBKNext from "./purchase-bknext";

async function main() {
  // await changeMarket();
  // await changeFee();
  await purchaseBKNext();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
