import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TextSegment {
    text: string;
    color: string;
}

interface BrandingConfig {
    segments: TextSegment[];
    style: {
        fontSize: string;
        letterSpacing: string;
        showUnderline: boolean;
        showParticles: boolean;
        showGlitchEffect: boolean;
        showScanlines: boolean;
        particleCount: number;
    };
    decorations: {
        type: "dots" | "lines" | "brackets" | "none";
        showDecorations: boolean;
    };
}

const defaultConfig: BrandingConfig = {
    segments: [
        { text: "COMMUNITY", color: "188 100% 50%" },
        { text: "RP", color: "0 100% 50%" },
    ],
    style: {
        fontSize: "2xl",
        letterSpacing: "0.25em",
        showUnderline: true,
        showParticles: true,
        showGlitchEffect: true,
        showScanlines: false,
        particleCount: 6,
    },
    decorations: {
        type: "dots",
        showDecorations: true,
    },
};

const fontSizeMap: Record<string, string> = {
    "sm": "text-xl",
    "md": "text-2xl",
    "lg": "text-3xl",
    "xl": "text-4xl",
    "2xl": "text-5xl",
};

export const BrandingWidget = () => {
    const [config, setConfig] = useState<BrandingConfig>(defaultConfig);

    useEffect(() => {
        fetch("/branding.json")
            .then((res) => res.json())
            .then((data) => setConfig({ ...defaultConfig, ...data }))
            .catch(() => console.log("Using default branding config"));
    }, []);

    const { segments, style, decorations } = config;
    const fontSize = fontSizeMap[style.fontSize] || fontSizeMap["lg"];

    // Get first and last colors for decorations/underline
    const firstColor = segments[0]?.color || "188 100% 50%";
    const lastColor = segments[segments.length - 1]?.color || "0 100% 50%";

    const renderDecorations = () => {
        if (!decorations.showDecorations) return null;

        switch (decorations.type) {
            case "dots":
                return (
                    <>
                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={`left-${i}`}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{
                                        background: `hsl(${firstColor})`,
                                        boxShadow: `0 0 8px hsl(${firstColor}), 0 0 16px hsl(${firstColor} / 0.5)`,
                                    }}
                                    animate={{
                                        opacity: [0.4, 1, 0.4],
                                        scale: [0.8, 1.2, 0.8],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                />
                            ))}
                        </div>
                        <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={`right-${i}`}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{
                                        background: `hsl(${lastColor})`,
                                        boxShadow: `0 0 8px hsl(${lastColor}), 0 0 16px hsl(${lastColor} / 0.5)`,
                                    }}
                                    animate={{
                                        opacity: [0.4, 1, 0.4],
                                        scale: [0.8, 1.2, 0.8],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.2 + 0.3,
                                    }}
                                />
                            ))}
                        </div>
                    </>
                );

            case "lines":
                return (
                    <>
                        <motion.div
                            className="absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}>
                            <div
                                className="w-6 h-0.5"
                                style={{
                                    background: `linear-gradient(90deg, transparent, hsl(${firstColor}))`,
                                    boxShadow: `0 0 6px hsl(${firstColor} / 0.6)`,
                                }}
                            />
                            <div
                                className="w-4 h-0.5"
                                style={{
                                    background: `linear-gradient(90deg, transparent, hsl(${firstColor} / 0.6))`,
                                }}
                            />
                        </motion.div>
                        <motion.div
                            className="absolute -right-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 items-end"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
                            <div
                                className="w-6 h-0.5"
                                style={{
                                    background: `linear-gradient(90deg, hsl(${lastColor}), transparent)`,
                                    boxShadow: `0 0 6px hsl(${lastColor} / 0.6)`,
                                }}
                            />
                            <div
                                className="w-4 h-0.5"
                                style={{
                                    background: `linear-gradient(90deg, hsl(${lastColor} / 0.6), transparent)`,
                                }}
                            />
                        </motion.div>
                    </>
                );

            case "brackets":
                return (
                    <>
                        <motion.div
                            className="absolute -left-6 top-1/2 -translate-y-1/2 text-2xl font-light"
                            style={{
                                color: `hsl(${firstColor})`,
                                textShadow: `0 0 10px hsl(${firstColor}), 0 0 20px hsl(${firstColor} / 0.5)`,
                            }}
                            animate={{ opacity: [0.6, 1, 0.6], x: [-2, 0, -2] }}
                            transition={{ duration: 2, repeat: Infinity }}>
                            ‹
                        </motion.div>
                        <motion.div
                            className="absolute -right-6 top-1/2 -translate-y-1/2 text-2xl font-light"
                            style={{
                                color: `hsl(${lastColor})`,
                                textShadow: `0 0 10px hsl(${lastColor}), 0 0 20px hsl(${lastColor} / 0.5)`,
                            }}
                            animate={{ opacity: [0.6, 1, 0.6], x: [2, 0, 2] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
                            ›
                        </motion.div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div
            id="branding"
            className="pointer-events-none">
            <motion.div
                initial={{ opacity: 0, y: -30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative flex flex-col items-center justify-center">
                {/* Scanlines overlay */}
                {style.showScanlines && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-10"
                        style={{
                            background:
                                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
                        }}
                    />
                )}

                {/* Massive outer glow - pulsing */}
                <motion.div
                    className="absolute inset-0 blur-3xl"
                    animate={{
                        opacity: [0.4, 0.7, 0.4],
                        scale: [1, 1.15, 1],
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}>
                    <div className={`${fontSize} font-bold tracking-widest flex items-baseline gap-3`}>
                        {segments.map((seg, i) => (
                            <span
                                key={i}
                                style={{ color: `hsl(${seg.color})` }}>
                                {seg.text}
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* Secondary glow layer - offset for depth */}
                <motion.div
                    className="absolute inset-0 blur-2xl opacity-50"
                    animate={{
                        x: [-2, 2, -2],
                        y: [1, -1, 1],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}>
                    <div className={`${fontSize} font-bold tracking-widest flex items-baseline gap-3`}>
                        {segments.map((seg, i) => (
                            <span
                                key={i}
                                style={{ color: `hsl(${seg.color.replace("50%", "70%")})` }}>
                                {seg.text}
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* Main text container with glitch effect */}
                <div className="relative flex items-baseline gap-3">
                    {/* Glitch layers */}
                    {style.showGlitchEffect && (
                        <>
                            <motion.div
                                className="absolute inset-0 flex items-baseline gap-3"
                                animate={{
                                    x: [-2, 0, 2, 0, -1, 0],
                                    opacity: [0, 0.8, 0, 0.5, 0, 0],
                                }}
                                transition={{
                                    duration: 0.15,
                                    repeat: Infinity,
                                    repeatDelay: 3,
                                    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                                }}
                                style={{ clipPath: "inset(10% 0 60% 0)" }}>
                                {segments.map((seg, i) => (
                                    <span
                                        key={i}
                                        className={`${fontSize} font-bold`}
                                        style={{
                                            letterSpacing: style.letterSpacing,
                                            color: `hsl(${seg.color})`,
                                        }}>
                                        {seg.text}
                                    </span>
                                ))}
                            </motion.div>

                            <motion.div
                                className="absolute inset-0 flex items-baseline gap-3"
                                animate={{
                                    x: [2, 0, -2, 0, 1, 0],
                                    opacity: [0, 0.6, 0, 0.4, 0, 0],
                                }}
                                transition={{
                                    duration: 0.15,
                                    repeat: Infinity,
                                    repeatDelay: 3,
                                    delay: 0.05,
                                    times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                                }}
                                style={{ clipPath: "inset(40% 0 20% 0)" }}>
                                {segments.map((seg, i) => (
                                    <span
                                        key={i}
                                        className={`${fontSize} font-bold`}
                                        style={{
                                            letterSpacing: style.letterSpacing,
                                            color: `hsl(${segments[(i + 1) % segments.length].color})`,
                                        }}>
                                        {seg.text}
                                    </span>
                                ))}
                            </motion.div>
                        </>
                    )}

                    {/* Main text segments */}
                    {segments.map((seg, i) => (
                        <motion.span
                            key={i}
                            className={`${fontSize} font-bold hud-text relative`}
                            style={{
                                letterSpacing: style.letterSpacing,
                                color: i === 0 ? "hsl(var(--foreground))" : `hsl(${seg.color.replace("50%", "55%")})`,
                                textShadow: `
                                    0 0 5px hsl(${seg.color} / 1),
                                    0 0 10px hsl(${seg.color} / 0.9),
                                    0 0 20px hsl(${seg.color} / 0.8),
                                    0 0 40px hsl(${seg.color} / 0.6),
                                    0 0 80px hsl(${seg.color} / 0.4),
                                    0 0 120px hsl(${seg.color} / 0.2)
                                `,
                            }}
                            animate={{
                                textShadow: [
                                    `0 0 5px hsl(${seg.color} / 1), 0 0 10px hsl(${seg.color} / 0.9), 0 0 20px hsl(${seg.color} / 0.8), 0 0 40px hsl(${seg.color} / 0.6), 0 0 80px hsl(${seg.color} / 0.4), 0 0 120px hsl(${seg.color} / 0.2)`,
                                    `0 0 8px hsl(${seg.color} / 1), 0 0 16px hsl(${seg.color} / 1), 0 0 32px hsl(${seg.color} / 0.9), 0 0 64px hsl(${seg.color} / 0.7), 0 0 100px hsl(${seg.color} / 0.5), 0 0 150px hsl(${seg.color} / 0.3)`,
                                    `0 0 5px hsl(${seg.color} / 1), 0 0 10px hsl(${seg.color} / 0.9), 0 0 20px hsl(${seg.color} / 0.8), 0 0 40px hsl(${seg.color} / 0.6), 0 0 80px hsl(${seg.color} / 0.4), 0 0 120px hsl(${seg.color} / 0.2)`,
                                ],
                                scale: i > 0 ? [1, 1.05, 1] : undefined,
                            }}
                            transition={{
                                duration: i === 0 ? 2 : 1.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.2,
                            }}>
                            {seg.text}
                        </motion.span>
                    ))}
                </div>

                {/* Animated underline with gradient sweep */}
                {style.showUnderline && (
                    <motion.div
                        className="relative mt-2 h-[3px] overflow-hidden"
                        initial={{ width: 0 }}
                        animate={{ width: "110%" }}
                        transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}>
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `linear-gradient(90deg, transparent, ${segments.map((s) => `hsl(${s.color})`).join(", ")}, transparent)`,
                                boxShadow: `
                                    0 0 10px hsl(${firstColor} / 0.8),
                                    0 0 20px hsl(${firstColor} / 0.5),
                                    0 0 30px hsl(${lastColor} / 0.5)
                                `,
                            }}
                        />
                        <motion.div
                            className="absolute inset-0 bg-white/60"
                            initial={{ x: "-100%" }}
                            animate={{ x: "200%" }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                repeatDelay: 2,
                                ease: "easeInOut",
                            }}
                            style={{ width: "30%" }}
                        />
                    </motion.div>
                )}

                {/* Floating particles */}
                {style.showParticles &&
                    [...Array(style.particleCount)].map((_, i) => {
                        const segmentColor = segments[i % segments.length].color;
                        return (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 rounded-full"
                                style={{
                                    background: `hsl(${segmentColor})`,
                                    boxShadow: `0 0 6px hsl(${segmentColor}), 0 0 12px hsl(${segmentColor})`,
                                    left: `${10 + i * (80 / style.particleCount)}%`,
                                    top: "50%",
                                }}
                                animate={{
                                    y: [0, -20 - i * 3, 0],
                                    opacity: [0, 1, 0],
                                    scale: [0.5, 1.2, 0.5],
                                }}
                                transition={{
                                    duration: 2 + i * 0.3,
                                    repeat: Infinity,
                                    delay: i * 0.4,
                                    ease: "easeInOut",
                                }}
                            />
                        );
                    })}

                {renderDecorations()}
            </motion.div>
        </div>
    );
};
