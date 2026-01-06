"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, Phone, RotateCcw, RefreshCw, Clock, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/formatUtils";
import type { DeathState } from "@/types/hud";
import { sendNuiCallback } from "@/hooks/useNuiEvents";
import { useTranslation } from "@/contexts/LanguageContext";

interface FullscreenDeathScreenProps {
    death: DeathState;
    visible: boolean;
}

export const FullscreenDeathScreen = ({ death, visible }: FullscreenDeathScreenProps) => {
    const { t } = useTranslation();
    const { isDead, respawnTimer: initialRespawnTimer, waitTimer: initialWaitTimer, canCallHelp = true, message } = death;

    // Local countdown state
    const [respawnTimer, setRespawnTimer] = useState(initialRespawnTimer);
    const [waitTimer, setWaitTimer] = useState(initialWaitTimer);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Reset timers when death state changes (new death event)
    useEffect(() => {
        if (isDead && initialRespawnTimer > 0) {
            setRespawnTimer(initialRespawnTimer);
            setWaitTimer(initialWaitTimer);
        }
    }, [isDead, initialRespawnTimer, initialWaitTimer]);

    // Countdown logic
    useEffect(() => {
        if (isDead && visible) {
            intervalRef.current = setInterval(() => {
                setRespawnTimer((prev) => Math.max(0, prev - 1));
                setWaitTimer((prev) => Math.max(0, prev - 1));
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isDead, visible]);

    const canRespawn = respawnTimer <= 0;
    const displayMessage = message || t.death.defaultMessage;
    const waitProgress = initialWaitTimer > 0 ? ((initialWaitTimer - waitTimer) / initialWaitTimer) * 100 : 100;

    const handleCallHelp = () => {
        sendNuiCallback("deathCallHelp");
    };

    const handleRespawn = () => {
        if (canRespawn) {
            sendNuiCallback("deathRespawn");
        }
    };

    const handleSyncPosition = () => {
        sendNuiCallback("deathSyncPosition");
    };

    const isVisible = visible && isDead;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="fixed inset-0 z-40 pointer-events-auto">
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "radial-gradient(ellipse at center, hsl(0 0% 3% / 0.9) 0%, hsl(0 0% 0%) 100%)",
                        }}
                    />

                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: "radial-gradient(ellipse at center, transparent 25%, hsl(0 85% 8% / 0.8) 100%)",
                        }}
                    />

                    <motion.div
                        className="absolute inset-0 pointer-events-none"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        style={{
                            background:
                                "radial-gradient(ellipse at center, transparent 35%, hsl(0 75% 15% / 0.6) 100%)",
                        }}
                    />

                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.08]"
                        style={{
                            backgroundImage:
                                "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(0 70% 40% / 0.1) 2px, hsl(0 70% 40% / 0.1) 4px)",
                        }}
                    />

                    <motion.div
                        className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-critical/40 pointer-events-none"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    />
                    <motion.div
                        className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 border-critical/40 pointer-events-none"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    />
                    <motion.div
                        className="absolute bottom-8 left-8 w-20 h-20 border-l-2 border-b-2 border-critical/40 pointer-events-none"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    />
                    <motion.div
                        className="absolute bottom-8 right-8 w-20 h-20 border-r-2 border-b-2 border-critical/40 pointer-events-none"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    />

                    {/* Centered content */}
                    <div className="relative h-full flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 30 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                            className="flex flex-col items-center text-center p-8 max-w-2xl">
                            <motion.div
                                className="relative mb-8"
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 3.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}>
                                {/* Outer glow ring with pulse */}
                                <motion.div
                                    className="absolute inset-0 rounded-full"
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
                                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                                    style={{
                                        width: "160px",
                                        height: "160px",
                                        background: "radial-gradient(circle, hsl(var(--critical)) 0%, transparent 60%)",
                                        filter: "blur(35px)",
                                    }}
                                />
                                <div
                                    className="relative w-32 h-32 rounded-full border-2 flex items-center justify-center"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, hsl(var(--critical) / 0.2) 0%, hsl(var(--critical) / 0.05) 100%)",
                                        borderColor: "hsl(var(--critical) / 0.8)",
                                        boxShadow:
                                            "0 0 70px hsl(var(--critical) / 0.7), inset 0 0 40px hsl(var(--critical) / 0.2), 0 0 0 1px hsl(var(--critical) / 0.4)",
                                    }}>
                                    <Skull
                                        size={64}
                                        className="text-critical drop-shadow-[0_0_20px_hsl(var(--critical))]"
                                    />
                                </div>
                                {/* Rotating ring accent */}
                                <motion.div
                                    className="absolute inset-0 w-32 h-32 rounded-full border border-critical/30"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                    style={{
                                        borderStyle: "dashed",
                                        borderWidth: "1px",
                                    }}
                                />
                            </motion.div>

                            <motion.h1
                                className="text-6xl font-black tracking-[0.35em] text-critical mb-4 uppercase relative"
                                style={{
                                    textShadow:
                                        "0 0 40px hsl(var(--critical)), 0 0 80px hsl(var(--critical) / 0.6), 0 4px 8px hsl(0 0% 0% / 0.8)",
                                    fontFamily: "'Rajdhani', 'Orbitron', sans-serif",
                                    fontWeight: 900,
                                    letterSpacing: "0.3em",
                                }}
                                animate={{ opacity: [0.85, 1, 0.85] }}
                                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}>
                                {t.death.title}
                                {/* Glitch effect overlay */}
                                <motion.span
                                    className="absolute inset-0"
                                    style={{
                                        color: "hsl(var(--critical))",
                                        textShadow: "2px 0 hsl(180 100% 50% / 0.5), -2px 0 hsl(280 100% 50% / 0.5)",
                                        clipPath: "polygon(0 0, 100% 0, 100% 45%, 0 45%)",
                                    }}
                                    animate={{
                                        clipPath: [
                                            "polygon(0 0, 100% 0, 100% 45%, 0 45%)",
                                            "polygon(0 60%, 100% 60%, 100% 100%, 0 100%)",
                                            "polygon(0 0, 100% 0, 100% 45%, 0 45%)",
                                        ],
                                        opacity: [0, 0.3, 0],
                                    }}
                                    transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, repeatDelay: 2 }}>
                                    {t.death.title}
                                </motion.span>
                            </motion.h1>

                            <p className="text-base text-foreground/75 mb-10 max-w-md font-medium tracking-wide leading-relaxed">
                                {displayMessage}
                            </p>

                            <div className="w-full max-w-md mb-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-critical/20 border border-critical/50 flex items-center justify-center shadow-[0_0_20px_hsl(var(--critical)/0.4)]">
                                            <Heart
                                                size={18}
                                                className="text-critical fill-critical/40"
                                            />
                                        </div>
                                        <span
                                            className="text-sm text-critical uppercase tracking-[0.2em] font-bold"
                                            style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                                            {t.death.critical}
                                        </span>
                                    </div>
                                    <span className="text-xs text-critical/80 font-mono tracking-wider">
                                        STATUS: CRITICAL
                                    </span>
                                </div>
                                <div
                                    className="h-3 rounded-lg overflow-hidden border border-critical/40 relative"
                                    style={{ background: "hsl(0 0% 5% / 0.8)" }}>
                                    <motion.div
                                        className="h-full rounded-lg relative"
                                        initial={{ width: "15%" }}
                                        animate={{ width: ["15%", "8%", "15%"] }}
                                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                                        style={{
                                            background:
                                                "linear-gradient(90deg, hsl(var(--critical)) 0%, hsl(var(--critical) / 0.8) 50%, hsl(var(--critical)) 100%)",
                                            boxShadow:
                                                "0 0 20px hsl(var(--critical)), 0 0 40px hsl(var(--critical) / 0.7)",
                                        }}>
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white/20 to-transparent" />
                                        {/* Animated pulse line */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                                            animate={{ x: ["-100%", "200%"] }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Number.POSITIVE_INFINITY,
                                                ease: "linear",
                                            }}
                                            style={{ width: "50%" }}
                                        />
                                    </motion.div>
                                </div>
                            </div>

                            <div className="mb-8 relative">
                                <span className="text-xs text-foreground/60 uppercase tracking-[0.25em] block mb-4 font-bold">
                                    {t.death.respawnIn}
                                </span>
                                <div className="relative inline-flex items-center justify-center w-[280px]">
                                    {/* Multiple glow layers */}
                                    <motion.div
                                        className="absolute inset-0 rounded-2xl blur-3xl"
                                        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
                                        transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY }}
                                        style={{
                                            background:
                                                "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
                                            transform: "scale(1.8)",
                                        }}
                                    />
                                    <div
                                        className="relative px-10 py-5 rounded-2xl border-2 w-full"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--primary) / 0.08) 100%)",
                                            borderColor: "hsl(var(--primary) / 0.6)",
                                            boxShadow:
                                                "0 0 40px hsl(var(--primary) / 0.4), inset 0 0 30px hsl(var(--primary) / 0.15), 0 0 0 1px hsl(var(--primary) / 0.3)",
                                        }}>
                                        <div
                                            className="text-7xl font-black text-primary tabular-nums text-center relative w-full"
                                            style={{
                                                textShadow:
                                                    "0 0 30px hsl(var(--primary)), 0 0 60px hsl(var(--primary) / 0.5)",
                                                fontFamily: "'Rajdhani', 'Orbitron', sans-serif",
                                                letterSpacing: "0.08em",
                                            }}>
                                            {formatTime(respawnTimer)}
                                            {/* Subtle scan line effect */}
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent"
                                                animate={{ y: ["-100%", "300%"] }}
                                                transition={{
                                                    duration: 2.5,
                                                    repeat: Number.POSITIVE_INFINITY,
                                                    ease: "linear",
                                                }}
                                                style={{ height: "30%" }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-md mb-8">
                                <div
                                    className="h-2.5 rounded-full overflow-hidden border border-primary/50 relative"
                                    style={{
                                        background: "hsl(0 0% 5% / 0.8)",
                                        boxShadow: "inset 0 2px 8px hsl(0 0% 0% / 0.5)",
                                    }}>
                                    <motion.div
                                        className="h-full rounded-full relative overflow-hidden"
                                        style={{
                                            width: `${waitProgress}%`,
                                            background:
                                                "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.9) 50%, hsl(var(--primary)) 100%)",
                                            boxShadow:
                                                "0 0 15px hsl(var(--primary)), 0 0 30px hsl(var(--primary) / 0.5)",
                                        }}
                                        transition={{ duration: 0.3 }}>
                                        {/* Enhanced shine effect */}
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                                            animate={{ x: ["-100%", "200%"] }}
                                            transition={{
                                                duration: 2,
                                                repeat: Number.POSITIVE_INFINITY,
                                                ease: "linear",
                                            }}
                                            style={{ width: "40%" }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                                    </motion.div>
                                </div>
                                <div className="flex justify-between items-center mt-3">
                                    <div className="flex items-center gap-2 text-xs text-primary font-bold tracking-wide">
                                        <Clock size={13} />
                                        <span>{t.death.waitTime}</span>
                                    </div>
                                    <span className="text-xs text-foreground/70 font-mono tabular-nums tracking-wider">
                                        {formatTime(waitTimer)}
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-foreground/65 mb-10 max-w-md leading-relaxed">
                                {t.death.infoText}
                            </p>

                            <div className="flex gap-3 mb-4">
                                {/* Call Help Button */}
                                <motion.button
                                    onClick={handleCallHelp}
                                    disabled={!canCallHelp}
                                    whileHover={canCallHelp ? { scale: 1.03 } : {}}
                                    whileTap={canCallHelp ? { scale: 0.97 } : {}}
                                    className={cn(
                                        "relative flex items-center gap-2 px-4 py-2.5 transition-all overflow-hidden clip-corner",
                                        canCallHelp
                                            ? "text-primary cursor-pointer"
                                            : "text-muted-foreground cursor-not-allowed opacity-40"
                                    )}
                                    style={{
                                        background: canCallHelp
                                            ? "linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--primary) / 0.08) 100%)"
                                            : "hsl(var(--muted) / 0.1)",
                                        clipPath:
                                            "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                                    }}>
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: canCallHelp
                                                ? "linear-gradient(135deg, hsl(var(--primary) / 0.6) 0%, hsl(var(--primary) / 0.2) 100%)"
                                                : "hsl(var(--muted) / 0.3)",
                                            clipPath:
                                                "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                                            WebkitMask:
                                                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                            WebkitMaskComposite: "xor",
                                            maskComposite: "exclude",
                                            padding: "1px",
                                        }}
                                    />
                                    {canCallHelp && (
                                        <motion.div
                                            className="absolute inset-0 pointer-events-none"
                                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                                            style={{
                                                background:
                                                    "radial-gradient(ellipse at center, hsl(var(--primary) / 0.25) 0%, transparent 70%)",
                                            }}
                                        />
                                    )}
                                    <Phone
                                        size={16}
                                        className="relative z-10"
                                    />
                                    <div className="relative z-10 text-left">
                                        <div
                                            className="text-xs font-bold tracking-wider"
                                            style={{ fontFamily: "Orbitron, sans-serif" }}>
                                            {t.death.helpButton}
                                        </div>
                                    </div>
                                    <span className="relative z-10 ml-1 px-2 py-1 bg-background/40 rounded text-[10px] font-bold tracking-wider border border-primary/30">
                                        E
                                    </span>
                                </motion.button>

                                {/* Respawn Button */}
                                <motion.button
                                    onClick={handleRespawn}
                                    disabled={!canRespawn}
                                    whileHover={canRespawn ? { scale: 1.03 } : {}}
                                    whileTap={canRespawn ? { scale: 0.97 } : {}}
                                    className={cn(
                                        "relative flex items-center gap-2 px-4 py-2.5 transition-all overflow-hidden",
                                        canRespawn
                                            ? "text-foreground cursor-pointer"
                                            : "text-muted-foreground cursor-not-allowed opacity-40"
                                    )}
                                    style={{
                                        background: canRespawn
                                            ? "linear-gradient(135deg, hsl(var(--foreground) / 0.12) 0%, hsl(var(--foreground) / 0.04) 100%)"
                                            : "hsl(var(--muted) / 0.1)",
                                        clipPath:
                                            "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                                    }}>
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: canRespawn
                                                ? "linear-gradient(135deg, hsl(var(--foreground) / 0.5) 0%, hsl(var(--foreground) / 0.15) 100%)"
                                                : "hsl(var(--muted) / 0.2)",
                                            clipPath:
                                                "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                                            WebkitMask:
                                                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                            WebkitMaskComposite: "xor",
                                            maskComposite: "exclude",
                                            padding: "1px",
                                        }}
                                    />
                                    {canRespawn && (
                                        <motion.div
                                            className="absolute inset-0 pointer-events-none"
                                            animate={{ opacity: [0.2, 0.4, 0.2] }}
                                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                                            style={{
                                                background:
                                                    "radial-gradient(ellipse at center, hsl(var(--foreground) / 0.15) 0%, transparent 70%)",
                                            }}
                                        />
                                    )}
                                    <RotateCcw
                                        size={16}
                                        className="relative z-10"
                                    />
                                    <div className="relative z-10 text-left">
                                        <div
                                            className="text-xs font-bold tracking-wider"
                                            style={{ fontFamily: "Orbitron, sans-serif" }}>
                                            {t.death.respawnButton}
                                        </div>
                                    </div>
                                    <span className="relative z-10 ml-1 px-2 py-1 bg-background/40 rounded text-[10px] font-bold tracking-wider border border-foreground/20">
                                        ↵
                                    </span>
                                </motion.button>
                            </div>

                            {/* Sync Position Button */}
                            <motion.button
                                onClick={handleSyncPosition}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="relative flex items-center gap-2 px-3 py-2 text-muted-foreground transition-all overflow-hidden hover:text-foreground"
                                style={{
                                    background:
                                        "linear-gradient(135deg, hsl(var(--muted) / 0.15) 0%, hsl(var(--muted) / 0.05) 100%)",
                                    clipPath:
                                        "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                                }}>
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, hsl(var(--muted) / 0.4) 0%, hsl(var(--muted) / 0.15) 100%)",
                                        clipPath:
                                            "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                                        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                        WebkitMaskComposite: "xor",
                                        maskComposite: "exclude",
                                        padding: "1px",
                                    }}
                                />
                                <RefreshCw
                                    size={12}
                                    className="relative z-10"
                                />
                                <span
                                    className="relative z-10 text-[10px] tracking-wider uppercase font-medium"
                                    style={{ fontFamily: "Orbitron, sans-serif" }}>
                                    {t.death.syncButton}
                                </span>
                                <span className="relative z-10 px-1.5 py-0.5 bg-background/40 rounded text-[9px] font-bold border border-muted/30">
                                    F5
                                </span>
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
