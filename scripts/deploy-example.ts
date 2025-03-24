import { ethers, upgrades } from 'hardhat';

async function main() {
  if (!process.env.PROJECT_REGISTRY) {
    console.log(`Please provide PROJECT_REGISTRY address`);
    return;
  }
  if (!process.env.IOID_STORE) {
    console.log(`Please provide IOID_STORE address`);
    return;
  }
  if (!process.env.PROJECT_NAME) {
    console.log(`Please provide PROJECT_NAME`);
    return;
  }
  
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  const accountBalance = Number(await ethers.provider.getBalance(deployer.address)) / 1e18;
  console.log(`Account balance: ${accountBalance} ETH`);
  
  // Deploy the Device NFT contract
  console.log('Deploying DeviceNFT as an upgradeable contract...');
  const DeviceNFT = await ethers.getContractFactory('DeviceNFT');
  const deviceNFT = await upgrades.deployProxy(DeviceNFT, ['DeviceNFT', 'DNFT'],
    { initializer: 'initialize' });
  await deviceNFT.waitForDeployment();
  console.log(`Device NFT deployed to: ${deviceNFT.target}`);

  // Configure the minter
  console.log('Configuring minter for Device NFT contract...');
  let tx = await deviceNFT.configureMinter(deployer.address, 100);
  await tx.wait();
  console.log(`Minter configured for Device NFT contract.`);

  // Register a project in ioID
  console.log('Registering a project in ioID...');
  const projectRegistry = await ethers.getContractAt('ProjectRegistry', process.env.PROJECT_REGISTRY);
  tx = await projectRegistry['register(string,uint8)'](process.env.PROJECT_NAME, 0);
  const receipt = await tx.wait();
  let projectId;
  for (let i = 0; i < receipt!.logs.length; i++) {
    const log = receipt!.logs[i];
    if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
      projectId = BigInt(log.topics[3]);
      break;
    }
  }

  console.log(`Project registered with ID: ${projectId}`);

  // Set Device NFT contract in ioIDStore
  console.log('Setting Device NFT contract for the project...');
  const ioIDStore = await ethers.getContractAt('ioIDStore', process.env.IOID_STORE);
  tx = await ioIDStore.setDeviceContract(projectId, deviceNFT.target);
  await tx.wait();
  console.log(`Device NFT contract set for project ID: ${projectId}`);

  // Apply for some ioIDs
  console.log('Applying for 100 IoID registrations...');
  const price = await ioIDStore.price();
  tx = await ioIDStore.applyIoIDs(projectId, 100, { value: 100n * price });
  await tx.wait();
  console.log(`100 IoID registrations successfully reserved for the project.`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
