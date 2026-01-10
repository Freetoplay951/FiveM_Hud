import { memo, useMemo } from "react";
import { LocationState } from "@/types/hud";
import { MinimapShape } from "@/types/widget";
import { cn } from "@/lib/utils";
import { useRenderLogger } from "@/hooks/useRenderLogger";

interface LocationWidgetProps {
    location: LocationState;
    shape?: MinimapShape;
}

// Static styles defined outside component
const STREET_STYLE = { textShadow: "0 0 8px hsl(var(--primary) / 0.5)" } as const;
const AREA_STYLE = { textShadow: "0 0 4px hsl(var(--primary) / 0.3)" } as const;

const LocationWidgetComponent = ({ location, shape = "square" }: LocationWidgetProps) => {
    // Performance logging
    useRenderLogger("LocationWidget", { street: location.street, area: location.area, shape });
    
    const { street, area } = location;
    const isRound = shape === "round";

    const containerClass = useMemo(
        () => cn(
            "px-3 py-1.5",
            isRound ? "rounded-full" : "rounded-lg",
            "bg-black/70 border border-white/20"
        ),
        [isRound]
    );

    return (
        <div className="relative">
            <div className={containerClass}>
                <div className="text-xs hud-text text-primary truncate max-w-[180px]" style={STREET_STYLE}>
                    {street}
                </div>
                <div className="text-[10px] text-muted-foreground truncate max-w-[180px]" style={AREA_STYLE}>
                    {area}
                </div>
            </div>
        </div>
    );
};

export const LocationWidget = memo(LocationWidgetComponent);
