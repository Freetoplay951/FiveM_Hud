import { motion, AnimatePresence } from "framer-motion";
import { Skull, Phone, RotateCcw, RefreshCw, Clock, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeathState } from "@/types/hud";
import { sendNuiCallback } from "@/hooks/useNuiEvents";

interface DeathScreenWidgetProps {
    death: DeathState;
    visible: boolean;
    isWidget?: boolean; // When used as movable widget, don't show full overlay
}

export const DeathScreenWidget = ({ death, visible, isWidget = false }: DeathScreenWidgetProps) => {
    const { 
        isDead, 
        respawnTimer, 
        waitTimer,
        canCallHelp = true,
        canRespawn = false,
        message = "Du wurdest schwer verletzt und benötigst medizinische Hilfe"
    } = death;

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    // Calculate progress percentage
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
            className={cn(
                "flex flex-col items-center text-center",
                isWidget ? "p-4" : "p-8"
            )}
        >
            {/* Skull Icon with Glow */}
            <motion.div
                className="relative mb-4"
                animate={{ 
                    scale: [1, 1.05, 1],
                }}
                transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <div 
                    className="w-24 h-24 rounded-full border-2 border-critical/60 flex items-center justify-center"
                    style={{
                        background: "radial-gradient(circle, hsl(var(--critical) / 0.2) 0%, transparent 70%)",
                        boxShadow: "0 0 40px hsl(var(--critical) / 0.4), inset 0 0 20px hsl(var(--critical) / 0.2)"
                    }}
                >
                    <Skull 
                        size={48} 
                        className="text-critical"
                        style={{ filter: "drop-shadow(0 0 10px hsl(var(--critical)))" }}
                    />
                </div>
            </motion.div>

            {/* Title */}
            <motion.h1
                className="text-3xl font-bold tracking-[0.3em] text-critical mb-2 hud-text"
                style={{ 
                    textShadow: "0 0 20px hsl(var(--critical) / 0.6), 0 0 40px hsl(var(--critical) / 0.3)",
                    fontFamily: "Orbitron, sans-serif"
                }}
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                BEWUSSTLOS
            </motion.h1>

            {/* Subtitle */}
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
                {message}
            </p>

            {/* Critical Health Bar */}
            <div className="w-full max-w-sm mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <Heart size={14} className="text-critical" />
                    <span className="text-xs text-critical uppercase tracking-wider">KRITISCH</span>
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
                        style={{ 
                            boxShadow: "0 0 10px hsl(var(--critical)), 0 0 20px hsl(var(--critical) / 0.5)" 
                        }}
                    />
                </div>
            </div>

            {/* Respawn Timer */}
            <div className="mb-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
                    RESPAWN MÖGLICH IN
                </span>
                <motion.div
                    className="hud-number text-4xl text-primary"
                    style={{ 
                        textShadow: "0 0 15px hsl(var(--primary) / 0.6)",
                        fontFamily: "Orbitron, sans-serif"
                    }}
                    key={respawnTimer}
                    initial={{ scale: 1.1 }}
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
                        style={{ 
                            width: `${waitProgress}%`,
                            boxShadow: "0 0 8px hsl(var(--primary))" 
                        }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-1 text-xs text-primary">
                        <Clock size={10} />
                        <span>Wartezeit</span>
                    </div>
                    <span className="text-xs text-muted-foreground hud-number">
                        {formatTime(waitTimer)}
                    </span>
                </div>
            </div>

            {/* Info Text */}
            <p className="text-xs text-muted-foreground mb-6 max-w-md">
                Warte auf den Rettungsdienst oder respawne im Krankenhaus
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-4">
                {/* Call Help Button */}
                <motion.button
                    onClick={handleCallHelp}
                    disabled={!canCallHelp}
                    whileHover={canCallHelp ? { scale: 1.02 } : {}}
                    whileTap={canCallHelp ? { scale: 0.98 } : {}}
                    className={cn(
                        "relative flex items-center gap-3 px-5 py-3 transition-all overflow-hidden",
                        "clip-corner",
                        canCallHelp 
                            ? "text-primary cursor-pointer" 
                            : "text-muted-foreground cursor-not-allowed opacity-40"
                    )}
                    style={{
                        background: canCallHelp 
                            ? "linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 100%)"
                            : "hsl(var(--muted) / 0.1)",
                        clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))"
                    }}
                >
                    {/* Border frame */}
                    <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: canCallHelp
                                ? "linear-gradient(135deg, hsl(var(--primary) / 0.6) 0%, hsl(var(--primary) / 0.2) 100%)"
                                : "hsl(var(--muted) / 0.3)",
                            clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                            padding: "1px"
                        }}
                    />
                    {/* Glow effect */}
                    {canCallHelp && (
                        <motion.div 
                            className="absolute inset-0 pointer-events-none"
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.2) 0%, transparent 70%)"
                            }}
                        />
                    )}
                    <Phone size={18} className="relative z-10" />
                    <div className="relative z-10 text-left">
                        <div className="text-sm font-bold tracking-wider" style={{ fontFamily: "Orbitron, sans-serif" }}>HILFE RUFEN</div>
                        <div className="text-[10px] opacity-60 tracking-wide">Rettungsdienst benachrichtigen</div>
                    </div>
                    <span className="relative z-10 ml-2 px-2 py-1 bg-background/40 rounded text-[10px] font-bold tracking-wider border border-primary/30">E</span>
                </motion.button>

                {/* Respawn Button */}
                <motion.button
                    onClick={handleRespawn}
                    disabled={!canRespawn}
                    whileHover={canRespawn ? { scale: 1.02 } : {}}
                    whileTap={canRespawn ? { scale: 0.98 } : {}}
                    className={cn(
                        "relative flex items-center gap-3 px-5 py-3 transition-all overflow-hidden",
                        canRespawn 
                            ? "text-foreground cursor-pointer" 
                            : "text-muted-foreground cursor-not-allowed opacity-40"
                    )}
                    style={{
                        background: canRespawn 
                            ? "linear-gradient(135deg, hsl(var(--foreground) / 0.1) 0%, hsl(var(--foreground) / 0.03) 100%)"
                            : "hsl(var(--muted) / 0.1)",
                        clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))"
                    }}
                >
                    {/* Border frame */}
                    <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: canRespawn
                                ? "linear-gradient(135deg, hsl(var(--foreground) / 0.5) 0%, hsl(var(--foreground) / 0.15) 100%)"
                                : "hsl(var(--muted) / 0.2)",
                            clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                            padding: "1px"
                        }}
                    />
                    {/* Glow effect */}
                    {canRespawn && (
                        <motion.div 
                            className="absolute inset-0 pointer-events-none"
                            animate={{ opacity: [0.2, 0.4, 0.2] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                background: "radial-gradient(ellipse at center, hsl(var(--foreground) / 0.1) 0%, transparent 70%)"
                            }}
                        />
                    )}
                    <RotateCcw size={18} className="relative z-10" />
                    <div className="relative z-10 text-left">
                        <div className="text-sm font-bold tracking-wider" style={{ fontFamily: "Orbitron, sans-serif" }}>RESPAWN</div>
                        <div className="text-[10px] opacity-60 tracking-wide">Im Krankenhaus aufwachen</div>
                    </div>
                    <span className="relative z-10 ml-2 px-2 py-1 bg-background/40 rounded text-[10px] font-bold tracking-wider border border-foreground/20">↵</span>
                </motion.button>
            </div>

            {/* Sync Position Button - same style but smaller/subtle accent */}
            <motion.button
                onClick={handleSyncPosition}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-all overflow-hidden"
                style={{
                    background: "linear-gradient(135deg, hsl(var(--muted) / 0.15) 0%, hsl(var(--muted) / 0.05) 100%)",
                    clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))"
                }}
            >
                {/* Border frame */}
                <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: "linear-gradient(135deg, hsl(var(--muted) / 0.4) 0%, hsl(var(--muted) / 0.15) 100%)",
                        clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude",
                        padding: "1px"
                    }}
                />
                <RefreshCw size={14} className="relative z-10" />
                <span className="relative z-10 text-[10px] tracking-wider uppercase font-medium" style={{ fontFamily: "Orbitron, sans-serif" }}>Position synchronisieren</span>
                <span className="relative z-10 px-1.5 py-0.5 bg-background/40 rounded text-[9px] font-bold border border-muted/30">F5</span>
            </motion.button>
        </motion.div>
    );

    // If used as widget (movable), just return the content
    if (isWidget) {
        return (
            <AnimatePresence>
                {visible && isDead && (
                    <div className="bg-background/90 backdrop-blur-md rounded-2xl border border-critical/30">
                        {content}
                    </div>
                )}
            </AnimatePresence>
        );
    }

    // Full screen overlay mode
    return (
        <AnimatePresence>
            {visible && isDead && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
                    style={{
                        background: "radial-gradient(ellipse at center, hsl(0 30% 8% / 0.95) 0%, hsl(0 20% 3% / 0.98) 100%)"
                    }}
                >
                    {/* Animated red vignette effect */}
                    <motion.div
                        className="absolute inset-0"
                        animate={{ opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{
                            background: "radial-gradient(ellipse at center, transparent 40%, hsl(var(--critical) / 0.15) 100%)"
                        }}
                    />
                    
                    {content}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
