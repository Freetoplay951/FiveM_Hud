import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

type BodyHealthStatus = "good" | "warning" | "critical";

const getBodyHealthStatus = (bodyHealth: number): BodyHealthStatus => {
    if (bodyHealth < 40) return "critical";
    if (bodyHealth < 70) return "warning";
    return "good";
};

interface BodyHealthIndicatorProps {
    bodyHealth: number;
}

export const BodyHealthIndicator = ({ bodyHealth }: BodyHealthIndicatorProps) => {
    const status = getBodyHealthStatus(bodyHealth);

    const colors = {
        good: { text: "text-green-500", shadow: "0 0 3px rgb(34,197,94)" },
        warning: { text: "text-yellow-400", shadow: "0 0 4px rgb(250,204,21)" },
        critical: { text: "text-red-600", shadow: "0 0 6px rgb(220,38,38)" },
    };

    return (
        <div
            className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full",
                status === "critical" && "animate-pulse"
            )}>
            <Wrench
                size={14}
                className={cn("transition-colors duration-300", colors[status].text)}
                style={{
                    filter: `drop-shadow(${colors[status].shadow})`,
                }}
            />
        </div>
    );
};
