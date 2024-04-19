import { ethers, upgrades } from 'hardhat';

async function main() {
  if (!process.env.WALLET_REGISTRY) {
    console.log(`Please provide wallet registry address`);
    return;
  }
  if (!process.env.WALLET_IMPLEMENTATION) {
    console.log(`Please provide wallet implementation`);
    return;
  }

  const [deployer] = await ethers.getSigners();

  const DeviceNFT = await ethers.getContractFactory('DeviceNFT');
  const deviceNFT = await upgrades.deployProxy(
    DeviceNFT,
    [deployer.address, process.env.WALLET_REGISTRY, process.env.WALLET_IMPLEMENTATION, 'ioID device NFT', 'IDN'],
    {
      initializer: 'initialize',
    },
  );
  await deviceNFT.waitForDeployment();
  console.log(`DeviceNFT deployed to ${deviceNFT.target}`);

  const DeviceRegistry = await ethers.getContractFactory('DeviceRegistry');
  const deviceRegistry = await upgrades.deployProxy(DeviceRegistry, [deviceNFT.target], {
    initializer: 'initialize',
  });
  await deviceRegistry.waitForDeployment();
  console.log(`DeviceRegistry deployed to ${deviceRegistry.target}`);

  console.log(`Set DeviceNFT minter to ${deviceRegistry.target}`);
  const tx = await deviceNFT.setMinter(deviceRegistry.target);
  await tx.wait();
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
