import { motion, AnimatePresence } from "framer-motion";
import { Car, Plane, Ship, Bike, Motorbike, Helicopter } from "lucide-react";
import { VehicleType } from "@/types/hud";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface VehicleNameWidgetProps {
    vehicleType: VehicleType;
    vehicleName?: string; // Name from FiveM
    vehicleSpawnName?: string; // Spawn name for tx
    inVehicle: boolean;
    visible: boolean;
    editMode: boolean;
}

const vehicleIcons: Record<VehicleType, React.ElementType> = {
    car: Car,
    plane: Plane,
    boat: Ship,
    helicopter: Helicopter,
    motorcycle: Motorbike,
    bicycle: Bike,
};

export const VehicleNameWidget = ({
    vehicleType,
    vehicleName,
    vehicleSpawnName,
    inVehicle,
    visible,
    editMode,
}: VehicleNameWidgetProps) => {
    const { t } = useTranslation();
    const Icon = vehicleIcons[vehicleType] || Car;

    // Use vehicle name from FiveM, fallback to translated type
    const displayName = vehicleName || t.speedometerTypes[vehicleType] || t.vehicle.unknown;
    // Spawn name for tx (e.g., "adder", "zentorno")
    const spawnName = vehicleSpawnName || (editMode ? "spawn_name" : undefined);

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
                        "glass-panel border border-border/30 rounded-lg px-3 py-2 flex items-center gap-2",
                        !inVehicle && editMode && "opacity-50"
                    )}>
                    <Icon
                        size={14}
                        className={cn("text-primary", vehicleType === "helicopter" && "rotate-45")}
                        style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary)))" }}
                    />
                    <div className="flex flex-col">
                        <span
                            className="text-xs font-medium text-foreground uppercase tracking-wider leading-tight"
                            style={{ fontFamily: "Orbitron, sans-serif" }}>
                            {displayName}
                        </span>
                        {spawnName && (
                            <span
                                className="text-[9px] text-muted-foreground font-mono leading-tight text-center"
                                style={{ opacity: 0.7 }}>
                                {spawnName}
                            </span>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
