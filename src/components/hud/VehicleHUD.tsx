import { Gauge, Fuel, Cog } from 'lucide-react';
import { VehicleState } from '@/types/hud';
import { cn } from '@/lib/utils';

interface VehicleHUDProps {
  vehicle: VehicleState;
  visible: boolean;
}

export const VehicleHUD = ({ vehicle, visible }: VehicleHUDProps) => {
  if (!visible) return null;

  const speedPercent = Math.min((vehicle.speed / 280) * 100, 100);
  const fuelLow = vehicle.fuel <= 20;
  const fuelCritical = vehicle.fuel <= 10;

  return (
    <div className={cn(
      "glass-panel rounded-xl p-4 min-w-[180px]",
      visible ? "animate-fade-in-up" : "animate-fade-out-down"
    )}>
      {/* Speedometer */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative w-32 h-16 overflow-hidden">
          {/* Speed Arc Background */}
          <svg className="absolute inset-0" viewBox="0 0 100 50">
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="hsl(var(--muted) / 0.3)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Speed Arc Progress */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${speedPercent * 1.26} 126`}
              className="transition-all duration-150"
              style={{
                filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.6))',
              }}
            />
          </svg>
          
          {/* Speed Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="hud-number text-2xl text-foreground leading-none">
              {Math.round(vehicle.speed)}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              km/h
            </span>
          </div>
        </div>
      </div>

      {/* Gear & Fuel Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Gear */}
        <div className="flex items-center gap-2">
          <Cog className="text-muted-foreground" size={14} />
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6].map((gear) => (
              <span
                key={gear}
                className={cn(
                  "hud-number text-xs w-4 h-4 flex items-center justify-center rounded",
                  vehicle.gear === gear 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground/50"
                )}
              >
                {gear === 0 ? 'R' : gear}
              </span>
            ))}
          </div>
        </div>

        {/* Fuel */}
        <div className="flex items-center gap-2">
          <Fuel 
            className={cn(
              "transition-colors",
              fuelCritical ? "text-critical critical-pulse" : 
              fuelLow ? "text-warning warning-pulse" : 
              "text-muted-foreground"
            )} 
            size={14} 
          />
          <div className="w-16 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-300",
                fuelCritical ? "bg-critical" : 
                fuelLow ? "bg-warning" : 
                "bg-stamina"
              )}
              style={{ 
                width: `${vehicle.fuel}%`,
                boxShadow: fuelCritical 
                  ? '0 0 8px hsl(var(--critical))' 
                  : fuelLow 
                    ? '0 0 8px hsl(var(--warning))'
                    : '0 0 8px hsl(var(--stamina) / 0.5)',
              }}
            />
          </div>
          <span className={cn(
            "hud-number text-xs",
            fuelCritical ? "text-critical" : 
            fuelLow ? "text-warning" : 
            "text-muted-foreground"
          )}>
            {Math.round(vehicle.fuel)}%
          </span>
        </div>
      </div>
    </div>
  );
};
