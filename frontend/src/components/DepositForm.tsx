import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../config/contracts";
import { TOKENS } from "../config/tokens";

type Props = {
  tokenSymbol: string;
  signer: ethers.Signer;
  userAddress: string;
};

export default function DepositForm({ tokenSymbol, signer, userAddress }: Props) {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const tokenMeta = TOKENS.find((t) => t.symbol === tokenSymbol);
  if (!tokenMeta) return <p className="text-red-400">Invalid token selected.</p>;

  const handleDeposit = async () => {
    try {
      setLoading(true);
      setStatus("Approving...");

      const token = new ethers.Contract(tokenMeta.address, CONTRACTS.DAI_ABI, signer);
      const lendingPool = new ethers.Contract(CONTRACTS.LENDING_POOL_ADDRESS, CONTRACTS.LENDING_POOL_ABI, signer);

      const parsedAmount = ethers.parseUnits(amount, tokenMeta.decimals);

      // Approve token if needed
      const allowance = await token.allowance(userAddress, CONTRACTS.LENDING_POOL_ADDRESS);
      if (allowance < parsedAmount) {
        const tx = await token.approve(CONTRACTS.LENDING_POOL_ADDRESS, parsedAmount);
        await tx.wait();
      }

      setStatus("Depositing...");
      const tx2 = await lendingPool.deposit(tokenMeta.address, parsedAmount);
      await tx2.wait();

      setStatus("✅ Deposit successful!");
    } catch (err: any) {
      console.error(err);
      setStatus("❌ Error: " + (err?.reason || err?.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="font-bold text-lg mb-2">➕ Deposit</h3>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          className="text-black px-4 py-2 rounded border w-48"
          placeholder={`Amount (${tokenSymbol})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={handleDeposit}
          disabled={loading}
        >
          {loading ? "Processing..." : `Deposit ${tokenSymbol}`}
        </button>
      </div>
      {status && <p className="mt-2 text-sm">{status}</p>}
    </div>
  );
}
