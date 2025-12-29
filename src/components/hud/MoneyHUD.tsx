import { DollarSign, CreditCard, Skull } from 'lucide-react';
import { MoneyState } from '@/types/hud';
import { cn } from '@/lib/utils';

interface MoneyHUDProps {
  money: MoneyState;
}

const formatMoney = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const MoneyHUD = ({ money }: MoneyHUDProps) => {
  return (
    <div className="glass-panel rounded-lg p-3 min-w-[160px] animate-slide-in-right">
      <div className="flex flex-col gap-2">
        {/* Cash */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <DollarSign className="text-cash" size={16} />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Cash</span>
          </div>
          <span 
            className="hud-number text-sm text-cash"
            style={{ textShadow: '0 0 10px hsl(var(--cash) / 0.5)' }}
          >
            ${formatMoney(money.cash)}
          </span>
        </div>

        {/* Bank */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CreditCard className="text-bank" size={16} />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Bank</span>
          </div>
          <span 
            className="hud-number text-sm text-bank"
            style={{ textShadow: '0 0 10px hsl(var(--bank) / 0.5)' }}
          >
            ${formatMoney(money.bank)}
          </span>
        </div>

        {/* Black Money (optional) */}
        {money.blackMoney !== undefined && money.blackMoney > 0 && (
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-border/30">
            <div className="flex items-center gap-2">
              <Skull className="text-blackMoney" size={16} />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Dirty</span>
            </div>
            <span 
              className="hud-number text-sm text-blackMoney"
              style={{ textShadow: '0 0 10px hsl(var(--black-money) / 0.5)' }}
            >
              ${formatMoney(money.blackMoney)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
