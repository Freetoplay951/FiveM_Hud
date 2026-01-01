import { motion } from "framer-motion";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { VoiceState } from "@/types/hud";
import { cn } from "@/lib/utils";

// Unified voice range types
export type VoiceRangeType = "whisper" | "normal" | "shout" | "megaphone";

interface VoiceWidgetProps {
    voice: VoiceState;
}

// Unified Range Configuration - only these 4 types are used
const VOICE_RANGE_CONFIG: Record<VoiceRangeType, { bars: number; color: string; label: string }> = {
    whisper: { bars: 1, color: "muted-foreground", label: "Flüstern" },
    normal: { bars: 2, color: "warning", label: "Normal" },
    shout: { bars: 3, color: "critical", label: "Schreien" },
    megaphone: { bars: 3, color: "primary", label: "Megafon" },
};

// Map legacy/external ranges to unified types
const normalizeVoiceRange = (range: string): VoiceRangeType => {
    const rangeLower = range.toLowerCase();
    
    // Direct matches
    if (rangeLower === "whisper" || rangeLower === "whisper_range" || rangeLower === "1" || rangeLower === "short") {
        return "whisper";
    }
    if (rangeLower === "normal" || rangeLower === "normal_range" || rangeLower === "2" || rangeLower === "medium") {
        return "normal";
    }
    if (rangeLower === "shout" || rangeLower === "shouting" || rangeLower === "3" || rangeLower === "long") {
        return "shout";
    }
    if (rangeLower === "megaphone" || rangeLower === "mega") {
        return "megaphone";
    }
    
    // Default to normal
    return "normal";
};

export const VoiceWidget = ({ voice }: VoiceWidgetProps) => {
    const normalizedRange = normalizeVoiceRange(voice.range);
    const config = VOICE_RANGE_CONFIG[normalizedRange];
    const isMegaphone = normalizedRange === "megaphone";

    return (
        <motion.div
            className="glass-panel rounded-lg px-3 py-2 flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}>
            {/* Mic Icon */}
            {voice.active ? (
                isMegaphone ? (
                    <Volume2
                        size={14}
                        className={`text-${config.color}`}
                        style={{
                            filter: `drop-shadow(0 0 6px hsl(var(--${config.color})))`,
                        }}
                    />
                ) : (
                    <Mic
                        size={14}
                        className={`text-${config.color}`}
                        style={{
                            filter: `drop-shadow(0 0 6px hsl(var(--${config.color})))`,
                        }}
                    />
                )
            ) : (
                <MicOff
                    size={14}
                    className="text-muted-foreground"
                />
            )}

            {/* Voice Bars */}
            <div className="flex items-end gap-0.5 h-4">
                {[1, 2, 3].map((bar) => (
                    <motion.div
                        key={bar}
                        className={cn(
                            "w-1 rounded-full transition-colors",
                            bar <= config.bars ? `bg-${config.color}` : "bg-muted/30"
                        )}
                        style={{
                            height: `${bar * 4 + 4}px`,
                            backgroundColor:
                                bar <= config.bars ? `hsl(var(--${config.color}))` : "hsl(var(--muted) / 0.3)",
                            boxShadow:
                                bar <= config.bars && voice.active ? `0 0 6px hsl(var(--${config.color}))` : "none",
                        }}
                        animate={
                            voice.active && bar <= config.bars
                                ? {
                                      opacity: [0.7, 1, 0.7],
                                      scaleY: [0.9, 1, 0.9],
                                  }
                                : {}
                        }
                        transition={{
                            duration: 0.3,
                            repeat: Infinity,
                            delay: bar * 0.1,
                        }}
                    />
                ))}
            </div>

            {/* Range Label */}
            <span
                className="text-[10px] text-muted-foreground uppercase tracking-wider"
                style={
                    voice.active
                        ? {
                              color: `hsl(var(--${config.color}))`,
                              textShadow: `0 0 6px hsl(var(--${config.color}) / 0.4)`,
                          }
                        : {}
                }>
                {config.label}
            </span>
        </motion.div>
    );
};
