import { motion } from "framer-motion";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeliVSpeedWidgetProps {
    verticalSpeed: number;
    visible: boolean;
}

export const HeliVSpeedWidget = ({ verticalSpeed, visible }: HeliVSpeedWidgetProps) => {
    return (
        <motion.div
            initial={false}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="bg-background/85 border border-white/20 rounded px-1.5 py-0.5 flex items-center gap-0.5 w-[44px]">
            {verticalSpeed > 0 ? (
                <ArrowUp
                    size={8}
                    className="text-stamina flex-shrink-0"
                    style={{ filter: "drop-shadow(0 0 2px hsl(var(--stamina)))" }}
                />
            ) : verticalSpeed < 0 ? (
                <ArrowDown
                    size={8}
                    className="text-warning flex-shrink-0"
                    style={{ filter: "drop-shadow(0 0 2px hsl(var(--warning)))" }}
                />
            ) : (
                <div className="w-2" />
            )}
            <motion.span
                className={cn(
                    "hud-number text-[8px] tabular-nums",
                    verticalSpeed > 0 ? "text-stamina" : verticalSpeed < 0 ? "text-warning" : "text-foreground"
                )}
                style={{ fontVariantNumeric: "tabular-nums" }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}>
                {verticalSpeed >= 0 ? "+" : ""}
                {String(Math.round(verticalSpeed)).padStart(2, "0")}
            </motion.span>
        </motion.div>
    );
};
