import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BurnHistoryItem {
  name: string;
  symbol: string;
  value: number;
  timestamp: number;
  txId: string;
}

interface AppState {
  burnHistory: BurnHistoryItem[];
  totalBurned: number;
  comboMultiplier: number;
  lastBurnTimestamp: number | null;
  addBurn: (name: string, symbol: string, value: number, txId: string, timestamp?: number) => void;
  resetStore: () => void;
}

const initialState = {
  burnHistory: [],
  totalBurned: 0,
  comboMultiplier: 1,
  lastBurnTimestamp: null,
};

export const useStore = create(
  persist<AppState>(
    (set) => ({
      ...initialState,
      addBurn: (name: string, symbol: string, value: number, txId: string, timestamp?: number) => set((state) => {
        const now = timestamp || Date.now();
        const newBurn = {
          name,
          symbol,
          value,
          timestamp: now,
          txId,
        };
        
        // Update combo multiplier (resets after 5 minutes)
        const isCombo = state.lastBurnTimestamp && 
          (now - state.lastBurnTimestamp) < 300000;
        
        return {
          burnHistory: [newBurn, ...state.burnHistory],
          totalBurned: state.totalBurned + value,
          comboMultiplier: isCombo ? state.comboMultiplier + 0.1 : 1,
          lastBurnTimestamp: now,
        };
      }),
      resetStore: () => set(initialState),
    }),
    {
      name: 'inferno-burn-storage',
    }
  )
); 