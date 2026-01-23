import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useHUDGlobalStore } from "@/stores/hudStore";

const WIDGET_ID = "branding";
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
    /** Enable pulse scale animation for this segment (default: false) */
    pulseScale?: boolean;
    /** Enable sequential letter highlight animation for this segment (default: false) */
    sequentialLetters?: boolean;
}

interface BrandingConfig {
    segments: TextSegment[];
    style: {
        fontSize: string;
        letterSpacing: string;
        showUnderline: boolean;
        showParticles: boolean;
        showGlitchEffect: boolean;
        particleCount: number;
    };
    decorations: {
        type: "dots" | "lines" | "brackets" | "none";
        showDecorations: boolean;
    };
    /** Animation settings */
    animation?: {
        /** Duration for sequential letter animation cycle (default: 3) */
        sequentialDuration?: number;
        /** Duration for pulse scale animation (default: 2) */
        pulseDuration?: number;
        /** Scale factor for pulse animation (default: 1.08) */
        pulseScale?: number;
    };
}

type LoadingState = "loading" | "ready" | "disabled";

/* ────────────────────────────────────────────── */
/* Defaults                                       */
/* ────────────────────────────────────────────── */

const defaultAnimationSettings = {
    sequentialDuration: 3,
    pulseDuration: 2,
    pulseScale: 1.08,
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
/* Sub-Components                                 */
/* ────────────────────────────────────────────── */

interface SequentialLetterProps {
    text: string;
    color: ColorValue;
    letterSpacing: string;
    fontSize: string;
    duration: number;
}

const SequentialLetterSegment = ({ text, color, letterSpacing, fontSize, duration }: SequentialLetterProps) => {
    const gradient = resolveGradient(color);
    const solidColor = resolveColor(color);
    const effectColor = getEffectColor(color);
    const letters = text.split("");
    const delayPerLetter = duration / letters.length;

    return (
        <span
            className={`${fontSize} font-bold relative inline-flex`}
            style={{ letterSpacing }}>
            {letters.map((letter, i) => (
                <motion.span
                    key={i}
                    className="inline-block"
                    style={{
                        background: gradient,
                        color: solidColor,
                        WebkitBackgroundClip: gradient ? "text" : undefined,
                        WebkitTextFillColor: gradient ? "transparent" : undefined,
                    }}
                    animate={{
                        filter: [
                            `brightness(1) drop-shadow(0 0 0px hsl(${effectColor}))`,
                            `brightness(1.4) drop-shadow(0 0 12px hsl(${effectColor}))`,
                            `brightness(1) drop-shadow(0 0 0px hsl(${effectColor}))`,
                        ],
                    }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        repeatDelay: duration - 0.6,
                        delay: i * delayPerLetter,
                        ease: "easeInOut",
                    }}>
                    {letter}
                </motion.span>
            ))}
        </span>
    );
};

interface PulseScaleSegmentProps {
    text: string;
    color: ColorValue;
    letterSpacing: string;
    fontSize: string;
    duration: number;
    scale: number;
    delay: number;
}

const PulseScaleSegment = ({
    text,
    color,
    letterSpacing,
    fontSize,
    duration,
    scale,
    delay,
}: PulseScaleSegmentProps) => {
    const gradient = resolveGradient(color);
    const solidColor = resolveColor(color);
    const effectColor = getEffectColor(color);

    return (
        <motion.span
            className={`${fontSize} font-bold relative inline-block origin-center`}
            style={{
                letterSpacing,
                background: gradient,
                color: solidColor,
                WebkitBackgroundClip: gradient ? "text" : undefined,
                WebkitTextFillColor: gradient ? "transparent" : undefined,
                textShadow: gradient
                    ? "0 0 40px rgba(255,255,255,0.35)"
                    : `0 0 10px hsl(${effectColor} / 0.9), 0 0 30px hsl(${effectColor} / 0.6)`,
                willChange: "transform",
            }}
            animate={{
                scale: [1, scale, 1],
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
            }}>
            {text}
        </motion.span>
    );
};

interface StaticSegmentProps {
    text: string;
    color: ColorValue;
    letterSpacing: string;
    fontSize: string;
}

const StaticSegment = ({ text, color, letterSpacing, fontSize }: StaticSegmentProps) => {
    const gradient = resolveGradient(color);
    const solidColor = resolveColor(color);
    const effectColor = getEffectColor(color);

    return (
        <span
            className={`${fontSize} font-bold relative`}
            style={{
                letterSpacing,
                background: gradient,
                color: solidColor,
                WebkitBackgroundClip: gradient ? "text" : undefined,
                WebkitTextFillColor: gradient ? "transparent" : undefined,
                textShadow: gradient
                    ? "0 0 40px rgba(255,255,255,0.35)"
                    : `0 0 10px hsl(${effectColor} / 0.9), 0 0 30px hsl(${effectColor} / 0.6)`,
            }}>
            {text}
        </span>
    );
};

/* ────────────────────────────────────────────── */
/* Main Component                                 */
/* ────────────────────────────────────────────── */

export const BrandingWidget = () => {
    const [config, setConfig] = useState<BrandingConfig | null>(null);
    const registerAsyncWidget = useHUDGlobalStore((s) => s.registerAsyncWidget);
    const markWidgetReady = useHUDGlobalStore((s) => s.markWidgetReady);

    // Register as async widget on mount
    useEffect(() => {
        registerAsyncWidget(WIDGET_ID);
    }, [registerAsyncWidget]);

    // Fetch branding config
    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await fetch("branding.json");
                if (!res.ok) {
                    console.log("[BrandingWidget] branding.json not found, disabling widget");
                    markWidgetReady(WIDGET_ID); // Mark as ready even when disabled - the HUD can proceed
                    return;
                }

                const data = await res.json();
                if (!data || !data.segments || data.segments.length === 0) {
                    console.log("[BrandingWidget] branding.json returned null or invalid config, disabling widget");
                    markWidgetReady(WIDGET_ID); // Mark as ready even when disabled - the HUD can proceed
                    return;
                }

                console.log("[BrandingWidget] Config loaded successfully");
                setConfig(data);
                markWidgetReady(WIDGET_ID); // Mark as ready even when disabled - the HUD can proceed
            } catch (error) {
                console.log("[BrandingWidget] Failed to load branding.json, disabling widget");
                markWidgetReady(WIDGET_ID); // Mark as ready even when disabled - the HUD can proceed
            }
        };

        loadConfig();
    }, [markWidgetReady]);

    // Memoized values
    const { segments, style, decorations, animSettings } = useMemo(() => {
        if (!config) {
            return {
                segments: [],
                style: null,
                decorations: null,
                animSettings: defaultAnimationSettings,
            };
        }

        return {
            segments: config.segments,
            style: config.style,
            decorations: config.decorations,
            animSettings: { ...defaultAnimationSettings, ...config.animation },
        };
    }, [config]);

    const fontSize = style ? fontSizeMap[style.fontSize] || fontSizeMap.lg : fontSizeMap.lg;
    const firstColor = getEffectColor(segments[0]?.color ?? "188 100% 50%");
    const lastColor = getEffectColor(segments[segments.length - 1]?.color ?? "0 100% 50%");

    /* ────────────────────────────────────────────── */
    /* Decorations                                   */
    /* ────────────────────────────────────────────── */

    const renderLeftDecoration = () => {
        if (!decorations?.showDecorations) return null;

        if (decorations.type === "dots") {
            return (
                <div className="flex flex-col gap-1.5 items-center justify-center">
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
            );
        }

        if (decorations.type === "brackets") {
            return (
                <motion.div
                    className="text-2xl flex items-center"
                    style={{ color: `hsl(${firstColor})` }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}>
                    ‹
                </motion.div>
            );
        }

        return null;
    };

    const renderRightDecoration = () => {
        if (!decorations?.showDecorations) return null;

        if (decorations.type === "dots") {
            return (
                <div className="flex flex-col gap-1.5 items-center justify-center">
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
            );
        }

        if (decorations.type === "brackets") {
            return (
                <motion.div
                    className="text-2xl flex items-center"
                    style={{ color: `hsl(${lastColor})` }}
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
                    ›
                </motion.div>
            );
        }

        return null;
    };

    /* ────────────────────────────────────────────── */
    /* Render Segment                                */
    /* ────────────────────────────────────────────── */

    const renderSegment = (seg: TextSegment, index: number) => {
        const letterSpacing = style?.letterSpacing ?? "0.25em";

        // Sequential letter animation takes priority
        if (seg.sequentialLetters) {
            return (
                <SequentialLetterSegment
                    key={index}
                    text={seg.text}
                    color={seg.color}
                    letterSpacing={letterSpacing}
                    fontSize={fontSize}
                    duration={animSettings.sequentialDuration}
                />
            );
        }

        // Pulse scale animation
        if (seg.pulseScale) {
            return (
                <PulseScaleSegment
                    key={index}
                    text={seg.text}
                    color={seg.color}
                    letterSpacing={letterSpacing}
                    fontSize={fontSize}
                    duration={animSettings.pulseDuration}
                    scale={animSettings.pulseScale}
                    delay={index * 0.2}
                />
            );
        }

        // Static segment (no animation)
        return (
            <StaticSegment
                key={index}
                text={seg.text}
                color={seg.color}
                letterSpacing={letterSpacing}
                fontSize={fontSize}
            />
        );
    };

    return (
        <AnimatePresence>
            <div
                id="branding"
                className="pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: -30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="relative flex flex-col items-center">
                    {/* Text with inline decorations */}
                    <div className="relative flex gap-4 items-center">
                        {renderLeftDecoration()}
                        <div className="flex gap-3 items-baseline">
                            {segments.map((seg, i) => renderSegment(seg, i))}
                        </div>
                        {renderRightDecoration()}
                    </div>

                    {/* Underline */}
                    {style?.showUnderline && (
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
                    {style?.showParticles &&
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

                    {/* Holographic shimmer effect */}
                    {/* <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 30%, transparent 35%)",
                        }}
                        initial={{ x: "-150%", skewX: -25 }}
                        animate={{ x: "150%", skewX: 25 }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            repeatDelay: 3,
                            ease: "easeInOut",
                        }}
                    /> */}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
