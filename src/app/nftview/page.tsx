/* eslint-disable */

'use client'

import { useState, useEffect } from 'react'
import { ethers, formatEther } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card"
import Header from '@/components/functions/Header'
import contractABi from '../contractABI'
import { BrowserProvider } from 'ethers'
import { Loader2 } from 'lucide-react'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS

interface NFT {
  tokenId: string;
  name: string;
  image: string;
  price: string;
}

export default function NFTViewer() {
  const [nfts, setNFTs] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [sellingNFT, setSellingNFT] = useState<NFT | null>(null)
  const [sellPrice, setSellPrice] = useState('')

  useEffect(() => {
    async function fetchNFTs() {
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      if (!CONTRACT_ADDRESS) {
        throw new Error("Contract address is not defined")
      }

      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABi, signer)

      try {
        const listedNFTs = await contract.getAllListedNFTs()

        const nftsData = await Promise.all(listedNFTs.map(async (nft: { tokenId: any; price: ethers.BigNumberish }) => {
          const tokenURI = await contract.tokenURI(nft.tokenId)
          let httpUrl = tokenURI.startsWith("ipfs://")
            ? tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
            : tokenURI

          const response = await fetch(httpUrl)
          const contentType = response.headers.get("content-type")

          let metadata
          let imageUrl

          if (contentType && contentType.includes("application/json")) {
            metadata = await response.json()
            imageUrl = metadata.image
          } else if (contentType && contentType.includes("image/")) {
            metadata = { name: `NFT ${nft.tokenId}` }
            imageUrl = httpUrl
          } else {
            throw new Error(`Unexpected content type: ${contentType}`)
          }

          if (imageUrl.startsWith("ipfs://")) {
            imageUrl = imageUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
          }

          return {
            tokenId: nft.tokenId.toString(),
            name: metadata.name || `NFT ${nft.tokenId}`,
            image: imageUrl,
            price: formatEther(nft.price) + ' ETH'
          }
        }))

        setNFTs(nftsData)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching NFTs:", error)
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [])

  const handleSell = async () => {
    if (!sellingNFT || !sellPrice) return
    
    try {
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      
      if (!CONTRACT_ADDRESS) {
        throw new Error("Contract address is not defined")
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABi, signer)
      const priceInWei = ethers.parseEther(sellPrice)
      
      const transaction = await contract.executeSale(sellingNFT.tokenId, {
        value: priceInWei
      })
      
      await transaction.wait()
      
      setNFTs(prevNFTs =>
        prevNFTs.filter(nft => nft.tokenId !== sellingNFT.tokenId)
      )
      
      setSellingNFT(null)
      setSellPrice('')
    } catch (error) {
      console.error("Error executing sale:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-5xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
          NFT Gallery
        </h1>
        
        {!loading && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {nfts.slice(1).map((nft) => (  // Start mapping from the second item
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
                Sell
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
                  <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Sell NFT</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Set your NFT price
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
                    placeholder="Enter price in ETH"
                    className="bg-gray-800 text-white border-gray-700 mt-2"
                  />
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <Button onClick={() => setSellingNFT(null)} variant="secondary" className="bg-gray-700 hover:bg-gray-600 text-white">Cancel</Button>
                  <Button onClick={handleSell} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white">List for Sale</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}