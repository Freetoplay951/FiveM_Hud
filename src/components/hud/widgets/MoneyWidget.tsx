import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, CreditCard, Briefcase, Banknote } from "lucide-react";
import { MoneyState, PlayerState } from "@/types/hud";
import { useRenderLogger } from "@/hooks/useRenderLogger";

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

// Static animation config
const motionConfig = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
} as const;

// Memoized static styles
const ICON_STYLES = {
    cash: { filter: "drop-shadow(0 0 4px hsl(var(--cash) / 0.5))" },
    bank: { filter: "drop-shadow(0 0 4px hsl(var(--bank) / 0.5))" },
    blackMoney: { filter: "drop-shadow(0 0 4px hsl(var(--black-money) / 0.5))" },
} as const;

const TEXT_STYLES = {
    id: { textShadow: "0 0 6px hsl(var(--foreground) / 0.3)" },
    job: { textShadow: "0 0 6px hsl(var(--primary) / 0.4)" },
    cash: { textShadow: "0 0 10px hsl(var(--cash) / 0.5)" },
    bank: { textShadow: "0 0 10px hsl(var(--bank) / 0.5)" },
    blackMoney: { textShadow: "0 0 10px hsl(var(--black-money) / 0.5)" },
} as const;

// Memoized player info row
const PlayerInfoRow = memo(({ player }: { player: PlayerState }) => (
    <div className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">ID</span>
        <span className="hud-number text-xs text-foreground" style={TEXT_STYLES.id}>
            {player.id}
        </span>
        <div className="w-px h-3 bg-border/30" />
        <Briefcase size={10} className="text-primary" />
        <span className="text-[10px] text-primary" style={TEXT_STYLES.job}>
            {player.job}
            {player.rank ? ` (${player.rank})` : ""}
        </span>
    </div>
));
PlayerInfoRow.displayName = "PlayerInfoRow";

// Memoized money row component
const MoneyRow = memo(({ 
    icon: Icon, 
    value, 
    colorClass, 
    iconStyle, 
    textStyle 
}: { 
    icon: typeof DollarSign; 
    value: number; 
    colorClass: string;
    iconStyle: React.CSSProperties;
    textStyle: React.CSSProperties;
}) => (
    <div className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2">
        <Icon size={12} className={colorClass} style={iconStyle} />
        <span className={`hud-number text-sm ${colorClass}`} style={textStyle}>
            ${formatMoney(value)}
        </span>
    </div>
));
MoneyRow.displayName = "MoneyRow";

const MoneyWidgetComponent = ({ money, player }: MoneyWidgetProps) => {
    // Performance logging
    useRenderLogger("MoneyWidget", { 
        cash: money.cash, 
        bank: money.bank, 
        blackMoney: money.blackMoney,
        playerId: player?.id 
    });

    const showBlackMoney = useMemo(
        () => money.blackMoney !== undefined && money.blackMoney > 0,
        [money.blackMoney]
    );

    return (
        <motion.div className="flex flex-col gap-1" {...motionConfig}>
            {player && <PlayerInfoRow player={player} />}
            
            <MoneyRow 
                icon={DollarSign}
                value={money.cash}
                colorClass="text-cash"
                iconStyle={ICON_STYLES.cash}
                textStyle={TEXT_STYLES.cash}
            />
            
            <MoneyRow 
                icon={CreditCard}
                value={money.bank}
                colorClass="text-bank"
                iconStyle={ICON_STYLES.bank}
                textStyle={TEXT_STYLES.bank}
            />
            
            {showBlackMoney && (
                <MoneyRow 
                    icon={Banknote}
                    value={money.blackMoney!}
                    colorClass="text-black-money"
                    iconStyle={ICON_STYLES.blackMoney}
                    textStyle={TEXT_STYLES.blackMoney}
                />
            )}
        </motion.div>
    );
};

export const MoneyWidget = memo(MoneyWidgetComponent);
