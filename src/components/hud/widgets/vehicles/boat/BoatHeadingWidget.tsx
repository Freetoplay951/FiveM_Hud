import { motion } from "framer-motion";
import { Navigation } from "lucide-react";
import { getDirectionFromDegree } from "@/lib/compassUtils";

interface BoatHeadingWidgetProps {
    heading: number;
    visible: boolean;
}

export const BoatHeadingWidget = ({ heading, visible }: BoatHeadingWidgetProps) => {
    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="bg-background/85 border border-white/20 rounded px-2 py-0.5 flex items-center gap-1 min-w-[80px] justify-center">
            <Navigation
                size={12}
                className="text-primary flex-shrink-0"
                style={{
                    transform: `rotate(${heading}deg)`,
                    filter: "drop-shadow(0 0 4px hsl(var(--primary)))",
                    transition: "transform 0.15s ease-out",
                }}
            />
            <motion.span
                className="hud-number text-[10px] text-primary tabular-nums"
                style={{
                    textShadow: "0 0 6px hsl(var(--primary) / 0.6)",
                    fontVariantNumeric: "tabular-nums",
                }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}>
                {getDirectionFromDegree(heading)} {String(Math.round(heading)).padStart(3, "0")}°
            </motion.span>
        </motion.div>
    );
};
