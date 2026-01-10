import { create } from "zustand";

/**
 * Utility Store - For FPS, Wanted Level, Ping and other utility data
 */
interface UtilityState {
    // FPS Counter
    fps: number;
    
    // Wanted Level (0-5 stars like GTA)
    wantedLevel: number;
    
    // Ping/Latency
    ping: number;
    
    // Actions
    setFps: (fps: number) => void;
    setWantedLevel: (level: number) => void;
    setPing: (ping: number) => void;
    setUtilityState: (state: Partial<UtilityState>) => void;
}

export const useUtilityStore = create<UtilityState>((set) => ({
    fps: 60,
    wantedLevel: 0,
    ping: 50,

    setFps: (fps) => set({ fps }),
    setWantedLevel: (level) => set({ wantedLevel: Math.min(5, Math.max(0, level)) }),
    setPing: (ping) => set({ ping }),
    setUtilityState: (state) => set((prev) => ({ ...prev, ...state })),
}));

// Selectors for performance
export const useFps = () => useUtilityStore((state) => state.fps);
export const useWantedLevel = () => useUtilityStore((state) => state.wantedLevel);
export const usePing = () => useUtilityStore((state) => state.ping);
