"use client"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Boxes } from "@/components/ui/background-boxes"
import { cn } from "@/lib/utils"
import Header from "@/components/functions/Header"
import axios from "axios"
import contractABi from "../contractABI"
import { ethers } from "ethers"
import {
  ConnectButton
} from '@rainbow-me/rainbowkit'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { BrowserProvider } from 'ethers'

export default function NFTCreationForm() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const signer = walletClient ? new BrowserProvider(walletClient as any).getSigner() : undefined
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image: null,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: { target: { files?: any; name?: any; value?: any } }) => {
    const { name, value } = e.target
    const files = e.target.files
    setForm({
      ...form,
      [name]: files ? files[0] : value,
    })
  }

  const uploadImageToPinata = async () => {
    const formData = new FormData()
    if (form.image) {
      formData.append("file", form.image)
    } else {
      throw new Error("No image file selected")
    }
    try {
      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          "pinata_api_key": process.env.NEXT_PUBLIC_PINATA_API_KEY,
          "pinata_secret_api_key": process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
          "Content-Type": "multipart/form-data",
        },
      })
      return res.data.IpfsHash
    } catch (error) {
      console.error("Error uploading image to IPFS:", error)
      return null
    }
  }

  const uploadMetadataToPinata = async (imageHash: any) => {
    const metadata = {
      name: form.name,
      description: form.description,
      image: `ipfs://${imageHash}`,
    }
    
    try {
      const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
        headers: {
          "pinata_api_key": process.env.NEXT_PUBLIC_PINATA_API_KEY,
          "pinata_secret_api_key": process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
          "Content-Type": "application/json",
        },
      })
      return `ipfs://${res.data.IpfsHash}`
    } catch (error) {
      console.error("Error uploading metadata to IPFS:", error)
      return null
    }
  }

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS

  const createNFT = async (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (!isConnected || !signer) {
      alert("Please connect your wallet first!")
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Upload the image file
      const imageHash = await uploadImageToPinata()
      if (!imageHash) {
        alert("Image upload failed.")
        setIsLoading(false)
        return
      }
      
      // Step 2: Upload the metadata (including name, description, and image reference)
      const tokenURI = await uploadMetadataToPinata(imageHash)
      if (!tokenURI) {
        alert("Metadata upload failed.")
        setIsLoading(false)
        return
      }

      if (!contractAddress) {
        alert("Contract address is not defined.")
        setIsLoading(false)
        return
      }

      const contract = new ethers.Contract(contractAddress, contractABi, await signer)
      const priceInWei = ethers.parseUnits(form.price, 'ether')
      
      // Request transaction creation
      const transaction = await contract.createToken(tokenURI, priceInWei)
      
      // Wait for transaction to be confirmed
      const receipt = await transaction.wait()
      
      // Reset form after successful NFT creation
      setForm({
        name: "",
        description: "",
        price: "",
        image: null,
      })
      
      alert(`NFT created successfully! Transaction hash: ${receipt.hash}`)
    } catch (error) {
      console.error("Error creating NFT:", error)
      alert("An error occurred while creating the NFT.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-black text-cyan-400 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl lg:grid lg:grid-cols-2 gap-8 rounded-xl overflow-hidden backdrop-blur-xl bg-black bg-opacity-30 shadow-2xl border border-cyan-500/20">
          {/* Form Section */}
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
                      value={form.name}
                      placeholder="My Awesome NFT"
                      required
                      className="mt-1 bg-black bg-opacity-50 border-cyan-500/50 text-cyan-300 placeholder-cyan-700"
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-cyan-400">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={form.description}
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
                      value={form.price}
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
                
                <div className="pt-2">
                  {!isConnected ? (
                    <div className="flex justify-center">
                      <ConnectButton />
                    </div>
                  ) : (
                    <Button 
                      type="submit" 
                      className="w-full bg-cyan-600 hover:bg-cyan-700" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating NFT..." : "Create NFT"}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Animated Background Section */}
          <div className="relative h-full w-full overflow-hidden bg-slate-900 flex flex-col items-center justify-center">
            <div className="absolute inset-0 w-full h-full bg-slate-900 z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />
            <Boxes />
            <h1 className={cn("md:text-4xl text-xl text-white relative z-20")}>
              Create Your NFT
            </h1>
            <p className="text-center mt-2 text-neutral-300 relative z-20 px-4">
              Transform your digital art into unique blockchain assets
            </p>
            {isConnected && (
              <div className="mt-4 text-sm text-cyan-300 relative z-20">
                Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}