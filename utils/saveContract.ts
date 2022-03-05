import fs from "fs";
import path from "path";
import { artifacts } from "hardhat";

export function saveContract(contract: any, name: string) {
  const filePath = path.join(__dirname + "/../export/" + name);
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath, { recursive: true });
  }
  fs.writeFileSync(
    `${filePath}/address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );
  fs.writeFileSync(
    `${filePath}/abi.json`,
    JSON.stringify(artifacts.readArtifactSync(name), undefined, 2)
  );
}
