import { motion, AnimatePresence } from "framer-motion";
import { Fuel, Thermometer } from "lucide-react";
import { VehicleState } from "@/types/hud";
import { cn } from "@/lib/utils";

interface VehicleHUDProps {
    vehicle: VehicleState;
    visible: boolean;
}

export const VehicleHUD = ({ vehicle, visible }: VehicleHUDProps) => {
    const maxSpeed = 300;

    /* =======================
     SVG / ARC CONFIG
  ======================= */
    const svgCenter = 50;
    const svgRadius = 44;

    const startAngle = -225;
    const sweepAngle = 270;

    const circumference = 2 * Math.PI * svgRadius;
    const arcLength = circumference * (sweepAngle / 360);

    const speedRatio = Math.min(1, vehicle.speed / maxSpeed);
    const progressLength = arcLength * speedRatio;

    const fuelWarning = vehicle.fuel <= 25;
    const fuelCritical = vehicle.fuel <= 10;

    // Speed tick marks (every 20 km/h)
    const speedTicks = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300];

    // Calculate position for each tick on a 270-degree arc starting from bottom-left
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
                    className="flex items-end gap-3">
                    {/* Fuel Bar - Vertical on Left */}
                    <motion.div
                        className="flex flex-col items-center gap-1"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}>
                        <div className="relative w-3 h-24 rounded-full glass-panel overflow-hidden">
                            {/* Fuel Fill */}
                            <motion.div
                                className={cn(
                                    "absolute bottom-0 left-0 right-0 rounded-full",
                                    fuelCritical ? "bg-critical" : fuelWarning ? "bg-warning" : "bg-stamina"
                                )}
                                initial={{ height: 0 }}
                                animate={{ height: `${vehicle.fuel}%` }}
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
                        <div className="flex items-center gap-0.5">
                            <Fuel
                                size={10}
                                className={cn(
                                    fuelCritical ? "text-critical" : fuelWarning ? "text-warning" : "text-stamina"
                                )}
                            />
                            <span
                                className={cn(
                                    "text-[9px] hud-number",
                                    fuelCritical
                                        ? "text-critical"
                                        : fuelWarning
                                        ? "text-warning"
                                        : "text-muted-foreground"
                                )}>
                                {Math.round(vehicle.fuel)}L
                            </span>
                        </div>
                    </motion.div>

                    {/* Speedometer Circle */}
                    <div className="relative w-44 h-44">
                        {/* Glass Background */}
                        <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
                            {/* Neon glow effect */}
                            <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: `conic-gradient(
                    from ${startAngle}deg,
                    hsl(var(--primary) / 0.3) 0deg,
                    hsl(var(--stamina) / 0.2) ${sweepAngle * speedRatio}deg,
                    transparent ${sweepAngle * speedRatio}deg
                    )`,
                                    filter: "blur(15px)",
                                }}
                            />
                        </div>

                        {/* SVG Speedometer */}
                        <svg
                            className="absolute inset-0 w-full h-full"
                            viewBox="0 0 100 100">
                            <defs>
                                <linearGradient
                                    id="speedNeonGradient"
                                    x1="0%"
                                    y1="100%"
                                    x2="100%"
                                    y2="0%">
                                    <stop
                                        offset="0%"
                                        stopColor="hsl(var(--primary))"
                                    />
                                    <stop
                                        offset="40%"
                                        stopColor="hsl(var(--stamina))"
                                    />
                                    <stop
                                        offset="70%"
                                        stopColor="hsl(var(--warning))"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="hsl(var(--critical))"
                                    />
                                </linearGradient>
                                <filter
                                    id="neonGlow"
                                    x="-50%"
                                    y="-50%"
                                    width="200%"
                                    height="200%">
                                    <feGaussianBlur
                                        stdDeviation="1.5"
                                        result="coloredBlur"
                                    />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Tick marks and labels */}
                            {speedTicks.map((tickSpeed) => {
                                const outerPos = getTickPosition(tickSpeed, svgRadius);
                                const innerPos = getTickPosition(tickSpeed, svgRadius - 6);
                                const labelPos = getTickPosition(tickSpeed, svgRadius - 12);
                                const isMajor = tickSpeed % 40 === 0;
                                const isActive = vehicle.speed >= tickSpeed;

                                return (
                                    <g key={tickSpeed}>
                                        {/* Tick line */}
                                        <line
                                            x1={innerPos.x}
                                            y1={innerPos.y}
                                            x2={outerPos.x}
                                            y2={outerPos.y}
                                            stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--muted) / 0.3)"}
                                            strokeWidth={isMajor ? 1.5 : 0.8}
                                            strokeLinecap="round"
                                            style={
                                                isActive
                                                    ? {
                                                          filter: "drop-shadow(0 0 2px hsl(var(--primary)))",
                                                      }
                                                    : {}
                                            }
                                        />
                                        {/* Speed label for major ticks */}
                                        {isMajor && (
                                            <text
                                                x={labelPos.x}
                                                y={labelPos.y}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="fill-muted-foreground"
                                                style={{
                                                    fontSize: "4px",
                                                    fontFamily: "Orbitron, sans-serif",
                                                    opacity: isActive ? 1 : 0.4,
                                                }}>
                                                {tickSpeed}
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
                                strokeLinecap="round"
                                transform={`rotate(${startAngle} ${svgCenter} ${svgCenter})`}
                            />

                            {/* Arc Progress with Neon Effect */}
                            <motion.circle
                                cx={svgCenter}
                                cy={svgCenter}
                                r={svgRadius}
                                fill="none"
                                stroke="url(#speedNeonGradient)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                filter="url(#neonGlow)"
                                strokeDasharray={`${progressLength} ${circumference}`}
                                transform={`rotate(${startAngle} ${svgCenter} ${svgCenter})`}
                                initial={{ strokeDasharray: `0 ${circumference}` }}
                                animate={{
                                    strokeDasharray: `${progressLength} ${circumference}`,
                                }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                            />
                        </svg>

                        {/* Center Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                            {/* KM/H Label */}
                            <span className="text-[8px] text-muted-foreground uppercase tracking-wider mb-1">KM/H</span>

                            {/* Speed Number */}
                            <motion.span
                                className="hud-number text-4xl text-foreground leading-none"
                                key={Math.round(vehicle.speed)}
                                initial={{ scale: 1.05 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.1 }}
                                style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.5)" }}>
                                {String(Math.round(vehicle.speed)).padStart(3, "0")}
                            </motion.span>

                            {/* Gear & Engine Status */}
                            <div className="flex items-center gap-3 mt-2">
                                {/* Engine Temp Icon */}
                                <Thermometer
                                    size={12}
                                    className="text-muted-foreground"
                                />

                                {/* Gear */}
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-muted-foreground">GEAR</span>
                                    <span
                                        className="hud-number text-lg text-primary leading-none"
                                        style={{ textShadow: "0 0 10px hsl(var(--primary) / 0.6)" }}>
                                        {vehicle.gear === 0 ? "R" : vehicle.gear}
                                    </span>
                                </div>

                                {/* Fuel Icon */}
                                <Fuel
                                    size={12}
                                    className={cn(
                                        fuelCritical
                                            ? "text-critical critical-pulse"
                                            : fuelWarning
                                            ? "text-warning warning-pulse"
                                            : "text-muted-foreground"
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
