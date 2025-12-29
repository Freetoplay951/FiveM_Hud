import { RotateCcw, Grid3X3, Circle, BarChart3, AlignVerticalSpaceAround, Minus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusDesign } from "@/types/widget";
import { PopoverContent } from "@/components/ui/popover";

interface EditModeOverlayProps {
  snapToGrid: boolean;
  statusDesign: StatusDesign;
  onSnapToGridChange: (value: boolean) => void;
  onStatusDesignChange: (design: StatusDesign) => void;
  onReset: () => void;
  onExitEditMode: () => void;
}

const DESIGN_OPTIONS: { design: StatusDesign; icon: React.ElementType; label: string }[] = [
  { design: "circular", icon: Circle, label: "Kreis" },
  { design: "bar", icon: BarChart3, label: "Balken" },
  { design: "vertical", icon: AlignVerticalSpaceAround, label: "Vertikal" },
  { design: "minimal", icon: Minus, label: "Minimal" },
  { design: "arc", icon: Activity, label: "Bogen" },
];

export const EditModeOverlay = ({
  snapToGrid,
  statusDesign,
  onSnapToGridChange,
  onStatusDesignChange,
  onReset,
  onExitEditMode,
}: EditModeOverlayProps) => {
  return (
    <PopoverContent
      align="end"
      side="left"
      sideOffset={12}
      className="glass-panel w-[360px] rounded-2xl border-border/40"
      style={{ boxShadow: "0 0 40px hsl(var(--primary) / 0.2)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Edit Mode</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Widgets ziehen & per Ecke skalieren (30%–500%).
          </p>
        </div>
      </div>

      <div className="my-4 h-px bg-border/40" />

      {/* Status Design */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-foreground mb-2">Status-Widget Design</h3>
        <div className="grid grid-cols-5 gap-2">
          {DESIGN_OPTIONS.map(({ design, icon: Icon, label }) => (
            <button
              key={design}
              onClick={() => onStatusDesignChange(design)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all",
                statusDesign === design ? "glass-panel border-primary/50" : "hover:bg-muted/20",
              )}
              style={
                statusDesign === design
                  ? { boxShadow: "0 0 14px hsl(var(--primary) / 0.25)" }
                  : {}
              }
            >
              <Icon
                size={18}
                className={statusDesign === design ? "text-primary" : "text-muted-foreground"}
                style={
                  statusDesign === design
                    ? { filter: "drop-shadow(0 0 4px hsl(var(--primary)))" }
                    : {}
                }
              />
              <span
                className={cn(
                  "text-[10px]",
                  statusDesign === design ? "text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2 mb-4">
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
          onClick={onExitEditMode}
          className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          style={{ boxShadow: "0 0 18px hsl(var(--primary) / 0.25)" }}
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
    </PopoverContent>
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
    <div
      className={cn(
        "w-10 h-5 rounded-full transition-colors relative",
        checked ? "bg-primary" : "bg-muted/50",
      )}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-foreground"
        style={{
          left: checked ? "22px" : "2px",
          boxShadow: checked ? "0 0 8px hsl(var(--primary))" : undefined,
          transition: "left 150ms ease",
        }}
      />
    </div>
  </button>
);
