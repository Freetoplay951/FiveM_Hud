import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { LocationState } from "@/types/hud";
import { DEMO_LOCATION } from "@/components/hud/data/demoData";
import { isNuiEnvironment } from "@/lib/nuiUtils";

interface LocationStoreActions {
    setLocation: (state: Partial<LocationState>) => void;
    setStreet: (street: string) => void;
    setArea: (area: string) => void;
    setHeading: (heading: number | undefined) => void;
}

type LocationStore = LocationState & LocationStoreActions;

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
    useLocationStore(
        useShallow((state) => ({
            street: state.street,
            area: state.area,
        })),
    );
