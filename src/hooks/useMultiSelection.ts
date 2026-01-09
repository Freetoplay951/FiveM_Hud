import { useState, useCallback, useRef, useEffect } from "react";
import { WidgetPosition, ResolvedWidgetConfig } from "@/types/widget";
import {
    getWidgetElement,
    getWidgetDOMPosition,
    setWidgetDOMPosition,
    calcGroupClampAdjust,
    isWidgetVisible,
} from "@/lib/widgetUtils";

interface UseMultiSelectionProps {
    editMode: boolean;
    widgets: ResolvedWidgetConfig[];
    getWidget: (id: string) => ResolvedWidgetConfig | undefined;
    updateWidgetPosition: (id: string, position: WidgetPosition) => void;
}

export const useMultiSelection = ({
    editMode,
    widgets,
    getWidget,
    updateWidgetPosition,
}: UseMultiSelectionProps) => {
    const [selectedWidgets, setSelectedWidgets] = useState<Set<string>>(new Set());
    const [selectionBox, setSelectionBox] = useState<{
        startX: number;
        startY: number;
        endX: number;
        endY: number;
    } | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
    const widgetStartPositionsRef = useRef<Map<string, WidgetPosition>>(new Map());

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

    const handleWidgetDragStart = useCallback(
        (id: string, startPos: WidgetPosition) => {
            widgetStartPositionsRef.current.clear();
            selectedWidgets.forEach((widgetId) => {
                const widget = getWidget(widgetId);
                if (widget) {
                    widgetStartPositionsRef.current.set(widgetId, { ...widget.position });
                }
            });
        },
        [selectedWidgets, getWidget]
    );

    const handleWidgetDragMove = useCallback((deltaX: number, deltaY: number) => {
        const widgetIds = Array.from(widgetStartPositionsRef.current.keys());
        const getNewPos = (id: string) => {
            const start = widgetStartPositionsRef.current.get(id);
            return start ? { x: start.x + deltaX, y: start.y + deltaY } : null;
        };

        const { adjustX, adjustY } = calcGroupClampAdjust(widgetIds, getNewPos);

        widgetIds.forEach((id) => {
            const pos = getNewPos(id);
            if (pos) setWidgetDOMPosition(id, { x: pos.x + adjustX, y: pos.y + adjustY });
        });
    }, []);

    const handleWidgetDragEnd = useCallback(() => {
        widgetStartPositionsRef.current.forEach((_, id) => {
            const pos = getWidgetDOMPosition(id);
            if (pos) updateWidgetPosition(id, pos);
        });
        widgetStartPositionsRef.current.clear();
    }, [updateWidgetPosition]);

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
        [editMode]
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
        [isSelecting]
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
        (id: string) => ({
            isSelected: selectedWidgets.has(id),
            onSelect: handleWidgetSelect,
            onDragStart: selectedWidgets.has(id) ? handleWidgetDragStart : undefined,
            onDragMove: selectedWidgets.has(id) && selectedWidgets.size > 1 ? handleWidgetDragMove : undefined,
            onDragEnd: selectedWidgets.has(id) && selectedWidgets.size > 1 ? handleWidgetDragEnd : undefined,
            onClearSelection: () => setSelectedWidgets(new Set()),
        }),
        [selectedWidgets, handleWidgetSelect, handleWidgetDragStart, handleWidgetDragMove, handleWidgetDragEnd]
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
    };
};
