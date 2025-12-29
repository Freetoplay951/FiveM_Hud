import { RadialStatus } from './RadialStatus';
import { HudState } from '@/types/hud';

interface StatusHUDProps {
  status: HudState;
}

export const StatusHUD = ({ status }: StatusHUDProps) => {
  return (
    <div className="flex items-center gap-2">
      <RadialStatus type="health" value={status.health} size={44} />
      {status.armor > 0 && (
        <RadialStatus type="armor" value={status.armor} size={44} />
      )}
      <RadialStatus type="hunger" value={status.hunger} size={44} />
      <RadialStatus type="thirst" value={status.thirst} size={44} />
      <RadialStatus type="stamina" value={status.stamina} size={44} />
    </div>
  );
};
