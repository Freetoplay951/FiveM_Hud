import { PositionResolver } from "@/lib/widgetPositionResolver";

export interface WidgetPosition {
    x: number;
    y: number;
}

export type WidgetPositionFunction = (
    id: string,
    widgetElement: HTMLElement | null,
    resolver: PositionResolver
) => WidgetPosition;

export interface WidgetConfig {
    id: string;
    type: WidgetType;
    position: WidgetPositionFunction;
    visible: boolean;
    scale?: number;
}

export interface ResolvedWidgetConfig {
    id: string;
    type: WidgetType;
    position: WidgetPosition;
    visible: boolean;
    scale?: number;
}

export type WidgetType =
    | "health"
    | "armor"
    | "hunger"
    | "thirst"
    | "stamina"
    | "stress"
    | "oxygen"
    | "money"
    | "clock"
    | "compass"
    | "vehiclename"
    | "minimap"
    | "voice"
    | "radio"
    | "location"
    | "speedometer"
    | "notifications"
    | "chat"
    | "teamchat";

export type StatusDesign = "circular" | "bar" | "vertical" | "minimal" | "arc";
export type SpeedometerType = "car" | "plane" | "boat" | "helicopter" | "motorcycle" | "bicycle";
export type MinimapShape = "square" | "round";

export interface HUDLayoutState {
    widgets: ResolvedWidgetConfig[];
    editMode: boolean;
    snapToGrid: boolean;
    gridSize: number;
    statusDesign: StatusDesign;
    hudScale: number;
    speedometerType: SpeedometerType;
    minimapShape: MinimapShape;
    widgetsDistributed: boolean;
}

const MARGIN = 20;
const GAP = 10;

// Helper to calculate status widget positions in a chain
const getStatusWidgetPosition = (
    widgetId: string,
    widgetElement: HTMLElement | null,
    resolver: PositionResolver
): WidgetPosition => {
    const statusWidgetIds = ["health", "armor", "hunger", "thirst", "stamina", "stress", "oxygen"];
    const currentIndex = statusWidgetIds.indexOf(widgetId);

    let x = resolver.getWidgetRect("minimap").right + GAP;

    // Calculate x by summing widths of all previous ENABLED status widgets
    for (let i = 0; i < currentIndex; i++) {
        const prevWidgetId = statusWidgetIds[i];

        // Skip disabled widgets - they don't take up space
        if (resolver.isWidgetDisabled?.(prevWidgetId)) {
            continue;
        }

        const prevRect = resolver.getWidgetRect(prevWidgetId);
        if (prevRect && prevRect.width > 0) {
            x = prevRect.right + GAP;
        }
    }

    const height = widgetElement?.offsetHeight ?? 0;

    return {
        x,
        y: resolver.screen.height - MARGIN - height,
    };
};

export const getDefaultWidgets = (): WidgetConfig[] => {
    return [
        // === Independent widgets (no dependencies) ===
        {
            id: "compass",
            type: "compass",
            position: (_id, _el, resolver) => {
                return { x: MARGIN, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "clock",
            type: "clock",
            position: (_id, el, resolver) => {
                const width = el?.offsetWidth ?? 0;
                return { x: resolver.screen.width / 2 - width / 2, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "money",
            type: "money",
            position: (_id, el, resolver) => {
                const width = el?.offsetWidth ?? 0;
                return { x: resolver.screen.width - MARGIN - width, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "voice",
            type: "voice",
            position: (_id, el, resolver) => {
                const width = el?.offsetWidth ?? 0;
                const height = el?.offsetHeight ?? 0;
                return {
                    x: resolver.screen.width / 2 - width / 2,
                    y: resolver.screen.height - MARGIN - height,
                };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "minimap",
            type: "minimap",
            position: (_id, el, resolver) => {
                const height = el?.offsetHeight ?? 0;
                return {
                    x: MARGIN,
                    y: resolver.screen.height - MARGIN - height,
                };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "speedometer",
            type: "speedometer",
            position: (_id, el, resolver) => {
                const width = el?.offsetWidth ?? 0;
                const height = el?.offsetHeight ?? 0;
                return {
                    x: resolver.screen.width - MARGIN - width,
                    y: resolver.screen.height - MARGIN - height,
                };
            },
            visible: true,
            scale: 1,
        },

        // === Dependent widgets (depend on previously defined widgets) ===
        {
            id: "vehiclename",
            type: "vehiclename",
            position: (_id, _el, resolver) => {
                const compassRect = resolver.getWidgetRect("compass");
                const x = compassRect ? compassRect.right + GAP : MARGIN;
                return { x, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "notifications",
            type: "notifications",
            position: (_id, _el, resolver) => {
                const compassRect = resolver.getWidgetRect("compass");
                const y = compassRect ? compassRect.bottom + GAP * 4 : MARGIN;
                return { x: MARGIN, y };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "teamchat",
            type: "teamchat",
            position: (_id, el, resolver) => {
                const moneyRect = resolver.getWidgetRect("money");
                const width = el?.offsetWidth ?? 0;
                const x = moneyRect ? moneyRect.x - GAP - width : resolver.screen.width - MARGIN - width;
                return { x, y: MARGIN };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "radio",
            type: "radio",
            position: (_id, el, resolver) => {
                const moneyRect = resolver.getWidgetRect("money");
                const width = el?.offsetWidth ?? 0;
                const scale = 0.8;
                const scaledWidth = width * scale;

                if (moneyRect) {
                    const moneyCenterX = moneyRect.x + moneyRect.width / 2;
                    return {
                        x: moneyCenterX - scaledWidth / 2,
                        y: moneyRect.bottom + GAP,
                    };
                }

                return {
                    x: resolver.screen.width - MARGIN - scaledWidth,
                    y: MARGIN + 50 + GAP,
                };
            },
            visible: true,
            scale: 0.8,
        },
        {
            id: "chat",
            type: "chat",
            position: (_id, _el, resolver) => {
                const notifyRect = resolver.getWidgetRect("notifications");
                const y = notifyRect ? notifyRect.bottom + GAP * 2 : resolver.screen.height / 4;
                return { x: MARGIN, y };
            },
            visible: true,
            scale: 1,
        },
        {
            id: "location",
            type: "location",
            position: (_id, el, resolver) => {
                const minimapRect = resolver.getWidgetRect("minimap");
                const width = el?.offsetWidth ?? 0;

                if (minimapRect) {
                    const minimapCenterX = minimapRect.x + minimapRect.width / 2;
                    return {
                        x: minimapCenterX - width / 2,
                        y: minimapRect.y - GAP - el.offsetHeight,
                    };
                }

                return {
                    x: resolver.screen.width - MARGIN - width,
                    y: MARGIN + 50 + GAP,
                };
            },
            visible: true,
            scale: 1,
        },

        // === Status widgets (chain dependency) ===
        {
            id: "health",
            type: "health",
            position: (_id, el, resolver) => getStatusWidgetPosition("health", el, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "armor",
            type: "armor",
            position: (_id, el, resolver) => getStatusWidgetPosition("armor", el, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "hunger",
            type: "hunger",
            position: (_id, el, resolver) => getStatusWidgetPosition("hunger", el, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "thirst",
            type: "thirst",
            position: (_id, el, resolver) => getStatusWidgetPosition("thirst", el, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "stamina",
            type: "stamina",
            position: (_id, el, resolver) => getStatusWidgetPosition("stamina", el, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "stress",
            type: "stress",
            position: (_id, el, resolver) => getStatusWidgetPosition("stress", el, resolver),
            visible: true,
            scale: 1,
        },
        {
            id: "oxygen",
            type: "oxygen",
            position: (_id, el, resolver) => getStatusWidgetPosition("oxygen", el, resolver),
            visible: true,
            scale: 1,
        },
    ];
};
