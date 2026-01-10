import { create } from "zustand";

/**
 * Utility Store - For Wanted Level, Ping, and Server Info
 */
interface UtilityState {
    // Wanted Level (0-5 stars like GTA)
    wantedLevel: number;
    
    // Ping/Latency
    ping: number;
    
    // Server Info
    serverName: string;
    playerCount: number;
    maxPlayers: number;
    
    // Actions
    setWantedLevel: (level: number) => void;
    setPing: (ping: number) => void;
    setServerInfo: (info: { serverName?: string; playerCount?: number; maxPlayers?: number }) => void;
    setUtilityState: (state: Partial<UtilityState>) => void;
}

export const useUtilityStore = create<UtilityState>((set) => ({
    wantedLevel: 0,
    ping: 50,
    serverName: "RP Server",
    playerCount: 64,
    maxPlayers: 128,

    setWantedLevel: (level) => set({ wantedLevel: Math.min(5, Math.max(0, level)) }),
    setPing: (ping) => set({ ping }),
    setServerInfo: (info) => set((state) => ({
        serverName: info.serverName ?? state.serverName,
        playerCount: info.playerCount ?? state.playerCount,
        maxPlayers: info.maxPlayers ?? state.maxPlayers,
    })),
    setUtilityState: (state) => set((prev) => ({ ...prev, ...state })),
}));

// Selectors for performance
export const useWantedLevel = () => useUtilityStore((state) => state.wantedLevel);
export const usePing = () => useUtilityStore((state) => state.ping);
export const useServerName = () => useUtilityStore((state) => state.serverName);
export const usePlayerCount = () => useUtilityStore((state) => state.playerCount);
export const useMaxPlayers = () => useUtilityStore((state) => state.maxPlayers);
