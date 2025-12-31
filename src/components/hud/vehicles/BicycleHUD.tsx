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

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex flex-col items-center">
                    {/* Minimal Bicycle Speedometer */}
                    <div className="relative w-24 h-24">
                        {/* Glass Background */}
                        <div className="absolute inset-0 rounded-full glass-panel overflow-hidden">
                            <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: `conic-gradient(
                                        from -135deg,
                                        hsl(var(--stamina) / 0.3) 0deg,
                                        hsl(var(--primary) / 0.2) ${270 * speedRatio}deg,
                                        transparent ${270 * speedRatio}deg
                                    )`,
                                    filter: "blur(10px)",
                                }}
                            />
                        </div>

                        {/* SVG Speed Ring */}
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
                                        offset="100%"
                                        stopColor="hsl(var(--primary))"
                                    />
                                </linearGradient>
                                <filter
                                    id="bicycleGlow"
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

                            {/* Background Arc */}
                            <circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke="hsl(var(--muted) / 0.1)"
                                strokeWidth="4"
                                strokeDasharray={`${2 * Math.PI * 42 * 0.75} ${2 * Math.PI * 42}`}
                                strokeLinecap="round"
                                transform="rotate(-225 50 50)"
                            />

                            {/* Progress Arc */}
                            <motion.circle
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke="url(#bicycleGradient)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                filter="url(#bicycleGlow)"
                                strokeDasharray={`${2 * Math.PI * 42 * 0.75 * speedRatio} ${2 * Math.PI * 42}`}
                                transform="rotate(-225 50 50)"
                                initial={{ strokeDasharray: `0 ${2 * Math.PI * 42}` }}
                                animate={{
                                    strokeDasharray: `${2 * Math.PI * 42 * 0.75 * speedRatio} ${2 * Math.PI * 42}`,
                                }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                            />
                        </svg>

                        {/* Center Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {/* Dark backdrop */}
                            <div className="absolute inset-[30%] rounded-full bg-background/80" />

                            <Bike
                                size={12}
                                className="relative text-stamina mb-0.5"
                                style={{ filter: "drop-shadow(0 0 4px hsl(var(--stamina) / 0.5))" }}
                            />

                            <motion.span
                                className="relative hud-number text-xl text-foreground leading-none"
                                key={Math.round(vehicle.speed)}
                                initial={{ scale: 1.05 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.1 }}
                                style={{ textShadow: "0 0 12px hsl(var(--stamina) / 0.5)" }}>
                                {Math.round(vehicle.speed)}
                            </motion.span>

                            <span className="relative text-[6px] text-muted-foreground uppercase tracking-wider mt-0.5">
                                KM/H
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
