import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { VoiceState } from "@/types/hud";
import { useTranslation } from "@/contexts/LanguageContext";
import { useRenderLogger } from "@/hooks/useRenderLogger";

interface VoiceWidgetProps {
    voice: VoiceState;
}

// Static animation config
const motionConfig = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
} as const;

// Voice range configuration - static, no need to recreate
const VOICE_RANGE_CONFIG = {
    whisper: { bars: 1, color: "muted-foreground", labelKey: "whisper" as const },
    normal: { bars: 2, color: "warning", labelKey: "normal" as const },
    shout: { bars: 3, color: "critical", labelKey: "shout" as const },
    megaphone: { bars: 3, color: "primary", labelKey: "megaphone" as const },
} as const;

// Bar heights - computed once
const BAR_HEIGHTS = [8, 12, 16]; // px values for bars 1, 2, 3

// Memoized voice bar component
const VoiceBar = memo(
    ({
        index,
        isActive,
        color,
        voiceActive,
    }: {
        index: number;
        isActive: boolean;
        color: string;
        voiceActive: boolean;
    }) => {
        const style = useMemo(
            () => ({
                height: `${BAR_HEIGHTS[index]}px`,
                backgroundColor: isActive ? `hsl(var(--${color}))` : "hsl(var(--muted) / 0.3)",
                boxShadow: isActive && voiceActive ? `0 0 6px hsl(var(--${color}))` : "none",
            }),
            [index, isActive, color, voiceActive],
        );

        const animate = useMemo(
            () => (voiceActive && isActive ? { opacity: [0.7, 1, 0.7], scaleY: [0.9, 1, 0.9] } : {}),
            [voiceActive, isActive],
        );

        const transition = useMemo(
            () => ({
                duration: 0.3,
                repeat: Infinity,
                delay: index * 0.1,
            }),
            [index],
        );

        return (
            <motion.div
                className="w-1 rounded-full transition-colors"
                style={style}
                animate={voiceActive && isActive ? animate : undefined}
                transition={voiceActive && isActive ? transition : undefined}
            />
        );
    },
);
VoiceBar.displayName = "VoiceBar";

const VoiceWidgetComponent = ({ voice }: VoiceWidgetProps) => {
    const { t } = useTranslation();

    // Performance logging
    useRenderLogger("VoiceWidget", { active: voice.active, range: voice.range, isMuted: voice.isMuted });

    const config = VOICE_RANGE_CONFIG[voice.range];
    const isMegaphone = voice.range === "megaphone";
    const isMuted = voice.isMuted === true;

    // Memoize icon style
    const iconStyle = useMemo(
        () => ({
            filter: `drop-shadow(0 0 6px hsl(var(--${isMuted ? "critical" : config.color})))`,
        }),
        [config.color, isMuted],
    );

    // Memoize label style
    const labelStyle = useMemo(() => {
        if (isMuted) {
            return {
                color: `hsl(var(--critical))`,
                textShadow: `0 0 6px hsl(var(--critical) / 0.4)`,
            };
        }
        return voice.active
            ? {
                  color: `hsl(var(--${config.color}))`,
                  textShadow: `0 0 6px hsl(var(--${config.color}) / 0.4)`,
              }
            : {};
    }, [voice.active, config.color, isMuted]);

    // Show MicOff only when actually muted (e.g., on TeamSpeak), not when just not talking
    const Icon = isMuted ? MicOff : isMegaphone ? Volume2 : Mic;

    return (
        <motion.div
            className="glass-panel rounded-lg px-3 py-2 flex items-center gap-2"
            {...motionConfig}>
            <Icon
                size={14}
                className={isMuted ? "text-critical" : voice.active ? `text-${config.color}` : "text-muted-foreground"}
                style={voice.active || isMuted ? iconStyle : undefined}
            />

            <div className="flex items-end gap-0.5 h-4">
                {[0, 1, 2].map((index) => (
                    <VoiceBar
                        key={index}
                        index={index}
                        isActive={index < config.bars}
                        color={isMuted ? "critical" : config.color}
                        voiceActive={voice.active && !isMuted}
                    />
                ))}
            </div>

            <span
                className="text-[10px] text-muted-foreground uppercase tracking-wider min-w-[52px] text-center"
                style={labelStyle}>
                {isMuted ? t.general.muted : t.general[config.labelKey]}
            </span>
        </motion.div>
    );
};

export const VoiceWidget = memo(VoiceWidgetComponent);
