import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type BodyHealthStatus = "good" | "warning" | "critical";

const getBodyHealthStatus = (bodyHealth: number): BodyHealthStatus => {
    // Thresholds match Lua config (in percent): yellowThreshold = 70, redThreshold = 40
    if (bodyHealth < 40) return "critical";
    if (bodyHealth < 70) return "warning";
    return "good";
};

interface BodyHealthIndicatorProps {
    bodyHealth: number;
}

export const BodyHealthIndicator = ({ bodyHealth }: BodyHealthIndicatorProps) => {
    const status = getBodyHealthStatus(bodyHealth);
    
    return (
        <motion.div
            className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full",
                status === "critical" && "critical-pulse"
            )}
            animate={status === "critical" ? {
                boxShadow: [
                    "0 0 4px hsl(var(--critical) / 0.4)",
                    "0 0 12px hsl(var(--critical) / 0.8)",
                    "0 0 4px hsl(var(--critical) / 0.4)"
                ]
            } : {}}
            transition={status === "critical" ? {
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
            } : {}}
        >
            <Wrench
                size={14}
                className={cn(
                    "transition-colors duration-300",
                    status === "critical" && "text-critical",
                    status === "warning" && "text-warning",
                    status === "good" && "text-stamina"
                )}
                style={{
                    filter: status === "critical" 
                        ? "drop-shadow(0 0 6px hsl(var(--critical)))"
                        : status === "warning"
                        ? "drop-shadow(0 0 4px hsl(var(--warning)))"
                        : "drop-shadow(0 0 3px hsl(var(--stamina)))"
                }}
            />
        </motion.div>
    );
};
