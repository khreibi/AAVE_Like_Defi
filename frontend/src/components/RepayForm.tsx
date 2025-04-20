import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../config/contracts";
import { TOKENS } from "../config/tokens";

type Props = {
    signer: ethers.Signer,
    userAddress: string,
    tokenSymbol: string
};

export default function RepayForm ({ signer, userAddress, tokenSymbol}: Props){
    const [amount, setAmount] = useState("");
    const [status, setStatus] = useState("");

    const token = TOKENS.find(t => t.symbol === tokenSymbol);
    if(!token) return <p className="text-red-500">Invalid token</p>;

    const handleRepay = async () => {
        try {
            const parsedAmount = ethers.parseUnits(amount, token.decimals);
            const tokenContract = new ethers.Contract(token.address, CONTRACTS.DAI_ABI, signer);
            const lendingPool = new ethers.Contract(CONTRACTS.LENDING_POOL_ADDRESS, CONTRACTS.LENDING_POOL_ABI, signer);


            const allowance = await tokenContract.allowance(userAddress, CONTRACTS.LENDING_POOL_ADDRESS)

            if(allowance < parsedAmount){
                setStatus("⏳ Approving token (infinite approval)...");
                const tx = await tokenContract.approve(CONTRACTS.LENDING_POOL_ADDRESS, ethers.MaxUint256);
                await tx.wait();
            }

            setStatus("💸 Sending repay transaction...");
            const tx = await lendingPool.repay(token.address, parsedAmount);
            await tx.wait();

            setStatus("✅ Repayment successful!");
        } catch (err: any) {
            console.error(err);
            setStatus(`❌ Error: ${err.reason || err.message}`);
        }
    };

    return (
        <div className="mt-6">
          <h3 className="font-bold text-lg mb-2">💵 Repay</h3>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder={`Amount (${tokenSymbol})`}
              className="text-black px-4 py-2 rounded border w-48"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <button
              onClick={handleRepay}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Repay {tokenSymbol}
            </button>
          </div>
          {status && <p className="mt-2 text-sm">{status}</p>}
        </div>
      );

}