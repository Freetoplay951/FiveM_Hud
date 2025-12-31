import { motion, AnimatePresence } from "framer-motion";
import { Phone, RotateCcw, RefreshCw, Clock, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeathState } from "@/types/hud";
import { sendNuiCallback } from "@/hooks/useNuiEvents";
import { useTranslation } from "@/contexts/LanguageContext";

interface DeathScreenWidgetProps {
    death: DeathState;
    visible: boolean;
}

// Sharp SVG Skull Icon - prevents blurriness
const SkullIcon = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={{ shapeRendering: "geometricPrecision" }}>
        <circle cx="9" cy="12" r="1" />
        <circle cx="15" cy="12" r="1" />
        <path d="M8 20v2h8v-2" />
        <path d="m12.5 17-.5-1-.5 1h1z" />
        <path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20" />
    </svg>
);

// Blood splatter SVG component
const BloodSplatter = ({ position, delay = 0 }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right"; delay?: number }) => {
    const positionClasses = {
        "top-left": "top-0 left-0 origin-top-left",
        "top-right": "top-0 right-0 origin-top-right rotate-90",
        "bottom-left": "bottom-0 left-0 origin-bottom-left -rotate-90",
        "bottom-right": "bottom-0 right-0 origin-bottom-right rotate-180",
    };

    return (
        <motion.div
            className={cn("absolute pointer-events-none", positionClasses[position])}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
                opacity: [0.6, 0.8, 0.6],
                scale: [1, 1.02, 1],
            }}
            transition={{ 
                delay,
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
            }}>
            <svg
                width="300"
                height="300"
                viewBox="0 0 300 300"
                fill="none"
                className="w-[200px] h-[200px] md:w-[300px] md:h-[300px]">
                {/* Main splatter */}
                <path
                    d="M0 0 C50 20, 80 60, 100 120 C110 150, 90 180, 70 200 C50 220, 20 210, 0 180 Z"
                    fill="url(#bloodGradient1)"
                    opacity="0.7"
                />
                {/* Drip 1 */}
                <path
                    d="M60 100 C65 130, 55 160, 50 200 C48 220, 45 240, 40 260 C38 270, 35 275, 30 270 C25 265, 28 250, 30 230 C35 190, 45 150, 55 110 Z"
                    fill="url(#bloodGradient2)"
                    opacity="0.8"
                />
                {/* Drip 2 */}
                <path
                    d="M90 80 C100 110, 95 140, 85 180 C80 200, 75 220, 72 250 C70 260, 68 265, 65 260 C60 255, 65 230, 70 200 C75 160, 85 120, 88 90 Z"
                    fill="url(#bloodGradient2)"
                    opacity="0.6"
                />
                {/* Splatter drops */}
                <circle cx="30" cy="150" r="8" fill="hsl(0 80% 25%)" opacity="0.5" />
                <circle cx="50" cy="180" r="5" fill="hsl(0 80% 20%)" opacity="0.6" />
                <circle cx="15" cy="120" r="6" fill="hsl(0 70% 30%)" opacity="0.4" />
                <circle cx="80" cy="140" r="4" fill="hsl(0 80% 25%)" opacity="0.5" />
                <defs>
                    <linearGradient id="bloodGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(0 80% 30%)" />
                        <stop offset="50%" stopColor="hsl(0 70% 20%)" />
                        <stop offset="100%" stopColor="hsl(0 60% 10%)" />
                    </linearGradient>
                    <linearGradient id="bloodGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(0 80% 25%)" />
                        <stop offset="100%" stopColor="hsl(0 70% 15%)" />
                    </linearGradient>
                </defs>
            </svg>
        </motion.div>
    );
};

export const DeathScreenWidget = ({ death, visible }: DeathScreenWidgetProps) => {
    const { t } = useTranslation();
    
    const {
        isDead,
        respawnTimer,
        waitTimer,
        canCallHelp = true,
        canRespawn = false,
        message,
    } = death;

    const displayMessage = message || t.death.defaultMessage;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

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

    if (!visible || !isDead) return null;

    const content = (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center text-center z-10 p-3">
            {/* Skull Icon with Glow */}
            <motion.div
                className="relative mb-4"
                animate={{
                    scale: [1, 1.05, 1],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}>
                <div
                    className="w-16 h-16 rounded-full border-2 border-critical/60 flex items-center justify-center"
                    style={{
                        background: "radial-gradient(circle, hsl(var(--critical) / 0.2) 0%, transparent 70%)",
                        boxShadow: "0 0 30px hsl(var(--critical) / 0.4), inset 0 0 15px hsl(var(--critical) / 0.2)",
                    }}>
                    <SkullIcon
                        size={32}
                        className="text-critical"
                    />
                </div>
            </motion.div>

            {/* Title */}
            <motion.h1
                className="text-xl font-bold tracking-[0.2em] text-critical mb-1 hud-text"
                style={{
                    textShadow: "0 0 15px hsl(var(--critical) / 0.6), 0 0 30px hsl(var(--critical) / 0.3)",
                    fontFamily: "Orbitron, sans-serif",
                }}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}>
                {t.death.title}
            </motion.h1>

            {/* Subtitle */}
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">{displayMessage}</p>

            {/* Critical Health Bar */}
            <div className="w-full max-w-xs mb-4">
                <div className="flex items-center gap-1.5 mb-1">
                    <Heart
                        size={12}
                        className="text-critical"
                    />
                    <span className="text-[10px] text-critical uppercase tracking-wider">{t.death.critical}</span>
                </div>
                <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: "hsl(var(--muted) / 0.3)" }}>
                    <motion.div
                        className="h-full bg-critical rounded-full"
                        initial={{ width: "15%" }}
                        animate={{ width: ["15%", "5%", "15%"] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{
                            boxShadow: "0 0 8px hsl(var(--critical)), 0 0 15px hsl(var(--critical) / 0.5)",
                        }}
                    />
                </div>
            </div>

            {/* Respawn Timer */}
            <div className="mb-3">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">
                    {t.death.respawnIn}
                </span>
                <motion.div
                    className="hud-number text-2xl text-primary"
                    style={{
                        textShadow: "0 0 12px hsl(var(--primary) / 0.6)",
                        fontFamily: "Orbitron, sans-serif",
                    }}
                    key={respawnTimer}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}>
                    {formatTime(respawnTimer)}
                </motion.div>
            </div>

            {/* Wait Timer Progress Bar */}
            <div className="w-full max-w-xs mb-3">
                <div
                    className="h-0.5 rounded-full overflow-hidden border border-primary/30"
                    style={{ background: "hsl(var(--muted) / 0.2)" }}>
                    <motion.div
                        className="h-full bg-primary rounded-full"
                        style={{
                            width: `${waitProgress}%`,
                            boxShadow: "0 0 6px hsl(var(--primary))",
                        }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <div className="flex justify-between items-center mt-0.5">
                    <div className="flex items-center gap-1 text-[10px] text-primary">
                        <Clock size={8} />
                        <span>{t.death.waitTime}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground hud-number">{formatTime(waitTimer)}</span>
                </div>
            </div>

            {/* Info Text */}
            <p className="text-[10px] text-muted-foreground mb-4 max-w-xs">
                {t.death.infoText}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-3">
                {/* Call Help Button */}
                <motion.button
                    onClick={handleCallHelp}
                    disabled={!canCallHelp}
                    whileHover={canCallHelp ? { scale: 1.02 } : {}}
                    whileTap={canCallHelp ? { scale: 0.98 } : {}}
                    className={cn(
                        "relative flex items-center gap-2 px-3 py-2 transition-all overflow-hidden",
                        "clip-corner",
                        canCallHelp
                            ? "text-primary cursor-pointer"
                            : "text-muted-foreground cursor-not-allowed opacity-40"
                    )}
                    style={{
                        background: canCallHelp
                            ? "linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 100%)"
                            : "hsl(var(--muted) / 0.1)",
                        clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                    }}>
                    {/* Border frame */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: canCallHelp
                                ? "linear-gradient(135deg, hsl(var(--primary) / 0.6) 0%, hsl(var(--primary) / 0.2) 100%)"
                                : "hsl(var(--muted) / 0.3)",
                            clipPath:
                                "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                            padding: "1px",
                        }}
                    />
                    {/* Glow effect */}
                    {canCallHelp && (
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                background:
                                    "radial-gradient(ellipse at center, hsl(var(--primary) / 0.2) 0%, transparent 70%)",
                            }}
                        />
                    )}
                    <Phone
                        size={14}
                        className="relative z-10"
                    />
                    <div className="relative z-10 text-left">
                        <div
                            className="text-[11px] font-bold tracking-wider"
                            style={{ fontFamily: "Orbitron, sans-serif" }}>
                            {t.death.helpButton}
                        </div>
                    </div>
                    <span className="relative z-10 ml-1 px-1.5 py-0.5 bg-background/40 rounded text-[9px] font-bold tracking-wider border border-primary/30">
                        E
                    </span>
                </motion.button>

                {/* Respawn Button */}
                <motion.button
                    onClick={handleRespawn}
                    disabled={!canRespawn}
                    whileHover={canRespawn ? { scale: 1.02 } : {}}
                    whileTap={canRespawn ? { scale: 0.98 } : {}}
                    className={cn(
                        "relative flex items-center gap-2 px-3 py-2 transition-all overflow-hidden",
                        canRespawn
                            ? "text-foreground cursor-pointer"
                            : "text-muted-foreground cursor-not-allowed opacity-40"
                    )}
                    style={{
                        background: canRespawn
                            ? "linear-gradient(135deg, hsl(var(--foreground) / 0.1) 0%, hsl(var(--foreground) / 0.03) 100%)"
                            : "hsl(var(--muted) / 0.1)",
                        clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                    }}>
                    {/* Border frame */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: canRespawn
                                ? "linear-gradient(135deg, hsl(var(--foreground) / 0.5) 0%, hsl(var(--foreground) / 0.15) 100%)"
                                : "hsl(var(--muted) / 0.2)",
                            clipPath:
                                "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                            padding: "1px",
                        }}
                    />
                    {/* Glow effect */}
                    {canRespawn && (
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            animate={{ opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                background:
                                    "radial-gradient(ellipse at center, hsl(var(--foreground) / 0.1) 0%, transparent 70%)",
                            }}
                        />
                    )}
                    <RotateCcw
                        size={14}
                        className="relative z-10"
                    />
                    <div className="relative z-10 text-left">
                        <div
                            className="text-[11px] font-bold tracking-wider"
                            style={{ fontFamily: "Orbitron, sans-serif" }}>
                            {t.death.respawnButton}
                        </div>
                    </div>
                    <span className="relative z-10 ml-1 px-1.5 py-0.5 bg-background/40 rounded text-[9px] font-bold tracking-wider border border-foreground/20">
                        ↵
                    </span>
                </motion.button>
            </div>

            {/* Sync Position Button */}
            <motion.button
                onClick={handleSyncPosition}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition-all overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, hsl(var(--muted) / 0.15) 0%, hsl(var(--muted) / 0.05) 100%)",
                    clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                }}>
                {/* Border frame */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(135deg, hsl(var(--muted) / 0.4) 0%, hsl(var(--muted) / 0.15) 100%)",
                        clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude",
                        padding: "1px",
                    }}
                />
                <RefreshCw
                    size={10}
                    className="relative z-10"
                />
                <span
                    className="relative z-10 text-[9px] tracking-wider uppercase font-medium"
                    style={{ fontFamily: "Orbitron, sans-serif" }}>
                    {t.death.syncButton}
                </span>
                <span className="relative z-10 px-1 py-0.5 bg-background/40 rounded text-[8px] font-bold border border-muted/30">
                    F5
                </span>
            </motion.button>
        </motion.div>
    );

    // Widget mode: return content with blood splatters in a contained box
    return (
        <AnimatePresence>
            {visible && isDead && (
                <div className="relative bg-background/90 rounded-2xl border border-critical/30 overflow-hidden">
                    {/* Blood splatters scaled down for widget */}
                    <div className="absolute inset-0 pointer-events-none opacity-50">
                        <BloodSplatter position="top-left" delay={0} />
                        <BloodSplatter position="top-right" delay={0.3} />
                    </div>
                    {/* Red vignette */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: "radial-gradient(ellipse at center, transparent 30%, hsl(0 70% 20% / 0.3) 100%)",
                        }}
                    />
                    {content}
                </div>
            )}
        </AnimatePresence>
    );
};
    // Full screen overlay mode with red overlay and blood splatters
    return (
        <AnimatePresence>
            {visible && isDead && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto overflow-hidden">
                    
                    {/* Red screen overlay */}
                    <motion.div
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            background: "linear-gradient(to bottom, hsl(0 60% 10% / 0.85), hsl(0 40% 5% / 0.95))",
                        }}
                    />
                    
                    {/* Blood splatter effects in corners */}
                    <BloodSplatter position="top-left" delay={0} />
                    <BloodSplatter position="top-right" delay={0.3} />
                    <BloodSplatter position="bottom-left" delay={0.6} />
                    <BloodSplatter position="bottom-right" delay={0.9} />
                    
                    {/* Pulsing red vignette */}
                    <motion.div
                        className="absolute inset-0"
                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            background: "radial-gradient(ellipse at center, transparent 20%, hsl(0 70% 20% / 0.6) 100%)",
                        }}
                    />
                    
                    {/* Stronger edge vignette */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "radial-gradient(ellipse at center, transparent 30%, hsl(0 80% 8% / 0.9) 100%)",
                        }}
                    />
                    
                    {/* Scanline effect for atmosphere */}
                    <div
                        className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{
                            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(0 100% 50% / 0.1) 2px, hsl(0 100% 50% / 0.1) 4px)",
                        }}
                    />

                    {content}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
