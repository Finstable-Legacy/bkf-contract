
import hre, { ethers } from "hardhat";
import addressUtils from "../../utils/addresses";

export default async function deployBridge() {
    const SimpleBKCBridge = await ethers.getContractFactory("SimpleBKCBridge");
    const simpleBKCBridge = await SimpleBKCBridge.deploy();

    await simpleBKCBridge.deployed();

    console.log("Simple BKC Bridge deployed to:", simpleBKCBridge.address);
    await addressUtils.saveAddresses(hre.network.name, { SimpleBKCBridge: simpleBKCBridge.address })
}

