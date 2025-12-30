import { motion, AnimatePresence } from "framer-motion";
import { Fuel, Anchor, Navigation, Waves } from "lucide-react";
import { VehicleState } from "@/types/hud";
import { cn } from "@/lib/utils";
import { getDirectionFromDegree } from "@/lib/compassUtils";

interface BoatHUDProps {
    vehicle: VehicleState;
    visible: boolean;
}

export const BoatHUD = ({ vehicle, visible }: BoatHUDProps) => {
    const speed = vehicle.speed;
    const heading = vehicle.heading || 0;
    const anchor = vehicle.anchor || false;

    const maxSpeed = 160;

    const svgCenter = 50;
    const svgRadius = 44;

    const startAngle = -225;
    const sweepAngle = 270;

    const circumference = 2 * Math.PI * svgRadius;
    const arcLength = circumference * (sweepAngle / 360);

    const speedRatio = Math.min(1, speed / maxSpeed);
    const progressLength = arcLength * speedRatio;

    const fuelWarning = vehicle.fuel <= 25;
    const fuelCritical = vehicle.fuel <= 10;

    const speedTicks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160];

    const getTickPosition = (tickSpeed: number, radius: number) => {
        const percentage = tickSpeed / maxSpeed;
        const angle = startAngle + percentage * sweepAngle;
        const radians = (angle * Math.PI) / 180;

        return {
            x: svgCenter + radius * Math.cos(radians),
            y: svgCenter + radius * Math.sin(radians),
        };
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex flex-col items-center">
                    {/* Speedometer */}
                    <div className="relative w-44 h-44">
                        {/* Glow */}
                        <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
                            <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: `conic-gradient(
                    from ${startAngle}deg,
                    hsl(var(--thirst) / 0.3) 0deg,
                    hsl(var(--primary) / 0.2) ${sweepAngle * speedRatio}deg,
                    transparent ${sweepAngle * speedRatio}deg
                  )`,
                                    filter: "blur(15px)",
                                }}
                            />
                        </div>

                        <svg
                            className="absolute inset-0 w-full h-full"
                            viewBox="0 0 100 100">
                            <defs>
                                <linearGradient
                                    id="boatSpeedGradient"
                                    x1="0%"
                                    y1="100%"
                                    x2="100%"
                                    y2="0%">
                                    <stop
                                        offset="0%"
                                        stopColor="hsl(var(--thirst))"
                                    />
                                    <stop
                                        offset="50%"
                                        stopColor="hsl(var(--primary))"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="hsl(var(--stamina))"
                                    />
                                </linearGradient>
                                <filter id="boatNeonGlow">
                                    <feGaussianBlur
                                        stdDeviation="1.5"
                                        result="blur"
                                    />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Ticks */}
                            {speedTicks.map((s) => {
                                const outer = getTickPosition(s, svgRadius);
                                const inner = getTickPosition(s, svgRadius - 6);
                                const label = getTickPosition(s, svgRadius - 12);

                                const isMajor = s % 20 === 0;
                                const isActive = speed >= s;

                                return (
                                    <g key={s}>
                                        <line
                                            x1={inner.x}
                                            y1={inner.y}
                                            x2={outer.x}
                                            y2={outer.y}
                                            stroke={isActive ? "hsl(var(--thirst))" : "hsl(var(--muted) / 0.3)"}
                                            strokeWidth={isMajor ? 1.5 : 0.8}
                                            strokeLinecap="round"
                                        />
                                        {isMajor && (
                                            <text
                                                x={label.x}
                                                y={label.y}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="fill-muted-foreground"
                                                style={{ fontSize: "4px", opacity: isActive ? 1 : 0.4 }}>
                                                {s}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}

                            {/* Arc Background */}
                            <circle
                                cx={svgCenter}
                                cy={svgCenter}
                                r={svgRadius}
                                fill="none"
                                stroke="hsl(var(--muted) / 0.1)"
                                strokeWidth="3"
                                strokeDasharray={`${arcLength} ${circumference}`}
                                transform={`rotate(${startAngle} ${svgCenter} ${svgCenter})`}
                                strokeLinecap="round"
                            />

                            {/* Arc Progress */}
                            <motion.circle
                                cx={svgCenter}
                                cy={svgCenter}
                                r={svgRadius}
                                fill="none"
                                stroke="url(#boatSpeedGradient)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                filter="url(#boatNeonGlow)"
                                strokeDasharray={`${progressLength} ${circumference}`}
                                transform={`rotate(${startAngle} ${svgCenter} ${svgCenter})`}
                                initial={{ strokeDasharray: `0 ${circumference}` }}
                                animate={{
                                    strokeDasharray: `${progressLength} ${circumference}`,
                                }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                            />

                            <Waves
                                x={42}
                                y={70}
                                width={16}
                                height={16}
                                className="text-thirst"
                                style={{ opacity: 0.3 }}
                            />
                        </svg>

                        {/* Center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                            <span className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">
                                KNOTS
                            </span>

                            <motion.span
                                className="hud-number text-4xl text-foreground leading-none tabular-nums"
                                style={{
                                    textShadow: "0 0 20px hsl(var(--thirst) / 0.5)",
                                    minWidth: "3ch",
                                    textAlign: "center",
                                }}
                                animate={{ scale: [1, 1.03, 1] }}
                                transition={{ duration: 0.15 }}
                                key={Math.round(speed)}>
                                {String(Math.round(speed)).padStart(3, "0")}
                            </motion.span>

                            {/* Heading & Anchor Status */}
                            <div className="flex items-center gap-2 mt-2 min-w-[100px] justify-center">
                                <Navigation
                                    size={12}
                                    className="text-primary flex-shrink-0"
                                    style={{
                                        transform: `rotate(${heading}deg)`,
                                        filter: "drop-shadow(0 0 4px hsl(var(--primary)))",
                                        transition: "transform 0.15s ease-out",
                                    }}
                                />
                                <span className="hud-number text-sm text-primary tabular-nums min-w-[60px] text-center">
                                    {getDirectionFromDegree(heading)} {String(Math.round(heading)).padStart(3, "0")}°
                                </span>
                                <Anchor
                                    size={12}
                                    className={cn(
                                        anchor ? "text-warning flex-shrink-0" : "text-muted-foreground flex-shrink-0"
                                    )}
                                    style={anchor ? { filter: "drop-shadow(0 0 4px hsl(var(--warning)))" } : {}}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fuel Bar - Horizontal below speedometer */}
                    <motion.div
                        className="flex items-center gap-2 mt-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}>
                        <Fuel
                            size={12}
                            className={cn(
                                fuelCritical
                                    ? "text-critical critical-pulse"
                                    : fuelWarning
                                    ? "text-warning warning-pulse"
                                    : "text-stamina"
                            )}
                        />
                        <div className="relative w-24 h-2 rounded-full glass-panel overflow-hidden">
                            <motion.div
                                className={cn(
                                    "absolute top-0 left-0 bottom-0 rounded-full",
                                    fuelCritical ? "bg-critical" : fuelWarning ? "bg-warning" : "bg-stamina"
                                )}
                                initial={{ width: 0 }}
                                animate={{ width: `${vehicle.fuel}%` }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    boxShadow: fuelCritical
                                        ? "0 0 12px hsl(var(--critical)), inset 0 0 8px hsl(var(--critical) / 0.5)"
                                        : fuelWarning
                                        ? "0 0 10px hsl(var(--warning))"
                                        : "0 0 8px hsl(var(--stamina) / 0.6)",
                                }}
                            />
                        </div>
                        <span
                            className={cn(
                                "text-[10px] hud-number tabular-nums min-w-[28px] text-right",
                                fuelCritical ? "text-critical" : fuelWarning ? "text-warning" : "text-muted-foreground"
                            )}>
                            {Math.round(vehicle.fuel)}%
                        </span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
