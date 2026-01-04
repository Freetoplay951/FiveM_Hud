import { motion } from "framer-motion";
import { Bike } from "lucide-react";
import { VehicleState } from "@/types/hud";
import { useTranslation } from "@/contexts/LanguageContext";

interface BicycleHUDProps {
    vehicle: VehicleState;
    visible: boolean;
}

export const BicycleHUD = ({ vehicle, visible }: BicycleHUDProps) => {
    const { t } = useTranslation();
    const maxSpeed = 50;

    const svgCenter = 50;
    const svgRadius = 44;

    const startAngle = -225;
    const sweepAngle = 270;

    const circumference = 2 * Math.PI * svgRadius;
    const arcLength = circumference * (sweepAngle / 360);

    const speedRatio = Math.min(1, vehicle.speed / maxSpeed);
    const progressLength = arcLength * speedRatio;

    const speedTicks = [0, 10, 20, 30, 40, 50];

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
            {/* Speedometer Circle - Same size as VehicleHUD */}
            <div className="relative w-44 h-44">
                {/* Glass Background */}
                <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: `conic-gradient(
                from ${startAngle}deg,
                hsl(var(--stamina) / 0.3) 0deg,
                hsl(var(--primary) / 0.2) ${sweepAngle * speedRatio}deg,
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
                            id="bicycleGradient"
                            x1="0%"
                            y1="100%"
                            x2="100%"
                            y2="0%">
                            <stop
                                offset="0%"
                                stopColor="hsl(var(--stamina))"
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
                        <filter
                            id="bicycleGlow"
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
                        const isMajor = tickSpeed % 10 === 0;
                        const isActive = vehicle.speed >= tickSpeed;

                        return (
                            <g key={tickSpeed}>
                                <line
                                    x1={innerPos.x}
                                    y1={innerPos.y}
                                    x2={outerPos.x}
                                    y2={outerPos.y}
                                    stroke={isActive ? "hsl(var(--stamina))" : "hsl(var(--muted) / 0.3)"}
                                    strokeWidth={isMajor ? 1.5 : 0.8}
                                    strokeLinecap="round"
                                    style={
                                        isActive
                                            ? {
                                                  filter: "drop-shadow(0 0 2px hsl(var(--stamina)))",
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

                    {/* Arc Progress with Effect */}
                    <motion.circle
                        cx={svgCenter}
                        cy={svgCenter}
                        r={svgRadius}
                        fill="none"
                        stroke="url(#bicycleGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        filter="url(#bicycleGlow)"
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
                        KM/H
                    </span>

                    <motion.span
                        className="relative hud-number text-4xl text-foreground leading-none"
                        key={Math.round(vehicle.speed)}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.1 }}
                        style={{ textShadow: "0 0 20px hsl(var(--stamina) / 0.5)" }}>
                        {String(Math.round(vehicle.speed)).padStart(2, "0")}
                    </motion.span>

                    {/* Bike Icon & Status */}
                    <div className="relative flex items-center gap-2 mt-2">
                        <Bike
                            size={14}
                            className="text-stamina"
                            style={{ filter: "drop-shadow(0 0 4px hsl(var(--stamina) / 0.6))" }}
                        />
                        <motion.span
                            className="text-[10px] text-muted-foreground uppercase tracking-wider"
                            animate={{ opacity: vehicle.speed > 0 ? [0.6, 1, 0.6] : 0.5 }}
                            transition={{ duration: 0.8, repeat: vehicle.speed > 0 ? Infinity : 0 }}>
                            {vehicle.speed > 0
                                ? t.vehicle.pedaling.toUpperCase()
                                : t.vehicle.stopped.toUpperCase()}
                        </motion.span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
