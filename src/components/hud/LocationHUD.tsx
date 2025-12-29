import { Navigation, MapPin } from 'lucide-react';
import { LocationState } from '@/types/hud';
import { cn } from '@/lib/utils';

interface LocationHUDProps {
  location: LocationState;
}

const getDirectionRotation = (direction: string): number => {
  const directions: Record<string, number> = {
    'N': 0,
    'NE': 45,
    'E': 90,
    'SE': 135,
    'S': 180,
    'SW': 225,
    'W': 270,
    'NW': 315,
  };
  return directions[direction] || 0;
};

export const LocationHUD = ({ location }: LocationHUDProps) => {
  const rotation = getDirectionRotation(location.direction);

  return (
    <div className="glass-panel rounded-lg px-4 py-2 flex items-center gap-3 animate-fade-in-up">
      {/* Compass */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-primary/30" />
        <Navigation 
          className="text-primary transition-transform duration-300"
          size={18}
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      </div>
      
      {/* Direction Badge */}
      <div className="hud-text text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
        {location.direction}
      </div>
      
      {/* Street Name */}
      <div className="flex items-center gap-2">
        <MapPin className="text-muted-foreground" size={14} />
        <span className="text-sm font-medium text-foreground/90 max-w-[180px] truncate">
          {location.street}
        </span>
      </div>
      
      {/* Area */}
      {location.area && (
        <span className="text-xs text-muted-foreground">
          {location.area}
        </span>
      )}
    </div>
  );
};
