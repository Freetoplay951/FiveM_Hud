import { motion, AnimatePresence } from "framer-motion";
import { Car, Plane, Ship, Bike } from "lucide-react";
import { VehicleType } from "@/types/hud";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

// Custom Motorcycle Icon
const MotorcycleIcon = ({ size = 24, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <circle cx="5" cy="17" r="3" />
        <circle cx="19" cy="17" r="3" />
        <path d="M9 17h6" />
        <path d="M19 17l-2-7h-3l-2 3-4-3" />
        <path d="M5 17l2-7h2" />
    </svg>
);

// Custom Bicycle Icon  
const BicycleIcon = ({ size = 24, className, style }: { size?: number; className?: string; style?: React.CSSProperties }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M12 17.5l-3-8h6l-1 4" />
        <path d="M9 9.5l3-4" />
        <path d="M15 9.5h3l1 8" />
        <circle cx="12" cy="5" r="1" />
    </svg>
);

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
    helicopter: Plane, // Using Plane rotated for helicopter
    motorcycle: MotorcycleIcon,
    bicycle: BicycleIcon,
};

export const VehicleNameWidget = ({ vehicleType, vehicleName, vehicleSpawnName, inVehicle, visible, editMode }: VehicleNameWidgetProps) => {
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
                        className={cn(
                            "text-primary",
                            vehicleType === "helicopter" && "rotate-45"
                        )}
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
                                className="text-[9px] text-muted-foreground font-mono leading-tight"
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
