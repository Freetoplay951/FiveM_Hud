import { motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { VoiceState } from "@/types/hud";
import { cn } from "@/lib/utils";

interface VoiceWidgetProps {
    voice: VoiceState;
    rangeConfig?: Record<string, { bars: number; color: string; label: string }>;
}

// Default Range-Konfiguration (kann via NUI überschrieben werden)
const DEFAULT_RANGE_CONFIG: Record<string, { bars: number; color: string; label: string }> = {
    // Standard Ranges (pma-voice, mumble-voip)
    "whisper": { bars: 1, color: "muted-foreground", label: "Flüstern" },
    "normal": { bars: 2, color: "warning", label: "Normal" },
    "shout": { bars: 3, color: "critical", label: "Schreien" },

    // SaltyChat Ranges (numerische Werte)
    "1": { bars: 1, color: "muted-foreground", label: "Flüstern" },
    "2": { bars: 2, color: "warning", label: "Normal" },
    "3": { bars: 3, color: "critical", label: "Schreien" },

    // SaltyChat alternative Namen
    "whisper_range": { bars: 1, color: "muted-foreground", label: "Flüstern" },
    "normal_range": { bars: 2, color: "warning", label: "Normal" },
    "shouting": { bars: 3, color: "critical", label: "Schreien" },
    "megaphone": { bars: 3, color: "primary", label: "Megafon" },

    // TokoVOIP Ranges
    "short": { bars: 1, color: "muted-foreground", label: "Kurz" },
    "medium": { bars: 2, color: "warning", label: "Mittel" },
    "long": { bars: 3, color: "critical", label: "Weit" },
};

export const VoiceWidget = ({ voice, rangeConfig }: VoiceWidgetProps) => {
    const mergedConfig = { ...DEFAULT_RANGE_CONFIG, ...rangeConfig };
    const rangeKey = String(voice.range);
    const config = mergedConfig[rangeKey] || mergedConfig.normal;

    return (
        <motion.div
            className="glass-panel rounded-lg px-3 py-2 flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}>
            {/* Mic Icon */}
            {voice.active ? (
                <Mic
                    size={14}
                    className={`text-${config.color}`}
                    style={{
                        filter: `drop-shadow(0 0 6px hsl(var(--${config.color})))`,
                    }}
                />
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
