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
  profilePicture: string | null;
  setProfilePicture: (url: string | null) => void;
  isConnecting: boolean;
  chainId: string | null;
  switchNetwork: (chainId: string) => Promise<void>;
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
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);

  // Load saved profile picture from localStorage
  useEffect(() => {
    const savedProfilePicture = localStorage.getItem('profilePicture');
    if (savedProfilePicture) {
      setProfilePicture(savedProfilePicture);
    }
  }, []);

  // Handle account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = (newChainId: string) => {
        setChainId(newChainId);
        // Reload the page to refresh all states
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Get initial chainId
      window.ethereum.request({ method: 'eth_chainId' }).then((id: string) => {
        setChainId(id);
      });

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        setIsConnecting(true);
        const provider = new Web3Provider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const network = await provider.getNetwork();
        setChainId(network.chainId.toString());
        setAccount(accounts[0]);

        // Load saved profile picture for this account
        const savedProfilePicture = localStorage.getItem(`profilePicture_${accounts[0]}`);
        if (savedProfilePicture) {
          setProfilePicture(savedProfilePicture);
        }
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    } else {
      throw new Error('MetaMask not detected. Please install MetaMask!');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProfilePicture(null);
    localStorage.removeItem(`profilePicture_${account}`);
  };

  const updateProfilePicture = (url: string | null) => {
    setProfilePicture(url);
    if (account && url) {
      localStorage.setItem(`profilePicture_${account}`, url);
    } else if (account) {
      localStorage.removeItem(`profilePicture_${account}`);
    }
  };

  const switchNetwork = async (targetChainId: string) => {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: targetChainId,
                // Add other parameters based on the network you want to add
                // This is an example for Mumbai testnet
                rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
                chainName: 'Mumbai Testnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18
                },
                blockExplorerUrls: ['https://mumbai.polygonscan.com/']
              },
            ],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
          throw addError;
        }
      }
      console.error('Error switching network:', error);
      throw error;
    }
  };

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      const provider = new Web3Provider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const network = await provider.getNetwork();
        setChainId(network.chainId.toString());

        // Load saved profile picture for this account
        const savedProfilePicture = localStorage.getItem(`profilePicture_${accounts[0]}`);
        if (savedProfilePicture) {
          setProfilePicture(savedProfilePicture);
        }
      }
    }
  };

  useEffect(() => {
    checkWalletConnection();
  }, []);

  return (
    <WalletContext.Provider 
      value={{ 
        account, 
        connectWallet, 
        disconnectWallet,
        profilePicture,
        setProfilePicture: updateProfilePicture,
        isConnecting,
        chainId,
        switchNetwork
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};