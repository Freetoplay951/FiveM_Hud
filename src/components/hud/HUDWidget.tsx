import { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { Eye, EyeOff, GripVertical, MoveDiagonal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetPosition } from "@/types/widget";

interface HUDWidgetProps {
    id: string;
    children: ReactNode;
    position: WidgetPosition; // Position in viewport pixels
    visible: boolean;
    editMode: boolean;
    snapToGrid: boolean;
    gridSize: number;
    scale?: number;
    onPositionChange: (id: string, position: WidgetPosition) => void;
    onVisibilityToggle?: (id: string) => void;
    onScaleChange?: (id: string, scale: number) => void;
    onReset?: (id: string) => void;
    hasAccess?: boolean;
    disabled: boolean;
    /** Hide the widget temporarily (used for auto-layout to prevent flicker) */
    suspended?: boolean;
    className?: string;
    /** Multi-selection support */
    isSelected?: boolean;
    onSelect?: (id: string, addToSelection: boolean) => void;
    /** Called when this widget starts being dragged (for multi-selection group drag) */
    onDragStart?: (id: string, startPos: WidgetPosition) => void;
    /** Called during drag with delta from start */
    onDragMove?: (deltaX: number, deltaY: number) => void;
    /** Called when drag ends */
    onDragEnd?: () => void;
    /** Called to clear all selections */
    onClearSelection?: () => void;
    /** Called during live drag with current position */
    onLiveDrag?: (id: string, currentPos: WidgetPosition) => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

export const HUDWidget = ({
    id,
    children,
    position,
    visible,
    editMode,
    snapToGrid,
    gridSize,
    scale = 1,
    onPositionChange,
    onVisibilityToggle,
    onScaleChange,
    onReset,
    hasAccess = true,
    disabled,
    suspended = false,
    className,
    isSelected = false,
    onSelect,
    onDragStart,
    onDragMove,
    onDragEnd,
    onClearSelection,
    onLiveDrag,
}: HUDWidgetProps) => {
    const rootRef = useRef<HTMLDivElement | null>(null);
    const [elementSize, setElementSize] = useState({ w: 0, h: 0 });

    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null);
    const [localScale, setLocalScale] = useState<number | null>(null);

    const dragStartPos = useRef({ x: 0, y: 0 });
    const widgetStartPos = useRef({ x: 0, y: 0 });

    const resizeStartPos = useRef({ x: 0, y: 0 });
    const resizeStartScale = useRef(1);
    const resizeStartElementSize = useRef({ w: 0, h: 0 });

    // Measure element size
    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;

        const updateSize = () => {
            setElementSize({
                w: el.offsetWidth,
                h: el.offsetHeight,
            });
        };

        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(el);

        return () => resizeObserver.disconnect();
    }, [visible]);

    // Clamp position to viewport using the widget's *rendered* size (includes CSS transforms)
    const clampToViewport = useCallback(
        (x: number, y: number) => {
            const el = rootRef.current;
            const rect = el?.getBoundingClientRect();

            // Fallback if rect is not available yet
            const fallbackScale = localScale ?? scale;
            const widgetWidth =
                rect && rect.width > 0 ? rect.width : (elementSize.w > 0 ? elementSize.w : 50) * fallbackScale;
            const widgetHeight =
                rect && rect.height > 0 ? rect.height : (elementSize.h > 0 ? elementSize.h : 50) * fallbackScale;

            const maxX = Math.max(0, window.innerWidth - widgetWidth);
            const maxY = Math.max(0, window.innerHeight - widgetHeight);
            return {
                x: Math.max(0, Math.min(maxX, x)),
                y: Math.max(0, Math.min(maxY, y)),
            };
        },
        [elementSize.w, elementSize.h, localScale, scale]
    );

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (!editMode) return;

            // Always handle selection first, even for non-movable widgets
            if (onSelect) {
                onSelect(id, e.ctrlKey || e.metaKey);
            }

            // Only handle dragging if position change is allowed
            if (!onPositionChange) return;
            if (isResizing) return;

            e.preventDefault();
            e.stopPropagation();

            setIsDragging(true);
            dragStartPos.current = { x: e.clientX, y: e.clientY };
            widgetStartPos.current = { x: position.x, y: position.y };
            setLocalPosition({ x: position.x, y: position.y });

            // Notify parent about drag start for multi-selection
            if (onDragStart) {
                onDragStart(id, position);
            }
        },
        [editMode, onPositionChange, isResizing, position, onSelect, onDragStart, id]
    );

    const localPositionRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - dragStartPos.current.x;
            const deltaY = e.clientY - dragStartPos.current.y;

            let newX = widgetStartPos.current.x + deltaX;
            let newY = widgetStartPos.current.y + deltaY;

            // Only snap to grid for single widget drag, not group drag
            if (snapToGrid && !isSelected) {
                newX = Math.round(newX / gridSize) * gridSize;
                newY = Math.round(newY / gridSize) * gridSize;
            }

            const clamped = clampToViewport(newX, newY);
            localPositionRef.current = { x: clamped.x, y: clamped.y };

            if (rootRef.current) {
                rootRef.current.style.left = `${clamped.x}px`;
                rootRef.current.style.top = `${clamped.y}px`;
            }

            // Notify parent about drag movement for multi-selection
            if (onDragMove && isSelected) {
                onDragMove(deltaX, deltaY);
            }
            
            // Notify parent about live drag position
            if (onLiveDrag) {
                onLiveDrag(id, clamped);
            }
        };

        const handleMouseUp = () => {
            if (localPositionRef.current) {
                // Position is already in viewport coords, onPositionChange will convert to reference
                onPositionChange(id, { x: localPositionRef.current.x, y: localPositionRef.current.y });
            }
            localPositionRef.current = null;
            setLocalPosition(null);
            setIsDragging(false);

            // Notify parent drag ended
            if (onDragEnd) {
                onDragEnd();
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, snapToGrid, gridSize, id, onPositionChange, clampToViewport, onDragMove, onDragEnd, isSelected]);

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        if (!editMode) return;
        if (!onScaleChange) return;
        e.preventDefault();
        e.stopPropagation();

        setIsResizing(true);
        resizeStartPos.current = { x: e.clientX, y: e.clientY };
        resizeStartScale.current = scale;
        resizeStartElementSize.current = { w: elementSize.w, h: elementSize.h };
        setLocalScale(scale);
    };

    useEffect(() => {
        if (!isResizing) return;
        if (!onScaleChange) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - resizeStartPos.current.x;
            const deltaY = e.clientY - resizeStartPos.current.y;

            const baseWidth = resizeStartElementSize.current.w / resizeStartScale.current;
            const baseHeight = resizeStartElementSize.current.h / resizeStartScale.current;

            const newWidth = resizeStartElementSize.current.w + deltaX;
            const newHeight = resizeStartElementSize.current.h + deltaY;

            const scaleXNew = baseWidth > 0 ? newWidth / baseWidth : resizeStartScale.current;
            const scaleYNew = baseHeight > 0 ? newHeight / baseHeight : resizeStartScale.current;

            const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, (scaleXNew + scaleYNew) / 2));
            setLocalScale(Number(nextScale.toFixed(3)));
        };

        const handleMouseUp = () => {
            if (localScale !== null) {
                onScaleChange(id, localScale);
            }
            setLocalScale(null);
            setIsResizing(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing, onScaleChange, id, localScale]);

    // Display position - use local during drag, otherwise use stored position
    const displayPosition = localPosition ?? position;
    const displayScale = localScale ?? scale;

    // Hidden state: not visible and not in edit mode, OR server disabled
    const isHidden = !visible && !editMode;

    const isSuspended = suspended;

    const isSubWidget = !(onPositionChange || onVisibilityToggle || onScaleChange || onReset);

    return (
        <div
            id={`hud-widget-${id}`}
            ref={rootRef}
            className={cn(
                "absolute pointer-events-auto select-none",
                editMode && onPositionChange && "cursor-move",
                editMode && !isSelected && "ring-2 ring-primary/50 ring-dashed rounded-lg",
                editMode &&
                    isSelected &&
                    "ring-[3px] ring-warning rounded-lg shadow-[0_0_15px_hsl(var(--warning)/0.5)]",
                (isDragging || isResizing) && "z-50",
                !visible && editMode && "opacity-40",
                className
            )}
            style={{
                left: displayPosition.x,
                top: displayPosition.y,
                // CEF Fix: Use translate3d for hardware acceleration consistency
                // Round scale to avoid subpixel rendering issues
                transform: `scale(${Math.round(displayScale * 100) / 100})`,
                transformOrigin: "top left",
                opacity: isSuspended ? 0 : !disabled && (visible || (editMode && hasAccess)) ? 1 : 0,
                // Hide via visibility instead of unmounting
                visibility: isHidden || isSuspended ? "hidden" : "visible",
                pointerEvents: isHidden || isSubWidget || isSuspended || !hasAccess ? "none" : "auto",
                zIndex: 10,
                // CEF Fix: Prevent black box artifacts
                willChange: isDragging || isResizing ? "transform" : "auto",
                // Selected state background glow
                ...(isSelected && editMode
                    ? {
                          backgroundColor: "hsl(var(--warning) / 0.1)",
                      }
                    : {}),
            }}
            onMouseDown={handleMouseDown}>
            {/* Edit Mode Controls */}
            {editMode && (
                <div className="absolute -top-7 left-0 right-0 flex items-center justify-between gap-1">
                    {!isSubWidget && (
                        <div className="flex items-center gap-1 bg-background/60 border border-border/30 rounded px-1 py-0.5">
                            <GripVertical
                                size={10}
                                className="text-muted-foreground"
                            />
                            <span className="text-[8px] text-muted-foreground uppercase">{id}</span>
                            <span className="text-[8px] text-muted-foreground ml-1">
                                {Math.round(displayScale * 100)}%
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-1">
                        {onReset && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReset(id);
                                    // Clear selection when resetting
                                    if (onClearSelection) {
                                        onClearSelection();
                                    }
                                }}
                                className="bg-background/60 border border-border/30 rounded p-1 hover:bg-muted/30 transition-colors"
                                title="Position & Größe zurücksetzen">
                                <RotateCcw
                                    size={10}
                                    className="text-muted-foreground hover:text-warning"
                                />
                            </button>
                        )}
                        {onVisibilityToggle && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onVisibilityToggle(id);
                                    // Clear selection when toggling visibility
                                    if (onClearSelection) {
                                        onClearSelection();
                                    }
                                }}
                                className="bg-background/60 border border-border/30 rounded p-1 hover:bg-muted/30 transition-colors">
                                {visible ? (
                                    <Eye
                                        size={10}
                                        className="text-primary"
                                    />
                                ) : (
                                    <EyeOff
                                        size={10}
                                        className="text-muted-foreground"
                                    />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Widget Content */}
            <div className={cn(editMode && "pointer-events-none")}>{children}</div>

            {/* Resize handle */}
            {editMode && onScaleChange && (
                <button
                    aria-label="Widget Größe ändern"
                    onMouseDown={handleResizeMouseDown}
                    className={cn(
                        "absolute -right-2 -bottom-2 p-1 rounded-md bg-background/60 border border-border/30",
                        "cursor-nwse-resize hover:bg-muted/30 transition-colors"
                    )}>
                    <MoveDiagonal
                        size={12}
                        className="text-muted-foreground"
                    />
                </button>
            )}
        </div>
    );
};
