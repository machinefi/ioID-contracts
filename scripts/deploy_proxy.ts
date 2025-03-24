import { ethers, BigNumber } from 'hardhat';

const PROJECT_REGISTRY_ADDRESS = process.env.PROJECT_REGISTRY;
const IOIDSTORE_ADDRESS = process.env.IOID_STORE;
const DEVICE_NFT_ADDRESS = process.env.DEVICE_NFT;

async function main() {
  if (!PROJECT_REGISTRY_ADDRESS) {
    console.log(`Please provide project registry address`);
    return;
  }
  if (!IOIDSTORE_ADDRESS) {
    console.log(`Please provide ioIDStore address`);
    return;
  }
  if (!DEVICE_NFT_ADDRESS) {
    console.log(`Please provide device NFT address`);
    return;
  }

  // Log the Project Registry, ioID Store and Device NFT addresses
  console.log(`Project Registry Address: ${PROJECT_REGISTRY_ADDRESS}`);
  console.log(`ioID Store Address: ${IOIDSTORE_ADDRESS}`);
  console.log(`Device NFT Address: ${DEVICE_NFT_ADDRESS}`);

  const [deployer] = await ethers.getSigners();

  // Get the balance of the deployer 
  const deployerBalance = Number(ethers.formatEther(await ethers.provider.getBalance(deployer.address))).toFixed(2);

  console.log(`Deploying the Proxy contract with account: ${deployer.address}`);
  console.log(`Balance is ${deployerBalance} IOTX`);

  // Fetch the contract factory
  const VerifyingProxy = await ethers.getContractFactory('VerifyingProxy');

  // Deploy the contract
  console.log("Deploying...");
  const verifyingProxy = await VerifyingProxy.deploy(IOIDSTORE_ADDRESS, PROJECT_REGISTRY_ADDRESS, DEVICE_NFT_ADDRESS);

  // Wait for the deployment to complete
  await verifyingProxy.waitForDeployment();

  console.log(`Verifying Proxy Contract deployed to: ${verifyingProxy.target}`);
}

main().catch((error) => {
  console.error('Error during deployment:', error.message);
  process.exitCode = 1;
});
