import { useState, useEffect } from 'react';
import { StatusHUD } from './hud/StatusHUD';
import { VehicleHUD } from './hud/VehicleHUD';
import { MoneyHUD } from './hud/MoneyHUD';
import { VoiceIndicator } from './hud/VoiceIndicator';
import { LocationHUD } from './hud/LocationHUD';
import { MinimapFrame } from './hud/MinimapFrame';
import { useNuiEvents, isNuiEnvironment } from '@/hooks/useNuiEvents';
import { HudState, VehicleState, MoneyState, VoiceState, LocationState, PlayerState } from '@/types/hud';

// Demo values for development
const DEMO_HUD: HudState = { health: 85, armor: 50, hunger: 70, thirst: 45, stamina: 90 };
const DEMO_VEHICLE: VehicleState = { inVehicle: true, speed: 127, gear: 4, fuel: 65 };
const DEMO_MONEY: MoneyState = { cash: 15420, bank: 234567 };
const DEMO_PLAYER: PlayerState = { id: 42, job: 'Polizei', rank: 'Kommissar' };
const DEMO_VOICE: VoiceState = { active: true, range: 'normal' };
const DEMO_LOCATION: LocationState = { street: 'Vinewood Boulevard', direction: 'NE', area: 'Vinewood' };

export const HUD = () => {
  const [hudState, setHudState] = useState<HudState>(DEMO_HUD);
  const [vehicleState, setVehicleState] = useState<VehicleState>(DEMO_VEHICLE);
  const [moneyState, setMoneyState] = useState<MoneyState>(DEMO_MONEY);
  const [playerState, setPlayerState] = useState<PlayerState>(DEMO_PLAYER);
  const [voiceState, setVoiceState] = useState<VoiceState>(DEMO_VOICE);
  const [locationState, setLocationState] = useState<LocationState>(DEMO_LOCATION);
  const [isDemoMode, setIsDemoMode] = useState(!isNuiEnvironment());

  // NUI Event handlers
  useNuiEvents({
    onUpdateHud: setHudState,
    onUpdateVehicle: setVehicleState,
    onUpdateMoney: setMoneyState,
    onUpdateVoice: setVoiceState,
    onUpdateLocation: setLocationState,
  });

  // Demo mode simulation
  useEffect(() => {
    if (!isDemoMode) return;

    const interval = setInterval(() => {
      setHudState(prev => ({
        ...prev,
        hunger: Math.max(0, prev.hunger - 0.1),
        thirst: Math.max(0, prev.thirst - 0.15),
        stamina: Math.min(100, Math.max(0, prev.stamina + (Math.random() - 0.5) * 5)),
      }));

      setVehicleState(prev => ({
        ...prev,
        speed: prev.inVehicle ? Math.min(280, Math.max(0, prev.speed + (Math.random() - 0.5) * 20)) : 0,
        fuel: Math.max(0, prev.fuel - 0.02),
      }));

      setVoiceState(prev => ({
        ...prev,
        active: Math.random() > 0.3,
      }));
    }, 500);

    return () => clearInterval(interval);
  }, [isDemoMode]);

  // Demo: Toggle vehicle on keypress
  useEffect(() => {
    if (!isDemoMode) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'v') {
        setVehicleState(prev => ({ ...prev, inVehicle: !prev.inVehicle }));
      }
      if (e.key === 'r') {
        setVoiceState(prev => ({
          ...prev,
          range: prev.range === 'whisper' ? 'normal' : prev.range === 'normal' ? 'shout' : 'whisper',
        }));
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [isDemoMode]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Demo Mode Badge */}
      {isDemoMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel rounded-lg px-4 py-2 animate-fade-in-up">
          <span className="text-xs text-primary uppercase tracking-wider hud-text">
            Demo Mode • Press V to toggle vehicle • Press R to change voice range
          </span>
        </div>
      )}

      {/* Top Right - Money & Player Info */}
      <div className="absolute top-6 right-6">
        <MoneyHUD money={moneyState} player={playerState} />
      </div>

      {/* Bottom Left - Minimap, Location, Status */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-3">
        <MinimapFrame />
        <LocationHUD location={locationState} />
        <div className="glass-panel rounded-lg px-3 py-2">
          <StatusHUD status={hudState} />
        </div>
      </div>

      {/* Bottom Right - Vehicle HUD */}
      <div className="absolute bottom-6 right-6">
        <VehicleHUD vehicle={vehicleState} visible={vehicleState.inVehicle} />
      </div>

      {/* Bottom Center - Voice Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <VoiceIndicator voice={voiceState} />
      </div>
    </div>
  );
};
