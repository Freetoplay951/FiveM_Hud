import { create } from "zustand";

/**
 * Utility Store - For Wanted Level and Server Info
 */
interface UtilityStoreState {
    // Wanted Level (0-5 stars like GTA)
    wantedLevel: number;
    // Is evading (cops lost sight) - stars should blink when true
    isEvading: boolean;
    // Server Info
    serverName: string;
    playerCount: number;
    maxPlayers: number;
}

type ServerInfo = Partial<Pick<UtilityStoreState, "serverName" | "playerCount" | "maxPlayers">>;

interface UtilityStoreActions {
    setWantedLevel: (level: number) => void;
    setIsEvading: (isEvading: boolean) => void;
    setServerInfo: (info: ServerInfo) => void;
    setUtilityState: (state: Partial<UtilityStoreState>) => void;
}

type UtilityStore = UtilityStoreState & UtilityStoreActions;

export const useUtilityStore = create<UtilityStore>((set) => ({
    wantedLevel: 0,
    isEvading: false,
    serverName: "RP Server",
    playerCount: 64,
    maxPlayers: 128,

    setWantedLevel: (level) => set({ wantedLevel: Math.min(5, Math.max(0, level)) }),
    setIsEvading: (isEvading) => set({ isEvading }),
    setServerInfo: (info) =>
        set((state) => ({
            serverName: info.serverName ?? state.serverName,
            playerCount: info.playerCount ?? state.playerCount,
            maxPlayers: info.maxPlayers ?? state.maxPlayers,
        })),
    setUtilityState: (state) => set((prev) => ({ ...prev, ...state })),
}));

// Selectors for performance
export const useWantedLevel = () => useUtilityStore((state) => state.wantedLevel);
export const useIsEvading = () => useUtilityStore((state) => state.isEvading);
export const useServerName = () => useUtilityStore((state) => state.serverName);
export const usePlayerCount = () => useUtilityStore((state) => state.playerCount);
export const useMaxPlayers = () => useUtilityStore((state) => state.maxPlayers);
