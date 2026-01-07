import { VehicleState } from "@/types/hud";
import { VehicleHUD } from "./VehicleHUD";
import { PlaneHUD } from "./PlaneHUD";
import { BoatHUD } from "./BoatHUD";
import { HelicopterHUD } from "./HelicopterHUD";
import { MotorcycleHUD } from "./MotorcycleHUD";
import { BicycleHUD } from "./BicycleHUD";

interface VehicleHUDFactoryProps {
    vehicle: VehicleState;
    visible: boolean;
}

export const VehicleHUDFactory = ({ vehicle, visible }: VehicleHUDFactoryProps) => {
    switch (vehicle.vehicleType) {
        case "plane":
            return (
                <PlaneHUD
                    vehicle={vehicle}
                    visible={visible}
                />
            );
        case "boat":
            return (
                <BoatHUD
                    vehicle={vehicle}
                    visible={visible}
                />
            );
        case "helicopter":
            return (
                <HelicopterHUD
                    vehicle={vehicle}
                    visible={visible}
                />
            );
        case "motorcycle":
            return (
                <MotorcycleHUD
                    vehicle={vehicle}
                    visible={visible}
                />
            );
        case "bicycle":
            return (
                <BicycleHUD
                    vehicle={vehicle}
                    visible={visible}
                />
            );
        case "car":
        default:
            return (
                <VehicleHUD
                    vehicle={vehicle}
                    visible={visible}
                />
            );
    }
};
