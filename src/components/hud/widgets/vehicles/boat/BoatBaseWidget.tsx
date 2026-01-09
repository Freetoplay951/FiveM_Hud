import { motion } from "framer-motion";
import { VehicleState } from "@/types/hud";
import { Waves } from "lucide-react";

interface BoatBaseWidgetProps {
    vehicle: VehicleState;
    visible: boolean;
}

export const BoatBaseWidget = ({ vehicle, visible }: BoatBaseWidgetProps) => {
    const speed = vehicle.speed;
    const maxSpeed = 160;

    const svgCenter = 50;
    const svgRadius = 44;

    const startAngle = -225;
    const sweepAngle = 270;

    const circumference = 2 * Math.PI * svgRadius;
    const arcLength = circumference * (sweepAngle / 360);

    const speedRatio = Math.min(1, speed / maxSpeed);
    const progressLength = arcLength * speedRatio;

    const speedTicks = [0, 20, 40, 60, 80, 100, 120, 140, 160];

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
                scale: visible ? 1 : 0.8,
            }}
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
                            id="boatSpeedGradientBase"
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
                        <filter id="boatGlowBase">
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

                        const isMajor = s % 40 === 0;
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
                        stroke="url(#boatSpeedGradientBase)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        filter="url(#boatGlowBase)"
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
                    {/* Dark backdrop for better text readability */}
                    <div className="absolute inset-[25%] rounded-full bg-background/80" />

                    <span className="relative text-[8px] text-muted-foreground uppercase tracking-wider mb-1">
                        KTS
                    </span>

                    <motion.span
                        className="relative hud-number text-4xl text-foreground leading-none tabular-nums"
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
                </div>
            </div>
        </motion.div>
    );
};
