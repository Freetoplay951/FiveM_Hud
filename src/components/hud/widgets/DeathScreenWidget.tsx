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
            <div className="flex gap-3 mb-4">
                {/* Call Help Button */}
                <button
                    onClick={handleCallHelp}
                    disabled={!canCallHelp}
                    className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-lg transition-all",
                        "border border-primary/50",
                        canCallHelp 
                            ? "bg-primary/20 hover:bg-primary/30 text-primary" 
                            : "bg-muted/20 text-muted-foreground cursor-not-allowed opacity-50"
                    )}
                    style={canCallHelp ? {
                        boxShadow: "0 0 15px hsl(var(--primary) / 0.3), inset 0 0 10px hsl(var(--primary) / 0.1)"
                    } : {}}
                >
                    <span className="px-2 py-0.5 bg-background/50 rounded text-xs font-bold">E</span>
                    <Phone size={16} />
                    <div className="text-left">
                        <div className="text-sm font-semibold tracking-wide">HILFE</div>
                        <div className="text-xs opacity-80">RUFEN</div>
                    </div>
                </button>

                {/* Respawn Button */}
                <button
                    onClick={handleRespawn}
                    disabled={!canRespawn}
                    className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-lg transition-all",
                        "border border-white/20",
                        canRespawn 
                            ? "bg-muted/30 hover:bg-muted/50 text-foreground" 
                            : "bg-muted/10 text-muted-foreground cursor-not-allowed opacity-50"
                    )}
                >
                    <span className="px-1.5 py-0.5 bg-background/50 rounded text-[10px] font-bold">ENTER</span>
                    <RotateCcw size={14} className="text-muted-foreground" />
                    <span className="text-sm font-semibold tracking-wide">RESPAWN</span>
                </button>
            </div>

            {/* Sync Position Button */}
            <button
                onClick={handleSyncPosition}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-background/30 hover:bg-background/50 transition-colors text-muted-foreground hover:text-foreground"
            >
                <span className="px-1.5 py-0.5 bg-background/50 rounded text-[10px] font-bold">F5</span>
                <RefreshCw size={12} />
                <span className="text-xs tracking-wide">POSITION SYNCHRONISIEREN</span>
            </button>
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
