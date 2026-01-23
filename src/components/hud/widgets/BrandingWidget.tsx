import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/* ────────────────────────────────────────────── */
/* Types                                          */
/* ────────────────────────────────────────────── */

type GradientColor = {
    type: "gradient";
    from: string;
    to: string;
    angle?: number;
};

type ColorValue = string | GradientColor;

interface TextSegment {
    text: string;
    color: ColorValue;
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

/* ────────────────────────────────────────────── */
/* Defaults                                       */
/* ────────────────────────────────────────────── */

const defaultConfig: BrandingConfig = {
    segments: [
        { text: "COMMUNITY", color: "188 100% 50%" },
        { text: "RP", color: "0 100% 50%" },
    ],
    style: {
        fontSize: "lg",
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

/* ────────────────────────────────────────────── */
/* Helpers                                        */
/* ────────────────────────────────────────────── */

const isGradient = (color: ColorValue): color is GradientColor =>
    typeof color === "object" && color.type === "gradient";

const resolveColor = (color: ColorValue) => (isGradient(color) ? undefined : `hsl(${color})`);

const resolveGradient = (color: ColorValue) => {
    if (!isGradient(color)) return undefined;
    return `linear-gradient(${color.angle ?? 90}deg, hsl(${color.from}), hsl(${color.to}))`;
};

const getEffectColor = (color: ColorValue) => (isGradient(color) ? color.from : color);

/* ────────────────────────────────────────────── */
/* Component                                      */
/* ────────────────────────────────────────────── */

export const BrandingWidget = () => {
    const [config, setConfig] = useState<BrandingConfig>(defaultConfig);

    useEffect(() => {
        fetch("/branding.json")
            .then((res) => res.json())
            .then((data) => setConfig({ ...defaultConfig, ...data }))
            .catch(() => console.log("Using default branding config"));
    }, []);

    const { segments, style, decorations } = config;
    const fontSize = fontSizeMap[style.fontSize] || fontSizeMap.lg;

    const firstColor = getEffectColor(segments[0]?.color ?? "188 100% 50%");
    const lastColor = getEffectColor(segments[segments.length - 1]?.color ?? "0 100% 50%");

    /* ────────────────────────────────────────────── */
    /* Decorations                                   */
    /* ────────────────────────────────────────────── */

    const renderDecorations = () => {
        if (!decorations.showDecorations) return null;

        if (decorations.type === "dots") {
            return (
                <>
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                    background: `hsl(${firstColor})`,
                                    boxShadow: `0 0 10px hsl(${firstColor})`,
                                }}
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                            />
                        ))}
                    </div>

                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                    background: `hsl(${lastColor})`,
                                    boxShadow: `0 0 10px hsl(${lastColor})`,
                                }}
                                animate={{ opacity: [0.4, 1, 0.4] }}
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
        }

        if (decorations.type === "brackets") {
            return (
                <>
                    <motion.div
                        className="absolute -left-6 top-1/2 -translate-y-1/2 text-2xl"
                        style={{ color: `hsl(${firstColor})` }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity }}>
                        ‹
                    </motion.div>
                    <motion.div
                        className="absolute -right-6 top-1/2 -translate-y-1/2 text-2xl"
                        style={{ color: `hsl(${lastColor})` }}
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
                        ›
                    </motion.div>
                </>
            );
        }

        return null;
    };

    /* ────────────────────────────────────────────── */
    /* Render                                        */
    /* ────────────────────────────────────────────── */

    return (
        <div
            id="branding"
            className="pointer-events-none">
            <motion.div
                initial={{ opacity: 0, y: -30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1 }}
                className="relative flex flex-col items-center">
                {/* Scanlines */}
                {style.showScanlines && (
                    <div
                        className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                            background:
                                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)",
                        }}
                    />
                )}

                {/* Text */}
                <div className="relative flex gap-3 items-baseline">
                    {segments.map((seg, i) => {
                        const gradient = resolveGradient(seg.color);
                        const color = resolveColor(seg.color);

                        return (
                            <motion.span
                                key={i}
                                className={`${fontSize} font-bold relative`}
                                style={{
                                    letterSpacing: style.letterSpacing,
                                    background: gradient,
                                    color,
                                    WebkitBackgroundClip: gradient ? "text" : undefined,
                                    WebkitTextFillColor: gradient ? "transparent" : undefined,
                                    textShadow: gradient
                                        ? "0 0 40px rgba(255,255,255,0.35)"
                                        : `
                                            0 0 10px hsl(${seg.color} / 0.9),
                                            0 0 30px hsl(${seg.color} / 0.6)
                                        `,
                                }}
                                animate={{
                                    scale: i > 0 ? [1, 1.05, 1] : undefined,
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.2,
                                }}>
                                {seg.text}
                            </motion.span>
                        );
                    })}
                </div>

                {/* Underline */}
                {style.showUnderline && (
                    <motion.div
                        className="relative mt-2 h-[3px] w-[110%] overflow-hidden"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 1 }}>
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `linear-gradient(90deg, transparent, ${segments
                                    .map((s) =>
                                        isGradient(s.color)
                                            ? `hsl(${s.color.from}), hsl(${s.color.to})`
                                            : `hsl(${s.color})`,
                                    )
                                    .join(", ")}, transparent)`,
                            }}
                        />
                    </motion.div>
                )}

                {/* Particles */}
                {style.showParticles &&
                    [...Array(style.particleCount)].map((_, i) => {
                        const c = getEffectColor(segments[i % segments.length].color);
                        return (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 rounded-full"
                                style={{
                                    background: `hsl(${c})`,
                                    left: `${10 + i * (80 / style.particleCount)}%`,
                                    top: "50%",
                                }}
                                animate={{
                                    y: [0, -20 - i * 2, 0],
                                    opacity: [0, 1, 0],
                                }}
                                transition={{
                                    duration: 2 + i * 0.3,
                                    repeat: Infinity,
                                    delay: i * 0.4,
                                }}
                            />
                        );
                    })}

                {renderDecorations()}
            </motion.div>
        </div>
    );
};
