import { motion, AnimatePresence } from 'framer-motion';
import { Settings, RotateCcw, Grid3X3, Square, X, Circle, BarChart3, AlignVerticalSpaceAround, Minus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusDesign } from '@/types/widget';

interface EditModeOverlayProps {
  isOpen: boolean;
  snapToGrid: boolean;
  showSafezone: boolean;
  statusDesign: StatusDesign;
  isMovingWidgets: boolean;
  onClose: () => void;
  onSnapToGridChange: (value: boolean) => void;
  onShowSafezoneChange: (value: boolean) => void;
  onStatusDesignChange: (design: StatusDesign) => void;
  onToggleMovingWidgets: () => void;
  onReset: () => void;
}

const DESIGN_OPTIONS: { design: StatusDesign; icon: React.ElementType; label: string }[] = [
  { design: 'circular', icon: Circle, label: 'Kreis' },
  { design: 'bar', icon: BarChart3, label: 'Balken' },
  { design: 'vertical', icon: AlignVerticalSpaceAround, label: 'Vertikal' },
  { design: 'minimal', icon: Minus, label: 'Minimal' },
  { design: 'arc', icon: Activity, label: 'Bogen' },
];

export const EditModeOverlay = ({
  isOpen,
  snapToGrid,
  showSafezone,
  statusDesign,
  isMovingWidgets,
  onClose,
  onSnapToGridChange,
  onShowSafezoneChange,
  onStatusDesignChange,
  onToggleMovingWidgets,
  onReset,
}: EditModeOverlayProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop with grid */}
          <div 
            className="absolute inset-0 bg-background/30 backdrop-blur-sm"
            style={{
              backgroundImage: snapToGrid 
                ? 'linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)'
                : 'none',
              backgroundSize: '20px 20px',
            }}
          />
          
          {/* Safezone indicator */}
          {showSafezone && (
            <div 
              className="absolute border-2 border-dashed border-warning/50 rounded-lg pointer-events-none"
              style={{
                left: '5%',
                right: '5%',
                top: '5%',
                bottom: '5%',
              }}
            >
              <span className="absolute top-2 left-2 text-[10px] text-warning uppercase">
                Safe Zone
              </span>
            </div>
          )}
          
          {/* Edit Mode Dialog */}
          <motion.div
            className="relative glass-panel rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            style={{
              boxShadow: '0 0 40px hsl(var(--primary) / 0.2), inset 0 0 20px hsl(var(--primary) / 0.05)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Settings 
                  size={20} 
                  className="text-primary"
                  style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary)))' }}
                />
                <h2 className="text-lg font-semibold text-foreground">Edit Mode</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground mb-6">
              Ziehe, verstecke oder ändere HUD-Komponenten. Klicke und ziehe zum Verschieben.
            </p>
            
            {/* Status Design Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3">Status-Widget Design</h3>
              <div className="grid grid-cols-5 gap-2">
                {DESIGN_OPTIONS.map(({ design, icon: Icon, label }) => (
                  <button
                    key={design}
                    onClick={() => onStatusDesignChange(design)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all",
                      statusDesign === design 
                        ? "glass-panel border-primary/50" 
                        : "hover:bg-muted/20"
                    )}
                    style={statusDesign === design ? {
                      boxShadow: '0 0 15px hsl(var(--primary) / 0.3)',
                    } : {}}
                  >
                    <Icon 
                      size={20} 
                      className={statusDesign === design ? "text-primary" : "text-muted-foreground"}
                      style={statusDesign === design ? { filter: 'drop-shadow(0 0 4px hsl(var(--primary)))' } : {}}
                    />
                    <span className={cn(
                      "text-[10px]",
                      statusDesign === design ? "text-primary" : "text-muted-foreground"
                    )}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              <ToggleOption
                icon={Grid3X3}
                label="Am Raster ausrichten"
                checked={snapToGrid}
                onChange={onSnapToGridChange}
              />
              <ToggleOption
                icon={Square}
                label="Safezone anzeigen"
                checked={showSafezone}
                onChange={onShowSafezoneChange}
              />
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={onToggleMovingWidgets}
                className={cn(
                  "w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
                  isMovingWidgets 
                    ? "bg-stamina text-stamina-foreground" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                style={{
                  boxShadow: isMovingWidgets 
                    ? '0 0 20px hsl(var(--stamina) / 0.5)' 
                    : '0 0 20px hsl(var(--primary) / 0.3)',
                }}
              >
                {isMovingWidgets ? 'Verschieben beenden' : 'Widgets verschieben'}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 rounded-lg glass-panel text-foreground hover:bg-muted/20 transition-colors"
              >
                Bearbeitung beenden
              </button>
              <button
                onClick={onReset}
                className="w-full py-2 rounded-lg glass-panel text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} />
                Layout zurücksetzen
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ToggleOptionProps {
  icon: React.ElementType;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const ToggleOption = ({ icon: Icon, label, checked, onChange }: ToggleOptionProps) => (
  <button
    onClick={() => onChange(!checked)}
    className="w-full flex items-center justify-between p-3 rounded-lg glass-panel hover:bg-muted/20 transition-colors"
  >
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-muted-foreground" />
      <span className="text-sm text-foreground">{label}</span>
    </div>
    <div className={cn(
      "w-10 h-5 rounded-full transition-colors relative",
      checked ? "bg-primary" : "bg-muted/50"
    )}>
      <motion.div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-foreground"
        animate={{ left: checked ? '22px' : '2px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={checked ? { boxShadow: '0 0 8px hsl(var(--primary))' } : {}}
      />
    </div>
  </button>
);
