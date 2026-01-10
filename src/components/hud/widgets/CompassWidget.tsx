import { memo, useMemo } from "react";
import { directions, getDirectionFromDegree } from "@/lib/compassUtils";
import { motion } from "framer-motion";
import { useRenderLogger } from "@/hooks/useRenderLogger";

interface CompassWidgetProps {
    heading: number;
}

// Pre-calculate direction positions (static, computed once)
const DIRECTION_POSITIONS = directions.map((dir, i) => {
    const radius = 30;
    const center = 40;
    const angleDeg = i * 45 - 90;
    const angleRad = angleDeg * (Math.PI / 180);
    return {
        dir,
        x: center + radius * Math.cos(angleRad),
        y: center + radius * Math.sin(angleRad),
        isCardinal: i % 2 === 0,
    };
});

// Static SVG filter - defined once
const CompassFilter = memo(() => (
    <defs>
        <filter id="compassGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
    </defs>
));
CompassFilter.displayName = "CompassFilter";

// Static compass ring
const CompassRing = memo(() => (
    <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted) / 0.2)" strokeWidth="1" />
));
CompassRing.displayName = "CompassRing";

// Static center dot
const CompassCenter = memo(() => (
    <circle
        cx="40"
        cy="40"
        r="4"
        fill="hsl(var(--primary))"
        style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary)))" }}
    />
));
CompassCenter.displayName = "CompassCenter";

// Memoized direction marker
const DirectionMarker = memo(({ 
    dir, 
    x, 
    y, 
    isCardinal, 
    isActive 
}: { 
    dir: string; 
    x: number; 
    y: number; 
    isCardinal: boolean; 
    isActive: boolean;
}) => {
    const style = useMemo(() => ({
        fontSize: isCardinal ? "8px" : "6px",
        fontFamily: "Orbitron, sans-serif",
        fontWeight: isCardinal ? "bold" : "normal",
        filter: isActive ? "drop-shadow(0 0 4px hsl(var(--primary)))" : "none",
    } as const), [isCardinal, isActive]);

    return (
        <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={isActive ? "fill-primary" : "fill-muted-foreground"}
            style={style}>
            {dir}
        </text>
    );
});
DirectionMarker.displayName = "DirectionMarker";

// Static needle styles
const NEEDLE_NORTH_STYLE = { filter: "drop-shadow(0 0 4px hsl(var(--critical)))" } as const;

// Spring config for smooth needle movement
const needleTransition = { type: "spring", stiffness: 100, damping: 20 } as const;

const CompassWidgetComponent = ({ heading }: CompassWidgetProps) => {
    // Performance logging
    useRenderLogger("CompassWidget", { heading });

    const activeDirection = useMemo(() => getDirectionFromDegree(heading), [heading]);

    return (
        <div className="relative w-20 h-20">
            {/* Glass Background */}
            <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: "radial-gradient(circle, transparent 40%, hsl(var(--primary) / 0.05) 100%)",
                    }}
                />
            </div>

            {/* SVG Compass */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80">
                <CompassFilter />
                <CompassRing />

                {/* Direction Markers */}
                {DIRECTION_POSITIONS.map(({ dir, x, y, isCardinal }) => (
                    <DirectionMarker
                        key={dir}
                        dir={dir}
                        x={x}
                        y={y}
                        isCardinal={isCardinal}
                        isActive={activeDirection === dir}
                    />
                ))}

                {/* Compass Needle */}
                <motion.g
                    animate={{ rotate: heading }}
                    transition={needleTransition}
                    style={{ transformOrigin: "40px 40px" }}>
                    {/* North Arrow (Red) */}
                    <polygon
                        points="40,15 37,40 43,40"
                        fill="hsl(var(--critical))"
                        filter="url(#compassGlow)"
                        style={NEEDLE_NORTH_STYLE}
                    />
                    {/* South Arrow (White) */}
                    <polygon
                        points="40,65 37,40 43,40"
                        fill="hsl(var(--foreground))"
                        opacity="0.6"
                    />
                </motion.g>

                <CompassCenter />
            </svg>
        </div>
    );
};

export const CompassWidget = memo(CompassWidgetComponent);
