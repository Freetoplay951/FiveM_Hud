import { motion, AnimatePresence } from "framer-motion";
import { Bike } from "lucide-react";
import { VehicleState } from "@/types/hud";

interface BicycleHUDProps {
    vehicle: VehicleState;
    visible: boolean;
}

export const BicycleHUD = ({ vehicle, visible }: BicycleHUDProps) => {
    const maxSpeed = 50; // Bicycles are much slower
    const speedRatio = Math.min(1, vehicle.speed / maxSpeed);
    
    // Generate tick marks for the speedometer
    const ticks = [];
    for (let i = 0; i <= 10; i++) {
        const angle = -135 + (i * 27); // 270 degrees / 10 ticks = 27 degrees per tick
        const isMajor = i % 2 === 0;
        ticks.push({ angle, isMajor, value: i * 5 });
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex flex-col items-center">
                    {/* Bicycle Speedometer - Same size as MotorcycleHUD */}
                    <div className="relative w-36 h-36">
                        {/* Outer glow ring */}
                        <div 
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: `conic-gradient(
                                    from -135deg,
                                    hsl(var(--stamina) / 0.4) 0deg,
                                    hsl(var(--primary) / 0.3) ${270 * speedRatio}deg,
                                    transparent ${270 * speedRatio}deg
                                )`,
                                filter: "blur(12px)",
                            }}
                        />

                        {/* Glass Background */}
                        <div className="absolute inset-1 rounded-full glass-panel overflow-hidden border border-border/20">
                            <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/40 to-background/60" />
                        </div>

                        {/* SVG Speed Ring */}
                        <svg
                            className="absolute inset-0 w-full h-full"
                            viewBox="0 0 144 144">
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
                                        stdDeviation="2"
                                        result="coloredBlur"
                                    />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Background Arc */}
                            <circle
                                cx="72"
                                cy="72"
                                r="60"
                                fill="none"
                                stroke="hsl(var(--muted) / 0.15)"
                                strokeWidth="6"
                                strokeDasharray={`${2 * Math.PI * 60 * 0.75} ${2 * Math.PI * 60}`}
                                strokeLinecap="round"
                                transform="rotate(-225 72 72)"
                            />

                            {/* Tick Marks */}
                            {ticks.map((tick, index) => {
                                const radians = (tick.angle * Math.PI) / 180;
                                const innerRadius = tick.isMajor ? 48 : 52;
                                const outerRadius = 58;
                                const x1 = 72 + innerRadius * Math.cos(radians);
                                const y1 = 72 + innerRadius * Math.sin(radians);
                                const x2 = 72 + outerRadius * Math.cos(radians);
                                const y2 = 72 + outerRadius * Math.sin(radians);
                                
                                // Label position for major ticks
                                const labelRadius = 40;
                                const labelX = 72 + labelRadius * Math.cos(radians);
                                const labelY = 72 + labelRadius * Math.sin(radians);
                                
                                return (
                                    <g key={index}>
                                        <line
                                            x1={x1}
                                            y1={y1}
                                            x2={x2}
                                            y2={y2}
                                            stroke={tick.isMajor ? "hsl(var(--foreground) / 0.4)" : "hsl(var(--muted-foreground) / 0.2)"}
                                            strokeWidth={tick.isMajor ? 2 : 1}
                                            strokeLinecap="round"
                                        />
                                        {tick.isMajor && (
                                            <text
                                                x={labelX}
                                                y={labelY}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                className="fill-muted-foreground/60"
                                                style={{ fontSize: "8px", fontWeight: 500 }}>
                                                {tick.value}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}

                            {/* Progress Arc */}
                            <motion.circle
                                cx="72"
                                cy="72"
                                r="60"
                                fill="none"
                                stroke="url(#bicycleGradient)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                filter="url(#bicycleGlow)"
                                strokeDasharray={`${2 * Math.PI * 60 * 0.75 * speedRatio} ${2 * Math.PI * 60}`}
                                transform="rotate(-225 72 72)"
                                initial={{ strokeDasharray: `0 ${2 * Math.PI * 60}` }}
                                animate={{
                                    strokeDasharray: `${2 * Math.PI * 60 * 0.75 * speedRatio} ${2 * Math.PI * 60}`,
                                }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                            />

                            {/* Inner decorative ring */}
                            <circle
                                cx="72"
                                cy="72"
                                r="32"
                                fill="none"
                                stroke="hsl(var(--border) / 0.3)"
                                strokeWidth="1"
                            />
                        </svg>

                        {/* Center Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {/* Dark backdrop */}
                            <div 
                                className="absolute inset-[28%] rounded-full bg-background/90 border border-border/30"
                                style={{ boxShadow: "inset 0 2px 10px hsl(var(--background) / 0.5)" }}
                            />

                            {/* Bike Icon */}
                            <Bike
                                size={16}
                                className="relative text-stamina mb-1"
                                style={{ filter: "drop-shadow(0 0 6px hsl(var(--stamina) / 0.6))" }}
                            />

                            {/* Speed Display */}
                            <motion.span
                                className="relative hud-number text-2xl text-foreground leading-none font-bold"
                                key={Math.round(vehicle.speed)}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.1 }}
                                style={{ textShadow: "0 0 15px hsl(var(--stamina) / 0.6)" }}>
                                {Math.round(vehicle.speed)}
                            </motion.span>

                            {/* Unit */}
                            <span className="relative text-[8px] text-muted-foreground uppercase tracking-widest mt-0.5">
                                KM/H
                            </span>
                        </div>

                        {/* Pedaling indicator (optional decorative element) */}
                        <motion.div
                            className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1"
                            animate={{ opacity: vehicle.speed > 0 ? [0.5, 1, 0.5] : 0.3 }}
                            transition={{ duration: 0.5, repeat: vehicle.speed > 0 ? Infinity : 0 }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-stamina/60" />
                            <span className="text-[7px] text-muted-foreground uppercase tracking-wider">
                                {vehicle.speed > 0 ? "Pedaling" : "Stopped"}
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-stamina/60" />
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
