import { ethers } from "hardhat";
import {
  BKFToken__factory,
  TestAdminKAP20Router__factory,
  TestAdminProjectRouter__factory,
  TestDiamonFactory__factory,
  TestDiamonRouter__factory,
  TestERC20__factory,
  TestKKUB__factory,
  TestKUSDT__factory,
  TestKYCBitkubChainV2__factory,
  TestNextTransferRouter__factory,
} from "../../typechain";

export const deployTestERC20 = async (
  name: string,
  symbol: string,
  managers: string[]
) => {
  const TestERC20 = (await ethers.getContractFactory(
    "TestERC20"
  )) as TestERC20__factory;
  return TestERC20.deploy(name, symbol, managers);
};

export const deployTestKKUB = async () => {
  const TestKKUB = (await ethers.getContractFactory(
    "TestKKUB"
  )) as TestKKUB__factory;
  return TestKKUB.deploy();
};

export const deployTestKUSDT = async (
  admin: string,
  committee: string,
  kyc: string,
  acceptedKYCLevel: number
) => {
  const TestKUSDT = (await ethers.getContractFactory(
    "TestKUSDT"
  )) as TestKUSDT__factory;
  return TestKUSDT.deploy(admin, committee, kyc, acceptedKYCLevel);
};

export const deployBKFToken = async (
  totalSupply: string = "10000000",
  committee: string,
  kyc: string,
  transferRouter: string,
  acceptedKYCLevel: number
) => {
  const parsedSupply = ethers.utils.parseEther(totalSupply);
  const BKFToken = (await ethers.getContractFactory(
    "BKFToken"
  )) as BKFToken__factory;
  return BKFToken.deploy(
    parsedSupply,
    kyc,
    committee,
    transferRouter,
    acceptedKYCLevel
  );
};

export const deployTestSwapFactory = async () => {
  const TestDiamonFactory = (await ethers.getContractFactory(
    "TestDiamonFactory"
  )) as TestDiamonFactory__factory;
  return TestDiamonFactory.deploy();
};

export const deployTestSwapRouter = async (factory: string, kkub: string) => {
  const TestDiamonRouter = (await ethers.getContractFactory(
    "TestDiamonRouter"
  )) as TestDiamonRouter__factory;
  return TestDiamonRouter.deploy(factory, kkub);
};

export const deployTestKYC = async () => {
  const TestKYCBitkubChainV2 = (await ethers.getContractFactory(
    "TestKYCBitkubChainV2"
  )) as TestKYCBitkubChainV2__factory;
  return TestKYCBitkubChainV2.deploy();
};

export const deployTestAdminProjectRouter = async () => {
  const TestAdminProjectRouter = (await ethers.getContractFactory(
    "TestAdminProjectRouter"
  )) as TestAdminProjectRouter__factory;
  return TestAdminProjectRouter.deploy();
};

export const deployTestAdminKAP20Router = async (
  adminRouter: string,
  committee: string,
  KKUB: string,
  KYC: string,
  bitkubNextLevel: number
) => {
  const TestAdminKAP20Router = (await ethers.getContractFactory(
    "TestAdminKAP20Router"
  )) as TestAdminKAP20Router__factory;
  return TestAdminKAP20Router.deploy(
    adminRouter,
    committee,
    KKUB,
    KYC,
    bitkubNextLevel
  );
};

export const deployTestNextTransferRouter = async (
  adminRouter: string,
  adminKAP20Router: string,
  committee: string,
  KKUB: string,
  kTokens: string[]
) => {
  const TestNextTransferRouter = (await ethers.getContractFactory(
    "TestNextTransferRouter"
  )) as TestNextTransferRouter__factory;
  return TestNextTransferRouter.deploy(
    adminRouter,
    adminKAP20Router,
    KKUB,
    committee,
    kTokens
  );
};
