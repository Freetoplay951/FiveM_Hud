import { motion } from "framer-motion";
import { DollarSign, CreditCard, Briefcase, Banknote } from "lucide-react";
import { MoneyState, PlayerState } from "@/types/hud";

interface MoneyWidgetProps {
    money: MoneyState;
    player?: PlayerState;
}

const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
        style: "decimal",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const MoneyWidget = ({ money, player }: MoneyWidgetProps) => {
    return (
        <motion.div
            className="flex flex-col gap-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}>
            {/* Player Info Row */}
            {player && (
                <div className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">ID</span>
                    <span
                        className="hud-number text-xs text-foreground"
                        style={{ textShadow: "0 0 6px hsl(var(--foreground) / 0.3)" }}>
                        {player.id}
                    </span>
                    <div className="w-px h-3 bg-border/30" />
                    <Briefcase
                        size={10}
                        className="text-primary"
                    />
                    <span
                        className="text-[10px] text-primary"
                        style={{ textShadow: "0 0 6px hsl(var(--primary) / 0.4)" }}>
                        {player.job}
                        {player.rank ? ` (${player.rank})` : ""}
                    </span>
                </div>
            )}

            {/* Cash */}
            <div className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2">
                <DollarSign
                    size={12}
                    className="text-cash"
                    style={{ filter: "drop-shadow(0 0 4px hsl(var(--cash) / 0.5))" }}
                />
                <span
                    className="hud-number text-sm text-cash"
                    style={{ textShadow: "0 0 10px hsl(var(--cash) / 0.5)" }}>
                    ${formatMoney(money.cash)}
                </span>
            </div>

            {/* Bank */}
            <div className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2">
                <CreditCard
                    size={12}
                    className="text-bank"
                    style={{ filter: "drop-shadow(0 0 4px hsl(var(--bank) / 0.5))" }}
                />
                <span
                    className="hud-number text-sm text-bank"
                    style={{ textShadow: "0 0 10px hsl(var(--bank) / 0.5)" }}>
                    ${formatMoney(money.bank)}
                </span>
            </div>

            {/* Black Money - nur anzeigen wenn vorhanden */}
            {money.blackMoney !== undefined && money.blackMoney > 0 && (
                <div className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <Banknote
                        size={12}
                        className="text-black-money"
                        style={{ filter: "drop-shadow(0 0 4px hsl(var(--black-money) / 0.5))" }}
                    />
                    <span
                        className="hud-number text-sm text-black-money"
                        style={{ textShadow: "0 0 10px hsl(var(--black-money) / 0.5)" }}>
                        ${formatMoney(money.blackMoney)}
                    </span>
                </div>
            )}
        </motion.div>
    );
};
