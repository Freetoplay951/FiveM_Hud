import { motion } from "framer-motion";
import { Navigation2 } from "lucide-react";
import { LocationState } from "@/types/hud";
import { getDirectionFromDegree } from "@/lib/compassUtils";
import { isNuiEnvironment } from "@/hooks/useNuiEvents";

interface NeonMinimapWidgetProps {
    location: LocationState;
}

export const NeonMinimapWidget = ({ location }: NeonMinimapWidgetProps) => {
    const { heading, street, area } = location;
    const isNui = isNuiEnvironment();

    return (
        <div className="relative">
            {/* Location Text Above Minimap */}
            <div
                className={
                    isNui
                        ? "rounded-lg px-3 py-1.5 mb-2 border border-border/50 bg-transparent"
                        : "glass-panel rounded-lg px-3 py-1.5 mb-2"
                }
                style={
                    isNui
                        ? {
                              boxShadow: "0 0 0 2px hsl(var(--background) / 0.65)",
                          }
                        : {
                              boxShadow: "0 0 15px hsl(var(--primary) / 0.15)",
                          }
                }
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

            {/* Minimap */}
            <div className="relative w-44 h-36">
                {/* Frame */}
                <div
                    className={
                        isNui
                            ? "absolute inset-0 rounded-lg overflow-hidden border border-border/60 bg-transparent"
                            : "absolute inset-0 rounded-lg glass-panel overflow-hidden"
                    }
                    style={
                        isNui
                            ? {
                                  // Transparent cutout so the GTA/FiveM radar remains visible underneath.
                                  boxShadow:
                                      "0 0 0 2px hsl(var(--background) / 0.85), 0 0 18px hsl(var(--primary) / 0.12)",
                              }
                            : {
                                  boxShadow:
                                      "0 0 20px hsl(var(--primary) / 0.1), inset 0 0 15px hsl(var(--background) / 0.5)",
                              }
                    }
                >
                    {!isNui && (
                        <>
                            {/* Map Placeholder Grid */}
                            <div
                                className="absolute inset-2 rounded opacity-30"
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
                                viewBox="0 0 176 144"
                            >
                                <path
                                    d="M 0 72 L 176 72"
                                    stroke="hsl(var(--muted-foreground))"
                                    strokeWidth="3"
                                    fill="none"
                                />
                                <path
                                    d="M 88 0 L 88 144"
                                    stroke="hsl(var(--muted-foreground))"
                                    strokeWidth="3"
                                    fill="none"
                                />
                                <path
                                    d="M 44 0 L 44 54 Q 44 72, 60 72 L 116 72 Q 132 72, 132 88 L 132 144"
                                    stroke="hsl(var(--muted-foreground))"
                                    strokeWidth="2"
                                    fill="none"
                                />
                            </svg>

                            {/* Player Marker */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <motion.div
                                    animate={{
                                        rotate: heading,
                                    }}
                                    transition={{ type: "spring", stiffness: 100 }}
                                >
                                    <Navigation2
                                        size={24}
                                        className="text-primary fill-primary"
                                        style={{
                                            filter: "drop-shadow(0 0 8px hsl(var(--primary)))",
                                        }}
                                    />
                                </motion.div>
                            </div>
                        </>
                    )}

                    {isNui && (
                        <div
                            className="absolute inset-2 rounded"
                            style={{
                                background: "transparent",
                                // A subtle outside ring for contrast without covering the map.
                                boxShadow:
                                    "inset 0 0 0 2px hsl(var(--background) / 0.75), inset 0 0 0 3px hsl(var(--primary) / 0.18)",
                            }}
                            aria-hidden="true"
                        />
                    )}
                </div>

                {/* Compass Direction */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                    <div
                        className={
                            isNui
                                ? "rounded px-2 py-0.5 flex items-center gap-1 border border-border/50 bg-transparent"
                                : "glass-panel rounded px-2 py-0.5 flex items-center gap-1"
                        }
                        style={
                            isNui
                                ? {
                                      boxShadow: "0 0 0 2px hsl(var(--background) / 0.65)",
                                  }
                                : {
                                      boxShadow: "0 0 10px hsl(var(--background) / 0.5)",
                                  }
                        }
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
