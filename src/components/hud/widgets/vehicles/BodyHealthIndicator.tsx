import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type BodyHealthStatus = "good" | "warning" | "critical";

const getBodyHealthStatus = (bodyHealth: number): BodyHealthStatus => {
    // Thresholds match Lua config: yellowThreshold = 700, redThreshold = 400
    if (bodyHealth < 400) return "critical";
    if (bodyHealth < 700) return "warning";
    return "good";
};

interface BodyHealthIndicatorProps {
    bodyHealth: number;
}

export const BodyHealthIndicator = ({ bodyHealth }: BodyHealthIndicatorProps) => {
    const status = getBodyHealthStatus(bodyHealth);
    
    return (
        <motion.div
            className="flex items-center justify-center gap-2 mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <motion.div
                className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full glass-panel",
                    status === "critical" && "critical-pulse"
                )}
                animate={status === "critical" ? {
                    boxShadow: [
                        "0 0 8px hsl(var(--critical) / 0.4)",
                        "0 0 20px hsl(var(--critical) / 0.8)",
                        "0 0 8px hsl(var(--critical) / 0.4)"
                    ]
                } : {}}
                transition={status === "critical" ? {
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                } : {}}
                style={{
                    boxShadow: status === "critical" 
                        ? "0 0 15px hsl(var(--critical) / 0.6)"
                        : status === "warning"
                        ? "0 0 10px hsl(var(--warning) / 0.4)"
                        : "0 0 8px hsl(var(--stamina) / 0.3)"
                }}
            >
                <Wrench
                    size={16}
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
        </motion.div>
    );
};
