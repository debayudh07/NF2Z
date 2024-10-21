"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Web3Provider } from '@ethersproject/providers';
import { formatEther } from '@ethersproject/units';
import { useWallet } from "../_contexts/WalletContext";
import {
  Activity,
  ArrowUpRight,
  Wallet,
  CreditCard,
  DollarSign,
  Menu,
  Package2,
  Search,
  Users,
  ListPlus,
  ShoppingCart,
  Tag,
  Image as ImageIcon,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function NFTMarketplaceDashboard() {
  const [isLoaded, setIsLoaded] = useState(false)
  const { account, connectWallet, disconnectWallet } = useWallet();
  const [balance, setBalance] = useState<string>('0.00 ETH');


  useEffect(() => {
    const fetchBalance = async () => {
      if (account && window.ethereum) {
        const provider = new Web3Provider(window.ethereum);
        const balanceInWei = await provider.getBalance(account);
        const balanceInEth = parseFloat(formatEther(balanceInWei)).toFixed(4);
        setBalance(`${balanceInEth} ETH`);
      }
    };
    
    if (account) {
      fetchBalance();
    }
  }, [account]);


  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className={`flex min-h-screen w-full flex-col bg-black text-sky-300 transition-opacity duration-1000 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b border-sky-800 bg-black px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Package2 className="h-6 w-6" />
            <span className="sr-only">NFT Marketplace</span>
          </Link>
          <Link
            href="#"
            className="text-sky-300 transition-colors hover:text-sky-100"
          >
            Dashboard
          </Link>
          <Link
            href="#"
            className="text-sky-500 transition-colors hover:text-sky-300"
          >
            Explore
          </Link>
          <Link
            href="/nftview"
            className="text-sky-500 transition-colors hover:text-sky-300"
          >
            My NFTs
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
              <Link href="#" className="hover:text-sky-100">
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
          variant="outline"
          size="icon"
          className="rounded-full bg-black text-sky-300 border-sky-800"
        >
          <Wallet className="h-5 w-5" />
          <span className="sr-only">Toggle wallet menu</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="bg-black text-sky-300 border-sky-800">
        <DropdownMenuLabel>Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-sky-800" />

        {account ? (
          <>
            <DropdownMenuItem>
              <DollarSign className="mr-2 h-4 w-4" />
              <span>Balance: {balance}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => disconnectWallet()}>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={() => connectWallet()}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Connect Wallet</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-sky-800" />
        <DropdownMenuItem>
          <Users className="mr-2 h-4 w-4" />
          <span>Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ListPlus className="mr-2 h-4 w-4" />
          <span>List NFT</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {[
            { title: "Total Volume", icon: DollarSign, value: "1,234.56 ETH", change: "+20.1% from last month" },
            { title: "NFTs Owned", icon: ImageIcon, value: "42", change: "+5 new additions" },
            { title: "Active Listings", icon: Tag, value: "7", change: "2 sold this week" },
            { title: "Floor Price", icon: Activity, value: "0.25 ETH", change: "+0.05 ETH since last week" },
          ].map((item, index) => (
            <Card key={index} className={`bg-black border-sky-800 transition-all duration-500 ease-in-out ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: `${index * 100}ms` }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-sky-300">
                  {item.title}
                </CardTitle>
                <item.icon className="h-4 w-4 text-sky-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-sky-100">{item.value}</div>
                <p className="text-xs text-sky-500">
                  {item.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className={`xl:col-span-2 bg-black border-sky-800 transition-all duration-500 ease-in-out ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '400ms' }}>
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle className="text-sky-300">Recent Transactions</CardTitle>
                <CardDescription className="text-sky-500">
                  Your recent NFT transactions.
                </CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1 bg-sky-800 text-sky-100 hover:bg-sky-700">
                <Link href="#">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-sky-800">
                    <TableHead className="text-sky-300">NFT</TableHead>
                    <TableHead className="hidden xl:table-column text-sky-300">
                      Type
                    </TableHead>
                    <TableHead className="hidden xl:table-column text-sky-300">
                      Status
                    </TableHead>
                    <TableHead className="hidden xl:table-column text-sky-300">
                      Date
                    </TableHead>
                    <TableHead className="text-right text-sky-300">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { nft: "Bored Ape #1234", type: "Purchase", status: "Completed", date: "2023-06-23", price: "50 ETH" },
                    { nft: "CryptoPunk #5678", type: "Sale", status: "Completed", date: "2023-06-24", price: "30 ETH" },
                    { nft: "Azuki #9012", type: "Listing", status: "Active", date: "2023-06-25", price: "10 ETH" },
                  ].map((transaction, index) => (
                    <TableRow key={index} className={`border-sky-800 transition-all duration-500 ease-in-out ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: `${500 + index * 100}ms` }}>
                      <TableCell className="font-medium text-sky-300">
                        {transaction.nft}
                      </TableCell>
                      <TableCell className="hidden xl:table-column text-sky-300">
                        {transaction.type}
                      </TableCell>
                      <TableCell className="hidden xl:table-column">
                        <Badge className="text-xs bg-sky-900 text-sky-300" variant="outline">
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell lg:hidden xl:table-column text-sky-300">
                        {transaction.date}
                      </TableCell>
                      <TableCell className="text-right text-sky-300">{transaction.price}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className={`bg-black border-sky-800 transition-all duration-500 ease-in-out ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: '800ms' }}>
            <CardHeader>
              <CardTitle className="text-sky-300">Your NFT Collection</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-8">
              {[
                { name: "Bored Ape #1234", collection: "Bored Ape Yacht Club", price: "50 ETH" },
                { name: "CryptoPunk #5678", collection: "CryptoPunks", price: "30 ETH" },
                { name: "Azuki #9012", collection: "Azuki", price: "10 ETH" },
              ].map((nft, index) => (
                <div key={index} className={`flex items-center gap-4 transition-all duration-500 ease-in-out ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ transitionDelay: `${900 + index * 100}ms` }}>
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder.svg?height=36&width=36" alt="NFT" />
                    <AvatarFallback>NFT</AvatarFallback>
                  </Avatar>
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none text-sky-300">
                      {nft.name}
                    </p>
                    <p className="text-sm text-sky-500">
                      {nft.collection}
                    </p>
                  </div>
                  <div className="ml-auto font-medium text-sky-300">{nft.price}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}