// context/WalletContext.tsx
"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Web3Provider } from '@ethersproject/providers';

declare global {
  interface Window {
    ethereum: any;
  }
}

interface WalletContextProps {
  account: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextProps | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [account, setAccount] = useState<string | null>(null);

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const provider = new Web3Provider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                setAccount(accounts[0]);
            } catch (error) {
                console.error('Error connecting to MetaMask:', error);
            }
        } else {
            alert('MetaMask not detected. Please install MetaMask!');
        }
    };

    const disconnectWallet = () => {
        setAccount(null);  // Clear the account state to simulate disconnecting
    };

    const checkWalletConnection = async () => {
        if (window.ethereum) {
            const provider = new Web3Provider(window.ethereum);
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) {
                setAccount(accounts[0]);
            }
        }
    };

    useEffect(() => {
        // Check if wallet is already connected when the page loads
        checkWalletConnection();
    }, []);

    return (
        <WalletContext.Provider value={{ account, connectWallet, disconnectWallet }}>
            {children}
        </WalletContext.Provider>
    );
};
