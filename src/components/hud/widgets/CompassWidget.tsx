import { directions, getDirectionFromDegree } from "@/lib/compassUtils";
import { motion } from "framer-motion";

interface CompassWidgetProps {
    heading: number;
    editMode: boolean;
}

export const CompassWidget = ({ heading, editMode }: CompassWidgetProps) => {
    if (heading == undefined && !editMode) {
        return null;
    }

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
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 80 80">
                <defs>
                    <filter
                        id="compassGlow"
                        x="-50%"
                        y="-50%"
                        width="200%"
                        height="200%">
                        <feGaussianBlur
                            stdDeviation="1"
                            result="coloredBlur"
                        />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Outer Ring */}
                <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="hsl(var(--muted) / 0.2)"
                    strokeWidth="1"
                />

                {/* Direction Markers */}
                {directions.map((dir, i) => {
                    const radius = 30;
                    const center = 40;
                    const angleDeg = i * 45 - 90;
                    const angleRad = angleDeg * (Math.PI / 180);
                    const x = center + radius * Math.cos(angleRad);
                    const y = center + radius * Math.sin(angleRad);
                    const isCardinal = i % 2 === 0;
                    const isActive = getDirectionFromDegree(heading) === dir;

                    return (
                        <text
                            key={dir}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className={isActive ? "fill-primary" : "fill-muted-foreground"}
                            style={{
                                fontSize: isCardinal ? "8px" : "6px",
                                fontFamily: "Orbitron, sans-serif",
                                fontWeight: isCardinal ? "bold" : "normal",
                                filter: isActive ? "drop-shadow(0 0 4px hsl(var(--primary)))" : "none",
                            }}>
                            {dir}
                        </text>
                    );
                })}

                {/* Compass Needle */}
                <motion.g
                    animate={{ rotate: heading }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    style={{ transformOrigin: "40px 40px" }}>
                    {/* North Arrow (Red) */}
                    <polygon
                        points="40,15 37,40 43,40"
                        fill="hsl(var(--critical))"
                        filter="url(#compassGlow)"
                        style={{ filter: "drop-shadow(0 0 4px hsl(var(--critical)))" }}
                    />
                    {/* South Arrow (White) */}
                    <polygon
                        points="40,65 37,40 43,40"
                        fill="hsl(var(--foreground))"
                        opacity="0.6"
                    />
                </motion.g>

                {/* Center Dot */}
                <circle
                    cx="40"
                    cy="40"
                    r="4"
                    fill="hsl(var(--primary))"
                    style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary)))" }}
                />
            </svg>
        </div>
    );
};
