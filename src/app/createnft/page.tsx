"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Header from "@/components/functions/Header";
import axios from "axios";
import { useWallet } from "../_contexts/WalletContext"; // Import Wallet Context
 import contractABi from "../contractABI";// Import the ABI from the JSON file
import { ethers } from "ethers";

export default function NFTCreationForm() {
  const { account, connectWallet } = useWallet(); // Use Wallet Context
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement;
    const files = (e.target as HTMLInputElement).files;
    setForm({
      ...form,
      [name]: files ? files[0] : value,
    });
  };

  const uploadToPinata = async () => {
    const formData = new FormData();
    if (form.image) {
      formData.append("file", form.image);
    } else {
      throw new Error("No image file selected");
    }
    try {
      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          "pinata_api_key": process.env.NEXT_PUBLIC_PINATA_API_KEY,
          "pinata_secret_api_key": process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
          "Content-Type": "multipart/form-data",
        },
      });
      return `ipfs://${res.data.IpfsHash}`;
    } catch (error) {
      console.error("Error uploading image to IPFS:", error);
      return null;
    }
  };

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS; // Your deployed contract address

  const createNFT = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!account) {
      alert("Please connect your wallet first!");
      return;
    }

    const price = form.price;
    try {
      const tokenURI = await uploadToPinata();
      if (!tokenURI) {
        alert("Image upload failed.");
        return;
      }

      // Set up provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      if (!contractAddress) {
        alert("Contract address is not defined.");
        return;
      }

      // Create contract instance using ABI and contract address
      const contract = new ethers.Contract(contractAddress, contractABi, signer);

      // Convert price to wei
     

      // Estimate gas for createToken function
      const priceInWei = ethers.parseUnits(form.price, 'ether');

      // Call the contract's createToken function
      const transaction = await contract.createToken(tokenURI, priceInWei);
      // Await transaction confirmation
      await transaction.wait();
      alert("NFT created successfully!");
    } catch (error) {
      console.error("Error creating NFT:", error);
      alert("An error occurred while creating the NFT.");
    }
  };

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl lg:grid lg:grid-cols-2 gap-8 rounded-xl overflow-hidden backdrop-blur-xl bg-black bg-opacity-30 shadow-2xl border border-cyan-500/20">
          <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold">Create NFT</h1>
                <p className="mt-2 text-sm text-cyan-300">Fill in the details below to create your new NFT</p>
              </div>
              <form onSubmit={createNFT} className="mt-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nft-name" className="text-cyan-400">NFT Name</Label>
                    <Input
                      id="nft-name"
                      name="name"
                      type="text"
                      placeholder="My Awesome NFT"
                      required
                      className="mt-1 bg-black bg-opacity-50 border-cyan-500/50 text-cyan-300 placeholder-cyan-700"
                      onChange={(e) => handleChange(e as React.ChangeEvent<HTMLInputElement>)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-cyan-400">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe your NFT..."
                      required
                      className="mt-1 bg-black bg-opacity-50 border-cyan-500/50 text-cyan-300 placeholder-cyan-700"
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price" className="text-cyan-400">Price (ETH)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      placeholder="0.05"
                      required
                      className="mt-1 bg-black bg-opacity-50 border-cyan-500/50 text-cyan-300 placeholder-cyan-700"
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image" className="text-cyan-400">Upload Image</Label>
                    <Input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      required
                      className="mt-1 bg-black bg-opacity-50 border-cyan-500/50 text-cyan-300 file:bg-cyan-900 file:text-cyan-300 file:border-0 file:rounded-md file:px-4 file:py-2 hover:file:bg-cyan-800"
                      onChange={handleChange}
                    />
                  </div>
                </div>
                {!account ? (
                  <Button onClick={connectWallet} className="w-full mt-4">Connect Wallet</Button>
                ) : (
                  <Button type="submit" className="w-full mt-4 bg-cyan-600">Create NFT</Button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
