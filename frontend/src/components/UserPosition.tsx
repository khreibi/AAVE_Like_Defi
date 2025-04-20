import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { TOKENS } from "../config/tokens";
import { CONTRACTS } from "../config/contracts";

type Props = {
    userAddress: string,
    provider: ethers.BrowserProvider;
}

export default function UerPosition({ userAddress, provider}: Props){
    const [positions, setPositions] = useState<any[]>([]);
    const [netWorth, setNewWorth] = useState("0");

    useEffect(()=>{
        const fetchData = async () =>{
            const pool = new ethers.Contract(CONTRACTS.LENDING_POOL_ADDRESS, CONTRACTS.LENDING_POOL_ABI, provider);
            
            const updated = await Promise.all(TOKENS.map(async (token) =>{
                const erc20 = new ethers.Contract(token.address, CONTRACTS.DAI_ABI, provider);

                const [wallet, deposit, accrueDebt, price] = await Promise.all([
                    erc20.balanceOf(userAddress),
                    pool.userBalances(userAddress, token.address),
                    pool.getAccruedDebt(userAddress, token.address),
                    pool.assetPrices(token.address)
                ]);

                const walletFloat = parseFloat(ethers.formatUnits(wallet, token.decimals));
                const depositFloat = parseFloat(ethers.formatUnits(deposit, token.decimals));
                const debtFloat = parseFloat(ethers.formatUnits(accrueDebt, token.decimals));
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
            }));

            setPositions(updated);

            const totalNet = updated.reduce((sum, t)=> sum + t.net, 0);
            setNewWorth(totalNet.toFixed(2));
        };

        if(userAddress) fetchData();
    },[userAddress, provider]);
    return (
        <div className="mt-6 p-4 bg-gray-800 rounded">
          <h3 className="text-lg font-bold mb-2">📊 User Position Overview</h3>
          <table className="text-sm w-full">
            <thead>
              <tr>
                <th className="text-left">Asset</th>
                <th>Wallet</th>
                <th>Deposited</th>
                <th>Borrowed</th>
                <th>Net (USD)</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((t) => (
                <tr key={t.symbol}>
                  <td>{t.symbol}</td>
                  <td>{t.wallet}</td>
                  <td>{t.deposit}</td>
                  <td>{t.debt}</td>
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