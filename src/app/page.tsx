'use client'

import { useState, useEffect, useRef, useCallback } from "react"
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from "wagmi"
import { parseAbi, formatUnits } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Flame,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Loader2,
  Trophy,
  HelpCircle,
  X,
  Sparkles,
  Skull,
  Volume2,
  VolumeX,
} from "lucide-react"
import { NetworkSwitcher } from "@/components/network-switcher"
import { BurnAnimation } from "@/components/burn-animation"
import { ComboCounter } from "@/components/combo-counter"
import { HelpSection } from "@/components/help-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useSound } from "@/components/sound-provider"
import { SiteFooter } from "@/components/site-footer"

// Standard ERC-20 ABI with functions we need
const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address, uint256) returns (bool)",
])

// Burn address
const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD"

// Emoji reactions for different token burn values
const getEmojiReaction = (value: number) => {
  if (value < 10) return "🔥"
  if (value < 50) return "🔥🔥"
  if (value < 100) return "🔥🔥🔥"
  if (value < 500) return "🔥🔥🔥🔥"
  if (value < 1000) return "🔥🔥🔥🔥🔥"
  return "🔥🔥🔥🔥🔥🔥"
}

// Fun messages for burning tokens
const burnMessages = [
  "Burn baby burn! 🔥",
  "Another one bites the dust! 💀",
  "Sent straight to hell! 👹",
  "Cleansing your wallet one token at a time! 🧹",
  "That's what you get for spamming! 😈",
  "Begone, foul token! ⚔️",
  "Purification complete! 🌟",
  "Spam token? More like GONE token! 💨",
  "Reduced to ashes! 🌋",
  "Another scammer crying somewhere! 😭",
]

export default function Home() {
  const [tokenAddress, setTokenAddress] = useState("")
  const [tokenInfo, setTokenInfo] = useState<{
    name: string
    symbol: string
    decimals: number
    balance: bigint
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showBurnAnimation, setShowBurnAnimation] = useState(false)
  const [comboCount, setComboCount] = useState(0)
  const [totalBurned, setTotalBurned] = useState(0)
  const [burnHistory, setBurnHistory] = useState<
    Array<{
      name: string
      symbol: string
      value: number
      timestamp: number
    }>
  >([])
  const [soundsLoaded, setSoundsLoaded] = useState(false)

  // Audio references
  const devilLaughRef = useRef<HTMLAudioElement | null>(null)
  const fireSound1Ref = useRef<HTMLAudioElement | null>(null)
  const fireSound2Ref = useRef<HTMLAudioElement | null>(null)

  const { soundEnabled, toggleSound } = useSound()

  const chainId = useChainId()
  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()

  // Initialize audio elements
  useEffect(() => {
    // Create audio elements with actual sound files
    const createAudio = (src: string): HTMLAudioElement => {
      const audio = new Audio(src)
      audio.preload = "auto" // Preload the audio
      return audio
    }

    try {
      devilLaughRef.current = createAudio("/sounds/devil-laugh.mp3")
      fireSound1Ref.current = createAudio("/sounds/fire-sound-1.mp3")
      fireSound2Ref.current = createAudio("/sounds/fire-sound-2.mp3")

      // Add load event listeners to track when sounds are ready
      const soundElements = [devilLaughRef.current, fireSound1Ref.current, fireSound2Ref.current]
      let loadedCount = 0

      soundElements.forEach((audio) => {
        if (audio) {
          audio.addEventListener("canplaythrough", () => {
            loadedCount++
            if (loadedCount === soundElements.length) {
              setSoundsLoaded(true)
            }
          })
        }
      })
    } catch (err) {
      console.error("Error initializing audio:", err)
    }

    return () => {
      // Cleanup
      [devilLaughRef, fireSound1Ref, fireSound2Ref].forEach((ref) => {
        if (ref.current) {
          ref.current.pause()
          ref.current.src = ""
          ref.current = null
        }
      })
    }
  }, [])

  // Contract read hooks
  const { data: tokenName } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "name",
    query: {
      enabled: Boolean(tokenAddress && isConnected && tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)),
    },
  })

  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "symbol",
    query: {
      enabled: Boolean(tokenAddress && isConnected && tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)),
    },
  })

  const { data: tokenDecimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "decimals",
    query: {
      enabled: Boolean(tokenAddress && isConnected && tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)),
    },
  })

  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: {
      enabled: Boolean(tokenAddress && isConnected && address && tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)),
    },
  })

  // Contract write hooks
  const { data: hash, isPending, writeContract } = useWriteContract()

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Function to play sound with error handling
  const playSound = useCallback((soundRef: React.RefObject<HTMLAudioElement>) => {
    if (soundEnabled && soundRef.current && soundsLoaded) {
      try {
        // Reset the audio to start
        soundRef.current.currentTime = 0
        
        // Reduce volume for better user experience
        soundRef.current.volume = 0.6
        
        const playPromise = soundRef.current.play()

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Sound playback was prevented or failed:", error)
          })
        }
      } catch (e) {
        console.log("Error playing sound:", e)
      }
    }
  }, [soundEnabled, soundsLoaded])

  // Function to fetch token information
  const fetchTokenInfo = async () => {
    if (!isConnected || !address || !tokenAddress) return

    setIsLoading(true)
    setError("")
    setTokenInfo(null)

    try {
      // Validate token address format
      if (!tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        throw new Error("Invalid token address format")
      }

      // Trigger refetch of token data
      await refetchBalance()

      if (tokenName && tokenSymbol && tokenDecimals && tokenBalance) {
        setTokenInfo({
          name: tokenName as string,
          symbol: tokenSymbol as string,
          decimals: tokenDecimals as number,
          balance: tokenBalance as bigint,
        })

        // Play fire sound when token is loaded
        if (fireSound1Ref.current) {
          playSound(fireSound1Ref as React.RefObject<HTMLAudioElement>)
        }
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to fetch token information")
    } finally {
      setIsLoading(false)
    }
  }

  // Function to burn tokens
  const burnTokens = async () => {
    if (!isConnected || !address || !tokenInfo) return

    // Check if balance is zero
    if (tokenInfo.balance === BigInt(0)) {
      setError("You don't have any tokens to burn")
      return
    }

    setError("")

    try {
      // Send transaction to burn tokens
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [BURN_ADDRESS, tokenInfo.balance],
      })

      // Play fire sound when transaction is initiated
      if (fireSound2Ref.current) {
        playSound(fireSound2Ref as React.RefObject<HTMLAudioElement>)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to burn tokens")
    }
  }

  // Handle successful burn
  useEffect(() => {
    if (isConfirmed && tokenInfo) {
      // Show burn animation
      setShowBurnAnimation(true)

      // Play devil laugh sound
      if (devilLaughRef.current) {
        playSound(devilLaughRef as React.RefObject<HTMLAudioElement>)
      }

      // Increase combo count
      setComboCount((prev) => prev + 1)

      // Calculate value (simplified for demo)
      const value = Number(formatUnits(tokenInfo.balance, tokenInfo.decimals))
      setTotalBurned((prev) => prev + value)

      // Add to burn history
      setBurnHistory((prev) => [
        {
          name: tokenInfo.name,
          symbol: tokenInfo.symbol,
          value: value,
          timestamp: Date.now(),
        },
        ...prev,
      ])

      // Show toast with random message
      const randomMessage = burnMessages[Math.floor(Math.random() * burnMessages.length)]
      toast.error(`${tokenInfo.symbol} Burned! ${randomMessage}`, {
        richColors: true,
      })

      // Reset token info after successful burn
      setTimeout(() => {
        setTokenInfo(null)
        setTokenAddress("")
        setShowBurnAnimation(false)
      }, 3000)
    }
  }, [isConfirmed, tokenInfo, playSound])

  // Get block explorer URL based on chain ID
  const getBlockExplorerUrl = () => {
    const explorers: Record<number, string> = {
      1: "https://etherscan.io",
      10: "https://optimistic.etherscan.io",
      137: "https://polygonscan.com",
      42161: "https://arbiscan.io",
      8453: "https://basescan.org",
      11155111: "https://sepolia.etherscan.io",
    }
    return explorers[chainId] || "https://etherscan.io"
  }

  // Obfuscate wallet address for privacy
  const obfuscateAddress = (address: string) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // Share burn combo on social media
  const shareCombo = (platform: "twitter" | "warpcast") => {
    const message = `🔥 I just burned ${comboCount} spam tokens worth ${totalBurned.toFixed(2)} using Inferno Token Burner! My wallet is now cleansed from scam tokens! 🧹 #TokenBurner #CleanWallet`

    if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, "_blank")
    } else if (platform === "warpcast") {
      window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(message)}`, "_blank")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-red-950 to-gray-950 text-white">
      {showBurnAnimation && <BurnAnimation />}

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              className="text-orange-300 hover:text-orange-100 hover:bg-red-900/50 rounded-full"
            >
              {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </Button>
          </div>

          <h1 className="text-4xl md:text-6xl font-cinzel font-bold text-center mb-2 text-orange-400 flex items-center transform hover:scale-105 transition-transform duration-300">
            <Flame className="h-10 w-10 mr-2 animate-pulse text-red-500" />
            <span className="flame-text">Inferno Token Burner</span>
            <Flame className="h-10 w-10 ml-2 animate-pulse text-red-500" />
          </h1>
          <p className="text-xl text-center text-orange-200 mb-4 font-medium">
            Send those pesky spam tokens straight to hell! 😈
          </p>

          {comboCount > 0 && <ComboCounter count={comboCount} total={totalBurned} />}
        </div>

        <Tabs defaultValue="burn" className="max-w-3xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900 border border-red-900 p-1">
            <TabsTrigger
              value="burn"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-900 data-[state=active]:to-red-800 data-[state=active]:text-orange-100 font-medium data-[state=active]:shadow-none"
            >
              <Flame className="mr-2 h-4 w-4" /> Burn Tokens
            </TabsTrigger>
            <TabsTrigger
              value="help"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-900 data-[state=active]:to-red-800 data-[state=active]:text-orange-100 font-medium data-[state=active]:shadow-none"
            >
              <HelpCircle className="mr-2 h-4 w-4" /> Help & Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="burn">
            <Card className="border-red-900 bg-gray-900/90 backdrop-blur-sm shadow-xl card-3d-hover">
              <CardHeader className="border-b border-red-900/50 bg-gradient-to-r from-gray-900 to-red-950">
                <CardTitle className="flex items-center gap-2 text-orange-400 font-cinzel">
                  <Skull className="h-6 w-6 text-red-500" />
                  Burn Those Worthless Tokens!
                </CardTitle>
                <CardDescription className="text-orange-200">
                  Connect your wallet, find the spam, and send it to the eternal flames
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-6">
                {/* Wallet Connection and Network */}
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-orange-100">Your Wallet</span>
                    {isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnect()}
                        className="border-red-700 hover:bg-red-900 text-red-400 hover:text-red-200 transform hover:scale-105 transition-all"
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => connect({ connector: connectors[0] })}
                        className="border-green-700 hover:bg-green-900 text-green-400 hover:text-green-200 transform hover:scale-105 transition-all"
                      >
                        Connect Wallet
                      </Button>
                    )}
                  </div>

                  {isConnected && address && (
                    <>
                      <div className="flex items-center gap-2 p-2 bg-gray-950 rounded-md text-sm border border-red-900/50 shadow-inner">
                        <Wallet className="h-4 w-4 text-orange-300" />
                        <span className="truncate text-orange-100">{obfuscateAddress(address)}</span>
                        <a
                          href={`${getBlockExplorerUrl()}/address/${address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs text-orange-400 hover:text-orange-300 hover:underline"
                        >
                          View on Explorer
                        </a>
                      </div>

                      {/* Network Display and Switcher */}
                      <div className="mt-2">
                        <label htmlFor="network-select" className="text-sm font-medium mb-1 block text-orange-100">
                          Network
                        </label>
                        <NetworkSwitcher />
                      </div>
                    </>
                  )}
                </div>

                {/* Token Input */}
                <div className="space-y-2">
                  <label htmlFor="token-address" className="text-sm font-medium text-orange-100">
                    Spam Token Address
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="token-address"
                      placeholder="0x..."
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                      disabled={!isConnected || isLoading}
                      className="bg-gray-950 border-red-900/50 text-orange-100 placeholder:text-gray-600 focus:ring-red-500"
                    />
                    <Button
                      onClick={fetchTokenInfo}
                      disabled={!isConnected || !tokenAddress || isLoading}
                      variant="secondary"
                      className="bg-orange-800 hover:bg-orange-700 text-white transform hover:scale-105 transition-all"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load"}
                    </Button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive" className="bg-red-900/70 border-red-700 text-white">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Token Information */}
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-gray-800" />
                    <Skeleton className="h-4 w-3/4 bg-gray-800" />
                    <Skeleton className="h-4 w-1/2 bg-gray-800" />
                  </div>
                ) : (
                  tokenInfo && (
                    <div className="space-y-3 p-3 border rounded-md border-red-900/50 bg-gray-950 shadow-inner transform hover:shadow-red-900/20 hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between">
                        <span className="text-sm text-orange-300">Name:</span>
                        <span className="font-medium text-orange-100">{tokenInfo.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-orange-300">Symbol:</span>
                        <span className="font-medium text-orange-100">{tokenInfo.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-orange-300">Balance:</span>
                        <span className="font-medium text-orange-100">
                          {formatUnits(tokenInfo.balance, tokenInfo.decimals)} {tokenInfo.symbol}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-red-900/30 mt-2">
                        <span className="text-sm text-orange-300">Burn Reaction:</span>
                        <span className="text-xl ml-2">
                          {getEmojiReaction(Number(formatUnits(tokenInfo.balance, tokenInfo.decimals)))}
                        </span>
                      </div>
                    </div>
                  )
                )}

                {/* Transaction Status */}
                {isPending && (
                  <Alert className="bg-orange-900/70 border-orange-700 text-white">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertTitle>Summoning Hellfire...</AlertTitle>
                    <AlertDescription>Waiting for wallet confirmation...</AlertDescription>
                  </Alert>
                )}

                {isConfirming && (
                  <Alert className="bg-orange-900/70 border-orange-700 text-white">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertTitle>The Flames Are Rising!</AlertTitle>
                    <AlertDescription>
                      Your burn transaction is being processed...
                      {hash && (
                        <a
                          href={`${getBlockExplorerUrl()}/tx/${hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-1 text-xs text-orange-200 hover:underline truncate"
                        >
                          View on explorer: {hash}
                        </a>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {isConfirmed && (
                  <Alert className="bg-green-900/70 border-green-700 text-white">
                    <CheckCircle2 className="h-4 w-4 text-green-300" />
                    <AlertTitle className="text-green-200">Burn Complete! 🔥</AlertTitle>
                    <AlertDescription className="text-green-300">
                      Tokens successfully sent to the eternal flames!
                      {hash && (
                        <a
                          href={`${getBlockExplorerUrl()}/tx/${hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block mt-1 text-xs text-blue-200 hover:underline truncate"
                        >
                          View on explorer: {hash}
                        </a>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Burn History */}
                {burnHistory.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-orange-300 mb-2 flex items-center font-cinzel">
                      <Flame className="h-5 w-5 mr-2 text-red-500" />
                      Burn History
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-900 scrollbar-track-gray-950">
                      {burnHistory.map((burn, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 bg-gray-950 rounded border border-red-900/50 text-sm transform hover:translate-x-1 transition-transform duration-200"
                        >
                          <div className="flex items-center">
                            <span className="text-orange-300 mr-2">{burn.symbol}</span>
                            <span className="text-orange-100 truncate max-w-[150px]">{burn.name}</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-orange-100">{burn.value.toFixed(2)}</span>
                            <span className="ml-2">{getEmojiReaction(burn.value)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Sharing */}
                {comboCount > 0 && (
                  <div className="flex flex-col space-y-2 mt-4 p-3 border border-orange-900/50 rounded-md bg-gradient-to-r from-orange-950 to-red-950 shadow-md transform hover:shadow-orange-900/20 hover:shadow-lg transition-all duration-300">
                    <h3 className="text-lg font-semibold text-orange-300 flex items-center font-cinzel">
                      <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                      Share Your Burn Combo!
                    </h3>
                    <p className="text-sm text-orange-200">
                      {`You've burned ${comboCount} tokens worth ${totalBurned.toFixed(2)}! Brag about it!`}
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        onClick={() => shareCombo("twitter")}
                        className="bg-blue-700 hover:bg-blue-600 flex-1 transform hover:scale-105 transition-all"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Share on X
                      </Button>
                      <Button
                        onClick={() => shareCombo("warpcast")}
                        className="bg-purple-700 hover:bg-purple-600 flex-1 transform hover:scale-105 transition-all"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Share on Warpcast
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="p-4">
                <Button
                  className={cn(
                    "w-full text-lg py-6 relative overflow-hidden group font-cinzel font-bold burn-btn",
                    isPending || isConfirming
                      ? "bg-orange-800 hover:bg-orange-700"
                      : "bg-gradient-to-r from-red-700 to-orange-700 hover:from-red-600 hover:to-orange-600 shadow-lg hover:shadow-red-900/20 transform hover:translate-y-[-2px]",
                  )}
                  onClick={burnTokens}
                  disabled={!isConnected || !tokenInfo || tokenInfo.balance === BigInt(0) || isPending || isConfirming}
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {isPending ? "Confirm in Wallet..." : "Burning..."}
                    </>
                  ) : (
                    <>
                      <Flame className="mr-2 h-5 w-5 group-hover:animate-ping text-yellow-300" />
                      BURN IT TO HELL!
                    </>
                  )}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-red-500 to-orange-500 group-hover:opacity-100 opacity-70"></div>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="help">
            <HelpSection />
          </TabsContent>
        </Tabs>
      </div>

      <SiteFooter />
    </main>
  )
}

