import { useState } from "react";
import { ethers } from "ethers";
import { TOKENS } from "../config/tokens";
import { CONTRACTS } from "../config/contracts";

type Props = {
    tokenSymbol: string,
    signer: ethers.Signer,
    userAddress: string
}

export default function BorrowForm({ tokenSymbol, signer, userAddress}: Props) {
    const [amount, setAmount] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const tokenMeta = TOKENS.find(t=> t.symbol === tokenSymbol);
    if(!tokenMeta) return <p className= "text-red-400"> invalid token selected</p>

    const handleBorrow = async () => {

        try {
          
            setLoading(true);
            setStatus("Borrowing...");
    
            const lendingPool = new ethers.Contract(CONTRACTS.LENDING_POOL_ADDRESS, CONTRACTS.LENDING_POOL_ABI, signer);
            const parsedAmount = ethers.parseUnits(amount, tokenMeta.decimals);
    
            const tx = await lendingPool.borrow(tokenMeta.address, parsedAmount);
            await tx.wait();
    
            setStatus("✅ Borrow successful!");


        } catch (error : any) {
            console.error(error);
            setStatus(`❌ Borrow failed: ${error?.reason || error?.message || "unknown"}`);
        } finally {
            setLoading(false);
          }
    };

return (
    <div className="mt-6">
      <h3 className="font-bold text-lg mb-2">📤 Borrow</h3>
      <div className="flex gap-2 items-center">
        <input
          type="number"
          className="text-black px-4 py-2 rounded border w-48"
          placeholder={`Amount (${tokenSymbol})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded"
          onClick={handleBorrow}
          disabled={loading}
        >
          {loading ? "Processing..." : `Borrow ${tokenSymbol}`}
        </button>
      </div>
      {status && <p className="mt-2 text-sm">{status}</p>}
    </div>
  );
}