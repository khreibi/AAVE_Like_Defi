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

      {signer && userAddress && provider && (
  <UserStats userAddress={userAddress} provider={provider} />
)}

      {userAddress && (
        <>
          <p className="mt-4 mb-2">Select Token:</p>
          <TokenSelector selected={selectedToken} onSelect={setSelectedToken} />
        </>
      )}
      {signer && userAddress && (
        <DepositForm
          tokenSymbol={selectedToken}
          signer={signer}
          userAddress={userAddress}
        />
      )}

      {signer && userAddress && (
        <BorrowForm
          tokenSymbol={selectedToken}
          signer={signer}
          userAddress={userAddress}
        />
      )}

    {signer && userAddress && (
      <WithdrawForm
        tokenSymbol={selectedToken}
        signer={signer}
        userAddress={userAddress}
      />
      )}

    {signer && userAddress && (
      <LiquidationForm signer={signer} userAddress={userAddress} />
    )}

    {provider && userAddress && (

        <>
          <UserStats userAddress={userAddress} provider={provider} />
          <UserPosition userAddress={userAddress} provider={provider} />
        </>
    )}

    {provider && (
      <LiquidationLeaderboard provider={provider} />
    )}
    </div>
  );
}

export default App;
