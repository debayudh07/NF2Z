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

// Import your smart contract ABI and address
import contractABi from '../contractABI'
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS

// Define NFT type
interface NFT {
  id: string
  name: string
  description: string
  image: string
  owner: string
}

export default function AccountPage() {
  const [account, setAccount] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [chainId, setChainId] = useState<string | null>(null)
  const [networkName, setNetworkName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [myNFTs, setMyNFTs] = useState<NFT[]>([])
  const [nftLoading, setNftLoading] = useState(false)
  const [debug, setDebug] = useState<any>(null)  // For debugging purposes

  const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY
  const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY

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
          
          // After wallet is connected, load NFTs
          await loadNFTs(address, provider, signer)
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

  const loadNFTs = async (address: string, provider: ethers.BrowserProvider, signer: ethers.Signer) => {
    try {
      setNftLoading(true)
      setDebug(null)
      
      // Create contract instance with signer for read-write operations
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS as string,
        contractABi,
        signer
      )
      
      console.log("Fetching NFTs for account:", address)
      console.log("Using contract at address:", CONTRACT_ADDRESS)
      
      try {
        // Call getMyNFTs function from the smart contract
        const myNFTsData = await contract.getMyNFTs()
        
        // Save debug info
        setDebug({
          raw: myNFTsData,
          stringified: JSON.stringify(myNFTsData, 
            (key, value) => typeof value === 'bigint' ? value.toString() : value
          )
        })
        
        console.log("Raw NFT data:", myNFTsData)
        
        // Handle different return types
        const nftArray = Array.isArray(myNFTsData) ? myNFTsData : 
                       myNFTsData.toArray ? myNFTsData.toArray() : 
                       myNFTsData.toString ? [myNFTsData] : []
        
        if (nftArray.length === 0) {
          console.log("No NFTs found in the response")
          setMyNFTs([])
          setNftLoading(false)
          return
        }
  
        // Process the returned NFT data
        const nftsWithMetadata = await Promise.all(
          nftArray.map(async (nftData: any, index: number) => {
            try {
              console.log(`Processing NFT at index ${index}:`, nftData)
              
              // Extract ID from the returned data - adjust based on your contract's return structure
              // Handle different data structures
              let id, owner
              
              if (Array.isArray(nftData)) {
                // If it's an array like [id, owner, creator, price]
                id = nftData[0]?.toString() || index.toString()
                owner = nftData[1] || nftData[2] || address
              } else if (typeof nftData === 'object' && nftData !== null) {
                // If it's an object with properties
                id = nftData.id?.toString() || nftData.tokenId?.toString() || index.toString()
                owner = nftData.owner || nftData.creator || address
              } else {
                // If it's a primitive (like just the ID)
                id = nftData.toString()
                owner = address
              }
              
              console.log(`Extracted ID: ${id}, Owner: ${owner}`)
              
              // Get token URI for this ID
              console.log(`Requesting tokenURI for ID: ${id}`)
              const tokenURI = await contract.tokenURI(id)
              console.log(`Token URI for ID ${id}:`, tokenURI)
              
              // If tokenURI is IPFS URI, handle accordingly
              const metadataURL = tokenURI.startsWith('ipfs://')
                ? `https://gateway.pinata.cloud/ipfs/${tokenURI.slice(7)}`
                : tokenURI
              
              console.log(`Fetching metadata from: ${metadataURL}`)
              
              // Try to fetch metadata
              const metadata = await axios.get(metadataURL)
              console.log(`Metadata for ID ${id}:`, metadata.data)
              
              // Process image URL if it's IPFS
              let imageUrl = metadata.data.image
              if (imageUrl && imageUrl.startsWith('ipfs://')) {
                imageUrl = `https://gateway.pinata.cloud/ipfs/${imageUrl.slice(7)}`
              }
              
              return {
                id: id,
                name: metadata.data.name || `NFT #${id}`,
                description: metadata.data.description || '',
                image: imageUrl || '/placeholder-nft.jpeg',
                owner: owner
              }
            } catch (err) {
              console.error(`Error processing NFT data for index ${index}:`, err)
              console.error(`NFT data was:`, nftData)
              
              // Try to extract an ID even if there was an error
              let id = index.toString()
              try {
                if (Array.isArray(nftData)) {
                  id = nftData[0]?.toString() || id
                } else if (typeof nftData === 'object' && nftData !== null) {
                  id = nftData.id?.toString() || nftData.tokenId?.toString() || id
                } else if (nftData !== null && nftData !== undefined) {
                  id = nftData.toString()
                }
              } catch (idErr) {
                console.error("Could not extract ID:", idErr)
              }
              
              // Return a placeholder for failed NFTs
              return {
                id: id,
                name: `NFT #${id}`,
                description: 'Error loading metadata',
                image: '/placeholder-nft.png',
                owner: address
              }
            }
          })
        )
        
        console.log("Processed NFTs:", nftsWithMetadata)
        setMyNFTs(nftsWithMetadata.filter(nft => nft !== null))
      } catch (err) {
        console.error("Error in getMyNFTs call:", err)
        
        // Fallback: Try to get NFTs by events if direct method fails
        try {
          console.log("Trying fallback method to get NFTs...")
          
          // Get past Transfer events where 'to' is current address
          const filter = contract.filters.Transfer(null, address, null)
          const events = await contract.queryFilter(filter)
          console.log("Found transfer events:", events.length)
          
          if (events.length > 0) {
            // Process events to get token IDs
            const uniqueTokenIds = new Set()
            events.forEach(event => {
              if ('args' in event && event.args && event.args[2]) {
                uniqueTokenIds.add(event.args[2].toString())
              }
            })
            
            console.log("Unique token IDs:", Array.from(uniqueTokenIds))
            
            // Process each token ID
            const nftsWithMetadata = await Promise.all(
              Array.from(uniqueTokenIds).map(async (id: any) => {
                try {
                  const tokenURI = await contract.tokenURI(id)
                  
                  const metadataURL = tokenURI.startsWith('ipfs://')
                    ? `https://gateway.pinata.cloud/ipfs/${tokenURI.slice(7)}`
                    : tokenURI
                  
                  const metadata = await axios.get(metadataURL)
                  
                  let imageUrl = metadata.data.image
                  if (imageUrl && imageUrl.startsWith('ipfs://')) {
                    imageUrl = `https://gateway.pinata.cloud/ipfs/${imageUrl.slice(7)}`
                  }
                  
                  return {
                    id: id.toString(),
                    name: metadata.data.name || `NFT #${id}`,
                    description: metadata.data.description || '',
                    image: imageUrl || '/placeholder-nft.png',
                    owner: address
                  }
                } catch (err) {
                  console.error(`Error processing token ID ${id}:`, err)
                  return {
                    id: id.toString(),
                    name: `NFT #${id}`,
                    description: 'Error loading metadata',
                    image: '/placeholder-nft.png',
                    owner: address
                  }
                }
              })
            )
            
            setMyNFTs(nftsWithMetadata.filter(nft => nft !== null))
          }
        } catch (fallbackErr) {
          console.error("Fallback method also failed:", fallbackErr)
          setError('Could not load NFTs. Please check the console for details.')
        }
      }
    } catch (err) {
      console.error('Failed to load NFTs:', err)
      setError('Failed to load your NFTs. Please check the console for details.')
    } finally {
      setNftLoading(false)
    }
  }

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
    setMyNFTs([])
    localStorage.removeItem('profilePicture') // Clear stored profile picture
  }

  const refreshNFTs = async () => {
    if (account) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()
        await loadNFTs(account, provider, signer)
      } catch (err) {
        console.error('Failed to refresh NFTs:', err)
        setError('Failed to refresh your NFTs. Please try again.')
      }
    }
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

        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-white/[0.2] shadow-xl mb-8">
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

        {/* NFTs Section */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-white/[0.2] shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">My NFTs</CardTitle>
            <CardDescription className="text-gray-400">NFTs created by this account</CardDescription>
          </CardHeader>
          <CardContent>
            {nftLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : myNFTs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No NFTs found for this account</p>
                <Button
                  onClick={refreshNFTs}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                  disabled={nftLoading}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {myNFTs.map((nft) => (
                  <div key={nft.id} className="bg-gray-800 rounded-lg overflow-hidden">
                    <div className="aspect-square overflow-hidden">
                      <img 
                        src={nft.image} 
                        alt={nft.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback for broken images
                          (e.target as HTMLImageElement).src = '/placeholder-nft.png'
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-cyan-400 truncate">{nft.name}</h3>
                      <p className="text-sm text-gray-300 mt-1 line-clamp-2">{nft.description}</p>
                      <p className="text-xs text-gray-400 mt-2">ID: {nft.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              onClick={refreshNFTs}
              className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              disabled={nftLoading || !account}
            >
              {nftLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading NFTs...
                </>
              ) : (
                'Refresh NFTs'
              )}
            </Button>
          </CardContent>
        </Card>
        
      </div>
    </div>
    </div>
  )
}