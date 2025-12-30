import { motion } from "framer-motion";
import { Navigation2 } from "lucide-react";
import { LocationState } from "@/types/hud";
import { MinimapShape } from "@/types/widget";
import { getDirectionFromDegree } from "@/lib/compassUtils";
import { isNuiEnvironment } from "@/hooks/useNuiEvents";
import { cn } from "@/lib/utils";

interface NeonMinimapWidgetProps {
    location: LocationState;
    shape?: MinimapShape;
}

export const NeonMinimapWidget = ({ location, shape = "square" }: NeonMinimapWidgetProps) => {
    const { heading, street, area } = location;
    const isNui = isNuiEnvironment();
    const isRound = shape === "round";

    return (
        <div className="relative">
            {/* Location Text Above Minimap */}
            <div
                className={cn(
                    "px-3 py-1.5 mb-2",
                    isRound ? "rounded-full" : "rounded-lg",
                    "bg-black/70 backdrop-blur-sm border border-white/20"
                )}
            >
                <div
                    className="text-xs hud-text text-primary truncate max-w-[180px]"
                    style={{ textShadow: "0 0 8px hsl(var(--primary) / 0.5)" }}
                >
                    {street}
                </div>
                <div
                    className="text-[10px] text-muted-foreground truncate max-w-[180px]"
                    style={{ textShadow: "0 0 4px hsl(var(--primary) / 0.3)" }}
                >
                    {area}
                </div>
            </div>

            {/* Minimap Container */}
            <div className={cn("relative", isRound ? "w-40 h-40" : "w-44 h-36")}>
                {/* 
                    In FiveM/NUI: This is just a decorative frame - the actual GTA radar 
                    renders BEHIND this element. We make it completely transparent in the center.
                    
                    In Demo mode: We show a placeholder map with fake roads.
                */}
                <div
                    className={cn(
                        "absolute inset-0 overflow-hidden",
                        isRound ? "rounded-full" : "rounded-lg",
                        // Only show border frame, center is transparent for GTA radar
                        "border-2 border-white/30"
                    )}
                    style={{
                        // Transparent background - GTA radar shows through
                        background: isNui ? "transparent" : undefined,
                        boxShadow: isNui 
                            ? "0 0 15px hsl(var(--primary) / 0.2), inset 0 0 0 1px hsl(var(--primary) / 0.1)"
                            : "0 0 20px hsl(var(--primary) / 0.1), inset 0 0 15px hsl(var(--background) / 0.5)",
                    }}
                >
                    {/* Demo Mode Only - Placeholder Map */}
                    {!isNui && (
                        <>
                            {/* Dark background for demo */}
                            <div className="absolute inset-0 bg-background/90" />
                            
                            {/* Map Grid */}
                            <div
                                className={cn("absolute inset-2 opacity-30", isRound ? "rounded-full" : "rounded")}
                                style={{
                                    backgroundImage: `
                                        linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                                        linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
                                    `,
                                    backgroundSize: "20px 20px",
                                }}
                            />

                            {/* Fake Roads */}
                            <svg
                                className="absolute inset-0 w-full h-full opacity-40"
                                viewBox={isRound ? "0 0 160 160" : "0 0 176 144"}
                            >
                                {isRound ? (
                                    <>
                                        <path d="M 0 80 L 160 80" stroke="hsl(var(--muted-foreground))" strokeWidth="3" fill="none" />
                                        <path d="M 80 0 L 80 160" stroke="hsl(var(--muted-foreground))" strokeWidth="3" fill="none" />
                                        <circle cx="80" cy="80" r="50" stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="none" />
                                    </>
                                ) : (
                                    <>
                                        <path d="M 0 72 L 176 72" stroke="hsl(var(--muted-foreground))" strokeWidth="3" fill="none" />
                                        <path d="M 88 0 L 88 144" stroke="hsl(var(--muted-foreground))" strokeWidth="3" fill="none" />
                                        <path d="M 44 0 L 44 54 Q 44 72, 60 72 L 116 72 Q 132 72, 132 88 L 132 144" stroke="hsl(var(--muted-foreground))" strokeWidth="2" fill="none" />
                                    </>
                                )}
                            </svg>

                            {/* Player Marker */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <motion.div
                                    animate={{ rotate: heading }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                >
                                    <Navigation2
                                        size={24}
                                        className="text-primary fill-primary"
                                        style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary)))" }}
                                    />
                                </motion.div>
                            </div>
                        </>
                    )}
                </div>

                {/* Compass Direction Badge */}
                <div className={cn("absolute left-1/2 -translate-x-1/2", isRound ? "-bottom-2" : "-bottom-1")}>
                    <div
                        className={cn(
                            "px-2 py-0.5 flex items-center gap-1",
                            isRound ? "rounded-full" : "rounded",
                            "bg-black/70 backdrop-blur-sm border border-white/20"
                        )}
                    >
                        <span
                            className="hud-number text-xs text-primary"
                            style={{ textShadow: "0 0 6px hsl(var(--primary) / 0.5)" }}
                        >
                            {getDirectionFromDegree(heading)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
