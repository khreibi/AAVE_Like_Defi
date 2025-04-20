import { expect } from "chai";
import { ethers } from "hardhat";
import { MockDAI, LendingPool } from "../typechain-types";

describe("LendingPool - Repay Function", () => {
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
    await dai.connect(user).approve(await pool.getAddress(), ethers.parseEther("100"));
    await pool.setAssetPrice(dai.getAddress(), ethers.parseEther("1"));

    await pool.connect(user).deposit(dai.getAddress(), ethers.parseEther("10"));
    await pool.connect(user).borrow(dai.getAddress(), ethers.parseEther("5"));
  });

  it("should allow partial repay", async () => {
    const repayAmount = ethers.parseEther("2");
    await dai.connect(user).approve(await pool.getAddress(), repayAmount);

    await pool.connect(user).repay(dai.getAddress(), repayAmount);

    const remainingDebt = await pool.userBorrows(user.address, dai.getAddress());
    const expected = ethers.parseEther("3");
    expect(remainingDebt).to.be.closeTo(expected, ethers.parseUnits("0.00001", 18));
  });

  it("should allow full repay and reset timestamp", async () => {
    const repayAmount = ethers.parseEther("5.01"); // allow buffer for interest
    await dai.connect(user).approve(await pool.getAddress(), repayAmount);
    
    await pool.connect(user).repay(dai.getAddress(), repayAmount);
    
    const remainingDebt = await pool.userBorrows(user.address, dai.getAddress());
    const timestamp = await pool.lastBorrowTimestamp(user.address, dai.getAddress());
    
    expect(remainingDebt).to.equal(0n); // now it works
    expect(timestamp).to.equal(0n);
    
  });

  it("should cap repay to current debt if overpaying", async () => {
    const repayAmount = ethers.parseEther("10");
    await dai.connect(user).approve(await pool.getAddress(), repayAmount);

    await pool.connect(user).repay(dai.getAddress(), repayAmount);

    const remainingDebt = await pool.userBorrows(user.address, dai.getAddress());
    expect(remainingDebt).to.equal(0);
  });

  it("should revert if repay amount is zero", async () => {
    await expect(
      pool.connect(user).repay(dai.getAddress(), 0)
    ).to.be.revertedWithCustomError(pool, "AmountCantBeZero");
  });
});
