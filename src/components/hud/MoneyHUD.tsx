import { DollarSign, CreditCard, IdCard } from 'lucide-react';
import { MoneyState, PlayerState } from '@/types/hud';

interface MoneyHUDProps {
  money: MoneyState;
  player?: PlayerState;
}

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
};

export const MoneyHUD = ({ money, player }: MoneyHUDProps) => {
  return (
    <div className="flex flex-col gap-1.5 animate-slide-in-right">
      {/* Money Row */}
      <div className="glass-panel rounded-lg px-3 py-2 flex items-center gap-4">
        {/* Cash */}
        <div className="flex items-center gap-1.5">
          <DollarSign className="text-cash" size={14} />
          <span 
            className="hud-number text-sm text-cash"
            style={{ textShadow: '0 0 8px hsl(var(--cash) / 0.4)' }}
          >
            ${formatMoney(money.cash)}
          </span>
        </div>
        
        {/* Divider */}
        <div className="w-px h-4 bg-border/30" />
        
        {/* Bank */}
        <div className="flex items-center gap-1.5">
          <CreditCard className="text-bank" size={14} />
          <span 
            className="hud-number text-sm text-bank"
            style={{ textShadow: '0 0 8px hsl(var(--bank) / 0.4)' }}
          >
            ${formatMoney(money.bank)}
          </span>
        </div>
      </div>
      
      {/* Player Info Row */}
      {player && (
        <div className="glass-panel rounded-lg px-3 py-1.5 flex items-center gap-3">
          {/* ID */}
          <div className="flex items-center gap-1.5">
            <IdCard className="text-muted-foreground" size={12} />
            <span className="text-xs text-muted-foreground">ID:</span>
            <span className="hud-number text-xs text-foreground">{player.id}</span>
          </div>
          
          {/* Divider */}
          <div className="w-px h-3 bg-border/30" />
          
          {/* Job */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-foreground">{player.job}</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-primary">{player.rank}</span>
          </div>
        </div>
      )}
    </div>
  );
};
