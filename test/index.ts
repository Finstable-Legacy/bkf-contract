import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Broker", function () {
  it("Should purchase successfully", async function () {
    const [owner] = await ethers.getSigners();
    const pancakeRouter = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"; // PANCAKE TESTNET

    const Broker = await ethers.getContractFactory("Broker");
    const broker = await Broker.deploy(pancakeRouter, owner);
    await broker.deployed();

    const deadline = new Date(new Date().setMinutes(5)).getTime() / 1000;

    const tx = await broker.purchase(
      1,
      0x3664e69cb319b161f52a3e8da5a28e91e28cb7b5,
      0x6f1622984491ac580b8b2f712027f8e6d7e7b33b,
      0xa7f2363b9ee97f569a348bd858c722a5006b765f,
      1000000000000000000,
      1000000000000000000,
      deadline
    );

    const receipt = await tx.wait();
    console.log("receipt", receipt);

    // expect(await greeter.greet()).to.equal("Hello, world!");

    // const setGreetingTx = await greeter.setGreeting("Hola, mundo!");

    // // wait until the transaction is mined
    // await setGreetingTx.wait();

    // expect(await greeter.greet()).to.equal("Hola, mundo!");
  });
});
