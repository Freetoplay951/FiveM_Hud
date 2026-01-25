import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { DeathState } from "@/types/hud";
import { DEMO_DEATH } from "@/components/hud/data/demoData";
import { isNuiEnvironment } from "@/lib/nuiUtils";

export const DEFAULT_DEATH_CONFIG: NonNullable<DeathState["config"]> = {
    respawnTimer: 300,
    bleedoutTimer: 600,
    syncTimer: 10,
    helpTimer: 60,
};

interface DeathStore extends DeathState {
    config: NonNullable<DeathState["config"]>;
    setDeathState: (state: Partial<DeathState>) => void;
    setIsDead: (isDead: boolean) => void;
}

const isDemoMode = !isNuiEnvironment();

export const useDeathStore = create<DeathStore>((set) => ({
    isDead: isDemoMode ? DEMO_DEATH.isDead : false,
    message: DEMO_DEATH.message,
    config: DEFAULT_DEATH_CONFIG,

    setDeathState: (state) =>
        set((prev) => ({
            ...prev,
            ...state,
            config: state.config
                ? {
                      ...prev.config,
                      ...state.config,
                  }
                : prev.config,
        })),

    setIsDead: (isDead) => set({ isDead }),
}));

// Selectors
export const useIsDead = () => useDeathStore((state) => state.isDead);
export const useDeathMessage = () => useDeathStore((state) => state.message);
export const useDeathConfig = () => useDeathStore((state) => state.config);
export const useDeathData = () =>
    useDeathStore(
        useShallow((state) => ({
            isDead: state.isDead,
            message: state.message,
            config: state.config,
        })),
    );
