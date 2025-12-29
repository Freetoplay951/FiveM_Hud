import { motion, AnimatePresence } from 'framer-motion';
import { Fuel, ArrowUp, ArrowDown, Gauge } from 'lucide-react';
import { VehicleState } from '@/types/hud';
import { cn } from '@/lib/utils';

interface HelicopterHUDProps {
  vehicle: VehicleState;
  visible: boolean;
}

export const HelicopterHUD = ({ vehicle, visible }: HelicopterHUDProps) => {
  const pitch = vehicle.pitch || 0;
  const roll = vehicle.roll || 0;
  const altitude = vehicle.altitude || 0;
  const airspeed = vehicle.airspeed || vehicle.speed;
  const verticalSpeed = vehicle.verticalSpeed || 0;
  const rotorRpm = vehicle.rotorRpm || 100;
  const heading = vehicle.heading || 0;
  
  const fuelWarning = vehicle.fuel <= 25;
  const fuelCritical = vehicle.fuel <= 10;
  const lowRpm = rotorRpm < 80;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex items-center gap-3"
        >
          {/* Left Panel - Altitude & Vertical Speed */}
          <div className="flex flex-col items-center gap-2">
            {/* Altitude */}
            <div className="glass-panel rounded-lg p-2 w-16">
              <span className="text-[7px] text-muted-foreground block text-center">ALT</span>
              <span 
                className="hud-number text-lg text-armor block text-center"
                style={{ textShadow: '0 0 10px hsl(var(--armor) / 0.5)' }}
              >
                {Math.round(altitude)}
              </span>
              <span className="text-[7px] text-muted-foreground block text-center">METERS</span>
            </div>
            
            {/* Vertical Speed */}
            <div className="glass-panel rounded-lg p-2 w-16">
              <span className="text-[7px] text-muted-foreground block text-center">V/S</span>
              <div className="flex items-center justify-center gap-1">
                {verticalSpeed > 0 ? (
                  <ArrowUp size={12} className="text-stamina" />
                ) : verticalSpeed < 0 ? (
                  <ArrowDown size={12} className="text-warning" />
                ) : null}
                <span 
                  className={cn(
                    "hud-number text-sm",
                    verticalSpeed > 0 ? "text-stamina" : verticalSpeed < 0 ? "text-warning" : "text-foreground"
                  )}
                  style={{ 
                    textShadow: `0 0 8px hsl(var(--${verticalSpeed > 0 ? 'stamina' : verticalSpeed < 0 ? 'warning' : 'foreground'}) / 0.5)` 
                  }}
                >
                  {verticalSpeed > 0 ? '+' : ''}{Math.round(verticalSpeed)}
                </span>
              </div>
              <span className="text-[7px] text-muted-foreground block text-center">M/S</span>
            </div>
          </div>

          {/* Main Attitude Indicator */}
          <div className="relative w-40 h-40">
            <div className="absolute inset-0 rounded-full glass-panel overflow-hidden" />
            
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
              <defs>
                <clipPath id="heliHorizonClip">
                  <circle cx="50" cy="50" r="40" />
                </clipPath>
                <linearGradient id="heliSkyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(210 70% 25%)" />
                  <stop offset="50%" stopColor="hsl(210 50% 45%)" />
                </linearGradient>
                <linearGradient id="heliGroundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="50%" stopColor="hsl(25 45% 25%)" />
                  <stop offset="100%" stopColor="hsl(25 35% 15%)" />
                </linearGradient>
              </defs>
              
              <g clipPath="url(#heliHorizonClip)">
                <g transform={`rotate(${-roll}, 50, 50) translate(0, ${pitch * 0.6})`}>
                  <rect x="-50" y="-50" width="200" height="100" fill="url(#heliSkyGradient)" />
                  <rect x="-50" y="50" width="200" height="100" fill="url(#heliGroundGradient)" />
                  <line x1="-50" y1="50" x2="150" y2="50" stroke="hsl(var(--primary))" strokeWidth="1.5" />
                  
                  {/* Pitch ladder */}
                  {[-30, -20, -10, 10, 20, 30].map((p) => (
                    <g key={p} transform={`translate(0, ${-p * 1.5})`}>
                      <line x1="30" y1="50" x2="42" y2="50" stroke="hsl(var(--foreground) / 0.6)" strokeWidth="0.5" />
                      <line x1="58" y1="50" x2="70" y2="50" stroke="hsl(var(--foreground) / 0.6)" strokeWidth="0.5" />
                    </g>
                  ))}
                </g>
              </g>
              
              {/* Roll scale */}
              <g transform="translate(50, 50)">
                {[-45, -30, -15, 0, 15, 30, 45].map((angle) => {
                  const x = 38 * Math.sin((angle * Math.PI) / 180);
                  const y = -38 * Math.cos((angle * Math.PI) / 180);
                  return (
                    <line
                      key={angle}
                      x1={x * 0.92}
                      y1={y * 0.92}
                      x2={x}
                      y2={y}
                      stroke="hsl(var(--primary))"
                      strokeWidth={angle === 0 ? 1.5 : 0.5}
                    />
                  );
                })}
                <polygon
                  points="0,-36 -2.5,-41 2.5,-41"
                  fill="hsl(var(--warning))"
                  transform={`rotate(${roll})`}
                />
              </g>
              
              {/* Aircraft symbol */}
              <g transform="translate(50, 50)">
                <line x1="-18" y1="0" x2="-6" y2="0" stroke="hsl(var(--warning))" strokeWidth="2.5" />
                <line x1="6" y1="0" x2="18" y2="0" stroke="hsl(var(--warning))" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="2.5" fill="none" stroke="hsl(var(--warning))" strokeWidth="2.5" />
              </g>
              
              {/* Heading */}
              <text x="50" y="92" textAnchor="middle" className="fill-primary" style={{ fontSize: '6px', fontFamily: 'Orbitron' }}>
                {Math.round(heading)}°
              </text>
            </svg>
            
            {/* Airspeed overlay */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 glass-panel rounded px-1.5 py-0.5">
              <span className="hud-number text-[10px] text-stamina">{Math.round(airspeed)}</span>
              <span className="text-[6px] text-muted-foreground block">KTS</span>
            </div>
          </div>

          {/* Right Panel - Rotor RPM & Fuel */}
          <div className="flex flex-col items-center gap-2">
            {/* Rotor RPM */}
            <div className={cn(
              "glass-panel rounded-lg p-2 w-16",
              lowRpm && "border border-critical/50"
            )}>
              <span className="text-[7px] text-muted-foreground block text-center">ROTOR</span>
              <div className="flex items-center justify-center gap-1">
                <Gauge 
                  size={12} 
                  className={cn(lowRpm ? "text-critical critical-pulse" : "text-primary")}
                />
                <span 
                  className={cn(
                    "hud-number text-sm",
                    lowRpm ? "text-critical" : "text-primary"
                  )}
                  style={{ textShadow: `0 0 8px hsl(var(--${lowRpm ? 'critical' : 'primary'}) / 0.5)` }}
                >
                  {Math.round(rotorRpm)}%
                </span>
              </div>
            </div>
            
            {/* Fuel Gauge */}
            <div className="glass-panel rounded-lg p-2 w-16">
              <span className="text-[7px] text-muted-foreground block text-center">FUEL</span>
              <div className="relative w-full h-3 rounded-full bg-muted/30 overflow-hidden mt-1">
                <motion.div 
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    fuelCritical ? "bg-critical" : 
                    fuelWarning ? "bg-warning" : 
                    "bg-stamina"
                  )}
                  animate={{ width: `${vehicle.fuel}%` }}
                  style={{
                    boxShadow: `0 0 6px hsl(var(--${fuelCritical ? 'critical' : fuelWarning ? 'warning' : 'stamina'}) / 0.6)`,
                  }}
                />
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Fuel 
                  size={10} 
                  className={cn(
                    fuelCritical ? "text-critical critical-pulse" : 
                    fuelWarning ? "text-warning" : 
                    "text-stamina"
                  )}
                />
                <span 
                  className={cn(
                    "hud-number text-[10px]",
                    fuelCritical ? "text-critical" : 
                    fuelWarning ? "text-warning" : 
                    "text-stamina"
                  )}
                >
                  {Math.round(vehicle.fuel)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
