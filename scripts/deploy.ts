import { ethers, artifacts } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  // Deploy MockDAI (DAI)
  const MockDAIFactory = await ethers.getContractFactory("MockDAI");
  const dai = await MockDAIFactory.deploy();
  await dai.waitForDeployment();
  const daiAddress = await dai.getAddress();
  console.log(`✅ MockDAI (DAI) deployed at: ${daiAddress}`);

  // Deploy USDC (also using MockDAI)
  const usdc = await MockDAIFactory.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`✅ MockDAI (USDC) deployed at: ${usdcAddress}`);

  // Deploy LendingPool
  const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
  const pool = await LendingPoolFactory.deploy(daiAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log(`✅ LendingPool deployed at: ${poolAddress}`);

  // Configure LendingPool
  await pool.addSupportedAsset(usdcAddress);
  await pool.setAssetPrice(daiAddress, ethers.parseEther("1"));
  await pool.setAssetPrice(usdcAddress, ethers.parseEther("1"));
  console.log(`⚙️  USDC added and prices set`);

  // ✅ Export to frontend
  const frontendDir = path.join(__dirname, "../frontend/src/config");
  const abisDir = path.join(frontendDir, "abis");
  fs.mkdirSync(abisDir, { recursive: true });

  const addresses = {
    LENDING_POOL_ADDRESS: poolAddress,
    DAI_ADDRESS: daiAddress,
    USDC_ADDRESS: usdcAddress,
  };

  fs.writeFileSync(
    path.join(frontendDir, "contract-addresses.json"),
    JSON.stringify(addresses, null, 2)
  );

  const lendingPoolArtifact = await artifacts.readArtifact("LendingPool");
  fs.writeFileSync(
    path.join(abisDir, "LendingPool.json"),
    JSON.stringify(lendingPoolArtifact, null, 2)
  );

  const mockDAIArtifact = await artifacts.readArtifact("MockDAI");
  fs.writeFileSync(
    path.join(abisDir, "MockDAI.json"),
    JSON.stringify(mockDAIArtifact, null, 2)
  );

  console.log("📦 Contract addresses and ABIs exported to frontend.");

  const testUser = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
  const testUser2 = "0xdD2FD4581271e230360230F9337D5c0430Bf44C0";

// Transfer tokens to test wallet
  await dai.transfer(testUser, ethers.parseEther("1000"));
  await usdc.transfer(testUser, ethers.parseEther("1000"));

  await dai.transfer(testUser2, ethers.parseEther("1000"));
  await usdc.transfer(testUser2, ethers.parseEther("1000"));
  console.log(`💸 Supplied 1000 DAI + 1000 USDC to test user ${testUser} and ${testUser2}`);
  console.log(`🚀 Deployment complete!`);
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exitCode = 1;
});
