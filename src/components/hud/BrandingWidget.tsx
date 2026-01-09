import { motion } from "framer-motion";

export const BrandingWidget = () => {
    return (
        //Achtung: Darf nicht umbenannt werden (siehe useDemoSimulation)
        <div
            id="branding"
            className="fixed top-4 left-1/2 -translate-x-1/2 pointer-events-none z-40">
            <motion.div
                initial={{ opacity: 0, y: -30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative flex flex-col items-center justify-center">
                {/* Scanlines overlay */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                        background:
                            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
                    }}
                />

                {/* Massive outer glow - pulsing */}
                <motion.div
                    className="absolute inset-0 blur-3xl"
                    animate={{
                        opacity: [0.4, 0.7, 0.4],
                        scale: [1, 1.15, 1],
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}>
                    <div className="text-5xl font-bold tracking-widest">
                        <span className="text-primary">COMMUNITY</span>
                        <span className="text-secondary"> RP</span>
                    </div>
                </motion.div>

                {/* Secondary glow layer - offset for depth */}
                <motion.div
                    className="absolute inset-0 blur-2xl opacity-50"
                    animate={{
                        x: [-2, 2, -2],
                        y: [1, -1, 1],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}>
                    <div className="text-4xl font-bold tracking-widest">
                        <span style={{ color: "hsl(188 100% 70%)" }}>COMMUNITY</span>
                        <span style={{ color: "hsl(0 100% 70%)" }}> RP</span>
                    </div>
                </motion.div>

                {/* Main text container with glitch effect */}
                <div className="relative flex items-baseline gap-3">
                    {/* Glitch layer 1 - cyan offset */}
                    <motion.div
                        className="absolute inset-0 flex items-baseline gap-3"
                        animate={{
                            x: [-2, 0, 2, 0, -1, 0],
                            opacity: [0, 0.8, 0, 0.5, 0, 0],
                        }}
                        transition={{
                            duration: 0.15,
                            repeat: Infinity,
                            repeatDelay: 3,
                            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                        }}
                        style={{ clipPath: "inset(10% 0 60% 0)" }}>
                        <span className="text-3xl md:text-4xl font-bold tracking-[0.25em] text-primary">COMMUNITY</span>
                        <span className="text-3xl md:text-4xl font-bold tracking-[0.25em] text-secondary">RP</span>
                    </motion.div>

                    {/* Glitch layer 2 - red offset */}
                    <motion.div
                        className="absolute inset-0 flex items-baseline gap-3"
                        animate={{
                            x: [2, 0, -2, 0, 1, 0],
                            opacity: [0, 0.6, 0, 0.4, 0, 0],
                        }}
                        transition={{
                            duration: 0.15,
                            repeat: Infinity,
                            repeatDelay: 3,
                            delay: 0.05,
                            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                        }}
                        style={{ clipPath: "inset(40% 0 20% 0)" }}>
                        <span
                            className="text-3xl md:text-4xl font-bold tracking-[0.25em]"
                            style={{ color: "hsl(0 100% 50%)" }}>
                            COMMUNITY
                        </span>
                        <span
                            className="text-3xl md:text-4xl font-bold tracking-[0.25em]"
                            style={{ color: "hsl(188 100% 50%)" }}>
                            RP
                        </span>
                    </motion.div>

                    {/* COMMUNITY text - Cyan with intense glow */}
                    <motion.span
                        className="text-3xl md:text-4xl font-bold tracking-[0.25em] hud-text relative"
                        style={{
                            color: "hsl(var(--foreground))",
                            textShadow: `
                                0 0 5px hsl(188 100% 50% / 1),
                                0 0 10px hsl(188 100% 50% / 0.9),
                                0 0 20px hsl(188 100% 50% / 0.8),
                                0 0 40px hsl(188 100% 50% / 0.6),
                                0 0 80px hsl(188 100% 50% / 0.4),
                                0 0 120px hsl(188 100% 50% / 0.2)
                            `,
                        }}
                        animate={{
                            textShadow: [
                                `0 0 5px hsl(188 100% 50% / 1), 0 0 10px hsl(188 100% 50% / 0.9), 0 0 20px hsl(188 100% 50% / 0.8), 0 0 40px hsl(188 100% 50% / 0.6), 0 0 80px hsl(188 100% 50% / 0.4), 0 0 120px hsl(188 100% 50% / 0.2)`,
                                `0 0 8px hsl(188 100% 50% / 1), 0 0 16px hsl(188 100% 50% / 1), 0 0 32px hsl(188 100% 50% / 0.9), 0 0 64px hsl(188 100% 50% / 0.7), 0 0 100px hsl(188 100% 50% / 0.5), 0 0 150px hsl(188 100% 50% / 0.3)`,
                                `0 0 5px hsl(188 100% 50% / 1), 0 0 10px hsl(188 100% 50% / 0.9), 0 0 20px hsl(188 100% 50% / 0.8), 0 0 40px hsl(188 100% 50% / 0.6), 0 0 80px hsl(188 100% 50% / 0.4), 0 0 120px hsl(188 100% 50% / 0.2)`,
                            ],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}>
                        COMMUNITY
                    </motion.span>

                    {/* RP text - Red with intense glow and scale pulse */}
                    <motion.span
                        className="text-3xl md:text-4xl font-bold tracking-[0.25em] hud-text"
                        style={{
                            color: "hsl(0 100% 55%)",
                            textShadow: `
                                0 0 5px hsl(0 100% 50% / 1),
                                0 0 15px hsl(0 100% 50% / 1),
                                0 0 30px hsl(0 100% 50% / 0.9),
                                0 0 60px hsl(0 100% 50% / 0.7),
                                0 0 100px hsl(0 100% 50% / 0.5),
                                0 0 150px hsl(0 100% 50% / 0.3)
                            `,
                        }}
                        animate={{
                            textShadow: [
                                `0 0 5px hsl(0 100% 50% / 1), 0 0 15px hsl(0 100% 50% / 1), 0 0 30px hsl(0 100% 50% / 0.9), 0 0 60px hsl(0 100% 50% / 0.7), 0 0 100px hsl(0 100% 50% / 0.5), 0 0 150px hsl(0 100% 50% / 0.3)`,
                                `0 0 10px hsl(0 100% 50% / 1), 0 0 25px hsl(0 100% 50% / 1), 0 0 50px hsl(0 100% 50% / 1), 0 0 80px hsl(0 100% 50% / 0.8), 0 0 120px hsl(0 100% 50% / 0.6), 0 0 180px hsl(0 100% 50% / 0.4)`,
                                `0 0 5px hsl(0 100% 50% / 1), 0 0 15px hsl(0 100% 50% / 1), 0 0 30px hsl(0 100% 50% / 0.9), 0 0 60px hsl(0 100% 50% / 0.7), 0 0 100px hsl(0 100% 50% / 0.5), 0 0 150px hsl(0 100% 50% / 0.3)`,
                            ],
                            scale: [1, 1.05, 1],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.2,
                        }}>
                        RP
                    </motion.span>
                </div>

                {/* Animated underline with gradient sweep */}
                <motion.div
                    className="relative mt-2 h-[3px] overflow-hidden"
                    initial={{ width: 0 }}
                    animate={{ width: "110%" }}
                    transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}>
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(90deg, transparent, hsl(188 100% 50%), hsl(0 100% 50%), transparent)",
                            boxShadow: `
                                0 0 10px hsl(188 100% 50% / 0.8),
                                0 0 20px hsl(188 100% 50% / 0.5),
                                0 0 30px hsl(0 100% 50% / 0.5)
                            `,
                        }}
                    />
                    {/* Sweeping light on underline */}
                    <motion.div
                        className="absolute inset-0 bg-white/60"
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatDelay: 2,
                            ease: "easeInOut",
                        }}
                        style={{ width: "30%" }}
                    />
                </motion.div>

                {/* Floating particles around text */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 rounded-full"
                        style={{
                            background: i % 2 === 0 ? "hsl(188 100% 50%)" : "hsl(0 100% 50%)",
                            boxShadow:
                                i % 2 === 0
                                    ? "0 0 6px hsl(188 100% 50%), 0 0 12px hsl(188 100% 50%)"
                                    : "0 0 6px hsl(0 100% 50%), 0 0 12px hsl(0 100% 50%)",
                            left: `${10 + i * 12}%`,
                            top: "50%",
                        }}
                        animate={{
                            y: [0, -20 - i * 5, 0],
                            opacity: [0, 1, 0],
                            scale: [0.5, 1.2, 0.5],
                        }}
                        transition={{
                            duration: 2 + i * 0.3,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {/* Holographic shimmer effect */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 30%, transparent 35%)",
                    }}
                    initial={{ x: "-150%" }}
                    animate={{ x: "150%" }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        repeatDelay: 3,
                        ease: "easeInOut",
                    }}
                />

                {/* Corner accents */}
                <motion.div
                    className="absolute -left-4 -top-2 w-6 h-6 border-l-2 border-t-2 border-primary"
                    style={{ boxShadow: "0 0 10px hsl(188 100% 50% / 0.5)" }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                    className="absolute -right-4 -top-2 w-6 h-6 border-r-2 border-t-2 border-secondary"
                    style={{ boxShadow: "0 0 10px hsl(0 100% 50% / 0.5)" }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
                <motion.div
                    className="absolute -left-4 -bottom-4 w-6 h-6 border-l-2 border-b-2 border-secondary"
                    style={{ boxShadow: "0 0 10px hsl(0 100% 50% / 0.5)" }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />
                <motion.div
                    className="absolute -right-4 -bottom-4 w-6 h-6 border-r-2 border-b-2 border-primary"
                    style={{ boxShadow: "0 0 10px hsl(188 100% 50% / 0.5)" }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                />
            </motion.div>
        </div>
    );
};
