import { LocationState } from "@/types/hud";
import { MinimapShape } from "@/types/widget";
import { cn } from "@/lib/utils";

interface LocationWidgetProps {
    location: LocationState;
    shape?: MinimapShape;
}

export const LocationWidget = ({ location, shape = "square" }: LocationWidgetProps) => {
    const { street, area } = location;
    const isRound = shape === "round";

    return (
        <div className="relative">
            <div
                className={cn(
                    "px-3 py-1.5",
                    isRound ? "rounded-full" : "rounded-lg",
                    "bg-black/70 border border-white/20"
                )}>
                <div
                    className="text-xs hud-text text-primary truncate max-w-[180px]"
                    style={{ textShadow: "0 0 8px hsl(var(--primary) / 0.5)" }}>
                    {street}
                </div>
                <div
                    className="text-[10px] text-muted-foreground truncate max-w-[180px]"
                    style={{ textShadow: "0 0 4px hsl(var(--primary) / 0.3)" }}>
                    {area}
                </div>
            </div>
        </div>
    );
};
