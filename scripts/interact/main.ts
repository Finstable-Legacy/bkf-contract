import changeFee from "./change-fee";
import changeMarket from "./change-market";

async function main() {
  // await changeMarket();
  // await changeFee();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
