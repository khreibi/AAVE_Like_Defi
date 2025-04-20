import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { TOKENS } from "../config/tokens";
import { CONTRACTS } from "../config/contracts";

type Props = {
  userAddress: string;
  provider: ethers.BrowserProvider;
};

export default function UserPosition({ userAddress, provider }: Props) {
  const [positions, setPositions] = useState<any[]>([]);
  const [netWorth, setNetWorth] = useState("0");

  const fetchData = async () => {
    const pool = new ethers.Contract(CONTRACTS.LENDING_POOL_ADDRESS, CONTRACTS.LENDING_POOL_ABI, provider);
    const interestRate = 0.10;
    const secondsPerYear = 365 * 24 * 60 * 60;
    const now = Math.floor(Date.now() / 1000);

    const updated = await Promise.all(
      TOKENS.map(async (token) => {
        const erc20 = new ethers.Contract(token.address, CONTRACTS.DAI_ABI, provider);

        const [wallet, deposit, principal, price, lastTimestamp] = await Promise.all([
          erc20.balanceOf(userAddress),
          pool.userBalances(userAddress, token.address),
          pool.userBorrows(userAddress, token.address),
          pool.assetPrices(token.address),
          pool.lastBorrowTimestamp(userAddress, token.address),
        ]);

        const elapsed = now - Number(lastTimestamp);
        const interest =
          principal *
          BigInt(Math.floor(interestRate * 1e18)) *
          BigInt(elapsed) /
          BigInt(secondsPerYear) /
          BigInt(1e18);

        const totalDebt = principal + interest;

        const walletFloat = parseFloat(ethers.formatUnits(wallet, token.decimals));
        const depositFloat = parseFloat(ethers.formatUnits(deposit, token.decimals));
        const debtFloat = parseFloat(ethers.formatUnits(totalDebt, token.decimals));
        const priceUsd = parseFloat(ethers.formatUnits(price, token.decimals));

        const depositUsd = depositFloat * priceUsd;
        const debtUsd = debtFloat * priceUsd;

        return {
          symbol: token.symbol,
          wallet: walletFloat,
          deposit: depositFloat,
          debt: debtFloat,
          depositUsd,
          debtUsd,
          net: depositUsd - debtUsd,
        };
      })
    );

    setPositions(updated);
    const totalNet = updated.reduce((sum, t) => sum + t.net, 0);
    setNetWorth(totalNet.toFixed(2));
  };

  useEffect(() => {
    if (!userAddress || !provider) return;

    fetchData(); // Initial load

    const pool = new ethers.Contract(CONTRACTS.LENDING_POOL_ADDRESS, CONTRACTS.LENDING_POOL_ABI, provider);
    const onUpdate = () => fetchData();

    pool.on("Deposit", onUpdate);
    pool.on("Withdraw", onUpdate);
    pool.on("Borrow", onUpdate);
    pool.on("Repay", onUpdate);
    pool.on("Liquidation", onUpdate);

    return () => {
      pool.off("Deposit", onUpdate);
      pool.off("Withdraw", onUpdate);
      pool.off("Borrow", onUpdate);
      pool.off("Repay", onUpdate);
      pool.off("Liquidation", onUpdate);
    };
  }, [userAddress, provider]);

  return (
    <div className="mt-6 p-4 bg-gray-800 rounded">
      <h3 className="text-lg font-bold mb-2">📊 User Position Overview</h3>
      <table className="text-sm w-full">
        <thead>
          <tr>
            <th className="text-left">Asset</th>
            <th>Wallet</th>
            <th>Deposited</th>
            <th>Borrowed (with interest)</th>
            <th>Net (USD)</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((t) => (
            <tr key={t.symbol}>
              <td>{t.symbol}</td>
              <td>{t.wallet}</td>
              <td>{t.deposit}</td>
              <td>{t.debt.toFixed(4)}</td>
              <td className={t.net >= 0 ? "text-green-400" : "text-red-400"}>
                ${t.net.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 font-bold">🧮 Net Worth: ${netWorth}</p>
    </div>
  );
}
