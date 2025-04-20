import { useState } from "react";
import { ethers } from "ethers";
import WalletConnect from "./components/WalletConnect";
import TokenSelector from "./components/TokenSelector";
import DepositForm from "./components/DepositForm";
import UserStats from "./components/UserStats";
import BorrowForm from "./components/BorrowForm";
import WithdrawForm from "./components/withdrawForm";
import LiquidationForm from "./components/LiquidationForm";
import UserPosition from "./components/UserPosition";
import LiquidationLeaderboard from "./components/LiquidationLeaderboard";
import RepayForm from "./components/RepayForm";

function App() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<string>("DAI");

  const handleConnect = (prov: ethers.BrowserProvider, s: ethers.Signer, addr: string) => {
    setProvider(prov);
    setSigner(s);
    setUserAddress(addr);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-4">🟢 AAVE Lite Frontend</h1>
  
      <WalletConnect onConnect={handleConnect} />
  
      <table className="w-full table-auto border-separate border-spacing-y-4">
        <tbody>
          {signer && userAddress && provider && (
            <>
              <tr>
                <td colSpan={4}>
                  <UserStats userAddress={userAddress} provider={provider} />
                </td>
              </tr>
              <tr>
                <td colSpan={4}>
                  <TokenSelector selected={selectedToken} onSelect={setSelectedToken} />
                </td>
              </tr>
            </>
          )}
  
          {signer && userAddress && (
            <tr>
              <td><DepositForm tokenSymbol={selectedToken} signer={signer} userAddress={userAddress} /></td>
              <td><BorrowForm tokenSymbol={selectedToken} signer={signer} userAddress={userAddress} /></td>
              <td><WithdrawForm tokenSymbol={selectedToken} signer={signer} userAddress={userAddress} /></td>
              <td><RepayForm tokenSymbol={selectedToken} signer={signer} userAddress={userAddress} /></td>
            </tr>
          )}
  
          {provider && userAddress && (
            <tr>
              <td colSpan={4}>
                <UserPosition userAddress={userAddress} provider={provider} />
              </td>
            </tr>
          )}
  
          {signer && userAddress && (
            <tr>
              <td colSpan={2}><LiquidationLeaderboard provider={provider} /></td>
              <td colSpan={2}><LiquidationForm signer={signer} userAddress={userAddress} /></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
  
}

export default App;
