import changeMarket from "./change-market";

async function main() {
  await changeMarket();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
