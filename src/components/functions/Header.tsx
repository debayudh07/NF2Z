/* eslint-disable */

import React from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Web3Provider } from '@ethersproject/providers'
import { formatEther } from '@ethersproject/units'
import { useWallet } from '@/app/_contexts/WalletContext'
import {
  ArrowUpRight,
  Wallet,
  CreditCard,
  DollarSign,
  Menu,
  Package2,
  Search,
  Users,
  ListPlus,
  Settings,
  Image as ImageIcon,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

const Header = () => {
  const { account, connectWallet, disconnectWallet, profilePicture } = useWallet()
  const [balance, setBalance] = useState<string>('0.00 ETH')

  useEffect(() => {
    const fetchBalance = async () => {
      if (account && window.ethereum) {
        const provider = new Web3Provider(window.ethereum)
        const balanceInWei = await provider.getBalance(account)
        const balanceInEth = parseFloat(formatEther(balanceInWei)).toFixed(4)
        setBalance(`${balanceInEth} ETH`)
      }
    }
    
    if (account) {
      fetchBalance()
    }
  }, [account])

  return (
    <div>
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b border-sky-800 bg-black px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="#"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Package2 className="h-6 w-6" />
            <span className="sr-only">NFT Marketplace</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sky-300 transition-colors hover:text-sky-100"
          >
            Dashboard
          </Link>
          <Link
            href="/nftview"
            className="text-sky-500 transition-colors hover:text-sky-300"
          >
             NFTs
          </Link>
          <Link
            href="/createnft"
            className="text-sky-500 transition-colors hover:text-sky-300"
          >
            Create
          </Link>
        </nav>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-black text-sky-300">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="#"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Package2 className="h-6 w-6" />
                <span className="sr-only">NFT Marketplace</span>
              </Link>
              <Link href="/dashboard" className="hover:text-sky-100">
                Dashboard
              </Link>
              <Link
                href="#"
                className="text-sky-500 hover:text-sky-300"
              >
                Explore
              </Link>
              <Link
                href="/nftview"
                className="text-sky-500 hover:text-sky-300"
              >
                My NFTs
              </Link>
              <Link
                href="/createnft"
                className="text-sky-500 hover:text-sky-300"
              >
                Create
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <form className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sky-500" />
              <Input
                type="search"
                placeholder="Search NFTs..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-black text-sky-300 border-sky-800 placeholder-sky-500"
              />
            </div>
          </form>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-sky-900/10"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profilePicture || undefined} />
                  <AvatarFallback className="bg-sky-900 text-sky-100">
                    {account ? account.slice(0, 2).toUpperCase() : 'NA'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 bg-black text-sky-300 border-sky-800">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-sky-800" />

              {account ? (
                <>
                  <DropdownMenuItem>
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>Balance: {balance}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Users className="mr-2 h-4 w-4" />
                    <Link href="/acc">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ListPlus className="mr-2 h-4 w-4" />
                    <Link href="/createnft">List NFT</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-sky-800" />
                  <DropdownMenuItem className="text-red-500" onClick={() => disconnectWallet()}>
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    <span>Disconnect</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => connectWallet()}>
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>Connect Wallet</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </div>
  )
}

export default Header