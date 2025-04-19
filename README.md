# 💸 AAVE Lite — DeFi Lending Protocol (Zero to Hero Journey)

Welcome to **AAVE Lite** — a fully working decentralized lending and borrowing protocol, built from scratch in Solidity and React, modeled after Aave.

This project is **not just code**, it's a **learning journey**:
> From writing your first smart contract,  
> To building a frontend that interacts with a real lending protocol,  
> To understanding the mechanics of collateralization, interest, liquidation, and protocol economics.

---

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity + Hardhat + OpenZeppelin
- **Frontend**: React + ethers.js + Tailwind (optional polish)
- **Testing**: Hardhat + Chai
- **Chain**: Local Hardhat node (can be deployed to Sepolia)

---

## ✨ Features

| Feature                    | Status | Description |
|---------------------------|--------|-------------|
| ✅ ERC20 Mock Tokens      | ✔️     | DAI & USDC for testing |
| ✅ Lending Pool Contract  | ✔️     | Users can deposit, borrow, withdraw |
| ✅ Health Factor Logic    | ✔️     | Protects protocol from undercollateralized debt |
| ✅ Liquidation Mechanism  | ✔️     | Incentivizes third-party bots to repay bad debt |
| ✅ Interest Accrual       | ✔️     | Borrowed amounts grow over time |
| ✅ Frontend dApp          | ✔️     | React interface to interact with the protocol |
| ✅ Real-time Event Sync   | ✔️     | Frontend updates automatically via contract events |

---

## 🚀 Project Sprints Overview

Each sprint represents a learning milestone 🧠:

### 🏁 Sprint 0: Scaffold & Setup
- Hardhat config
- Mock ERC20 tokens (DAI/USDC)

### 🧱 Sprint 1: Core Protocol Logic
- Deposit & Withdraw functions
- Token balance mapping
- Custom errors + events

### 💸 Sprint 2: Borrowing Engine
- Collateral factor (80%)
- Borrowing only if HF ≥ 1
- Asset price mock oracle

### ⚡ Sprint 3: Liquidation Engine
- Liquidator repays user debt
- Seizes collateral with bonus
- Ensures protocol solvency

### 📈 Sprint 4: Interest Accrual
- 10% annual rate
- Per-second accrual
- Health factor includes interest

### 🖥 Sprint 5: Frontend dApp
- MetaMask integration
- Deposit/withdraw/borrow
- Health factor display
- Live event listeners for UX

---

## 📊 Live Demo (Coming Soon)

> Frontend hosted on Vercel (optional)  
> Smart contracts deployed to Sepolia (optional)

---

## 📘 Learning Outcomes

By following this repo, you'll learn:

- How DeFi lending protocols actually work
- Why overcollateralization and health factors matter
- How to write secure, clean Solidity code
- How interest and liquidation incentives are designed
- How to build dApps with real Web3 contract interaction
- How to think like a protocol engineer and product owner

---

## 📦 To Run Locally

```bash
git clone https://github.com/khreibi/AAVE_Like_Defi
cd AAVE_Like_Defi
npm install
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
cd frontend
npm run dev
