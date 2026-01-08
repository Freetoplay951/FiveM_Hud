import { motion } from "framer-motion";
import { VehicleState } from "@/types/hud";

interface HeliHeadingWidgetProps {
    vehicle: VehicleState;
    visible: boolean;
}

export const HeliHeadingWidget = ({ vehicle, visible }: HeliHeadingWidgetProps) => {
    const heading = vehicle.heading || 0;

    return (
        <motion.div
            initial={false}
            animate={{
                opacity: visible ? 1 : 0,
                scale: visible ? 1 : 0.9,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-background/85 border border-white/20 rounded px-2 py-0.5 flex items-center gap-1 w-[48px] justify-center">
            <motion.span
                className="hud-number text-[10px] text-primary tabular-nums"
                style={{
                    textShadow: "0 0 6px hsl(var(--primary) / 0.6)",
                    fontVariantNumeric: "tabular-nums",
                }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}>
                {String(Math.round(heading)).padStart(3, "0")}°
            </motion.span>
        </motion.div>
    );
};
