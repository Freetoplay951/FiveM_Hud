import { WidgetPosition } from "@/types/widget";
import { getWidgetElementId } from "@/lib/widgetConfig";

/** Get widget DOM element by ID */
export const getWidgetElement = (id: string): HTMLElement | null => document.getElementById(getWidgetElementId(id));

/** Get widget position from DOM */
export const getWidgetDOMPosition = (id: string): WidgetPosition | null => {
    const el = getWidgetElement(id);
    if (!el) return null;
    const x = parseInt(el.style.left, 10);
    const y = parseInt(el.style.top, 10);
    return isNaN(x) || isNaN(y) ? null : { x, y };
};

/** Set widget position in DOM */
export const setWidgetDOMPosition = (id: string, pos: WidgetPosition): void => {
    const el = getWidgetElement(id);
    if (el) {
        el.style.left = `${pos.x}px`;
        el.style.top = `${pos.y}px`;
    }
};

/** Calculate viewport clamp adjustment for a group of widgets */
export const calcGroupClampAdjust = (
    widgetIds: string[],
    getNewPos: (id: string) => WidgetPosition | null,
): { adjustX: number; adjustY: number } => {
    let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

    for (const id of widgetIds) {
        const el = getWidgetElement(id);
        const pos = getNewPos(id);
        if (!el || !pos) continue;

        const rect = el.getBoundingClientRect();
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + rect.width);
        maxY = Math.max(maxY, pos.y + rect.height);
    }

    return {
        adjustX: minX < 0 ? -minX : maxX > window.innerWidth ? window.innerWidth - maxX : 0,
        adjustY: minY < 0 ? -minY : maxY > window.innerHeight ? window.innerHeight - maxY : 0,
    };
};

/** Check if widget element is visible */
export const isWidgetVisible = (id: string): boolean => {
    const el = getWidgetElement(id);
    if (!el) return false;

    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();

    return (
        style.visibility !== "hidden" &&
        style.opacity !== "0" &&
        style.display !== "none" &&
        rect.width > 0 &&
        rect.height > 0
    );
};
