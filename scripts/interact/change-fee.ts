import { BlockSwapRouter__factory, Broker__factory } from "../../typechain";
import addresses from "../../utils/addresses";
import hre, { ethers } from 'hardhat';

export default async function changeFee() {
    const [owner] = await ethers.getSigners();
    const addressList = await addresses.getAddressList(hre.network.name);
    const broker = Broker__factory.connect(addressList["Broker"], owner);

    await broker.setFee("50").then(tx => tx.wait());

    console.log("Set Fee to: ", await broker.fee());
}