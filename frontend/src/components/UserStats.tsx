import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../config/contracts";

type Props = {
  userAddress: string;
  provider: ethers.BrowserProvider;
};

export default function UserStats({ userAddress, provider }: Props) {
  const [collateral, setCollateral] = useState("0");
  const [borrowed, setBorrowed] = useState("0");
  const [healthFactor, setHealthFactor] = useState("∞");

  useEffect(() => {
    if (!userAddress) return;

    const lendingPool = new ethers.Contract(
      CONTRACTS.LENDING_POOL_ADDRESS,
      CONTRACTS.LENDING_POOL_ABI,
      provider
    );

    const fetchData = async () => {
      const [totalCollateralUsd, totalBorrowedUsd, hf] = await lendingPool.getAccountData(userAddress);
      setCollateral(ethers.formatEther(totalCollateralUsd));
      setBorrowed(ethers.formatEther(totalBorrowedUsd));
      setHealthFactor(hf === ethers.MaxUint256 ? "∞" : Number(ethers.formatEther(hf)).toFixed(2));
    };

    // Initial fetch
    fetchData();

    // Setup listeners
    const onUpdate = (user: string) => {
      if (user.toLowerCase() === userAddress.toLowerCase()) {
        fetchData();
      }
    };

    lendingPool.on("Deposit", onUpdate);
    lendingPool.on("Borrow", onUpdate);
    lendingPool.on("Withdraw", onUpdate);
    lendingPool.on("Liquidation", onUpdate);

    // Cleanup
    return () => {
      lendingPool.off("Deposit", onUpdate);
        lendingPool.off("Borrow", onUpdate);
        lendingPool.off("Withdraw", onUpdate);
        lendingPool.off("Liquidation", onUpdate);
    };
  }, [userAddress, provider]);

  const safe = parseFloat(healthFactor) >= 1;

  return (
    <div className="mt-6 p-4 bg-gray-800 rounded text-sm">
      <p>Total Deposited: <strong>${collateral}</strong></p>
      <p>Total Borrowed: <strong>${borrowed}</strong></p>
      <p>
        Health Factor:{" "}
        <span className={`font-bold ${safe ? "text-green-400" : "text-red-400"}`}>
          {healthFactor} {safe ? "✅" : "⚠️"}
        </span>
      </p>
    </div>
  );
}
