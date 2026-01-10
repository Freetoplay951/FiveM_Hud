import { create } from "zustand";
import { LocationState } from "@/types/hud";
import { DEMO_LOCATION } from "@/components/hud/data/demoData";
import { isNuiEnvironment } from "@/hooks/useNuiEvents";

interface LocationStore extends LocationState {
    setLocation: (state: Partial<LocationState>) => void;
    setStreet: (street: string) => void;
    setArea: (area: string) => void;
    setHeading: (heading: number | undefined) => void;
}

const initialState: LocationState = isNuiEnvironment()
    ? {
          street: "",
          area: "",
          heading: undefined,
      }
    : DEMO_LOCATION;

export const useLocationStore = create<LocationStore>((set) => ({
    ...initialState,

    setLocation: (state) =>
        set((prev) => ({
            ...prev,
            ...state,
        })),

    setStreet: (street) => set({ street }),

    setArea: (area) => set({ area }),

    setHeading: (heading) => set({ heading }),
}));

// Selectors
export const useStreet = () => useLocationStore((state) => state.street);
export const useArea = () => useLocationStore((state) => state.area);
export const useHeading = () => useLocationStore((state) => state.heading);
export const useLocationData = () =>
    useLocationStore((state) => ({
        street: state.street,
        area: state.area,
    }));
