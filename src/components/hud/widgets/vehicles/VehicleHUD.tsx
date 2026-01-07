import { motion } from "framer-motion";
import { Fuel, Thermometer } from "lucide-react";
import { VehicleState } from "@/types/hud";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";
import { BodyHealthIndicator } from "./BodyHealthIndicator";

interface VehicleHUDProps {
    vehicle: VehicleState;
    visible: boolean;
}

export const VehicleHUD = ({ vehicle, visible }: VehicleHUDProps) => {
    const { t } = useTranslation();
    const maxSpeed = 300;

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

    const speedTicks = [0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300];

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
        <motion.div
            initial={false}
            animate={{ 
                opacity: visible ? 1 : 0, 
                scale: visible ? 1 : 0.8 
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center">
            {/* Speedometer Circle */}
            <div className="relative w-44 h-44">
                {/* Glass Background */}
                <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
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
                            id="speedGradient"
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
                            id="glow"
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

                    {/* Arc Progress */}
                    <motion.circle
                        cx={svgCenter}
                        cy={svgCenter}
                        r={svgRadius}
                        fill="none"
                        stroke="url(#speedGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        filter="url(#glow)"
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
                    {/* Dark backdrop for better text readability */}
                    <div className="absolute inset-[25%] rounded-full bg-background/80" />

                    <span className="relative text-[8px] text-muted-foreground uppercase tracking-wider mb-1">
                        {t.vehicle.kmh}
                    </span>

                    <motion.span
                        className="relative hud-number text-4xl text-foreground leading-none"
                        key={Math.round(vehicle.speed)}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.1 }}
                        style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.5)" }}>
                        {String(Math.round(vehicle.speed)).padStart(3, "0")}
                    </motion.span>

                    {/* Gear Display */}
                    <div className="relative flex items-center gap-1 mt-2">
                        <span className="text-[10px] text-muted-foreground">
                            {t.vehicle.gear.toUpperCase()}
                        </span>
                        <span
                            className="hud-number text-lg text-primary leading-none"
                            style={{ textShadow: "0 0 10px hsl(var(--primary) / 0.6)" }}>
                            {vehicle.gear === 0 ? "R" : vehicle.gear}
                        </span>
                    </div>
                </div>

                {/* Body Health Indicator - On the arc, bottom center */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                    {vehicle.bodyHealth !== undefined ? (
                        <BodyHealthIndicator bodyHealth={vehicle.bodyHealth} />
                    ) : (
                        <Thermometer
                            size={12}
                            className="text-muted-foreground"
                        />
                    )}
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
                        "text-[10px] hud-number",
                        fuelCritical ? "text-critical" : fuelWarning ? "text-warning" : "text-muted-foreground"
                    )}>
                    {Math.round(vehicle.fuel)}%
                </span>
            </motion.div>
        </motion.div>
    );
};
