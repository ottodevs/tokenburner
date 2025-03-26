'use client'

import { createContext, useContext, useState } from "react"

type SoundProviderProps = {
  children: React.ReactNode
}

type SoundProviderState = {
  soundEnabled: boolean
  toggleSound: () => void
}

const initialState: SoundProviderState = {
  soundEnabled: true,
  toggleSound: () => null,
}

const SoundProviderContext = createContext<SoundProviderState>(initialState)

export function SoundProvider({ children }: SoundProviderProps) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev)
  }

  const value = {
    soundEnabled,
    toggleSound,
  }

  return <SoundProviderContext.Provider value={value}>{children}</SoundProviderContext.Provider>
}

export const useSound = () => {
  const context = useContext(SoundProviderContext)

  if (context === undefined) throw new Error("useSound must be used within a SoundProvider")

  return context
} 