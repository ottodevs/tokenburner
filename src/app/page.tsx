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
  useConfig,
  type Config,
} from "wagmi"
import { parseAbi, formatUnits, getContract, createPublicClient, http, type Chain } from "viem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Flame,
  AlertCircle,
  Wallet,
  Loader2,
  Trophy,
  HelpCircle,
  Skull,
  Volume2,
  VolumeX,
} from "lucide-react"
import { NetworkSwitcher } from "@/components/network-switcher"
import { BurnAnimation } from "@/components/burn-animation"
import { HelpSection } from "@/components/help-section"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useSound } from "@/components/sound-provider"
import { SiteFooter } from "@/components/site-footer"
import { BurnHistory } from "@/components/burn-history"
import { useStore } from "@/lib/store"

// Standard ERC-20 ABI with functions we need
const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address, uint256) returns (bool)",
  // Add support for tokens that use bytes32 instead of string
  "function name() view returns (bytes32)",
  "function symbol() view returns (bytes32)",
  // Add support for detecting fee-on-transfer tokens
  "function _taxFee() view returns (uint256)",
  "function getFeePercent() view returns (uint256)",
  "function getTotalFee() view returns (uint256)",
  "function getTransferFeeRate() view returns (uint256)",
  "function transferFee() view returns (uint256)",
  "function fee() view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event TransferFee(address indexed from, address indexed to, uint256 value)",
  "event Fee(address indexed from, address indexed to, uint256 value)",
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

// Helper function to convert bytes32 to string
const bytes32ToString = (bytes32: string | unknown) => {
  // If it's already a string, return it
  if (typeof bytes32 === 'string' && !bytes32.startsWith('0x')) {
    return bytes32;
  }
  
  // Convert bytes32 to string and trim trailing null characters
  try {
    if (typeof bytes32 !== 'string') return "Unknown";
    
    const hex = bytes32.slice(2); // Remove 0x prefix
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substring(i, i + 2), 16);
      if (code === 0) break; // Stop at first null character
      str += String.fromCharCode(code);
    }
    return str.trim() || "Unknown";
  } catch (err) {
    console.warn("Error converting bytes32 to string:", err);
    return "Unknown";
  }
};

// Function to detect if token may have special behaviors like fee-on-transfer
const detectSpecialToken = async (
  address: string, 
  chainId: number, 
  config: Config
): Promise<{ isSpecial: boolean, warning: string }> => {
  if (!address) return { isSpecial: false, warning: "" };
  
  try {
    if (!config?.chains || config.chains.length === 0) {
      return { isSpecial: false, warning: "" };
    }
    
    const currentChain = config.chains.find((chain: Chain) => chain.id === chainId);
    if (!currentChain || !currentChain.rpcUrls.default.http[0]) {
      return { isSpecial: false, warning: "" };
    }
    
    const client = createPublicClient({
      chain: currentChain,
      transport: http(currentChain.rpcUrls.default.http[0])
    });
    
    const contract = getContract({
      address: address as `0x${string}`,
      abi: erc20Abi,
      client,
    });
    
    // Check for known fee-on-transfer indicators
    try {
      // Try different methods that fee-on-transfer tokens might implement
      const feeChecks = [
        { method: '_taxFee', result: null },
        { method: 'getFeePercent', result: null },
        { method: 'getTotalFee', result: null },
        { method: 'getTransferFeeRate', result: null },
        { method: 'transferFee', result: null },
        { method: 'fee', result: null },
      ];
      
      for (const check of feeChecks) {
        try {
          // @ts-expect-error - Dynamic method call that might not exist
          const result = await contract.read[check.method]();
          if (result && Number(result) > 0) {
            return { 
              isSpecial: true, 
              warning: "This appears to be a fee-on-transfer token. Consider using a lower burn percentage."
            };
          }
        } catch {
          // Method doesn't exist, continue to next check
        }
      }
    } catch {
      // Fee check failed, continue
    }
    
    // Use contract name or symbol to heuristically identify special tokens
    const tokenName = await contract.read.name().catch(() => "");
    const tokenSymbol = await contract.read.symbol().catch(() => "");
    
    // Convert bytes32 to string if needed
    const tokenNameStr = typeof tokenName === 'string' ? tokenName : '';
    const tokenSymbolStr = typeof tokenSymbol === 'string' ? tokenSymbol : '';
    
    const riskKeywords = [
      'rebase', 'elastic', 'fee', 'tax', 'reflection', 'rewards', 
      'dividend', 'yield', 'stake', 'deflationary'
    ];
    
    // Check if token name or symbol contains any risky keywords
    for (const keyword of riskKeywords) {
      if (
        tokenNameStr.toLowerCase().includes(keyword.toLowerCase()) || 
        tokenSymbolStr.toLowerCase().includes(keyword.toLowerCase())
      ) {
        return { 
          isSpecial: true, 
          warning: `This might be a ${keyword} token. Consider using a lower burn percentage.`
        };
      }
    }
    
    return { isSpecial: false, warning: "" };
  } catch (err) {
    console.warn("Error detecting special token:", err);
    return { isSpecial: false, warning: "" };
  }
};

export default function Home() {
  const [tokenAddress, setTokenAddress] = useState("")
  const [tokenInfo, setTokenInfo] = useState<{
    name: string
    symbol: string
    decimals: number
    balance: bigint
    isSpecialToken?: boolean
    tokenWarning?: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showBurnAnimation, setShowBurnAnimation] = useState(false)
  const [soundsLoaded, setSoundsLoaded] = useState(false)
  const [burnPercentage, setBurnPercentage] = useState(100) // Default to 100%
  const [burnPercentageText, setBurnPercentageText] = useState("100")
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [processedTransactions, setProcessedTransactions] = useState<Set<string>>(new Set())

  // Audio references
  const devilLaughRef = useRef<HTMLAudioElement | null>(null)
  const fireSound1Ref = useRef<HTMLAudioElement | null>(null)
  const fireSound2Ref = useRef<HTMLAudioElement | null>(null)

  const { soundEnabled, toggleSound } = useSound()

  const chainId = useChainId()
  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const config = useConfig()

  // Reset animation when chain changes
  useEffect(() => {
    setShowBurnAnimation(false);
  }, [chainId]);

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
    // Reset burn percentage to 100% for each new token
    setBurnPercentage(100)
    setBurnPercentageText("100")
    setShowAdvancedOptions(false)

    try {
      // Validate token address format
      if (!tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        console.info("Invalid token address format")
      }

      // Create local variables to handle potential errors with specific token fields
      let name = "Unknown Token";
      let symbol = "???";
      let decimals = 18; // Default to 18 decimals
      let balance = BigInt(0);

      // Check if the contract exists in other chains if we can't find it in the current chain
      const checkOtherChains = async () => {
        if (!config.chains) return null;
        
        for (const chain of config.chains) {
          if (chain.id === chainId) continue; // Skip current chain
          
          try {
            const client = createPublicClient({
              chain,
              transport: http(chain.rpcUrls.default.http[0])
            });

            const code = await client.getBytecode({ address: tokenAddress as `0x${string}` });
            if (code && code !== '0x') {
              // Found the contract in another chain
              return {
                chainId: chain.id,
                chainName: chain.name
              };
            }
          } catch (err) {
            console.warn(`Error checking chain ${chain.name}:`, err);
          }
        }
        return null;
      };

      // First, verify if the address is a contract in current chain
      let contractFound = false;
      try {
        if (config.chains && config.chains.length > 0) {
          const currentChain = config.chains.find((chain: Chain) => chain.id === chainId);
          if (currentChain && currentChain.rpcUrls.default.http[0]) {
            const client = createPublicClient({
              chain: currentChain,
              transport: http(currentChain.rpcUrls.default.http[0])
            });

            const code = await client.getBytecode({ address: tokenAddress as `0x${string}` });
            if (code && code !== '0x') {
              contractFound = true;
            } else {
              // Check other chains
              const foundChain = await checkOtherChains();
              if (foundChain) {
                console.info(
                  `This token contract exists on ${foundChain.chainName} (Chain ID: ${foundChain.chainId}). ` +
                  `Please switch to that network to interact with it.`
                );
                setError("This token contract exists on another network. Please switch to that network to interact with it.")
              } else {
                console.info("This address is not a contract on any supported network");
                setError("This address is not a contract on any supported network")
              }
            }
          }
        }
      } catch (err) {
        console.info("Error verifying contract:", err);
        console.info("Failed to verify contract");
      }

      if (!contractFound) {
        console.info("Could not verify contract on current network");
      }

      // Try to get balance first to verify if it's a valid token
      try {
        await refetchBalance();
        if (tokenBalance !== undefined) {
          balance = tokenBalance as bigint;
        } else {
          console.info("Could not fetch token balance");
        }
      } catch (err) {
        console.info("Error fetching balance:", err);
        console.info("Could not interact with this token contract. It might not be a valid ERC20 token.");
      }

      // Try different methods to get token name
      try {
        if (tokenName) {
          const processedName = bytes32ToString(tokenName);
          name = processedName || "Unknown Token";
        }
      } catch (err) {
        console.info("Error fetching token name:", err);
        // If standard name() call fails, try bytes32 version
        try {
          if (config.chains && config.chains.length > 0) {
            const currentChain = config.chains.find((chain: Chain) => chain.id === chainId);
            if (currentChain && currentChain.rpcUrls.default.http[0]) {
              const client = createPublicClient({
                chain: currentChain,
                transport: http(currentChain.rpcUrls.default.http[0])
              });

              const contract = getContract({
                address: tokenAddress as `0x${string}`,
                abi: parseAbi([
                  "function name() view returns (bytes32)",
                ]),
                client,
              });

              const bytes32Name = await contract.read.name();
              if (bytes32Name) {
                name = bytes32ToString(bytes32Name) || "Unknown Token";
              }
            }
          }
        } catch (e) {
          console.warn("Bytes32 name fetch failed:", e);
          // Keep default "Unknown Token"
        }
      }

      // Try different methods to get token symbol
      try {
        if (tokenSymbol) {
          const processedSymbol = bytes32ToString(tokenSymbol);
          symbol = processedSymbol || "???";
        }
      } catch (err) {
        console.info("Error fetching token symbol:", err);
        // If standard symbol() call fails, try bytes32 version
        try {
          if (config.chains && config.chains.length > 0) {
            const currentChain = config.chains.find((chain: Chain) => chain.id === chainId);
            if (currentChain && currentChain.rpcUrls.default.http[0]) {
              const client = createPublicClient({
                chain: currentChain,
                transport: http(currentChain.rpcUrls.default.http[0])
              });

              const contract = getContract({
                address: tokenAddress as `0x${string}`,
                abi: parseAbi([
                  "function symbol() view returns (bytes32)",
                ]),
                client,
              });

              const bytes32Symbol = await contract.read.symbol();
              if (bytes32Symbol) {
                symbol = bytes32ToString(bytes32Symbol) || "???";
              }
            }
          }
        } catch (e) {
          console.info("Bytes32 symbol fetch failed:", e);
          // Keep default "???"
        }
      }

      try {
        if (tokenDecimals !== undefined) {
          decimals = tokenDecimals as number;
        }
      } catch (err) {
        console.info("Error fetching token decimals:", err);
        // Keep default 18 decimals
      }

      // Detect if this is a special token with fees or rebasing
      const { isSpecial, warning } = await detectSpecialToken(tokenAddress, chainId, config);
      
      // If we detect a special token, suggest a lower burn percentage and show advanced options
      if (isSpecial) {
        const suggestedPercentage = 80;
        setBurnPercentage(suggestedPercentage);
        setBurnPercentageText(suggestedPercentage.toString());
        setShowAdvancedOptions(true);
      }

      // Set token info
      setTokenInfo({
        name,
        symbol,
        decimals,
        balance,
        isSpecialToken: isSpecial,
        tokenWarning: warning || (name === "Unknown Token" && symbol === "???" ? 
          "Warning: This token doesn't implement standard name and symbol functions. Proceed with caution." : undefined)
      });

      // Play fire sound when token is loaded
      if (fireSound1Ref.current) {
        playSound(fireSound1Ref as React.RefObject<HTMLAudioElement>)
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to fetch token information")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle burn percentage input change
  const handleBurnPercentageChange = (value: string) => {
    // Allow empty string for typing purposes
    if (value === "") {
      setBurnPercentageText(value);
      return;
    }
    
    // Only allow numbers and decimal point
    if (!/^(\d+\.?\d*|\.\d+)$/.test(value)) {
      return;
    }
    
    setBurnPercentageText(value);
    
    // Convert to number and validate range
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      if (numValue < 0.01) {
        setBurnPercentage(0.01);
      } else if (numValue > 100) {
        setBurnPercentage(100);
      } else {
        setBurnPercentage(numValue);
      }
    }
  };
  
  // Sync slider with text input
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setBurnPercentage(value);
    setBurnPercentageText(value.toString());
  };

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
      // If burnPercentage is 100 (default), use the full balance
      let burnAmount: bigint;
      
      if (burnPercentage === 100) {
        burnAmount = tokenInfo.balance;
      } else {
        // Otherwise calculate amount based on percentage - support decimals
        const percentage = parseFloat(burnPercentageText);
        // Use BigInt math with scaling to handle decimals (multiply by 1000 for 3 decimal precision)
        const scaledPercentage = BigInt(Math.floor(percentage * 1000));
        const scaledTotal = tokenInfo.balance * scaledPercentage;
        burnAmount = scaledTotal / BigInt(100000); // Divide by 100 * 1000 to get the result
      }
      
      console.log(`Attempting to burn ${formatUnits(burnAmount, tokenInfo.decimals)} ${tokenInfo.symbol} (${burnPercentageText}% of balance)`)
      
      // Send transaction to burn tokens
      writeContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "transfer",
        args: [BURN_ADDRESS, burnAmount],
      })

      // Play fire sound when transaction is initiated
      if (fireSound2Ref.current) {
        playSound(fireSound2Ref as React.RefObject<HTMLAudioElement>)
      }
    } catch (err) {
      console.error(err)
      
      // Check for token locked error
      const errorMessage = err instanceof Error ? err.message.toLowerCase() : '';
      if (errorMessage.includes('execution reverted') && errorMessage.includes('locked')) {
        setError("This token is locked and cannot be transferred. Nothing can be done.");
        toast.error("Token is Locked! 🔒", {
          description: "This token is locked and cannot be transferred. There's nothing that can be done with it.",
          richColors: true,
          duration: 6000,
        });
        return;
      }
      
      setError(err instanceof Error ? err.message : "Failed to burn tokens")
      // If transaction fails, show advanced options
      setShowAdvancedOptions(true)
      
      // Show toast suggesting to try with a lower percentage
      toast.error("Transaction failed! Try lowering the burn percentage.", {
        description: "Some tokens require burning less than 100% due to fees or special mechanics.",
        richColors: true,
        duration: 5000,
      })
    }
  }

  // Handle successful burn
  useEffect(() => {
    // Only proceed if we have a confirmed transaction with hash and token info
    if (isConfirmed && hash && tokenInfo) {
      // Check if this transaction has already been processed
      if (processedTransactions.has(hash)) {
        return; // Skip if we've already processed this transaction
      }
      
      // Add to processed transactions set
      setProcessedTransactions(prev => {
        const updated = new Set(prev);
        updated.add(hash);
        return updated;
      });

      // Check if this transaction is already in history before proceeding
      const { burnHistory } = useStore.getState();
      const transactionExists = burnHistory.some(entry => entry.txId === hash);
      
      // Only proceed with animation and adding to history if it's a new transaction
      if (!transactionExists) {
        // Show burn animation
        setShowBurnAnimation(true);

        // Play devil laugh sound
        if (devilLaughRef.current) {
          playSound(devilLaughRef as React.RefObject<HTMLAudioElement>);
        }

        // Calculate value
        const value = Number(formatUnits(tokenInfo.balance, tokenInfo.decimals));

        // Add to persistent store with transaction hash
        useStore.getState().addBurn(
          tokenInfo.name,
          tokenInfo.symbol,
          value,
          hash
        );

        // Show toast with random message
        const randomMessage = burnMessages[Math.floor(Math.random() * burnMessages.length)];
        toast.error(`${tokenInfo.symbol} Burned! ${randomMessage}`, {
          richColors: true,
        });
      }

      // Reset token info after successful burn (whether new or existing transaction)
      setTimeout(() => {
        setTokenInfo(null);
        setTokenAddress("");
        setShowBurnAnimation(false);
      }, 3000);
    }
  }, [isConfirmed, hash, tokenInfo, playSound, processedTransactions]);

  // Expand advanced options when transaction is rejected
  useEffect(() => {
    if (isPending && !isConfirming && !hash) {
      // This effect handles when a user rejects the transaction in their wallet
      // We don't need to do anything special here
    }
  }, [isPending, isConfirming, hash])

  // Get block explorer URL and transaction URL functions
  const getBlockExplorerUrl = () => {
    // Use Blockscan.com which works across all chains instead of chain-specific explorers
    return "https://blockscan.com"
  }
  
  const getTransactionUrl = (txHash: string) => {
    return `${getBlockExplorerUrl()}/tx/${txHash}`
  }
  
  // For wallet addresses, we'll still need chain-specific explorers
  const getAddressExplorerUrl = () => {
    const explorers: Record<number, string> = {
      1: "https://etherscan.io",
      10: "https://optimistic.etherscan.io",
      137: "https://polygonscan.com",
      42161: "https://arbiscan.io",
      8453: "https://basescan.org",
      11155111: "https://sepolia.etherscan.io",
    }
    return explorers[chainId] || "https://blockscan.com"
  }

  // Obfuscate wallet address for privacy
  const obfuscateAddress = (address: string) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-red-950 to-gray-950 text-white">
      {showBurnAnimation && tokenInfo && (
        <BurnAnimation value={Number(formatUnits(tokenInfo.balance, tokenInfo.decimals))} />
      )}

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
        </div>

        <Tabs defaultValue="burn" className="max-w-3xl mx-auto">
          <TabsList className="h-12 w-full bg-gray-900 border rounded-lg border-red-900">
            <TabsTrigger
              value="burn"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-900 data-[state=active]:to-red-800 data-[state=active]:text-orange-100 font-medium data-[state=active]:shadow-none"
            >
              <Flame className="mr-2 h-4 w-4" /> Burn Tokens
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-900 data-[state=active]:to-red-800 data-[state=active]:text-orange-100 font-medium data-[state=active]:shadow-none"
            >
              <Trophy className="mr-2 h-4 w-4" /> History
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
                          href={`${getAddressExplorerUrl()}/address/${address}`}
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
                      
                      {/* Token Warning */}
                      {tokenInfo?.tokenWarning && (
                        <div className="mt-2 bg-yellow-900/30 p-2 rounded-md border border-yellow-600/50 text-xs text-yellow-200">
                          <AlertCircle className="h-3.5 w-3.5 inline-block mr-1 text-yellow-400" />
                          <span>{tokenInfo.tokenWarning}</span>
                        </div>
                      )}
                      
                      {/* Advanced Options Toggle */}
                      <div className="pt-2 border-t border-red-900/30 mt-2">
                        <button
                          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                          className="text-sm flex items-center justify-between w-full text-orange-300 hover:text-orange-200 focus:outline-none transition-colors"
                        >
                          <span className="flex items-center">
                            <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
                            Advanced Options
                          </span>
                          <span className="text-xs">
                            {showAdvancedOptions ? '▲' : '▼'}
                          </span>
                        </button>
                        
                        {/* Burn Percentage Selector (in collapsible section) */}
                        {showAdvancedOptions && (
                          <div className="mt-2 pt-2 border-t border-red-900/20 animate-fadeIn">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm text-orange-300">Burn Percentage:</span>
                              <div className="flex items-center">
                                <input
                                  type="text"
                                  value={burnPercentageText}
                                  onChange={(e) => handleBurnPercentageChange(e.target.value)}
                                  onBlur={() => {
                                    // Ensure value is between 0.01 and 100
                                    const numValue = parseFloat(burnPercentageText);
                                    if (isNaN(numValue) || burnPercentageText === "") {
                                      setBurnPercentageText("100");
                                      setBurnPercentage(100);
                                    // } else if (numValue < 0.01) {
                                    //   setBurnPercentageText("0.01");
                                    //   setBurnPercentage(0.01);
                                    } else if (numValue > 100) {
                                      setBurnPercentageText("100");
                                      setBurnPercentage(100);
                                    }
                                  }}
                                  className="w-16 bg-gray-950 border border-red-900/50 text-orange-100 rounded-md p-1 text-sm text-center"
                                />
                                <span className="font-medium text-orange-100 ml-1">%</span>
                              </div>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="100"
                              value={Math.round(burnPercentage)}
                              onChange={handleSliderChange}
                              className="w-full h-2 bg-red-900/30 rounded-lg appearance-none cursor-pointer accent-red-600"
                            />
                            <div className="flex justify-between text-xs text-orange-200 mt-1">
                              <span>1%</span>
                              <span>50%</span>
                              <span>100%</span>
                            </div>
                            <div className="mt-2 text-xs text-orange-300">
                              <AlertCircle className="h-3 w-3 inline-block mr-1" />
                              Use less than 100% for tokens with transfer fees or special mechanisms.
                            </div>
                          </div>
                        )}
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
                          href={getTransactionUrl(hash)}
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

          <TabsContent value="history">
            <BurnHistory />
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

