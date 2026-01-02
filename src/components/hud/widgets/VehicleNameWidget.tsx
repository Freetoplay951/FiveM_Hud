import { motion, AnimatePresence } from "framer-motion";
import { Car, Plane, Ship, Helicopter, Bike, BikeIcon } from "lucide-react";
import { VehicleType } from "@/types/hud";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface VehicleNameWidgetProps {
    vehicleType: VehicleType;
    vehicleName?: string; // Name from FiveM
    inVehicle: boolean;
    visible: boolean;
    editMode: boolean;
}

const vehicleIcons: Record<VehicleType, React.ElementType> = {
    car: Car,
    plane: Plane,
    boat: Ship,
    helicopter: Helicopter,
    motorcycle: Bike,
    bicycle: BikeIcon,
};

export const VehicleNameWidget = ({ vehicleType, vehicleName, inVehicle, visible, editMode }: VehicleNameWidgetProps) => {
    const { t } = useTranslation();
    const Icon = vehicleIcons[vehicleType] || Car;
    
    // Use vehicle name from FiveM, fallback to translated type
    const displayName = vehicleName || t.speedometerTypes[vehicleType] || t.vehicle.unknown;

    // Show in edit mode or when in vehicle
    if (!visible && !editMode) return null;
    if (!inVehicle && !editMode) return null;

    return (
        <AnimatePresence>
            {(inVehicle || editMode) && (
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        "glass-panel border border-border/30 rounded-lg px-3 py-1.5 flex items-center gap-2",
                        !inVehicle && editMode && "opacity-50"
                    )}>
                    <Icon
                        size={14}
                        className="text-primary"
                        style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary)))" }}
                    />
                    <span
                        className="text-xs font-medium text-foreground uppercase tracking-wider"
                        style={{ fontFamily: "Orbitron, sans-serif" }}>
                        {displayName}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
