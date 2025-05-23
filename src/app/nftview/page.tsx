/*eslint-disable*/
'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card"
import Header from '@/components/functions/Header'
import contractABi from '../contractABI'
import { Loader2 } from 'lucide-react'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS

interface NFT {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  price: string;
}

export default function NFTViewer() {
  const [nfts, setNFTs] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [sellingNFT, setSellingNFT] = useState<NFT | null>(null)
  const [sellPrice, setSellPrice] = useState('')
  const [isSaleProcessing, setIsSaleProcessing] = useState(false)
  
  // Ethers.js states
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [contract, setContract] = useState<ethers.Contract | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  
  // Initialize ethers provider and contract
  useEffect(() => {
    const initEthers = async () => {
      // Check if ethereum is available (metamask or other wallet)
      if (window.ethereum) {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum)
          setProvider(browserProvider)
          
          // Create contract instance
          if (CONTRACT_ADDRESS) {
            const contractInstance = new ethers.Contract(
              CONTRACT_ADDRESS,
              contractABi,
              browserProvider
            )
            setContract(contractInstance)
          }
          
          // Check if already connected
          const accounts = await browserProvider.listAccounts()
          if (accounts.length > 0) {
            const userSigner = await browserProvider.getSigner()
            setSigner(userSigner)
            setAddress(accounts[0].address)
            setIsConnected(true)
          }
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length > 0) {
              handleAccountChange(browserProvider)
            } else {
              // Disconnected
              setSigner(null)
              setAddress(null)
              setIsConnected(false)
            }
          })
          
          // Listen for chain changes
          window.ethereum.on('chainChanged', () => {
            window.location.reload()
          })
          
        } catch (error) {
          console.error("Error initializing ethers:", error)
        }
      }
    }
    
    initEthers()
    
    // Cleanup
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged')
        window.ethereum.removeAllListeners('chainChanged')
      }
    }
  }, [])

  // Handle account changes
  const handleAccountChange = async (provider: ethers.BrowserProvider) => {
    try {
      const userSigner = await provider.getSigner()
      const userAddress = await userSigner.getAddress()
      
      setSigner(userSigner)
      setAddress(userAddress)
      setIsConnected(true)
      
      // Create contract with signer
      if (CONTRACT_ADDRESS) {
        const contractWithSigner = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABi,
          userSigner
        )
        setContract(contractWithSigner)
      }
    } catch (error) {
      console.error("Error handling account change:", error)
    }
  }
  
  // Connect wallet
  const handleConnectWallet = async () => {
    if (!provider) return
    
    try {
      // Request accounts access
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      await handleAccountChange(provider)
    } catch (error) {
      console.error("Error connecting wallet:", error)
    }
  }
  
  // Fetch all listed NFTs
  const fetchListedNFTs = async () => {
    if (!contract) return
    
    try {
      setLoading(true)
      const listedNFTs = await contract.getAllListedNFTs()
      
      if (listedNFTs && Array.isArray(listedNFTs)) {
        const nftsPromises = listedNFTs.map(fetchNFTMetadata)
        const nftsData = (await Promise.all(nftsPromises)).filter(Boolean) as NFT[]
        setNFTs(nftsData)
      }
    } catch (error) {
      console.error("Error fetching listed NFTs:", error)
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch token URI data for NFTs
  const fetchNFTMetadata = async (nft: any) => {
    try {
      // Get token URI
      const tokenURI = await contract?.tokenURI(nft.tokenId)
      
      let httpUrl = tokenURI.startsWith("ipfs://")
        ? tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
        : tokenURI

      const response = await fetch(httpUrl)
      const contentType = response.headers.get("content-type")

      let metadata
      let imageUrl
      let name = `NFT ${nft.tokenId}`
      let description = ''

      if (contentType && contentType.includes("application/json")) {
        metadata = await response.json()
        imageUrl = metadata.image
        name = metadata.name || name
        description = metadata.description || ''
      } else if (contentType && contentType.includes("image/")) {
        metadata = { name, description }
        imageUrl = httpUrl
      } else {
        throw new Error(`Unexpected content type: ${contentType}`)
      }

      if (imageUrl.startsWith("ipfs://")) {
        imageUrl = imageUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
      }

      return {
        tokenId: nft.tokenId.toString(),
        name,
        description,
        image: imageUrl,
        price: ethers.formatEther(nft.price) + ' ETH'
      }
    } catch (error) {
      console.error("Error fetching NFT metadata:", error)
      return null
    }
  }

  // Load NFTs when connected
  useEffect(() => {
    if (isConnected && contract) {
      fetchListedNFTs()
    }
  }, [isConnected, contract])
  
  // Execute NFT sale
  const handleSell = async () => {
    if (!sellingNFT || !sellPrice || !isConnected || !contract || !signer) return
    
    try {
      setIsSaleProcessing(true)
      const priceInWei = ethers.parseEther(sellPrice)
      
      // Execute sale transaction
      const transaction = await contract.executeSale(sellingNFT.tokenId, {
        value: priceInWei
      })
      
      // Wait for transaction to be mined
      await transaction.wait()
      
      // Update UI
      setNFTs(prevNFTs => prevNFTs.filter(nft => nft.tokenId !== sellingNFT?.tokenId))
      setSellingNFT(null)
      setSellPrice('')
      
      // Refetch NFTs
      fetchListedNFTs()
    } catch (error) {
      console.error("Error executing sale:", error)
    } finally {
      setIsSaleProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
          NFT Gallery
        </h1>
        
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-xl text-gray-300 mb-6">Connect your wallet to view available NFTs</p>
            <Button 
              onClick={handleConnectWallet}
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold hover:from-cyan-700 hover:to-blue-700"
            >
              Connect Wallet
            </Button>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
          </div>
        ) : nfts.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-300">No NFTs available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {nfts.map((nft) => (
              <motion.div
                key={nft.tokenId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex justify-center"
              >
                <CardContainer className="inter-var">
                  <CardBody className="bg-gradient-to-br from-gray-800 to-gray-900 relative group/card hover:shadow-2xl hover:shadow-cyan-500/[0.1] border-white/[0.2] w-full rounded-xl p-6 border h-[320px] flex flex-col justify-between">
                    <div className="flex flex-row gap-4">
                      <CardItem
                        translateZ="100"
                        className="w-1/2 flex-shrink-0"
                        onClick={() => setSelectedNFT(nft)}
                      >
                        <div className="aspect-[3/4] w-full relative overflow-hidden rounded-xl">
                          <img
                            src={nft.image}
                            className="absolute inset-0 w-full h-full object-cover group-hover/card:shadow-xl transition-transform duration-300 group-hover/card:scale-110"
                            alt={nft.name}
                          />
                        </div>
                      </CardItem>
                      <div className="w-1/2 flex flex-col justify-between">
                        <CardItem
                          translateZ="50"
                          className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 h-14 overflow-hidden"
                        >
                          {nft.name}
                        </CardItem>
                        <CardItem
                          translateZ="50"
                          className="text-cyan-400 font-semibold mt-2"
                        >
                          Price: {nft.price}
                        </CardItem>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 space-x-4">
                      <CardItem
                        translateZ={20}
                        as="button"
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-sm font-bold flex-1 transition-colors duration-300"
                        onClick={() => setSelectedNFT(nft)}
                      >
                        View Details
                      </CardItem>
                      <CardItem
                        translateZ={20}
                        as="button"
                        className="px-4 py-2 rounded-xl bg-white text-gray-900 text-sm font-bold flex-1 transition-colors duration-300 hover:bg-gray-200"
                        onClick={() => {
                          setSellingNFT(nft)
                          setSellPrice('')
                        }}
                      >
                        Buy
                      </CardItem>
                    </div>
                  </CardBody>
                </CardContainer>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {selectedNFT && (
            <Dialog open={!!selectedNFT} onOpenChange={() => setSelectedNFT(null)}>
              <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-gray-800 to-gray-900 text-white border border-cyan-500/20">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">{selectedNFT.name}</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    NFT Details
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <img src={selectedNFT.image} alt={selectedNFT.name} className="w-full h-64 object-cover rounded-lg mb-4 shadow-lg shadow-cyan-500/20" />
                  {selectedNFT.description && (
                    <div className="mb-4">
                      <h3 className="text-white font-semibold mb-1">Description:</h3>
                      <p className="text-gray-300">{selectedNFT.description}</p>
                    </div>
                  )}
                  <p className="text-cyan-400 font-semibold">Price: {selectedNFT.price}</p>
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={() => setSelectedNFT(null)} variant="secondary" className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white">Close</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {sellingNFT && (
            <Dialog open={!!sellingNFT} onOpenChange={() => setSellingNFT(null)}>
              <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-gray-800 to-gray-900 text-white border border-cyan-500/20">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Buy NFT</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Confirm purchase price
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <img src={sellingNFT.image} alt={sellingNFT.name} className="w-full h-64 object-cover rounded-lg mb-4 shadow-lg shadow-cyan-500/20" />
                  <Label htmlFor="price" className="text-white">Price (ETH)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder={sellingNFT.price.replace(' ETH', '')}
                    className="bg-gray-800 text-white border-gray-700 mt-2"
                  />
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <Button onClick={() => setSellingNFT(null)} variant="secondary" className="bg-gray-700 hover:bg-gray-600 text-white">Cancel</Button>
                  <Button 
                    onClick={handleSell} 
                    disabled={isSaleProcessing}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                  >
                    {isSaleProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Purchase'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}