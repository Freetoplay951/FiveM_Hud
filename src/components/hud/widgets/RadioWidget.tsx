import { motion, AnimatePresence } from "framer-motion";
import { Radio, User } from "lucide-react";
import { RadioState } from "@/types/hud";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/contexts/LanguageContext";

interface RadioWidgetProps {
    radio: RadioState;
}

export const RadioWidget = ({ radio }: RadioWidgetProps) => {
    const { t } = useTranslation();
    
    if (!radio.active || radio.members.length === 0) {
        return null;
    }

    return (
        <motion.div
            className="glass-panel rounded-lg overflow-hidden"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            style={{ width: 180 }}>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-info/10">
                <Radio
                    size={12}
                    className="text-info"
                />
                <span className="text-[10px] font-medium text-info uppercase tracking-wider">{t.radio.title}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{radio.channel}</span>
            </div>

            {/* Members */}
            <div className="p-2 space-y-1 max-h-[200px] overflow-y-auto scrollbar-thin">
                <AnimatePresence mode="popLayout">
                    {radio.members.map((member) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className={cn(
                                "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors",
                                member.talking ? "bg-info/20 border border-info/30" : "bg-background/30"
                            )}>
                            {/* Avatar */}
                            <div
                                className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center overflow-hidden",
                                    member.talking ? "ring-2 ring-info" : "bg-muted/30"
                                )}>
                                {member.avatar ? (
                                    <img
                                        src={member.avatar}
                                        alt={member.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User
                                        size={12}
                                        className="text-muted-foreground"
                                    />
                                )}
                            </div>

                            {/* Name */}
                            <span
                                className={cn(
                                    "text-xs flex-1 truncate",
                                    member.talking ? "text-info font-medium" : "text-foreground"
                                )}>
                                {member.name}
                            </span>

                            {/* Talking indicator */}
                            {member.talking && (
                                <motion.div
                                    className="flex items-center gap-0.5"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}>
                                    {[1, 2, 3].map((bar) => (
                                        <motion.div
                                            key={bar}
                                            className="w-0.5 bg-info rounded-full"
                                            animate={{ height: [4, 8, 4] }}
                                            transition={{
                                                duration: 0.4,
                                                repeat: Infinity,
                                                delay: bar * 0.1,
                                            }}
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 border-t border-border/30 bg-background/20">
                <span className="text-[9px] text-muted-foreground">{radio.members.length} {t.radio.participants}</span>
            </div>
        </motion.div>
    );
};
