import { expect } from "chai";
import { ethers } from "hardhat";
import { MockDAI, LendingPool } from "../typechain-types"; // ✅

describe("LendingPool", () => {
  let dai: MockDAI;
  let usdc: MockDAI;
  let pool: LendingPool;
  let owner: any;
  let user: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    const MockDAIFactory = await ethers.getContractFactory("MockDAI");
    dai = (await MockDAIFactory.deploy()) as MockDAI;

    usdc = (await MockDAIFactory.deploy()) as MockDAI;

    const LendingPoolFactory = await ethers.getContractFactory("LendingPool");
    pool = (await LendingPoolFactory.deploy(dai.getAddress())) as LendingPool;

    await dai.transfer(user.address, ethers.parseEther("100"));
    await dai.connect(user).approve(await pool.getAddress(), ethers.parseEther("50"));

    await usdc.transfer(owner.address, ethers.parseEther("100"));
    await usdc.connect(owner).approve(await pool.getAddress(), ethers.parseEther("100"));

    await pool.setAssetPrice(dai.getAddress(), ethers.parseEther("1"));
    await pool.setAssetPrice(usdc.getAddress(), ethers.parseEther("1"));
  });

  it("should deposit tokens successfully", async () => {
    const amount = ethers.parseEther("10");

    await expect(pool.connect(user).deposit(dai.getAddress(), amount))
      .to.emit(pool, "Deposit")
      .withArgs(user.address, dai.getAddress(), amount);

    const balance = await pool.userBalances(user.address, dai.getAddress());
    expect(balance).to.equal(amount);
  });

  it("should revert if amount is zero", async () => {
    await expect(pool.connect(user).deposit(dai.getAddress(), 0))
      .to.be.revertedWithCustomError(pool, "AmountCantBeZero");
  });

  it("should revert when insufficent funds", async () => {
    const amount = ethers.parseEther("10");
    await expect(pool.connect(user).withdraw(dai.getAddress(), amount))
    .to.be.revertedWithCustomError(pool, "InsufficientBalance");
  })


  it("should allow user to withdraw deposited tokens", async () => {
    const amount = ethers.parseEther("10");

    // User deposits 10 DAI
    await pool.connect(user).deposit(await dai.getAddress(), amount);

    // User withdraws 10 DAI
    await expect(pool.connect(user).withdraw(await dai.getAddress(), amount))
      .to.emit(pool, "Withdraw")
      .withArgs(user.address, await dai.getAddress(), amount);

    // Internal balance should be zero
    const internalBalance = await pool.userBalances(user.address, await dai.getAddress());
    expect(internalBalance).to.equal(0);

    // User wallet should get DAI back
    const userBalance = await dai.balanceOf(user.address);
    expect(userBalance).to.equal(ethers.parseEther("100"));
    });

    it("should allow user to borrow some asset", async () => {
      const amount = ethers.parseEther("10");
      const safeBorrow = ethers.parseEther("8"); // 80% of deposit
    
      // Deposit DAI
      await pool.connect(user).deposit(await dai.getAddress(), amount);
    
      // Set price so health factor logic works
      await pool.connect(owner).setAssetPrice(dai.getAddress(), ethers.parseEther("1"));
    
      // Expect borrow to succeed
      await expect(pool.connect(user).borrow(dai.getAddress(), safeBorrow))
        .to.emit(pool, "Borrow")
        .withArgs(user.address, dai.getAddress(), safeBorrow);
    });

    it("should revert for Insufficient Balance", async ()=>{
      const amount = ethers.parseEther("10");
      
      await expect(pool.connect(user).borrow(dai.getAddress(), amount))
      .revertedWithCustomError(pool, "InsufficientBalance")
    });

    it("should revert withdraw if health factor drops below threshold", async () => {
      const depositAmount = ethers.parseEther("10");
      const borrowAmount = ethers.parseEther("8");

      await pool.connect(user).deposit(dai.getAddress(), depositAmount);
      await pool.setAssetPrice(dai.getAddress(), ethers.parseEther("1"));
      await pool.connect(user).borrow(dai.getAddress(), borrowAmount);

      await expect(
        pool.connect(user).withdraw(dai.getAddress(), ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(pool, "InsufficientCollateral");
    })

    it("should allow borrowing up to max safe limit based on collateral factor", async () => {
      const depositAmount = ethers.parseEther("10");
      const maxBorrow = ethers.parseEther("8");

      await pool.connect(user).deposit(dai.getAddress(), depositAmount);
      await pool.setAssetPrice(dai.getAddress(), ethers.parseEther("1"));

      await expect(pool.connect(user).borrow(dai.getAddress(), maxBorrow))
      .to.emit(pool, "Borrow")
      .withArgs(user.address, dai.getAddress(), maxBorrow);
    })

    it("should allow liquidation of undercollateralized position", async () => {
      const depositAmount = ethers.parseEther("10"); // 10 DAI ~ $10
      const borrowAmount = ethers.parseEther("5");   // 5 USDC ~ $5
      const repayAmount = ethers.parseEther("2");    // Partial liquidation
    
      // Step 1: Register USDC as supported asset
      await pool.connect(owner).addSupportedAsset(usdc.getAddress());
    
      // Step 2: Set prices
      await pool.connect(owner).setAssetPrice(dai.getAddress(), ethers.parseEther("1"));    // DAI = $1
      await pool.connect(owner).setAssetPrice(usdc.getAddress(), ethers.parseEther("1"));   // USDC = $1
    
      // Step 3: User deposits DAI as collateral
      await pool.connect(user).deposit(dai.getAddress(), depositAmount);
    
      // Step 4: Seed the pool with USDC so it has liquidity
      await usdc.connect(owner).approve(pool.getAddress(), ethers.parseEther("100"));
      await pool.connect(owner).deposit(usdc.getAddress(), ethers.parseEther("100"));
    
      // Step 5: User borrows USDC
      await pool.connect(user).borrow(usdc.getAddress(), borrowAmount);
    
      // Step 6: Simulate price crash of collateral (DAI)
      await pool.connect(owner).setAssetPrice(dai.getAddress(), ethers.parseEther("0.4")); // DAI now $0.4
    

      await usdc.connect(owner).approve(pool.getAddress(), repayAmount);    
      // Step 9: Perform liquidation
      await expect(
        pool.connect(owner).liquidate(user.address, usdc.getAddress(), dai.getAddress(), repayAmount)
      ).to.emit(pool, "Liquidation");
    });
    
    it("should simulate linear interest growth over time using getAccruedDebt", async () => {
      const depositAmount = ethers.parseEther("10");
      const borrowAmount = ethers.parseEther("5");
      const interestRateDecimal = 0.10; // 10% annual
    
      // Add and price assets
      await pool.connect(owner).addSupportedAsset(usdc.getAddress());
      await pool.connect(owner).setAssetPrice(dai.getAddress(), ethers.parseEther("1"));
      await pool.connect(owner).setAssetPrice(usdc.getAddress(), ethers.parseEther("1"));
    
      // User deposits DAI
      await pool.connect(user).deposit(dai.getAddress(), depositAmount);
    
      // Owner seeds USDC into the pool
      await usdc.connect(owner).approve(pool.getAddress(), ethers.parseEther("100"));
      await pool.connect(owner).deposit(usdc.getAddress(), ethers.parseEther("100"));
    
      // User borrows USDC
      await pool.connect(user).borrow(usdc.getAddress(), borrowAmount);
    
      // Simulate 6 months
      const sixMonths = (365 * 24 * 60 * 60) / 2;
      await ethers.provider.send("evm_increaseTime", [sixMonths]);
      await ethers.provider.send("evm_mine");
    
      // Simulate accrued debt
      const accruedDebt = await pool.getAccruedDebt(user.address, usdc.getAddress());
    
      // Convert to float for human-readable calculation
      const borrowAmountFloat = parseFloat(ethers.formatEther(borrowAmount));
      const expectedInterest = borrowAmountFloat * interestRateDecimal * 0.5; // Half a year
      const expectedDebt = borrowAmountFloat + expectedInterest;
    
      const actualDebtFloat = parseFloat(ethers.formatEther(accruedDebt));
    
      console.log("💡 Expected Debt:", expectedDebt.toFixed(6));
      console.log("📈 Actual Debt:  ", actualDebtFloat.toFixed(6));
    
      // Assert with a small margin
      expect(actualDebtFloat).to.be.closeTo(expectedDebt, 0.01);
    });
    
    
    

    
  });



