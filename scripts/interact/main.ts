import payment from "./payment";
import approveToken from "./approve-token";
import getData from "./getData";

async function main() {
  // await approveToken();
  await payment({ sameToken: false });
  await getData();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
