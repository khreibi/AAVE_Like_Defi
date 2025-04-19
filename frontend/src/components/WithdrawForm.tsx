import { useState } from "react";
import { ethers } from "ethers";
import { TOKENS } from "../config/tokens";
import { CONTRACTS } from "../config/contracts";

type Props = {
    tokenSymbol: string,
    signer: ethers.Signer,
    userAddress: string
};


export default function WithdrawForm({ tokenSymbol, signer, userAddress }: Props){
    const [amount, setAmount] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const tokenMeta = TOKENS.find((t)=> t.symbol === tokenSymbol);
    if(!tokenMeta) return <p className="text-red-400">Invalid token selected</p>;

    const handleWithdraw = async () =>{
        try {
            const lendingPool = new ethers.Contract(CONTRACTS.LENDING_POOL_ADDRESS, CONTRACTS.LENDING_POOL_ABI, signer);
            const parsedAmount = ethers.parseUnits(amount, tokenMeta.decimals);

            const tx = await lendingPool.withdraw(tokenMeta.address, parsedAmount);
            await tx.wait();

            setStatus("✅ Withdraw successful!");
        } catch (err: any) {
            const reason = err?.reason || err?.error?.message || err?.message || "Unknown";
            setStatus(`❌ Withdraw failed: ${reason}`);
        }
        finally{
            setLoading(false);  
        }
    };
    return (
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2">🔄 Withdraw</h3>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              className="text-black px-4 py-2 rounded border w-48"
              placeholder={`Amount (${tokenSymbol})`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-red-600 text-white rounded"
              onClick={handleWithdraw}
              disabled={loading}
            >
              {loading ? "Processing..." : `Withdraw ${tokenSymbol}`}
            </button>
          </div>
          {status && <p className="mt-2 text-sm">{status}</p>}
        </div>
      );
}
