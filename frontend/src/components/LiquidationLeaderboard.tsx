import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../config/contracts"; 

type Props = {
    provider: ethers.BrowserProvider
}

const testAddresses = [
    "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", // Hardhat user 1
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Hardhat user 2
    "0x90f79bf6eb2c4f870365e785982e1f101e93b906", // Hardhat user 3
  ];
  

export default function LiquiditionLeaderboard({ provider } :  Props){
    const [atRiskUsers, setAtRiskUsers] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const contract = new ethers.Contract(CONTRACTS.LENDING_POOL_ADDRESS, CONTRACTS.LENDING_POOL_ABI, provider);

            const users = await Promise.all(
                testAddresses.map(async (addr) =>{
                    try {
                        const[collateralUsd, borrowedUsd, hfRaw] = await contract.getAccountData(addr);
                        const hf = parseFloat(ethers.formatEther(hfRaw));

                        return {
                            address: addr,
                            collateral: ethers.formatEther(collateralUsd),
                            borrowed: ethers.formatEther(borrowedUsd),
                            hf: hf.toFixed(2)
                        }
                    } catch (err: any) {
                        return null;
                    }
                })
            );

            const filtered = users.filter(u => u && parseFloat(u.hf) < 1.0);
            setAtRiskUsers(filtered);
        };

        load();
    }, [provider]);
    
    if(atRiskUsers.length === 0){
        return <p className="mt-6 text-sm text-green-400">🎉 No users currently at risk of liquidation.</p>;
    }

    return (
        <div className="mt-6 p-4 bg-gray-800 rounded">
          <h3 className="font-bold text-lg mb-2 text-red-400">💣 Liquidation Leaderboard</h3>
          <table className="text-sm w-full">
            <thead>
              <tr>
                <th className="text-left">User</th>
                <th>Collateral ($)</th>
                <th>Borrowed ($)</th>
                <th>Health Factor</th>
              </tr>
            </thead>
            <tbody>
              {atRiskUsers.map((u) => (
                <tr key={u.address}>
                  <td className="truncate max-w-[180px]">{u.address}</td>
                  <td>{u.collateral}</td>
                  <td>{u.borrowed}</td>
                  <td className="text-red-400">{u.hf} ⚠️</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
}