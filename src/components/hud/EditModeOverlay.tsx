import { motion, AnimatePresence } from 'framer-motion';
import { Settings, RotateCcw, Grid3X3, X, Circle, BarChart3, AlignVerticalSpaceAround, Minus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusDesign } from '@/types/widget';
import * as Dialog from '@radix-ui/react-dialog';

interface EditModeOverlayProps {
  isOpen: boolean;
  snapToGrid: boolean;
  statusDesign: StatusDesign;
  onClose: () => void;
  onSnapToGridChange: (value: boolean) => void;
  onStatusDesignChange: (design: StatusDesign) => void;
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
  statusDesign,
  onClose,
  onSnapToGridChange,
  onStatusDesignChange,
  onReset,
}: EditModeOverlayProps) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-50 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(4px)',
              backgroundImage: snapToGrid 
                ? 'linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)'
                : 'none',
              backgroundSize: '20px 20px',
            }}
          />
        </Dialog.Overlay>
        
        <Dialog.Content asChild>
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 glass-panel rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto pointer-events-auto"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
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
                <Dialog.Title className="text-lg font-semibold text-foreground">
                  Edit Mode
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors">
                  <X size={18} className="text-muted-foreground" />
                </button>
              </Dialog.Close>
            </div>
            
            {/* Description */}
            <Dialog.Description className="text-sm text-muted-foreground mb-6">
              Verschiebe Widgets direkt auf dem Bildschirm. Nutze die +/- Buttons um die Größe anzupassen.
            </Dialog.Description>
            
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
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-2">
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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