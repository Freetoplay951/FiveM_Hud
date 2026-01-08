import { motion } from "framer-motion";
import { VehicleState } from "@/types/hud";
import { cn } from "@/lib/utils";

interface HeliBaseWidgetProps {
    vehicle: VehicleState;
    visible: boolean;
}

export const HeliBaseWidget = ({ vehicle, visible }: HeliBaseWidgetProps) => {
    const pitch = vehicle.pitch || 0;
    const roll = vehicle.roll || 0;

    return (
        <motion.div
            initial={false}
            animate={{
                opacity: visible ? 1 : 0,
                scale: visible ? 1 : 0.8,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center">
            {/* Main Attitude Indicator */}
            <div className="relative w-44 h-44">
                <div className="absolute inset-0 rounded-full glass-panel overflow-hidden" />

                <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 100 100">
                    <defs>
                        <clipPath id="heliHorizonClip">
                            <circle
                                cx="50"
                                cy="50"
                                r="40"
                            />
                        </clipPath>
                        <linearGradient
                            id="heliSkyGradient"
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%">
                            <stop
                                offset="0%"
                                stopColor="hsl(210 70% 25%)"
                            />
                            <stop
                                offset="50%"
                                stopColor="hsl(210 50% 45%)"
                            />
                        </linearGradient>
                        <linearGradient
                            id="heliGroundGradient"
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%">
                            <stop
                                offset="50%"
                                stopColor="hsl(25 45% 25%)"
                            />
                            <stop
                                offset="100%"
                                stopColor="hsl(25 35% 15%)"
                            />
                        </linearGradient>
                        <filter
                            id="heliGlow"
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

                    <g clipPath="url(#heliHorizonClip)">
                        <motion.g
                            animate={{
                                rotate: -roll,
                                y: pitch * 0.6,
                            }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            style={{ transformOrigin: "50px 50px" }}>
                            <rect
                                x="-50"
                                y="-50"
                                width="200"
                                height="100"
                                fill="url(#heliSkyGradient)"
                            />
                            <rect
                                x="-50"
                                y="50"
                                width="200"
                                height="100"
                                fill="url(#heliGroundGradient)"
                            />
                            <line
                                x1="-50"
                                y1="50"
                                x2="150"
                                y2="50"
                                stroke="hsl(var(--primary))"
                                strokeWidth="1.5"
                                filter="url(#heliGlow)"
                            />

                            {/* Pitch ladder */}
                            {[-30, -20, -10, 10, 20, 30].map((p) => (
                                <g
                                    key={p}
                                    transform={`translate(0, ${-p * 1.5})`}>
                                    <line
                                        x1="30"
                                        y1="50"
                                        x2="42"
                                        y2="50"
                                        stroke="hsl(var(--foreground) / 0.6)"
                                        strokeWidth="0.5"
                                    />
                                    <line
                                        x1="58"
                                        y1="50"
                                        x2="70"
                                        y2="50"
                                        stroke="hsl(var(--foreground) / 0.6)"
                                        strokeWidth="0.5"
                                    />
                                </g>
                            ))}
                        </motion.g>
                    </g>

                    {/* Roll scale */}
                    <g transform="translate(50, 50)">
                        {[-45, -30, -15, 0, 15, 30, 45].map((angle) => {
                            const x = 38 * Math.sin((angle * Math.PI) / 180);
                            const y = -38 * Math.cos((angle * Math.PI) / 180);
                            return (
                                <line
                                    key={angle}
                                    x1={x * 0.92}
                                    y1={y * 0.92}
                                    x2={x}
                                    y2={y}
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={angle === 0 ? 2 : 0.8}
                                    filter={angle === 0 ? "url(#heliGlow)" : undefined}
                                />
                            );
                        })}
                        <motion.polygon
                            points="0,-36 -2.5,-41 2.5,-41"
                            fill="hsl(var(--warning))"
                            animate={{ rotate: roll }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            style={{ transformOrigin: "0 0" }}
                            filter="url(#heliGlow)"
                        />
                    </g>

                    {/* Aircraft symbol */}
                    <g
                        transform="translate(50, 50)"
                        filter="url(#heliGlow)">
                        <line
                            x1="-18"
                            y1="0"
                            x2="-6"
                            y2="0"
                            stroke="hsl(var(--warning))"
                            strokeWidth="2.5"
                        />
                        <line
                            x1="6"
                            y1="0"
                            x2="18"
                            y2="0"
                            stroke="hsl(var(--warning))"
                            strokeWidth="2.5"
                        />
                        <circle
                            cx="0"
                            cy="0"
                            r="2.5"
                            fill="none"
                            stroke="hsl(var(--warning))"
                            strokeWidth="2.5"
                        />
                    </g>

                    {/* Outer ring */}
                    <circle
                        cx="50"
                        cy="50"
                        r="44"
                        fill="none"
                        stroke="hsl(var(--primary) / 0.3)"
                        strokeWidth="1"
                    />
                </svg>
            </div>
        </motion.div>
    );
};
