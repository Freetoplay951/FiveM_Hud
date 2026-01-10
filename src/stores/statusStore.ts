import { create } from "zustand";
import { StatusWidgetState, StatusType } from "@/types/hud";
import { DEMO_HUD } from "@/components/hud/data/demoData";
import { isNuiEnvironment } from "@/hooks/useNuiEvents";

interface StatusStore {
    // Individual status values
    health: number;
    armor: number;
    hunger: number;
    thirst: number;
    stamina: number;
    stress: number;
    oxygen: number;
    isUnderwater: boolean;

    // Actions
    setStatus: (status: Partial<StatusWidgetState>) => void;
    setStatusValue: (type: StatusType, value: number) => void;
    setIsUnderwater: (value: boolean) => void;
}

const initialState = isNuiEnvironment()
    ? {
          health: 100,
          armor: 100,
          hunger: 100,
          thirst: 100,
          stamina: 100,
          stress: 0,
          oxygen: 100,
          isUnderwater: false,
      }
    : {
          health: DEMO_HUD.health,
          armor: DEMO_HUD.armor,
          hunger: DEMO_HUD.hunger,
          thirst: DEMO_HUD.thirst,
          stamina: DEMO_HUD.stamina,
          stress: DEMO_HUD.stress ?? 0,
          oxygen: DEMO_HUD.oxygen ?? 100,
          isUnderwater: DEMO_HUD.isUnderwater ?? false,
      };

export const useStatusStore = create<StatusStore>((set) => ({
    ...initialState,

    setStatus: (status) =>
        set((state) => ({
            ...state,
            ...status,
        })),

    setStatusValue: (type, value) =>
        set((state) => ({
            ...state,
            [type]: value,
        })),

    setIsUnderwater: (value) => set({ isUnderwater: value }),
}));

// Selectors for individual status types - widgets subscribe only to their value
export const useHealthStatus = () => useStatusStore((state) => state.health);
export const useArmorStatus = () => useStatusStore((state) => state.armor);
export const useHungerStatus = () => useStatusStore((state) => state.hunger);
export const useThirstStatus = () => useStatusStore((state) => state.thirst);
export const useStaminaStatus = () => useStatusStore((state) => state.stamina);
export const useStressStatus = () => useStatusStore((state) => state.stress);
export const useOxygenStatus = () => useStatusStore((state) => state.oxygen);
export const useIsUnderwater = () => useStatusStore((state) => state.isUnderwater);
