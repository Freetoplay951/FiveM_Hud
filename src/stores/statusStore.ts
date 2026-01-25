import { create } from "zustand";
import { StatusWidgetState, StatusType } from "@/types/hud";
import { STATUS_DATA } from "@/components/hud/data/demoData";
import { isNuiEnvironment } from "@/lib/nuiUtils";

interface StatusStoreState {
    health: number;
    armor: number;
    hunger: number;
    thirst: number;
    stamina: number;
    stress: number;
    oxygen: number;
    isUnderwater: boolean;
}

interface StatusStoreActions {
    setStatus: (status: Partial<StatusWidgetState>) => void;
    setStatusValue: (type: StatusType, value: number) => void;
    setIsUnderwater: (value: boolean) => void;
}

type StatusStore = StatusStoreState & StatusStoreActions;

const initialState: StatusStoreState = isNuiEnvironment()
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
          health: STATUS_DATA.health,
          armor: STATUS_DATA.armor,
          hunger: STATUS_DATA.hunger,
          thirst: STATUS_DATA.thirst,
          stamina: STATUS_DATA.stamina,
          stress: STATUS_DATA.stress ?? 0,
          oxygen: STATUS_DATA.oxygen ?? 100,
          isUnderwater: STATUS_DATA.isUnderwater ?? false,
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
