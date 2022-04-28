import { formatBytes32String } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";
import {
  AdminProjectRouter__factory,
  AdminProject__factory,
  TestAdminKAP20Router__factory,
} from "../../typechain";
import addressUtils from "../../utils/addresses";

export async function deployAdminKAP20() {
  const addressList = await addressUtils.getAddressList(hre.network.name);
  const [owner] = await ethers.getSigners();

  const AdminProject = (await ethers.getContractFactory(
    "AdminProject"
  )) as AdminProject__factory;

  const AdminProjectRouter = (await ethers.getContractFactory(
    "AdminProjectRouter"
  )) as AdminProjectRouter__factory;

  const AdminKAP20Router = (await ethers.getContractFactory(
    "TestAdminKAP20Router"
  )) as TestAdminKAP20Router__factory;

  const committee = addressList["Committee"];

  // ----- ADMIN PROJECT -------
  const adminChangeKey = formatBytes32String("bkfsmoothie");
  const adminProject = await AdminProject.deploy(committee, adminChangeKey);

  await adminProject.deployTransaction.wait();

  console.log("Deployed AdminProject at: ", adminProject.address);

  await addressUtils.saveAddresses(hre.network.name, {
    AdminProject: adminProject.address,
  });

  // ----- ADMIN PROJECT -------

  // ----- ADMIN PROJECT ROUTER -------
  const adminProjectRouter = await AdminProjectRouter.deploy(
    adminProject.address
  );

  await adminProjectRouter.deployTransaction.wait();

  console.log("Deployed AdminProjectRouter at: ", adminProjectRouter.address);

  await addressUtils.saveAddresses(hre.network.name, {
    AdminProjectRouter: adminProjectRouter.address,
  });

  // ----- ADMIN PROJECT ROUTER -------

  // ----- ADMIN KAP20 ROUTER -------
  const kkub = addressList["KKUB"];
  const kyc = addressList["KYC"];
  const bitkubNextLevel = 0;
  const adminKAP20Router = await AdminKAP20Router.deploy(
    adminProjectRouter.address,
    committee,
    kkub,
    kyc,
    bitkubNextLevel
  );

  await adminKAP20Router.deployTransaction.wait();

  console.log("Deployed AdminKAP20Router at: ", adminKAP20Router.address);

  await addressUtils.saveAddresses(hre.network.name, {
    AdminKAP20Router: adminKAP20Router.address,
  });

  // ----- ADMIN KAP20 ROUTER -------
}
