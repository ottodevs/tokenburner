"use client"

import { useSwitchChain, useChainId } from "wagmi"
import { mainnet, sepolia, optimism, arbitrum, polygon, base } from "wagmi/chains"
import { Check, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Define networks with their details
const networks = [
  {
    id: mainnet.id,
    name: "Ethereum",
    icon: "🔷",
    chain: mainnet,
  },
  {
    id: polygon.id,
    name: "Polygon",
    icon: "🟣",
    chain: polygon,
  },
  {
    id: optimism.id,
    name: "Optimism",
    icon: "🔴",
    chain: optimism,
  },
  {
    id: arbitrum.id,
    name: "Arbitrum",
    icon: "🔵",
    chain: arbitrum,
  },
  {
    id: base.id,
    name: "Base",
    icon: "🔷",
    chain: base,
  },
  {
    id: sepolia.id,
    name: "Sepolia",
    icon: "🧪",
    chain: sepolia,
  },
]

export function NetworkSwitcher() {
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()

  // Find current network
  const currentNetwork = networks.find((network) => network.id === chainId) || {
    id: chainId,
    name: "Unknown Network",
    icon: "❓",
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between bg-gray-950 border-red-900/50 text-orange-100 hover:bg-gray-900 hover:text-orange-200 shadow-inner transform hover:scale-[1.02] transition-all duration-200 card-3d-hover"
          disabled={isPending}
        >
          <div className="flex items-center gap-2">
            <span>{currentNetwork.icon}</span>
            <span>{currentNetwork.name}</span>
            {isPending && <span className="text-xs text-orange-400">(switching...)</span>}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[200px] bg-gray-950 border-red-900/50 text-orange-100 shadow-lg shadow-red-900/20"
      >
        {networks.map((network) => (
          <DropdownMenuItem
            key={network.id}
            className={cn(
              "flex cursor-pointer items-center justify-between hover:bg-gray-900 transition-colors duration-200",
              network.id === chainId && "bg-red-900/30",
            )}
            onClick={() => {
              if (network.id !== chainId) {
                switchChain({ chainId: network.id })
              }
            }}
            disabled={isPending}
          >
            <div className="flex items-center gap-2">
              <span>{network.icon}</span>
              <span>{network.name}</span>
            </div>
            {network.id === chainId && <Check className="h-4 w-4 text-orange-400" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

