import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Navigation2 } from "lucide-react";
import { MinimapShape } from "@/types/widget";

interface MinimapWidgetProps {
    shape?: MinimapShape;
}

export const MinimapWidget = ({ shape = "square" }: MinimapWidgetProps) => {
    const isRound = shape === "round";

    // GTA Default Minimap Größen (relativ)
    const mapWidthRel = 0.15;
    const mapHeightRel = 0.188;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const widthPx = viewportWidth * mapWidthRel;
    const heightPx = viewportHeight * mapHeightRel;

    // Rund = quadratisch
    const size = isRound ? Math.min(widthPx, heightPx) : null;

    return (
        <div className="relative">
            {/* Minimap Container */}
            <div
                className="relative overflow-hidden"
                style={{
                    width: isRound ? `${size}px` : `${widthPx}px`,
                    height: isRound ? `${size}px` : `${heightPx}px`,
                }}>
                <div
                    className={cn(
                        "absolute inset-0 overflow-hidden",
                        isRound ? "rounded-full" : "rounded-lg",
                        "border-2 border-white/30"
                    )}
                    style={{
                        boxShadow: "0 0 20px hsl(var(--primary) / 0.1), inset 0 0 15px hsl(var(--background) / 0.5)",
                    }}>
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
                        viewBox={isRound ? "0 0 160 160" : "0 0 176 144"}>
                        {isRound ? (
                            <>
                                <path
                                    d="M 0 80 L 160 80"
                                    stroke="hsl(var(--muted-foreground))"
                                    strokeWidth="3"
                                    fill="none"
                                />
                                <path
                                    d="M 80 0 L 80 160"
                                    stroke="hsl(var(--muted-foreground))"
                                    strokeWidth="3"
                                    fill="none"
                                />
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="50"
                                    stroke="hsl(var(--muted-foreground))"
                                    strokeWidth="2"
                                    fill="none"
                                />
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
                    </svg>

                    {/* Player Marker */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <motion.div
                            animate={{ rotate: 0 }}
                            transition={{ type: "spring", stiffness: 100 }}>
                            <Navigation2
                                size={24}
                                className="text-primary fill-primary"
                                style={{ filter: "drop-shadow(0 0 8px hsl(var(--primary)))" }}
                            />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};
