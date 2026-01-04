import {
    RotateCcw,
    Grid3X3,
    Circle,
    BarChart3,
    AlignVerticalSpaceAround,
    Minus,
    Activity,
    Car,
    Plane,
    Ship,
    Fan,
    Bike,
    Square,
    Skull,
    Motorbike,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusDesign, SpeedometerType, MinimapShape } from "@/types/widget";
import { PopoverContent } from "@/components/ui/popover";
import { useTranslation } from "@/contexts/LanguageContext";
import { LanguageDropdown } from "../LanguageDropdown";

interface EditModeOverlayProps {
    snapToGrid: boolean;
    statusDesign: StatusDesign;
    speedometerType: SpeedometerType;
    minimapShape: MinimapShape;
    onSnapToGridChange: (value: boolean) => void;
    onStatusDesignChange: (design: StatusDesign) => void;
    onSpeedometerTypeChange: (type: SpeedometerType) => void;
    onMinimapShapeChange: (shape: MinimapShape) => void;
    onReset: () => void;
    onExitEditMode: () => void;
}

const DESIGN_OPTIONS: {
    design: StatusDesign;
    icon: React.ElementType;
    labelKey: keyof import("@/types/translation").Translations["statusDesigns"];
}[] = [
    { design: "circular", icon: Circle, labelKey: "circular" },
    { design: "bar", icon: BarChart3, labelKey: "bar" },
    { design: "vertical", icon: AlignVerticalSpaceAround, labelKey: "vertical" },
    { design: "minimal", icon: Minus, labelKey: "minimal" },
    { design: "arc", icon: Activity, labelKey: "arc" },
];

const SPEEDOMETER_OPTIONS: {
    type: SpeedometerType;
    icon: React.ElementType;
    labelKey: keyof import("@/types/translation").Translations["speedometerTypes"];
}[] = [
    { type: "car", icon: Car, labelKey: "car" },
    { type: "plane", icon: Plane, labelKey: "plane" },
    { type: "boat", icon: Ship, labelKey: "boat" },
    { type: "helicopter", icon: Fan, labelKey: "helicopter" },
    { type: "motorcycle", icon: Motorbike, labelKey: "motorcycle" },
    { type: "bicycle", icon: Bike, labelKey: "bicycle" },
];

const MINIMAP_SHAPE_OPTIONS: {
    shape: MinimapShape;
    icon: React.ElementType;
    labelKey: keyof import("@/types/translation").Translations["minimapShapes"];
}[] = [
    { shape: "square", icon: Square, labelKey: "square" },
    { shape: "round", icon: Circle, labelKey: "round" },
];

export const EditModeOverlay = ({
    snapToGrid,
    statusDesign,
    speedometerType,
    minimapShape,
    onSnapToGridChange,
    onStatusDesignChange,
    onSpeedometerTypeChange,
    onMinimapShapeChange,
    onReset,
    onExitEditMode,
}: EditModeOverlayProps) => {
    const { t } = useTranslation();

    return (
        <PopoverContent
            align="end"
            side="left"
            sideOffset={12}
            className="w-[360px] rounded-2xl border-border/40 bg-background/95"
            style={{ boxShadow: "0 0 40px hsl(var(--primary) / 0.2)" }}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-foreground">{t.editMode.title}</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t.editMode.subtitle}</p>
                </div>
                {/* Language Toggle */}
                <LanguageDropdown />
            </div>

            <div className="my-4 h-px bg-border/40" />

            {/* Status Design */}
            <div className="mb-4">
                <h3 className="text-xs font-medium text-foreground mb-2">{t.editMode.statusDesign}</h3>
                <div className="grid grid-cols-5 gap-2">
                    {DESIGN_OPTIONS.map(({ design, icon: Icon, labelKey }) => (
                        <button
                            key={design}
                            onClick={() => onStatusDesignChange(design)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all",
                                statusDesign === design ? "bg-primary/20 border border-primary/50" : "hover:bg-muted/20"
                            )}
                            style={statusDesign === design ? { boxShadow: "0 0 14px hsl(var(--primary) / 0.25)" } : {}}>
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
                                    statusDesign === design ? "text-primary" : "text-muted-foreground"
                                )}>
                                {t.statusDesigns[labelKey]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Minimap Shape */}
            <div className="mb-4">
                <h3 className="text-xs font-medium text-foreground mb-2">{t.editMode.minimapShape}</h3>
                <div className="grid grid-cols-2 gap-2">
                    {MINIMAP_SHAPE_OPTIONS.map(({ shape, icon: Icon, labelKey }) => (
                        <button
                            key={shape}
                            onClick={() => onMinimapShapeChange(shape)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all",
                                minimapShape === shape ? "bg-primary/20 border border-primary/50" : "hover:bg-muted/20"
                            )}
                            style={minimapShape === shape ? { boxShadow: "0 0 14px hsl(var(--primary) / 0.25)" } : {}}>
                            <Icon
                                size={18}
                                className={minimapShape === shape ? "text-primary" : "text-muted-foreground"}
                                style={
                                    minimapShape === shape ? { filter: "drop-shadow(0 0 4px hsl(var(--primary)))" } : {}
                                }
                            />
                            <span
                                className={cn(
                                    "text-[10px]",
                                    minimapShape === shape ? "text-primary" : "text-muted-foreground"
                                )}>
                                {t.minimapShapes[labelKey]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Speedometer Type */}
            <div className="mb-4">
                <h3 className="text-xs font-medium text-foreground mb-2">{t.editMode.speedometerType}</h3>
                <div className="flex flex-wrap justify-center gap-2">
                    {SPEEDOMETER_OPTIONS.map(({ type, icon: Icon, labelKey }) => (
                        <button
                            key={type}
                            onClick={() => onSpeedometerTypeChange(type)}
                            className={cn(
                                "flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all w-[70px]",
                                speedometerType === type
                                    ? "bg-primary/20 border border-primary/50"
                                    : "hover:bg-muted/20"
                            )}
                            style={
                                speedometerType === type ? { boxShadow: "0 0 14px hsl(var(--primary) / 0.25)" } : {}
                            }>
                            <Icon
                                size={18}
                                className={speedometerType === type ? "text-primary" : "text-muted-foreground"}
                                style={
                                    speedometerType === type
                                        ? { filter: "drop-shadow(0 0 4px hsl(var(--primary)))" }
                                        : {}
                                }
                            />
                            <span
                                className={cn(
                                    "text-[10px]",
                                    speedometerType === type ? "text-primary" : "text-muted-foreground"
                                )}>
                                {t.speedometerTypes[labelKey]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Options */}
            <div className="space-y-2 mb-4">
                <ToggleOption
                    icon={Grid3X3}
                    label={t.editMode.snapToGrid}
                    checked={snapToGrid}
                    onChange={onSnapToGridChange}
                />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => {
                        onExitEditMode();
                    }}
                    type="button"
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors pointer-events-auto"
                    style={{ boxShadow: "0 0 18px hsl(var(--primary) / 0.25)" }}>
                    {t.editMode.exitEdit}
                </button>
                <button
                    onClick={onReset}
                    className="w-full py-2 rounded-lg bg-muted/30 border border-border/30 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2">
                    <RotateCcw size={14} />
                    {t.editMode.resetLayout}
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
        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
            <Icon
                size={16}
                className="text-muted-foreground"
            />
            <span className="text-sm text-foreground">{label}</span>
        </div>
        <div className={cn("w-10 h-5 rounded-full transition-colors relative", checked ? "bg-primary" : "bg-muted/50")}>
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
