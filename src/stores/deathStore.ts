import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { DeathState } from "@/types/hud";
import { DEMO_DEATH } from "@/components/hud/data/demoData";
import { isNuiEnvironment } from "@/hooks/useNuiEvents";

interface DeathStore extends DeathState {
    setDeathState: (state: Partial<DeathState>) => void;
    setIsDead: (isDead: boolean) => void;
    setCanRespawn: (canRespawn: boolean) => void;
    setTimers: (respawnTimer: number, waitTimer: number) => void;
}

const isDemoMode = !isNuiEnvironment();

export const useDeathStore = create<DeathStore>((set) => ({
    isDead: isDemoMode ? DEMO_DEATH.isDead : false,
    respawnTimer: DEMO_DEATH.respawnTimer,
    waitTimer: DEMO_DEATH.waitTimer,
    canCallHelp: DEMO_DEATH.canCallHelp,
    canRespawn: DEMO_DEATH.canRespawn,
    message: DEMO_DEATH.message,

    setDeathState: (state) =>
        set((prev) => ({
            ...prev,
            ...state,
        })),

    setIsDead: (isDead) =>
        set((prev) => ({
            ...prev,
            isDead,
            // Reset timers when dying
            ...(isDead && !prev.isDead
                ? {
                      respawnTimer: 14,
                      waitTimer: 59,
                      canRespawn: false,
                  }
                : {}),
        })),

    setCanRespawn: (canRespawn) => set({ canRespawn }),

    setTimers: (respawnTimer, waitTimer) => set({ respawnTimer, waitTimer }),
}));

// Selectors
export const useIsDead = () => useDeathStore((state) => state.isDead);
export const useRespawnTimer = () => useDeathStore((state) => state.respawnTimer);
export const useWaitTimer = () => useDeathStore((state) => state.waitTimer);
export const useCanRespawn = () => useDeathStore((state) => state.canRespawn);
export const useCanCallHelp = () => useDeathStore((state) => state.canCallHelp);
export const useDeathMessage = () => useDeathStore((state) => state.message);
export const useDeathData = () =>
    useDeathStore(
        useShallow((state) => ({
            isDead: state.isDead,
            respawnTimer: state.respawnTimer,
            waitTimer: state.waitTimer,
            canCallHelp: state.canCallHelp,
            canRespawn: state.canRespawn,
            message: state.message,
        }))
    );
