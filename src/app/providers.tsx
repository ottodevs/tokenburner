"use client"

import type React from "react"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, createConfig, http } from "wagmi"
import { mainnet, sepolia, optimism, arbitrum, polygon, base } from "wagmi/chains"
import { injected } from "wagmi/connectors"

// Create a client
const queryClient = new QueryClient()

// Create wagmi config
const config = createConfig({
  chains: [mainnet, sepolia, optimism, arbitrum, polygon, base],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
  },
  connectors: [injected()],
})

export function WagmiConfig({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

