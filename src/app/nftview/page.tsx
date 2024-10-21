'use client'

import { useState, useEffect } from 'react'
import { ethers, formatEther } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Header from '@/components/functions/Header'
import contractABi from '../contractABI'
import { BrowserProvider } from 'ethers'

// Contract ABI (simplified version for listing NFTs)


// Contract address (replace this with your deployed contract address)
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS

// Array of gradient classes
const gradients = [
  'bg-gradient-to-br from-purple-600 to-blue-500',
  'bg-gradient-to-br from-green-400 to-blue-500',
  'bg-gradient-to-br from-pink-500 to-orange-400',
  'bg-gradient-to-br from-yellow-400 to-red-500',
  'bg-gradient-to-br from-blue-500 to-teal-400',
  'bg-gradient-to-br from-indigo-500 to-purple-500',
]

export default function NFTViewer() {
  const [nfts, setNFTs] = useState<{ tokenId: number, name: string, description: string, image: string, price: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNFT, setSelectedNFT] = useState<{ tokenId: number, name: string, description: string, image: string, price: string } | null>(null)
  useEffect(() => {
    async function fetchNFTs() {
      // Initialize ethers.js provider (Metamask)
      const provider = new BrowserProvider(window.ethereum)
      const signer = provider.getSigner()

      // Ensure CONTRACT_ADDRESS is defined
      if (!CONTRACT_ADDRESS) {
        throw new Error("Contract address is not defined");
      }

      // Initialize the contract
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABi, await signer)

      try {
        // Fetch all listed NFTs
        const listedNFTs = await contract.getAllListedNFTs();

        const nftsData = await Promise.all(listedNFTs.map(async (nft: any) => {
          const tokenURI = await contract.tokenURI(nft.tokenId);

          let httpUrl = tokenURI.startsWith("ipfs://")
            ? tokenURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
            : tokenURI;

          const response = await fetch(httpUrl);
          const contentType = response.headers.get("content-type");

          let metadata;
          let imageUrl;

          if (contentType && contentType.includes("application/json")) {
            metadata = await response.json();
            imageUrl = metadata.image;
          } else if (contentType && contentType.includes("image/")) {
            // If the response is an image, use the tokenURI as both metadata and image URL
            metadata = { name: `NFT ${nft.tokenId}` };
            imageUrl = httpUrl;
          } else {
            throw new Error(`Unexpected content type: ${contentType}`);
          }

          // Ensure the image URL uses HTTPS
          if (imageUrl.startsWith("ipfs://")) {
            imageUrl = imageUrl.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
          }

          return {
            tokenId: nft.tokenId,
            name: metadata.name || `NFT ${nft.tokenId}`,
            image: imageUrl,
            price: formatEther(nft.price) + ' ETH'
          };
        }));




        setNFTs(nftsData)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching NFTs:", error)
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [])

  const openDialog = (nft: { tokenId: number, name: string, image: string, price: string }) => {
    setSelectedNFT({ ...nft, description: '' }) // Add a default description
  }

  const closeDialog = () => {
    setSelectedNFT(null)
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-4xl font-bold mb-8 text-center text-cyan-400">NFT Gallery</h1>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              className="w-16 h-16 border-t-4 border-cyan-400 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {nfts.map((nft, index) => (
              <motion.div
                key={nft.tokenId}
                className={`rounded-lg overflow-hidden shadow-lg transform transition duration-300 hover:scale-105 ${gradients[index % gradients.length]}`}
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="relative group cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => openDialog(nft)}
                >
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <p className="text-white text-lg font-semibold">View Details</p>
                  </div>
                </motion.div>
                <motion.div
                  className="p-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold mb-2">{nft.name}</h2>
                  <p className="text-sm text-gray-300 mb-2 line-clamp-2">{nft.description}</p>
                  <p className="text-cyan-400 font-semibold">Price: {nft.price}</p>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}

<AnimatePresence>
        {selectedNFT && (
          <Dialog open={!!selectedNFT} onOpenChange={closeDialog}>
            <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-cyan-400">{selectedNFT.name}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Details of the selected NFT
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <img src={selectedNFT.image} alt={selectedNFT.name} className="w-full h-64 object-cover rounded-lg mb-4" />
                <p className="text-sm text-gray-300 mb-4">{selectedNFT.description}</p>
                <p className="text-cyan-400 font-semibold">Price: {selectedNFT.price}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={closeDialog} variant="secondary">Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}
