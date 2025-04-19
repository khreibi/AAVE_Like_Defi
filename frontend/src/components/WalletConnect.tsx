import { useState, useEffect } from "react";
import { ethers } from "ethers";

type Props = {
    onConnect: (provider: ethers.BrowserProvider, signer: ethers.Signer, address: string) => void;
}

export default function WalletConnect({ onConnect }: Props){
    const [isAvailable, setIsAvailable] = useState(false);
    const [address, setAddress] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
            setIsAvailable(true);
        }
        }, []);

    const connect = async () => {
        if (!window.ethereum) return alert("MetaMask is not available.");

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const addr = await signer.getAddress();
    
        setAddress(addr);
        onConnect(provider, signer, addr);
    
    }
    return isAvailable ? (
        <button onClick={connect} className="px-4 py-2 bg-blue-600 text-white rounded">
          {address ? `Connected: ${address.slice(0, 6)}...` : "Connect Wallet"}
        </button>
      ) : (
        <p className="text-red-500">❌ MetaMask not found. Please install it to continue.</p>
      );
    }