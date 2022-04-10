require("dotenv").config();

const { hre, upgrades } = require("hardhat");

async function main() {
  // Deploying
  const PesoToken = await hre.ethers.getContractFactory("PesoToken");
  const instance = await upgrades.deployProxy(PesoToken, [
    process.env.ADDRESS,
    1000,
  ]);
  await instance.deployed();

  // Upgrading
  const PesoTokenV2 = await hre.getContractFactory("PesoTokenV2");
  const upgraded = await upgrades.upgradeProxy(instance.address, PesoTokenV2);

  console.log("PesoToken deployed to:", instance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
