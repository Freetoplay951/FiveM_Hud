import { create } from "zustand";

/**
 * Utility Store - For FPS, Wanted Level, Ping, Server Info and Speed Limit
 */
interface UtilityState {
    // FPS Counter
    fps: number;
    
    // Wanted Level (0-5 stars like GTA)
    wantedLevel: number;
    
    // Ping/Latency
    ping: number;
    
    // Server Info
    serverName: string;
    playerCount: number;
    maxPlayers: number;
    
    // Speed Limit
    speedLimit: number;
    speedZoneActive: boolean;
    
    // Actions
    setFps: (fps: number) => void;
    setWantedLevel: (level: number) => void;
    setPing: (ping: number) => void;
    setServerInfo: (info: { serverName?: string; playerCount?: number; maxPlayers?: number }) => void;
    setSpeedLimit: (limit: number, active: boolean) => void;
    setUtilityState: (state: Partial<UtilityState>) => void;
}

export const useUtilityStore = create<UtilityState>((set) => ({
    fps: 60,
    wantedLevel: 0,
    ping: 50,
    serverName: "RP Server",
    playerCount: 64,
    maxPlayers: 128,
    speedLimit: 50,
    speedZoneActive: false,

    setFps: (fps) => set({ fps }),
    setWantedLevel: (level) => set({ wantedLevel: Math.min(5, Math.max(0, level)) }),
    setPing: (ping) => set({ ping }),
    setServerInfo: (info) => set((state) => ({
        serverName: info.serverName ?? state.serverName,
        playerCount: info.playerCount ?? state.playerCount,
        maxPlayers: info.maxPlayers ?? state.maxPlayers,
    })),
    setSpeedLimit: (limit, active) => set({ speedLimit: limit, speedZoneActive: active }),
    setUtilityState: (state) => set((prev) => ({ ...prev, ...state })),
}));

// Selectors for performance
export const useFps = () => useUtilityStore((state) => state.fps);
export const useWantedLevel = () => useUtilityStore((state) => state.wantedLevel);
export const usePing = () => useUtilityStore((state) => state.ping);
export const useServerName = () => useUtilityStore((state) => state.serverName);
export const usePlayerCount = () => useUtilityStore((state) => state.playerCount);
export const useMaxPlayers = () => useUtilityStore((state) => state.maxPlayers);
export const useSpeedLimit = () => useUtilityStore((state) => state.speedLimit);
export const useSpeedZoneActive = () => useUtilityStore((state) => state.speedZoneActive);
