import { motion } from "framer-motion";

export const BrandingWidget = () => {
    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 pointer-events-none z-40">
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative flex items-center justify-center"
            >
                {/* Outer glow layer - dual color */}
                <motion.div
                    className="absolute inset-0 blur-2xl opacity-40"
                    animate={{
                        opacity: [0.3, 0.5, 0.3],
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    <div className="text-4xl font-bold tracking-widest">
                        <span className="text-primary">COMMUNITY</span>
                        <span style={{ color: "hsl(0 100% 50%)" }}> RP</span>
                    </div>
                </motion.div>

                {/* Main text container */}
                <div className="relative flex items-baseline gap-2">
                    {/* COMMUNITY text - Cyan */}
                    <motion.span
                        className="text-3xl md:text-4xl font-bold tracking-[0.2em] hud-text"
                        style={{
                            color: "hsl(var(--foreground))",
                            textShadow: `
                                0 0 10px hsl(188 100% 50% / 0.8),
                                0 0 20px hsl(188 100% 50% / 0.6),
                                0 0 40px hsl(188 100% 50% / 0.4),
                                0 0 60px hsl(188 100% 50% / 0.2)
                            `,
                        }}
                        animate={{
                            textShadow: [
                                `0 0 10px hsl(188 100% 50% / 0.8), 0 0 20px hsl(188 100% 50% / 0.6), 0 0 40px hsl(188 100% 50% / 0.4), 0 0 60px hsl(188 100% 50% / 0.2)`,
                                `0 0 15px hsl(188 100% 50% / 1), 0 0 30px hsl(188 100% 50% / 0.8), 0 0 50px hsl(188 100% 50% / 0.5), 0 0 80px hsl(188 100% 50% / 0.3)`,
                                `0 0 10px hsl(188 100% 50% / 0.8), 0 0 20px hsl(188 100% 50% / 0.6), 0 0 40px hsl(188 100% 50% / 0.4), 0 0 60px hsl(188 100% 50% / 0.2)`,
                            ],
                        }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        COMMUNITY
                    </motion.span>

                    {/* RP text - Red/Magenta */}
                    <motion.span
                        className="text-3xl md:text-4xl font-bold tracking-[0.2em] hud-text"
                        style={{
                            color: "hsl(0 100% 50%)",
                            textShadow: `
                                0 0 10px hsl(0 100% 50% / 1),
                                0 0 25px hsl(0 100% 50% / 0.8),
                                0 0 50px hsl(0 100% 50% / 0.6),
                                0 0 80px hsl(0 100% 50% / 0.4)
                            `,
                        }}
                        animate={{
                            textShadow: [
                                `0 0 10px hsl(0 100% 50% / 1), 0 0 25px hsl(0 100% 50% / 0.8), 0 0 50px hsl(0 100% 50% / 0.6), 0 0 80px hsl(0 100% 50% / 0.4)`,
                                `0 0 20px hsl(0 100% 50% / 1), 0 0 40px hsl(0 100% 50% / 1), 0 0 70px hsl(0 100% 50% / 0.8), 0 0 100px hsl(0 100% 50% / 0.5)`,
                                `0 0 10px hsl(0 100% 50% / 1), 0 0 25px hsl(0 100% 50% / 0.8), 0 0 50px hsl(0 100% 50% / 0.6), 0 0 80px hsl(0 100% 50% / 0.4)`,
                            ],
                            scale: [1, 1.02, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.3,
                        }}
                    >
                        RP
                    </motion.span>
                </div>

                {/* Underline glow effect - gradient from cyan to red */}
                <motion.div
                    className="absolute -bottom-2 left-1/2 h-[2px]"
                    style={{
                        background: "linear-gradient(90deg, transparent, hsl(188 100% 50%), hsl(0 100% 50%), transparent)",
                        boxShadow: `
                            0 0 10px hsl(188 100% 50% / 0.8),
                            0 0 20px hsl(0 100% 50% / 0.5)
                        `,
                    }}
                    initial={{ width: 0, x: "-50%" }}
                    animate={{ width: "120%", x: "-50%" }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                />

                {/* Animated shimmer effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    initial={{ x: "-200%" }}
                    animate={{ x: "200%" }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 4,
                        ease: "easeInOut",
                    }}
                    style={{ width: "50%" }}
                />
            </motion.div>
        </div>
    );
};