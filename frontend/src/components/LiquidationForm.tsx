import { use, useState } from "react";
import { ethers } from "ethers";
import { TOKENS } from "../config/tokens";
import { CONTRACTS } from "../config/contracts";

type Props = {
    signer: ethers.Signer,
    userAddress: string
};

export default function LiquidationForm({ signer, userAddress }: Props){
    const [borrower, setBorrower] = useState("");
    const [amount, setAmount] = useState("");
    const [asset, setAsset] = useState("USDC");
    const [status, setStatus] = useState("");

    const tokenMeta = TOKENS.find(t=> t.symbol === asset);
    if(!tokenMeta) return <p className="text-red-400">Invalid token</p>;
    const handleLiquidate = async () => {
        try {
            setStatus("Checking health factor..."); 
            const pool = new ethers.Contract(CONTRACTS.LENDING_POOL_ADDRESS, CONTRACTS.LENDING_POOL_ABI, signer);

            const [,, hf] = await pool.getAccountData(borrower);
            const parsedHF = Number(ethers.formatEther(hf));
        
            if(parsedHF >= 1.0){
                setStatus("❌ Borrower is not eligible for liquidation (HF ≥ 1.0)"); 
                return;
            }
        
            const parsedAmount = ethers.parseUnits(amount, tokenMeta.decimals);
        
            const token = new ethers.Contract(tokenMeta.address, CONTRACTS.DAI_ABI, signer);
            const allowance = await token.allowance(userAddress, CONTRACTS.LENDING_POOL_ADDRESS);
        
            if( allowance < parsedAmount){
                setStatus("Approving token...");
                const approveTx = await token.approve(CONTRACTS.LENDING_POOL_ADDRESS, parsedAmount);
                await approveTx.wait();
            }
        
            setStatus("Executing liquidation...");
        
            const tx = await pool.liquidate(borrower, tokenMeta.address, tokenMeta.address, parsedAmount);
            const receip = await tx.wait();
        
            setStatus("✅ Liquidation complete (see transaction)"); 
        } catch (err: any) {
            console.error(err);
            const reason = err?.reason || err?.message || "unknown";
            setStatus(`❌ Failed: ${reason}`);    
        }
    };

    return (
        <div className="mt-6 p-4 bg-gray-800 rounded">
          <h3 className="font-bold text-lg mb-2">🧨 Liquidation</h3>
    
          <input
            type="text"
            placeholder="Borrower address"
            value={borrower}
            onChange={(e) => setBorrower(e.target.value)}
            className="block w-full mb-2 px-3 py-2 text-black rounded"
          />
    
          <input
            type="number"
            placeholder={`Repay amount (${asset})`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="block w-full mb-2 px-3 py-2 text-black rounded"
          />
    
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="block w-full mb-3 px-3 py-2 text-black rounded"
          >
            {TOKENS.map((t) => (
              <option key={t.symbol} value={t.symbol}>
                {t.symbol}
              </option>
            ))}
          </select>
    
          <button
            onClick={handleLiquidate}
            className="px-4 py-2 bg-red-700 text-white font-semibold rounded w-full"
          >
            Liquidate
          </button>
    
          {status && <p className="mt-3 text-sm">{status}</p>}
        </div>
      );

}