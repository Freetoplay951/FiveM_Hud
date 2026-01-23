import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { VehicleHealthStatus } from "@/types/hud";

interface BodyHealthIndicatorProps {
    status: VehicleHealthStatus;
}

export const BodyHealthIndicator = ({ status }: BodyHealthIndicatorProps) => {
    const colors: Record<VehicleHealthStatus, { text: string; shadowVar: string }> = {
        good: { text: "text-stamina", shadowVar: "stamina" },
        warning: { text: "text-warning", shadowVar: "warning" },
        critical: { text: "text-critical", shadowVar: "critical" },
    };

    return (
        <div
            className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full",
                status === "critical" && "animate-pulse",
            )}>
            <Wrench
                size={14}
                className={cn("transition-colors duration-300", colors[status].text)}
                style={{
                    filter: `drop-shadow(0 0 4px hsl(var(--${colors[status].shadowVar})))`,
                }}
            />
        </div>
    );
};
