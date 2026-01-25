import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetPosition, ResolvedWidgetConfig } from "@/types/widget";
import {
    getWidgetElement,
    getWidgetDOMPosition,
    setWidgetDOMPosition,
    calcGroupClampAdjust,
    isWidgetVisible,
} from "@/lib/widgetUtils";
import { isExcludedFromMultiSelect, isSubwidget } from "@/lib/widgetConfig";
import { findNextSnapPosition, getVisibleWidgetIds, SnapDirection } from "@/lib/snapLineUtils";

interface UseMultiSelectionProps {
    editMode: boolean;
    widgets: ResolvedWidgetConfig[];
    getWidget: (id: string) => ResolvedWidgetConfig | undefined;
    updateWidgetPosition: (id: string, position: WidgetPosition) => void;
    /** Optional snap functions to include in getMultiSelectProps */
    getSnappedPosition?: (widgetId: string, position: WidgetPosition, selectedWidgetIds?: string[]) => WidgetPosition;
    onSnapLinesClear?: () => void;
    /** Show snap lines temporarily (for keyboard snap jumps) */
    onShowSnapLinesTemporarily?: (lines: import("@/lib/snapLineUtils").SnapLine[], durationMs?: number) => void;
    /** Whether SimpleMode is enabled - affects subwidget filtering */
    simpleMode?: boolean;
}

export const useMultiSelection = ({
    editMode,
    widgets,
    getWidget,
    updateWidgetPosition,
    getSnappedPosition,
    onSnapLinesClear,
    onShowSnapLinesTemporarily,
    simpleMode = true,
}: UseMultiSelectionProps) => {
    const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());
    const [selectionBox, setSelectionBox] = useState<{
        startX: number;
        startY: number;
        endX: number;
        endY: number;
    } | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [shakingWidgets, setShakingWidgets] = useState<Map<string, "horizontal" | "vertical">>(new Map());
    const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
    const widgetStartPositionsRef = useRef<Map<string, WidgetPosition>>(new Map());
    const simpleModeRef = useRef(simpleMode);

    // Keep simpleMode ref updated
    useEffect(() => {
        simpleModeRef.current = simpleMode;
    }, [simpleMode]);

    const handleWidgetSelect = useCallback((id: string, addToSelection: boolean) => {
        setSelectedWidgets((prev) => {
            const next = new Set(prev);
            if (addToSelection) {
                if (next.has(id)) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
            } else {
                if (!next.has(id)) {
                    next.clear();
                }
            }
            return next;
        });
    }, []);

    // Track the primary dragged widget ID for snapping
    const primaryDragWidgetRef = useRef<string | null>(null);

    const handleWidgetDragStart = useCallback(
        (id: string, startPos: WidgetPosition) => {
            widgetStartPositionsRef.current.clear();
            primaryDragWidgetRef.current = id; // Track which widget initiated the drag
            selectedWidgets.forEach((widgetId) => {
                const widget = getWidget(widgetId);
                if (widget) {
                    widgetStartPositionsRef.current.set(widgetId, { ...widget.position });
                }
            });
        },
        [selectedWidgets, getWidget],
    );

    const handleWidgetDragMove = useCallback(
        (deltaX: number, deltaY: number) => {
            const widgetIds = Array.from(widgetStartPositionsRef.current.keys());
            const primaryWidgetId = primaryDragWidgetRef.current;

            // Calculate raw new positions for all widgets
            const getNewPos = (id: string) => {
                const start = widgetStartPositionsRef.current.get(id);
                return start ? { x: start.x + deltaX, y: start.y + deltaY } : null;
            };

            // Calculate snap offset from the PRIMARY widget only
            let snapOffsetX = 0;
            let snapOffsetY = 0;

            if (primaryWidgetId && getSnappedPosition) {
                const primaryRawPos = getNewPos(primaryWidgetId);
                if (primaryRawPos) {
                    // Get snapped position for primary widget (passes all selected widget IDs)
                    const snappedPos = getSnappedPosition(primaryWidgetId, primaryRawPos, widgetIds);
                    // Calculate the snap offset (difference between snapped and raw)
                    snapOffsetX = snappedPos.x - primaryRawPos.x;
                    snapOffsetY = snappedPos.y - primaryRawPos.y;
                }
            }

            // Apply group clamping with snap offset applied
            const getSnappedPos = (id: string) => {
                const rawPos = getNewPos(id);
                return rawPos ? { x: rawPos.x + snapOffsetX, y: rawPos.y + snapOffsetY } : null;
            };

            const { adjustX, adjustY } = calcGroupClampAdjust(widgetIds, getSnappedPos);

            // Update all widget DOM positions with snap offset + clamp adjustment
            widgetIds.forEach((id) => {
                const pos = getSnappedPos(id);
                if (pos) setWidgetDOMPosition(id, { x: pos.x + adjustX, y: pos.y + adjustY });
            });
        },
        [getSnappedPosition],
    );

    const handleWidgetDragEnd = useCallback(() => {
        widgetStartPositionsRef.current.forEach((_, id) => {
            const pos = getWidgetDOMPosition(id);
            if (pos) updateWidgetPosition(id, pos);
        });
        widgetStartPositionsRef.current.clear();
        primaryDragWidgetRef.current = null;

        // Clear snap lines when drag ends
        if (onSnapLinesClear) {
            onSnapLinesClear();
        }
    }, [updateWidgetPosition, onSnapLinesClear]);

    // Move selected widgets by delta (for keyboard navigation)
    const moveSelectedWidgets = useCallback(
        (deltaX: number, deltaY: number, useSnapping: boolean = false) => {
            if (selectedWidgets.size === 0) return;

            const widgetIds = Array.from(selectedWidgets);
            const primaryWidgetId = widgetIds[0]; // Use first selected widget as primary

            // Get current positions
            const currentPositions = new Map<string, WidgetPosition>();
            widgetIds.forEach((id) => {
                const widget = getWidget(id);
                if (widget) {
                    currentPositions.set(id, { ...widget.position });
                }
            });

            // Calculate new positions
            const getNewPos = (id: string) => {
                const current = currentPositions.get(id);
                return current ? { x: current.x + deltaX, y: current.y + deltaY } : null;
            };

            // Calculate snap offset from the PRIMARY widget only (if snapping is enabled)
            let snapOffsetX = 0;
            let snapOffsetY = 0;

            if (useSnapping && primaryWidgetId && getSnappedPosition) {
                const primaryRawPos = getNewPos(primaryWidgetId);
                if (primaryRawPos) {
                    const snappedPos = getSnappedPosition(primaryWidgetId, primaryRawPos, widgetIds);
                    snapOffsetX = snappedPos.x - primaryRawPos.x;
                    snapOffsetY = snappedPos.y - primaryRawPos.y;
                }
            }

            // Calculate positions with snap offset
            const getSnappedPos = (id: string) => {
                const rawPos = getNewPos(id);
                return rawPos ? { x: rawPos.x + snapOffsetX, y: rawPos.y + snapOffsetY } : null;
            };

            // Apply clamping adjustment for group
            const { adjustX, adjustY } = calcGroupClampAdjust(widgetIds, getSnappedPos);

            // Update all widget positions
            widgetIds.forEach((id) => {
                const pos = getSnappedPos(id);
                if (pos) {
                    const finalPos = { x: pos.x + adjustX, y: pos.y + adjustY };
                    updateWidgetPosition(id, finalPos);
                }
            });

            // Clear snap lines after keyboard movement
            if (!useSnapping && onSnapLinesClear) {
                onSnapLinesClear();
            }
        },
        [selectedWidgets, getWidget, updateWidgetPosition, getSnappedPosition, onSnapLinesClear],
    );

    // Trigger shake animation on widgets
    const triggerShake = useCallback((widgetIds: string[], direction: "horizontal" | "vertical") => {
        const newShaking = new Map<string, "horizontal" | "vertical">();
        widgetIds.forEach((id) => newShaking.set(id, direction));
        setShakingWidgets(newShaking);
        
        // Clear shake after animation completes
        setTimeout(() => {
            setShakingWidgets(new Map());
        }, 300);
    }, []);

    // Jump to next snap position in direction
    const jumpToNextSnap = useCallback(
        (direction: SnapDirection) => {
            if (selectedWidgets.size === 0) return;

            const widgetIds = Array.from(selectedWidgets);
            const primaryWidgetId = widgetIds[0];
            const primaryWidget = getWidget(primaryWidgetId);
            if (!primaryWidget) return;

            // Get all visible widget IDs (filtered by simpleMode)
            const allVisibleIds = getVisibleWidgetIds();
            const targetWidgetIds = simpleModeRef.current
                ? allVisibleIds.filter((id) => !isSubwidget(id))
                : allVisibleIds;

            // Find next snap position for primary widget
            const result = findNextSnapPosition(
                primaryWidgetId,
                primaryWidget.position,
                direction,
                targetWidgetIds,
                widgetIds.filter((id) => id !== primaryWidgetId),
            );

            if (!result.found || !result.position) {
                // No snap found - trigger shake animation
                const shakeDirection = direction === "left" || direction === "right" ? "horizontal" : "vertical";
                triggerShake(widgetIds, shakeDirection);
                return;
            }

            // Show snap line visualization temporarily (uses config default)
            if (result.snapLine && onShowSnapLinesTemporarily) {
                onShowSnapLinesTemporarily([result.snapLine]);
            }

            // Calculate the delta from primary widget's current position
            const deltaX = result.position.x - primaryWidget.position.x;
            const deltaY = result.position.y - primaryWidget.position.y;

            // Apply clamping for group movement
            const getNewPos = (id: string) => {
                const widget = getWidget(id);
                return widget ? { x: widget.position.x + deltaX, y: widget.position.y + deltaY } : null;
            };

            const { adjustX, adjustY } = calcGroupClampAdjust(widgetIds, getNewPos);

            // Update all widget positions
            widgetIds.forEach((id) => {
                const pos = getNewPos(id);
                if (pos) {
                    const finalPos = { x: pos.x + adjustX, y: pos.y + adjustY };
                    updateWidgetPosition(id, finalPos);
                }
            });
        },
        [selectedWidgets, getWidget, updateWidgetPosition, triggerShake, onShowSnapLinesTemporarily],
    );

    // Keyboard navigation for selected widgets
    useEffect(() => {
        if (!editMode || selectedWidgets.size === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle arrow keys
            if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return;

            // Don't interfere with input fields
            if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;

            e.preventDefault();

            // Determine behavior:
            // - Shift: Jump to next snap position in direction
            // - Ctrl: Move 10px
            // - Default: Move 1px
            const useSnapJump = e.shiftKey && !e.ctrlKey;
            const moveDistance = e.ctrlKey ? 10 : 1;

            if (useSnapJump) {
                // Jump to next snap position
                let direction: SnapDirection;
                switch (e.key) {
                    case "ArrowUp":
                        direction = "up";
                        break;
                    case "ArrowDown":
                        direction = "down";
                        break;
                    case "ArrowLeft":
                        direction = "left";
                        break;
                    case "ArrowRight":
                        direction = "right";
                        break;
                    default:
                        return;
                }
                jumpToNextSnap(direction);
            } else {
                // Normal movement
                let deltaX = 0;
                let deltaY = 0;

                switch (e.key) {
                    case "ArrowUp":
                        deltaY = -moveDistance;
                        break;
                    case "ArrowDown":
                        deltaY = moveDistance;
                        break;
                    case "ArrowLeft":
                        deltaX = -moveDistance;
                        break;
                    case "ArrowRight":
                        deltaX = moveDistance;
                        break;
                }

                moveSelectedWidgets(deltaX, deltaY, false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [editMode, selectedWidgets.size, moveSelectedWidgets, jumpToNextSnap]);

    const handleSelectionStart = useCallback(
        (e: React.MouseEvent) => {
            if (!editMode) return;
            if ((e.target as HTMLElement).closest('[id^="hud-widget-"]')) return;

            e.preventDefault();
            setIsSelecting(true);
            selectionStartRef.current = { x: e.clientX, y: e.clientY };
            setSelectionBox({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY });

            if (!e.ctrlKey && !e.metaKey) {
                setSelectedWidgets(new Set());
            }
        },
        [editMode],
    );

    const handleSelectionMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isSelecting || !selectionStartRef.current) return;

            setSelectionBox({
                startX: selectionStartRef.current.x,
                startY: selectionStartRef.current.y,
                endX: e.clientX,
                endY: e.clientY,
            });
        },
        [isSelecting],
    );

    const handleSelectionEnd = useCallback(() => {
        if (!isSelecting || !selectionBox) {
            setIsSelecting(false);
            setSelectionBox(null);
            return;
        }

        const left = Math.min(selectionBox.startX, selectionBox.endX);
        const right = Math.max(selectionBox.startX, selectionBox.endX);
        const top = Math.min(selectionBox.startY, selectionBox.endY);
        const bottom = Math.max(selectionBox.startY, selectionBox.endY);

        const newSelection = new Set(selectedWidgets);
        widgets.forEach((widget) => {
            if (isExcludedFromMultiSelect(widget.id)) return;
            if (!isWidgetVisible(widget.id)) return;

            const el = getWidgetElement(widget.id);
            if (!el) return;

            const rect = el.getBoundingClientRect();
            if (rect.left < right && rect.right > left && rect.top < bottom && rect.bottom > top) {
                newSelection.add(widget.id);
            }
        });

        setSelectedWidgets(newSelection);
        setIsSelecting(false);
        setSelectionBox(null);
        selectionStartRef.current = null;
    }, [isSelecting, selectionBox, widgets, selectedWidgets]);

    // Clear selection when exiting edit mode
    useEffect(() => {
        if (!editMode) {
            setSelectedWidgets(new Set());
        }
    }, [editMode]);

    const getMultiSelectProps = useCallback(
        (id: string) => {
            const selectedWidgetIds = Array.from(selectedWidgets);
            const shakeDirection = shakingWidgets.get(id);
            return {
                isSelected: selectedWidgets.has(id),
                onSelect: handleWidgetSelect,
                onDragStart: selectedWidgets.has(id) ? handleWidgetDragStart : undefined,
                onDragMove: selectedWidgets.has(id) && selectedWidgets.size > 1 ? handleWidgetDragMove : undefined,
                onDragEnd: selectedWidgets.has(id) && selectedWidgets.size > 1 ? handleWidgetDragEnd : undefined,
                onClearSelection: () => setSelectedWidgets(new Set()),
                // Snap props - passed through to HUDWidget
                getSnappedPosition: getSnappedPosition
                    ? (widgetId: string, position: WidgetPosition) =>
                          getSnappedPosition(widgetId, position, selectedWidgetIds)
                    : undefined,
                onSnapLinesClear,
                // Pass selected widget IDs for group-aware snapping
                selectedWidgetIds,
                // Shake animation state
                shakeDirection,
            };
        },
        [
            selectedWidgets,
            shakingWidgets,
            handleWidgetSelect,
            handleWidgetDragStart,
            handleWidgetDragMove,
            handleWidgetDragEnd,
            getSnappedPosition,
            onSnapLinesClear,
        ],
    );

    return {
        selectedWidgets,
        selectionBox,
        isSelecting,
        handleSelectionStart,
        handleSelectionMove,
        handleSelectionEnd,
        getMultiSelectProps,
        setSelectedWidgets,
        shakingWidgets,
    };
};
