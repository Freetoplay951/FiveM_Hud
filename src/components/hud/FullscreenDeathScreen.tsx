import { motion, AnimatePresence } from "framer-motion";
import { Skull, Phone, RotateCcw, RefreshCw, Clock, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/formatUtils";
import { DeathState } from "@/types/hud";
import { sendNuiCallback } from "@/hooks/useNuiEvents";
import { useTranslation } from "@/contexts/LanguageContext";

interface FullscreenDeathScreenProps {
    death: DeathState;
    visible: boolean;
}

export const FullscreenDeathScreen = ({ death, visible }: FullscreenDeathScreenProps) => {
    const { t } = useTranslation();

    const { isDead, respawnTimer, waitTimer, canCallHelp = true, canRespawn = false, message } = death;
    const displayMessage = message || t.death.defaultMessage;
    const waitProgress = waitTimer > 0 ? ((60 - waitTimer) / 60) * 100 : 100;

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
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="fixed inset-0 z-40 pointer-events-auto"
                >
                    {/* Dark overlay with vignette */}
                    <div 
                        className="absolute inset-0"
                        style={{
                            background: "radial-gradient(ellipse at center, hsl(0 0% 0% / 0.75) 0%, hsl(0 0% 0% / 0.92) 100%)",
                        }}
                    />
                    
                    {/* Red vignette effect */}
                    <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: "radial-gradient(ellipse at center, transparent 40%, hsl(0 70% 15% / 0.5) 100%)",
                        }}
                    />
                    
                    {/* Animated red pulse at edges */}
                    <motion.div 
                        className="absolute inset-0 pointer-events-none"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            background: "radial-gradient(ellipse at center, transparent 50%, hsl(0 60% 20% / 0.4) 100%)",
                        }}
                    />

                    {/* Centered content */}
                    <div className="relative h-full flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
                            className="flex flex-col items-center text-center p-6"
                        >
                            {/* Skull Icon with Glow */}
                            <motion.div
                                className="relative mb-6"
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <div
                                    className="w-24 h-24 rounded-full border-2 border-critical/60 flex items-center justify-center"
                                    style={{
                                        background: "radial-gradient(circle, hsl(var(--critical) / 0.25) 0%, transparent 70%)",
                                        boxShadow: "0 0 50px hsl(var(--critical) / 0.5), inset 0 0 25px hsl(var(--critical) / 0.2)",
                                    }}
                                >
                                    <Skull size={48} className="text-critical" />
                                </div>
                            </motion.div>

                            {/* Title */}
                            <motion.h1
                                className="text-3xl font-bold tracking-[0.3em] text-critical mb-2 hud-text"
                                style={{
                                    textShadow: "0 0 20px hsl(var(--critical) / 0.7), 0 0 40px hsl(var(--critical) / 0.4)",
                                    fontFamily: "Orbitron, sans-serif",
                                }}
                                animate={{ opacity: [0.85, 1, 0.85] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {t.death.title}
                            </motion.h1>

                            {/* Subtitle */}
                            <p className="text-sm text-muted-foreground mb-6 max-w-md">{displayMessage}</p>

                            {/* Critical Health Bar */}
                            <div className="w-full max-w-sm mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Heart size={14} className="text-critical" />
                                    <span className="text-xs text-critical uppercase tracking-wider">{t.death.critical}</span>
                                </div>
                                <div
                                    className="h-1.5 rounded-full overflow-hidden"
                                    style={{ background: "hsl(var(--muted) / 0.3)" }}
                                >
                                    <motion.div
                                        className="h-full bg-critical rounded-full"
                                        initial={{ width: "15%" }}
                                        animate={{ width: ["15%", "5%", "15%"] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        style={{ boxShadow: "0 0 10px hsl(var(--critical)), 0 0 20px hsl(var(--critical) / 0.5)" }}
                                    />
                                </div>
                            </div>

                            {/* Respawn Timer */}
                            <div className="mb-4">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                                    {t.death.respawnIn}
                                </span>
                                <motion.div
                                    className="hud-number text-4xl text-primary"
                                    style={{
                                        textShadow: "0 0 15px hsl(var(--primary) / 0.7)",
                                        fontFamily: "Orbitron, sans-serif",
                                    }}
                                    key={respawnTimer}
                                    initial={{ scale: 1.15 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {formatTime(respawnTimer)}
                                </motion.div>
                            </div>

                            {/* Wait Timer Progress Bar */}
                            <div className="w-full max-w-sm mb-4">
                                <div
                                    className="h-1 rounded-full overflow-hidden border border-primary/30"
                                    style={{ background: "hsl(var(--muted) / 0.2)" }}
                                >
                                    <motion.div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${waitProgress}%`, boxShadow: "0 0 8px hsl(var(--primary))" }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <div className="flex items-center gap-1.5 text-xs text-primary">
                                        <Clock size={10} />
                                        <span>{t.death.waitTime}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground hud-number">{formatTime(waitTimer)}</span>
                                </div>
                            </div>

                            {/* Info Text */}
                            <p className="text-xs text-muted-foreground mb-6 max-w-sm">{t.death.infoText}</p>

                            {/* Action Buttons */}
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
                                        clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: canCallHelp
                                                ? "linear-gradient(135deg, hsl(var(--primary) / 0.6) 0%, hsl(var(--primary) / 0.2) 100%)"
                                                : "hsl(var(--muted) / 0.3)",
                                            clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                            WebkitMaskComposite: "xor",
                                            maskComposite: "exclude",
                                            padding: "1px",
                                        }}
                                    />
                                    {canCallHelp && (
                                        <motion.div
                                            className="absolute inset-0 pointer-events-none"
                                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            style={{
                                                background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.25) 0%, transparent 70%)",
                                            }}
                                        />
                                    )}
                                    <Phone size={16} className="relative z-10" />
                                    <div className="relative z-10 text-left">
                                        <div
                                            className="text-xs font-bold tracking-wider"
                                            style={{ fontFamily: "Orbitron, sans-serif" }}
                                        >
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
                                        clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                                    }}
                                >
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: canRespawn
                                                ? "linear-gradient(135deg, hsl(var(--foreground) / 0.5) 0%, hsl(var(--foreground) / 0.15) 100%)"
                                                : "hsl(var(--muted) / 0.2)",
                                            clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
                                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                            WebkitMaskComposite: "xor",
                                            maskComposite: "exclude",
                                            padding: "1px",
                                        }}
                                    />
                                    {canRespawn && (
                                        <motion.div
                                            className="absolute inset-0 pointer-events-none"
                                            animate={{ opacity: [0.2, 0.4, 0.2] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            style={{
                                                background: "radial-gradient(ellipse at center, hsl(var(--foreground) / 0.15) 0%, transparent 70%)",
                                            }}
                                        />
                                    )}
                                    <RotateCcw size={16} className="relative z-10" />
                                    <div className="relative z-10 text-left">
                                        <div
                                            className="text-xs font-bold tracking-wider"
                                            style={{ fontFamily: "Orbitron, sans-serif" }}
                                        >
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
                                    background: "linear-gradient(135deg, hsl(var(--muted) / 0.15) 0%, hsl(var(--muted) / 0.05) 100%)",
                                    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                                }}
                            >
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: "linear-gradient(135deg, hsl(var(--muted) / 0.4) 0%, hsl(var(--muted) / 0.15) 100%)",
                                        clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                                        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                                        WebkitMaskComposite: "xor",
                                        maskComposite: "exclude",
                                        padding: "1px",
                                    }}
                                />
                                <RefreshCw size={12} className="relative z-10" />
                                <span
                                    className="relative z-10 text-[10px] tracking-wider uppercase font-medium"
                                    style={{ fontFamily: "Orbitron, sans-serif" }}
                                >
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
