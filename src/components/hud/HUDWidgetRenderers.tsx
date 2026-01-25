import { memo, useCallback } from "react";
import { HUDWidget } from "./HUDWidget";
import { StatusWidget } from "./widgets/StatusWidget";
import { MoneyWidget } from "./widgets/MoneyWidget";
import { VoiceWidget } from "./widgets/VoiceWidget";
import { LocationWidget } from "./widgets/LocationWidget";
import { ClockWidget } from "./widgets/ClockWidget";
import { DateWidget } from "./widgets/DateWidget";
import { BrandingWidget } from "./widgets/BrandingWidget";
import { WantedWidget } from "./widgets/WantedWidget";
import { ServerInfoWidget } from "./widgets/ServerInfoWidget";
import { ServerNameWidget } from "./widgets/ServerNameWidget";
import { CompassWidget } from "./widgets/CompassWidget";
import { VehicleNameWidget } from "./widgets/VehicleNameWidget";
import { NotificationContainer } from "./notifications/NotificationContainer";
import { ChatWidget } from "./widgets/ChatWidget";
import { TeamChatWidget } from "./widgets/TeamChatWidget";
import { RadioWidget } from "./widgets/RadioWidget";
import { MinimapWidget } from "./widgets/MinimapWidget";
import { StatusType } from "@/types/hud";
import { WidgetPosition, StatusDesign, MinimapShape, SpeedometerType, ResolvedWidgetConfig } from "@/types/widget";
import { DEMO_RADIO_ENABLED, EDIT_MODE_DEMO_NOTIFICATIONS } from "./data/demoData";

// Import stores - widgets subscribe to their own data
import { useIsDemoMode } from "@/stores/hudStore";
import { useIsDead } from "@/stores/deathStore";
import { useStatusStore, useIsUnderwater } from "@/stores/statusStore";
import { useMoneyData, usePlayerData } from "@/stores/moneyStore";
import { useVoiceData, useIsVoiceEnabled, useRadioData } from "@/stores/voiceStore";
import { useLocationData, useHeading } from "@/stores/locationStore";
import { useVehicleStore } from "@/stores/vehicleStore";
import { useTeamChatHasAccess } from "@/stores/chatStore";
import { useNotifications, useRemoveNotification } from "@/stores/notificationStore";
import { useWantedLevel, useIsEvading, useServerName, usePlayerCount, useMaxPlayers } from "@/stores/utilityStore";
import { isNuiEnvironment } from "@/lib/nuiUtils";
import { STATUS_WIDGET_IDS } from "@/lib/widgetConfig";

// ==========================================
// LAYOUT-ONLY PROPS INTERFACE
// No widget data, no notifications - only layout/edit concerns
// ==========================================
export interface LayoutOnlyProps {
    // Layout settings
    editMode: boolean;
    snapToGrid: boolean;
    gridSize: number;
    statusDesign: StatusDesign;
    speedometerType: SpeedometerType;
    minimapShape: MinimapShape;
    hasSignaledReady: boolean;
    autoLayoutHiddenIds: string[];

    // Layout functions only
    getWidget: (id: string) => ResolvedWidgetConfig | undefined;
    updateWidgetPosition: (id: string, position: WidgetPosition) => void;
    updateWidgetScale: (id: string, scale: number) => void;
    toggleWidgetVisibility: (id: string) => void;
    resetWidget: (id: string, isWidgetDisabled?: (id: string) => boolean, hasSignaledReady?: boolean) => void;
    isWidgetDisabled: (id: string) => boolean;
    getMultiSelectProps: (id: string) => Record<string, unknown>;
}

// ==========================================
// NOTIFICATIONS WIDGET - Self-subscribed to notification store
// ==========================================
const NotificationsRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("notifications");
    const isDead = useIsDead();

    // Self-subscribe to notification store - only this component re-renders on notification changes
    const notifications = useNotifications();
    const removeNotification = useRemoveNotification();

    // Demo notifications for edit mode
    const isUsingEditDemoNotifications = editMode && notifications.length === 0;
    const displayedNotifications = isUsingEditDemoNotifications ? EDIT_MODE_DEMO_NOTIFICATIONS : notifications;

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    const handleClose = useCallback(
        (id: string) => {
            if (!isUsingEditDemoNotifications) {
                removeNotification(id);
            }
        },
        [isUsingEditDemoNotifications, removeNotification],
    );

    if (!widget) return null;

    const isDeadOverlay = isDead && !editMode;

    return (
        <HUDWidget
            id={widget.id}
            position={isDeadOverlay ? { x: 40, y: 40 } : widget.position}
            visible={widget.visible}
            scale={widget.scale}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            className={isDeadOverlay ? "z-50" : ""}
            {...getMultiSelectProps(widget.id)}>
            <NotificationContainer
                notifications={displayedNotifications}
                onClose={handleClose}
            />
        </HUDWidget>
    );
};

export const NotificationsRenderer = memo(NotificationsRendererComponent);

const StatusWidgetItemComponent = ({
    type,
    editMode,
    snapToGrid,
    gridSize,
    statusDesign,
    hasSignaledReady,
    autoLayoutHiddenIds,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps & { type: StatusType }) => {
    const widget = getWidget(type);
    const isDead = useIsDead();

    // Subscribe only to this specific status value
    const value = useStatusStore((state) => state[type] ?? 100);
    const isUnderwater = useIsUnderwater();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const isOxygenHidden = type === "oxygen" && !editMode && !isUnderwater;
    const baseVisible = widget.visible && (editMode ? true : !isDead) && !isOxygenHidden;

    return (
        <HUDWidget
            id={type}
            position={widget.position}
            visible={baseVisible}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            suspended={autoLayoutHiddenIds.includes(type)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(type)}>
            <StatusWidget
                type={type}
                value={value}
                design={statusDesign}
            />
        </HUDWidget>
    );
};

const StatusWidgetItem = memo(StatusWidgetItemComponent);

const StatusWidgetsRendererComponent = (props: LayoutOnlyProps) => {
    return (
        <>
            {STATUS_WIDGET_IDS.map((type) => (
                <StatusWidgetItem
                    key={type}
                    type={type}
                    {...props}
                />
            ))}
        </>
    );
};

export const StatusWidgetsRenderer = memo(StatusWidgetsRendererComponent);

// ==========================================
// MONEY WIDGET - Subscribes to money store
// ==========================================
const MoneyWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("money");
    const isDead = useIsDead();

    // Widget subscribes to its own data
    const money = useMoneyData();
    const player = usePlayerData();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !isDead);

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={baseVisible}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <MoneyWidget
                money={money}
                player={player}
            />
        </HUDWidget>
    );
};

export const MoneyWidgetRenderer = memo(MoneyWidgetRendererComponent);

// ==========================================
// BRANDING WIDGET - Self-contained, no external data
// ==========================================
const BrandingWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("branding");
    const isDead = useIsDead();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !isDead);

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={baseVisible}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={undefined}
            onScaleChange={undefined}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <BrandingWidget />
        </HUDWidget>
    );
};

export const BrandingWidgetRenderer = memo(BrandingWidgetRendererComponent);

// ==========================================
// CLOCK WIDGET - Self-contained, no external data
// ==========================================
const ClockWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("clock");
    const isDead = useIsDead();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !isDead);

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={baseVisible}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <ClockWidget />
        </HUDWidget>
    );
};

export const ClockWidgetRenderer = memo(ClockWidgetRendererComponent);

// ==========================================
// VOICE WIDGET - Subscribes to voice store
// ==========================================
const VoiceWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    autoLayoutHiddenIds,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("voice");
    const isDead = useIsDead();
    const isDemoMode = useIsDemoMode();

    // Widget subscribes to its own data
    const voice = useVoiceData();
    const isVoiceEnabled = useIsVoiceEnabled();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const baseVisible = editMode ? true : !isDead;
    const voiceAvailable = isDemoMode || isVoiceEnabled;
    const isVisibleWidget = widget.visible && baseVisible && voiceAvailable;

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={isVisibleWidget}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            suspended={autoLayoutHiddenIds.includes(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <VoiceWidget voice={voice} />
        </HUDWidget>
    );
};

export const VoiceWidgetRenderer = memo(VoiceWidgetRendererComponent);

// ==========================================
// RADIO WIDGET - Subscribes to voice store
// ==========================================
const RadioWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("radio");
    const isDead = useIsDead();
    const isDemoMode = useIsDemoMode();

    // Widget subscribes to its own data
    const radioData = useRadioData();
    const isVoiceEnabled = useIsVoiceEnabled();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const baseVisible = editMode ? true : !isDead;
    const voiceAvailable = isDemoMode || isVoiceEnabled;
    const showRadio = radioData.active || editMode;
    const isVisibleWidget = widget.visible && baseVisible && voiceAvailable && showRadio;
    const radioDisplay = editMode && !radioData.active ? DEMO_RADIO_ENABLED : radioData;

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={isVisibleWidget}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <RadioWidget radio={radioDisplay} />
        </HUDWidget>
    );
};

export const RadioWidgetRenderer = memo(RadioWidgetRendererComponent);

// ==========================================
// LOCATION WIDGET - Subscribes to location store
// ==========================================
const LocationWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    minimapShape,
    hasSignaledReady,
    autoLayoutHiddenIds,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("location");
    const isDead = useIsDead();

    // Widget subscribes to its own data
    const location = useLocationData();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !isDead);

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={baseVisible}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            suspended={autoLayoutHiddenIds.includes(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <LocationWidget
                location={location}
                shape={minimapShape}
            />
        </HUDWidget>
    );
};

export const LocationWidgetRenderer = memo(LocationWidgetRendererComponent);

// ==========================================
// COMPASS WIDGET - Subscribes to location store
// ==========================================
const CompassWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("compass");
    const isDead = useIsDead();

    // Widget subscribes to its own data
    const heading = useHeading();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const showCompass = heading != undefined || editMode;
    const baseVisible = widget.visible && (editMode ? true : !isDead) && showCompass;

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={baseVisible}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <CompassWidget heading={heading} />
        </HUDWidget>
    );
};

export const CompassWidgetRenderer = memo(CompassWidgetRendererComponent);

// ==========================================
// VEHICLE NAME WIDGET - Subscribes to vehicle store
// ==========================================
const VehicleNameWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    speedometerType,
    hasSignaledReady,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("vehiclename");
    const isDead = useIsDead();

    // Widget subscribes to its own data
    const inVehicle = useVehicleStore((s) => s.inVehicle);
    const vehicleType = useVehicleStore((s) => s.vehicleType);
    const vehicleName = useVehicleStore((s) => s.vehicleName);
    const vehicleSpawnName = useVehicleStore((s) => s.vehicleSpawnName);

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !isDead);

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={baseVisible}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <VehicleNameWidget
                vehicleType={editMode ? speedometerType : vehicleType}
                vehicleName={vehicleName}
                vehicleSpawnName={vehicleSpawnName}
                inVehicle={inVehicle}
                editMode={editMode}
            />
        </HUDWidget>
    );
};

export const VehicleNameWidgetRenderer = memo(VehicleNameWidgetRendererComponent);

// ==========================================
// MINIMAP WIDGET
// ==========================================
const MinimapWidgetRendererComponent = ({
    editMode,
    minimapShape,
    hasSignaledReady,
    autoLayoutHiddenIds,
    getWidget,
    isWidgetDisabled,
}: LayoutOnlyProps) => {
    const widget = getWidget("minimap");
    if (!widget) return null;

    const isNUI = isNuiEnvironment();
    const baseVisible = widget.visible && (editMode || !isNUI);

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={baseVisible}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            suspended={autoLayoutHiddenIds.includes(widget.id)}
            editMode={editMode}
            snapToGrid={false}
            gridSize={0}
            onPositionChange={undefined}
            onVisibilityToggle={undefined}
            onScaleChange={undefined}
            onReset={undefined}>
            <MinimapWidget shape={minimapShape} />
        </HUDWidget>
    );
};

export const MinimapWidgetRenderer = memo(MinimapWidgetRendererComponent);

// ==========================================
// CHAT WIDGET - Subscribes to chat store
// ==========================================
const ChatWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("chat");
    const isDead = useIsDead();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !isDead);

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={baseVisible}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <ChatWidget editMode={editMode} />
        </HUDWidget>
    );
};

export const ChatWidgetRenderer = memo(ChatWidgetRendererComponent);

// ==========================================
// TEAM CHAT WIDGET - Subscribes to chat store
// ==========================================
const TeamChatWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("teamchat");
    const isDead = useIsDead();

    // Widget subscribes to its own data
    const hasTeamAccess = useTeamChatHasAccess();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const baseVisible = hasTeamAccess && (editMode || !isDead);
    const isVisibleWidget = widget.visible && baseVisible;

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={isVisibleWidget}
            scale={widget.scale}
            hasAccess={hasTeamAccess}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <TeamChatWidget editMode={editMode} />
        </HUDWidget>
    );
};

export const TeamChatWidgetRenderer = memo(TeamChatWidgetRendererComponent);

// ==========================================
// WANTED WIDGET - Subscribes to utility store
// ==========================================
const WantedWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("wanted");
    const isDead = useIsDead();

    const wantedLevel = useWantedLevel();
    const isEvading = useIsEvading();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    // Show in edit mode, or when player has wanted level
    const showWanted = wantedLevel > 0 || editMode;
    const baseVisible = widget.visible && (editMode ? true : !isDead) && showWanted;

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={baseVisible}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <WantedWidget
                wantedLevel={editMode && wantedLevel === 0 ? 3 : wantedLevel}
                isEvading={editMode ? true : isEvading}
            />
        </HUDWidget>
    );
};

export const WantedWidgetRenderer = memo(WantedWidgetRendererComponent);

// ==========================================
// DATE WIDGET - Self-contained with locale sync
// ==========================================
const DateWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("date");
    const isDead = useIsDead();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !isDead);

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={baseVisible}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <DateWidget />
        </HUDWidget>
    );
};

export const DateWidgetRenderer = memo(DateWidgetRendererComponent);

// ==========================================
// SERVER INFO WIDGET - Subscribes to utility store
// ==========================================
const ServerInfoWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("serverinfo");
    const isDead = useIsDead();

    const playerCount = usePlayerCount();
    const maxPlayers = useMaxPlayers();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !isDead);

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={baseVisible}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <ServerInfoWidget
                playerCount={playerCount}
                maxPlayers={maxPlayers}
            />
        </HUDWidget>
    );
};

export const ServerInfoWidgetRenderer = memo(ServerInfoWidgetRendererComponent);

// ==========================================
// SERVER NAME WIDGET - Subscribes to utility store
// ==========================================
const ServerNameWidgetRendererComponent = ({
    editMode,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: LayoutOnlyProps) => {
    const widget = getWidget("servername");
    const isDead = useIsDead();

    const serverName = useServerName();

    const handleReset = useCallback(
        (id: string) => resetWidget(id, isWidgetDisabled, false),
        [resetWidget, isWidgetDisabled],
    );

    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !isDead);

    return (
        <HUDWidget
            id={widget.id}
            position={widget.position}
            visible={baseVisible}
            scale={widget.scale}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={updateWidgetScale}
            onReset={handleReset}
            {...getMultiSelectProps(widget.id)}>
            <ServerNameWidget serverName={serverName} />
        </HUDWidget>
    );
};

export const ServerNameWidgetRenderer = memo(ServerNameWidgetRendererComponent);

// ==========================================
// COMBINED WIDGET RENDERERS COMPONENT
// ==========================================
const HUDWidgetRenderersComponent = (props: LayoutOnlyProps) => {
    return (
        <>
            <NotificationsRenderer {...props} />
            <StatusWidgetsRenderer {...props} />
            <MoneyWidgetRenderer {...props} />
            <BrandingWidgetRenderer {...props} />
            <ClockWidgetRenderer {...props} />
            <DateWidgetRenderer {...props} />
            <WantedWidgetRenderer {...props} />
            <ServerInfoWidgetRenderer {...props} />
            <ServerNameWidgetRenderer {...props} />
            <VoiceWidgetRenderer {...props} />
            <RadioWidgetRenderer {...props} />
            <LocationWidgetRenderer {...props} />
            <CompassWidgetRenderer {...props} />
            <VehicleNameWidgetRenderer {...props} />
            <MinimapWidgetRenderer {...props} />
            <ChatWidgetRenderer {...props} />
            <TeamChatWidgetRenderer {...props} />
        </>
    );
};

export const HUDWidgetRenderers = memo(HUDWidgetRenderersComponent);
