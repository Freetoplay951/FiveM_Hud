import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { HUDWidget } from './hud/HUDWidget';
import { VehicleHUDFactory } from './hud/VehicleHUDFactory';
import { EditModeOverlay } from './hud/EditModeOverlay';
import { StatusWidget } from './hud/widgets/StatusWidget';
import { NeonMoneyWidget } from './hud/widgets/NeonMoneyWidget';
import { NeonLocationWidget } from './hud/widgets/NeonLocationWidget';
import { NeonVoiceWidget } from './hud/widgets/NeonVoiceWidget';
import { NeonMinimapWidget } from './hud/widgets/NeonMinimapWidget';
import { ClockWidget } from './hud/widgets/ClockWidget';
import { CompassWidget } from './hud/widgets/CompassWidget';
import { NotificationContainer } from './hud/NotificationContainer';
import { useHUDLayout } from '@/hooks/useHUDLayout';
import { useNuiEvents, isNuiEnvironment } from '@/hooks/useNuiEvents';
import { useNotifications } from '@/hooks/useNotifications';
import { HudState, VehicleState, MoneyState, VoiceState, LocationState, PlayerState, StatusType } from '@/types/hud';

// Demo values
const DEMO_HUD: HudState = { health: 85, armor: 50, hunger: 70, thirst: 45, stamina: 90, stress: 25, oxygen: 100 };
const DEMO_VEHICLE: VehicleState = { inVehicle: true, vehicleType: 'car', speed: 127, gear: 4, fuel: 65 };
const DEMO_MONEY: MoneyState = { cash: 15420, bank: 234567, blackMoney: 5000 };
const DEMO_PLAYER: PlayerState = { id: 42, job: 'LSPD', rank: 'Chief' };
const DEMO_VOICE: VoiceState = { active: true, range: 'normal' };
const DEMO_LOCATION: LocationState = { street: 'Vinewood Boulevard', direction: 'NE', area: 'Vinewood' };

export const HUD = () => {
  const [hudState, setHudState] = useState<HudState>(DEMO_HUD);
  const [vehicleState, setVehicleState] = useState<VehicleState>(DEMO_VEHICLE);
  const [moneyState, setMoneyState] = useState<MoneyState>(DEMO_MONEY);
  const [playerState] = useState<PlayerState>(DEMO_PLAYER);
  const [voiceState, setVoiceState] = useState<VoiceState>(DEMO_VOICE);
  const [locationState, setLocationState] = useState<LocationState>(DEMO_LOCATION);
  const [isDemoMode] = useState(!isNuiEnvironment());
  const [currentTime, setCurrentTime] = useState('18:24');

  const [isMovingWidgets, setIsMovingWidgets] = useState(false);

  const {
    widgets,
    editMode,
    snapToGrid,
    showSafezone,
    gridSize,
    statusDesign,
    toggleEditMode,
    setSnapToGrid,
    setShowSafezone,
    setStatusDesign,
    updateWidgetPosition,
    toggleWidgetVisibility,
    resetLayout,
    getWidget,
  } = useHUDLayout();

  const { notifications, removeNotification, success, error, warning, info } = useNotifications();

  // NUI Event handlers
  useNuiEvents({
    onUpdateHud: setHudState,
    onUpdateVehicle: setVehicleState,
    onUpdateMoney: setMoneyState,
    onUpdateVoice: setVoiceState,
    onUpdateLocation: setLocationState,
  });

  // Demo simulation
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

  // Clock update
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Demo key controls
  useEffect(() => {
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
      if (e.key === 'e') {
        toggleEditMode();
      }
      // Vehicle type switching for demo
      if (e.key === '1') setVehicleState(prev => ({ ...prev, vehicleType: 'car' }));
      if (e.key === '2') setVehicleState(prev => ({ ...prev, vehicleType: 'plane', altitude: 500, pitch: 5, roll: 0, heading: 180, airspeed: 250 }));
      if (e.key === '3') setVehicleState(prev => ({ ...prev, vehicleType: 'boat', heading: 90, anchor: false }));
      if (e.key === '4') setVehicleState(prev => ({ ...prev, vehicleType: 'helicopter', altitude: 200, rotorRpm: 95, verticalSpeed: 5 }));
      // Demo notifications
      if (e.key === 'n') success('Erfolg!', 'Aktion erfolgreich ausgeführt.');
      if (e.key === 'm') error('Fehler!', 'Etwas ist schief gelaufen.');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMovingWidgets) {
          setIsMovingWidgets(false);
        } else if (editMode) {
          toggleEditMode();
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleEditMode, success, error]);

  const handleCloseEditor = () => {
    setIsMovingWidgets(false);
    if (editMode) toggleEditMode();
  };

  const handleToggleMovingWidgets = () => {
    setIsMovingWidgets((prev) => {
      const next = !prev;
      // When enabling move mode, close the modal overlay so it doesn't block dragging
      if (next && editMode) toggleEditMode();
      return next;
    });
  };

  const widgetProps = {
    editMode: isMovingWidgets,
    snapToGrid,
    gridSize,
    onPositionChange: updateWidgetPosition,
    onVisibilityToggle: toggleWidgetVisibility,
  };

  const statusTypes: StatusType[] = ['health', 'armor', 'hunger', 'thirst', 'stamina', 'stress', 'oxygen'];

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden"
    >
      {/* Notifications - as draggable widget */}
      {(() => {
        const widget = getWidget('notifications');
        if (!widget) return (
          <NotificationContainer notifications={notifications} onClose={removeNotification} />
        );
        return (
          <HUDWidget id="notifications" position={widget.position} visible={widget.visible} {...widgetProps}>
            <NotificationContainer notifications={notifications} onClose={removeNotification} isWidget />
          </HUDWidget>
        );
      })()}

      {/* Edit Mode Button */}
      <button
        onClick={() => {
          if (isMovingWidgets) {
            setIsMovingWidgets(false);
            return;
          }
          toggleEditMode();
        }}
        className="fixed top-4 right-4 pointer-events-auto glass-panel rounded-lg p-2 hover:bg-primary/20 transition-colors z-40"
        style={{
          boxShadow: editMode || isMovingWidgets ? '0 0 15px hsl(var(--primary))' : 'none',
        }}
      >
        <Settings 
          size={18} 
          className={editMode || isMovingWidgets ? "text-primary" : "text-muted-foreground"}
          style={(editMode || isMovingWidgets) ? { filter: 'drop-shadow(0 0 4px hsl(var(--primary)))' } : {}}
        />
      </button>

      {/* Demo Mode Badge */}
      {isDemoMode && !editMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-panel rounded-lg px-4 py-2 animate-fade-in-up">
          <span className="text-xs text-primary uppercase tracking-wider hud-text">
            Demo • V=Vehicle • 1-4=Type • R=Voice • E=Edit • N/M=Notify
          </span>
        </div>
      )}

      {/* Status Widgets */}
      {statusTypes.map((type) => {
        const widget = getWidget(type);
        if (!widget) return null;
        const value = hudState[type as keyof HudState] ?? 100;
        return (
          <HUDWidget
            key={type}
            id={type}
            position={widget.position}
            visible={widget.visible}
            {...widgetProps}
          >
            <StatusWidget
              type={type}
              value={value}
              design={statusDesign}
              size={widget.size as 'sm' | 'md' | 'lg'}
            />
          </HUDWidget>
        );
      })}

      {/* Money Widget */}
      {(() => {
        const widget = getWidget('money');
        if (!widget) return null;
        return (
          <HUDWidget id="money" position={widget.position} visible={widget.visible} {...widgetProps}>
            <NeonMoneyWidget money={moneyState} player={playerState} />
          </HUDWidget>
        );
      })()}

      {/* Clock Widget */}
      {(() => {
        const widget = getWidget('clock');
        if (!widget) return null;
        return (
          <HUDWidget id="clock" position={widget.position} visible={widget.visible} {...widgetProps}>
            <ClockWidget time={currentTime} />
          </HUDWidget>
        );
      })()}

      {/* Location Widget */}
      {(() => {
        const widget = getWidget('location');
        if (!widget) return null;
        return (
          <HUDWidget id="location" position={widget.position} visible={widget.visible} {...widgetProps}>
            <NeonLocationWidget location={locationState} />
          </HUDWidget>
        );
      })()}

      {/* Voice Widget */}
      {(() => {
        const widget = getWidget('voice');
        if (!widget) return null;
        return (
          <HUDWidget id="voice" position={widget.position} visible={widget.visible} {...widgetProps}>
            <NeonVoiceWidget voice={voiceState} />
          </HUDWidget>
        );
      })()}

      {/* Minimap Widget */}
      {(() => {
        const widget = getWidget('minimap');
        if (!widget) return null;
        return (
          <HUDWidget id="minimap" position={widget.position} visible={widget.visible} {...widgetProps}>
            <NeonMinimapWidget direction={locationState.direction} />
          </HUDWidget>
        );
      })()}

      {/* Compass Widget */}
      {(() => {
        const widget = getWidget('compass');
        if (!widget) return null;
        return (
          <HUDWidget id="compass" position={widget.position} visible={widget.visible} {...widgetProps}>
            <CompassWidget direction={locationState.direction} />
          </HUDWidget>
        );
      })()}

      {/* Vehicle Speedometer */}
      {(() => {
        const widget = getWidget('speedometer');
        if (!widget) return null;
        return (
          <HUDWidget 
            id="speedometer" 
            position={widget.position} 
            visible={widget.visible && vehicleState.inVehicle} 
            {...widgetProps}
          >
            <VehicleHUDFactory vehicle={vehicleState} visible={vehicleState.inVehicle || editMode} />
          </HUDWidget>
        );
      })()}

      {/* Edit Mode Overlay */}
      <EditModeOverlay
        isOpen={editMode || isMovingWidgets}
        snapToGrid={snapToGrid}
        showSafezone={showSafezone}
        statusDesign={statusDesign}
        isMovingWidgets={isMovingWidgets}
        onClose={handleCloseEditor}
        onSnapToGridChange={setSnapToGrid}
        onShowSafezoneChange={setShowSafezone}
        onStatusDesignChange={setStatusDesign}
        onToggleMovingWidgets={handleToggleMovingWidgets}
        onReset={resetLayout}
      />
    </div>
  );
};
