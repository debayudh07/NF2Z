/* eslint-disable */

'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { ethers } from 'ethers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Upload } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import axios from 'axios'
import Header from '@/components/functions/Header'

export default function AccountPage() {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [chainId, setChainId] = useState<string | null>(null)
  const [networkName, setNetworkName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)

  const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY
  const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY

  useEffect(() => {
    const connectWallet = async () => {
      setLoading(true)
      setError(null)

      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' })
          const provider = new ethers.BrowserProvider(window.ethereum)
          const signer = await provider.getSigner()
          const address = await signer.getAddress()
          setAccount(address)

          const balance = await provider.getBalance(address)
          setBalance(ethers.formatEther(balance))

          const network = await provider.getNetwork()
          setChainId(network.chainId.toString())
          setNetworkName(network.name)

          // Load profile picture from localStorage or backend
          const storedProfilePicture = localStorage.getItem('profilePicture')
          if (storedProfilePicture) {
            setProfilePicture(storedProfilePicture)
          }

          setLoading(false)
        } catch (err) {
          console.error('Failed to connect wallet:', err)
          setError('Failed to connect wallet. Please try again.')
          setLoading(false)
        }
      } else {
        setError('Metamask is not installed. Please install it to use this feature.')
        setLoading(false)
      }
    }

    connectWallet()
  }, [])

  const uploadToPinata = async (file: File) => {
    try {
      setUploadLoading(true)
      const formData = new FormData()
      formData.append('file', file)
  
      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: {
          "pinata_api_key": process.env.NEXT_PUBLIC_PINATA_API_KEY,
          "pinata_secret_api_key": process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY,
          "Content-Type": "multipart/form-data",
        },
      })
  
      const ipfsHash = res.data.IpfsHash
      const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`

      // Store the IPFS URL in localStorage or send it to the backend
      localStorage.setItem('profilePicture', ipfsUrl)
      return ipfsUrl
    } catch (err) {
      console.error('Failed to upload to Pinata:', err)
      throw new Error('Failed to upload image to Pinata')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleProfilePictureChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        const ipfsUrl = await uploadToPinata(file)
        setProfilePicture(ipfsUrl)
      } catch (err) {
        setError('Failed to upload profile picture. Please try again.')
      }
    }
  }

  const handleDisconnect = () => {
    setAccount(null)
    setBalance(null)
    setChainId(null)
    setNetworkName(null)
    setProfilePicture(null)
    localStorage.removeItem('profilePicture') // Clear stored profile picture
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-gray-900 to-black">
        <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-gray-900 to-black p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div>
    <Header />
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
          Account Details
        </h1>
        
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-white/[0.2] shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Profile Picture</CardTitle>
            <CardDescription className="text-gray-400">Upload or change your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={profilePicture || undefined} alt="Profile picture" />
              <AvatarFallback className="bg-gray-700 text-cyan-400">
                {account ? account.slice(0, 2).toUpperCase() : 'NA'}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-2">
              <Input
                id="picture"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
                disabled={uploadLoading}
              />
              <Label
                htmlFor="picture"
                className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white h-10 py-2 px-4 ${
                  uploadLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {uploadLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Upload Picture
                  </>
                )}
              </Label>
            </div>
            
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-white/[0.2] shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Wallet Information</CardTitle>
            <CardDescription className="text-gray-400">Your Metamask wallet details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-cyan-400">Account Address</h3>
              <p className="text-sm text-gray-300 break-all">{account}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-cyan-400">Balance</h3>
              <p className="text-sm text-gray-300">{balance} ETH</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-cyan-400">Chain ID</h3>
              <p className="text-sm text-gray-300">{chainId}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-cyan-400">Network Name</h3>
              <p className="text-sm text-gray-300">{networkName}</p>
            </div>
            <Button
              onClick={handleDisconnect}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Disconnect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  )
}
