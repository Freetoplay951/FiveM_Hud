import { create } from "zustand";
import { VehicleState, VehicleType } from "@/types/hud";
import { DEMO_VEHICLE } from "@/components/hud/data/demoData";
import { isNuiEnvironment } from "@/hooks/useNuiEvents";

interface VehicleStore extends VehicleState {
    setVehicleState: (state: Partial<VehicleState>) => void;
    setInVehicle: (value: boolean) => void;
    setVehicleType: (type: VehicleType) => void;
}

const initialState: VehicleState = isNuiEnvironment()
    ? {
          inVehicle: false,
          vehicleType: "car",
          speed: 0,
          gear: 1,
          fuel: 100,
      }
    : DEMO_VEHICLE;

export const useVehicleStore = create<VehicleStore>((set) => ({
    ...initialState,

    setVehicleState: (state) =>
        set((prev) => ({
            ...prev,
            ...state,
        })),

    setInVehicle: (value) => set({ inVehicle: value }),

    setVehicleType: (type) => set({ vehicleType: type }),
}));

// Selectors for specific vehicle data - widgets subscribe to what they need
export const useInVehicle = () => useVehicleStore((state) => state.inVehicle);
export const useVehicleType = () => useVehicleStore((state) => state.vehicleType);
export const useVehicleSpeed = () => useVehicleStore((state) => state.speed);
export const useVehicleGear = () => useVehicleStore((state) => state.gear);
export const useVehicleFuel = () => useVehicleStore((state) => state.fuel);
export const useVehicleRpm = () => useVehicleStore((state) => state.rpm);
export const useVehicleBodyHealth = () => useVehicleStore((state) => state.bodyHealth);
export const useVehicleName = () =>
    useVehicleStore((state) => ({
        vehicleName: state.vehicleName,
        vehicleSpawnName: state.vehicleSpawnName,
    }));

// Aircraft-specific selectors
export const useAircraftData = () =>
    useVehicleStore((state) => ({
        altitude: state.altitude,
        airspeed: state.airspeed,
        pitch: state.pitch,
        roll: state.roll,
        heading: state.heading,
        verticalSpeed: state.verticalSpeed,
        rotorRpm: state.rotorRpm,
        landingGear: state.landingGear,
        flaps: state.flaps,
    }));

// Boat-specific selectors
export const useBoatData = () =>
    useVehicleStore((state) => ({
        anchor: state.anchor,
        depth: state.depth,
        heading: state.heading,
    }));

// Car-specific selectors
export const useCarData = () =>
    useVehicleStore((state) => ({
        seatbelt: state.seatbelt,
        lights: state.lights,
        blinker: state.blinker,
    }));
