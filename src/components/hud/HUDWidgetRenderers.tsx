import { HUDWidget } from "./HUDWidget";
import { StatusWidget } from "./widgets/StatusWidget";
import { MoneyWidget } from "./widgets/MoneyWidget";
import { VoiceWidget } from "./widgets/VoiceWidget";
import { LocationWidget } from "./widgets/LocationWidget";
import { ClockWidget } from "./widgets/ClockWidget";
import { CompassWidget } from "./widgets/CompassWidget";
import { VehicleNameWidget } from "./widgets/VehicleNameWidget";
import { NotificationContainer } from "./notifications/NotificationContainer";
import { ChatWidget } from "./widgets/ChatWidget";
import { TeamChatWidget } from "./widgets/TeamChatWidget";
import { RadioWidget } from "./widgets/RadioWidget";
import { MinimapWidget } from "./widgets/MinimapWidget";
import { isNuiEnvironment, sendNuiCallback } from "@/hooks/useNuiEvents";
import {
    StatusWidgetState,
    VehicleState,
    MoneyState,
    PlayerState,
    VoiceState,
    LocationState,
    DeathState,
    ChatState,
    TeamChatState,
    RadioState,
    StatusType,
    NotificationData,
} from "@/types/hud";
import { WidgetPosition, StatusDesign, MinimapShape, SpeedometerType, ResolvedWidgetConfig } from "@/types/widget";
import { DEMO_RADIO_ENABLED } from "./data/demoData";

// ==========================================
// SHARED WIDGET PROPS INTERFACE
// ==========================================
export interface WidgetRenderersProps {
    // State
    statusState: StatusWidgetState;
    vehicleState: VehicleState;
    moneyState: MoneyState;
    playerState: PlayerState;
    voiceState: VoiceState;
    locationState: LocationState;
    deathState: DeathState;
    chatState: ChatState;
    teamChatState: TeamChatState;
    radioState: RadioState;

    // Settings
    editMode: boolean;
    snapToGrid: boolean;
    gridSize: number;
    statusDesign: StatusDesign;
    speedometerType: SpeedometerType;
    minimapShape: MinimapShape;
    isDemoMode: boolean;
    isVoiceEnabled: boolean;
    hasSignaledReady: boolean;
    autoLayoutHiddenIds: string[];

    // Notifications
    notifications: NotificationData[];
    removeNotification: (id: string) => void;
    displayedNotifications: NotificationData[];
    isUsingEditDemoNotifications: boolean;

    // Widget functions
    getWidget: (id: string) => ResolvedWidgetConfig | undefined;
    updateWidgetPosition: (id: string, position: WidgetPosition) => void;
    updateWidgetScale: (id: string, scale: number) => void;
    toggleWidgetVisibility: (id: string) => void;
    resetWidget: (id: string, isWidgetDisabled?: (id: string) => boolean, hasSignaledReady?: boolean) => void;
    isWidgetDisabled: (id: string) => boolean;
    getMultiSelectProps: (id: string) => Record<string, unknown>;

    // State setters for chat
    setChatState: React.Dispatch<React.SetStateAction<ChatState>>;
    setTeamChatState: React.Dispatch<React.SetStateAction<TeamChatState>>;
}

// ==========================================
// NOTIFICATIONS WIDGET
// ==========================================
export const NotificationsRenderer = ({
    editMode,
    deathState,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    displayedNotifications,
    isUsingEditDemoNotifications,
    removeNotification,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: WidgetRenderersProps) => {
    const widget = getWidget("notifications");
    if (!widget) return null;

    const isDeadOverlay = deathState.isDead && !editMode;

    return (
        <HUDWidget
            id={widget.id}
            position={isDeadOverlay ? { x: 20, y: 20 } : widget.position}
            visible={widget.visible}
            scale={widget.scale}
            editMode={editMode}
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={updateWidgetPosition}
            onScaleChange={updateWidgetScale}
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            disabled={!hasSignaledReady || isWidgetDisabled(widget.id)}
            className={isDeadOverlay ? "z-50" : ""}
            {...getMultiSelectProps(widget.id)}>
            <NotificationContainer
                notifications={displayedNotifications}
                onClose={isUsingEditDemoNotifications ? () => {} : removeNotification}
            />
        </HUDWidget>
    );
};

// ==========================================
// STATUS WIDGETS
// ==========================================
const STATUS_TYPES: StatusType[] = ["health", "armor", "hunger", "thirst", "stamina", "stress", "oxygen"];

export const StatusWidgetsRenderer = ({
    statusState,
    editMode,
    deathState,
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
}: WidgetRenderersProps) => {
    return (
        <>
            {STATUS_TYPES.map((type) => {
                const widget = getWidget(type);
                if (!widget) return null;

                const value = statusState[type] ?? 100;
                const isOxygenHidden = type === "oxygen" && !editMode && !statusState.isUnderwater;
                const baseVisible = widget.visible && (editMode ? true : !deathState.isDead) && !isOxygenHidden;

                return (
                    <HUDWidget
                        key={type}
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
                        onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
                        {...getMultiSelectProps(type)}>
                        <StatusWidget
                            type={type}
                            value={value}
                            design={statusDesign}
                        />
                    </HUDWidget>
                );
            })}
        </>
    );
};

// ==========================================
// MONEY WIDGET
// ==========================================
export const MoneyWidgetRenderer = ({
    moneyState,
    playerState,
    editMode,
    deathState,
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
}: WidgetRenderersProps) => {
    const widget = getWidget("money");
    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !deathState.isDead);

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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <MoneyWidget
                money={moneyState}
                player={playerState}
            />
        </HUDWidget>
    );
};

// ==========================================
// CLOCK WIDGET
// ==========================================
export const ClockWidgetRenderer = ({
    editMode,
    deathState,
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
}: WidgetRenderersProps) => {
    const widget = getWidget("clock");
    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !deathState.isDead);

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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <ClockWidget />
        </HUDWidget>
    );
};

// ==========================================
// VOICE WIDGET
// ==========================================
export const VoiceWidgetRenderer = ({
    voiceState,
    editMode,
    deathState,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    isDemoMode,
    isVoiceEnabled,
    autoLayoutHiddenIds,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: WidgetRenderersProps) => {
    const widget = getWidget("voice");
    if (!widget) return null;

    const baseVisible = editMode ? true : !deathState.isDead;
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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <VoiceWidget voice={voiceState} />
        </HUDWidget>
    );
};

// ==========================================
// RADIO WIDGET
// ==========================================
export const RadioWidgetRenderer = ({
    radioState,
    editMode,
    deathState,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    isDemoMode,
    isVoiceEnabled,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: WidgetRenderersProps) => {
    const widget = getWidget("radio");
    if (!widget) return null;

    const baseVisible = editMode ? true : !deathState.isDead;
    const voiceAvailable = isDemoMode || isVoiceEnabled;
    const showRadio = radioState.active || editMode;
    const isVisibleWidget = widget.visible && baseVisible && voiceAvailable && showRadio;
    const radioData = editMode && !radioState.active ? DEMO_RADIO_ENABLED : radioState;

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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <RadioWidget radio={radioData} />
        </HUDWidget>
    );
};

// ==========================================
// LOCATION WIDGET
// ==========================================
export const LocationWidgetRenderer = ({
    locationState,
    editMode,
    deathState,
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
}: WidgetRenderersProps) => {
    const widget = getWidget("location");
    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !deathState.isDead);

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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <LocationWidget
                location={locationState}
                shape={minimapShape}
            />
        </HUDWidget>
    );
};

// ==========================================
// COMPASS WIDGET
// ==========================================
export const CompassWidgetRenderer = ({
    locationState,
    editMode,
    deathState,
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
}: WidgetRenderersProps) => {
    const widget = getWidget("compass");
    if (!widget) return null;

    const showCompass = locationState.heading != undefined || editMode;
    const baseVisible = widget.visible && (editMode ? true : !deathState.isDead) && showCompass;

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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <CompassWidget heading={locationState.heading} />
        </HUDWidget>
    );
};

// ==========================================
// VEHICLE NAME WIDGET
// ==========================================
export const VehicleNameWidgetRenderer = ({
    vehicleState,
    editMode,
    deathState,
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
}: WidgetRenderersProps) => {
    const widget = getWidget("vehiclename");
    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !deathState.isDead);

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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <VehicleNameWidget
                vehicleType={editMode ? speedometerType : vehicleState.vehicleType}
                vehicleName={vehicleState.vehicleName}
                vehicleSpawnName={vehicleState.vehicleSpawnName}
                inVehicle={vehicleState.inVehicle}
                editMode={editMode}
            />
        </HUDWidget>
    );
};

// ==========================================
// MINIMAP WIDGET
// ==========================================
export const MinimapWidgetRenderer = ({
    editMode,
    snapToGrid,
    gridSize,
    minimapShape,
    hasSignaledReady,
    autoLayoutHiddenIds,
    getWidget,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
}: WidgetRenderersProps) => {
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
            snapToGrid={snapToGrid}
            gridSize={gridSize}
            onPositionChange={undefined}
            onVisibilityToggle={toggleWidgetVisibility}
            onScaleChange={undefined}
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}>
            <MinimapWidget shape={minimapShape} />
        </HUDWidget>
    );
};

// ==========================================
// CHAT WIDGET
// ==========================================
export const ChatWidgetRenderer = ({
    chatState,
    setChatState,
    editMode,
    deathState,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    isDemoMode,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: WidgetRenderersProps) => {
    const widget = getWidget("chat");
    if (!widget) return null;

    const baseVisible = widget.visible && (editMode ? true : !deathState.isDead);

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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <ChatWidget
                chat={chatState}
                setChatState={setChatState}
                editMode={editMode}
                onSendMessage={(msg) => {
                    if (isDemoMode) {
                        const newMsg = {
                            id: Date.now().toString(),
                            type: "normal" as const,
                            sender: "Du",
                            message: msg,
                            timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
                        };
                        setChatState((prev) => ({
                            ...prev,
                            isInputActive: false,
                            messages: [...prev.messages, newMsg],
                        }));
                    } else {
                        sendNuiCallback("sendChatMessage", { message: msg });
                    }
                }}
                onClose={() => {
                    if (isDemoMode) {
                        setChatState((prev) => ({ ...prev, isInputActive: false }));
                    } else {
                        sendNuiCallback("closeChat");
                    }
                }}
            />
        </HUDWidget>
    );
};

// ==========================================
// TEAM CHAT WIDGET
// ==========================================
export const TeamChatWidgetRenderer = ({
    teamChatState,
    setTeamChatState,
    editMode,
    deathState,
    snapToGrid,
    gridSize,
    hasSignaledReady,
    isDemoMode,
    getWidget,
    updateWidgetPosition,
    updateWidgetScale,
    toggleWidgetVisibility,
    resetWidget,
    isWidgetDisabled,
    getMultiSelectProps,
}: WidgetRenderersProps) => {
    const widget = getWidget("teamchat");
    if (!widget) return null;

    const hasTeamAccess = teamChatState.hasAccess;
    const baseVisible = hasTeamAccess && (editMode || !deathState.isDead);
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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <TeamChatWidget
                teamChat={teamChatState}
                editMode={editMode}
                onSendMessage={(msg) => {
                    if (isDemoMode) {
                        const newMsg = {
                            id: Date.now().toString(),
                            sender: "Du",
                            rank: "Admin",
                            message: msg,
                            timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
                        };
                        setTeamChatState((prev) => ({
                            ...prev,
                            isInputActive: false,
                            messages: [...prev.messages, newMsg],
                        }));
                    } else {
                        sendNuiCallback("sendTeamChatMessage", { message: msg });
                    }
                }}
                onClose={() => {
                    if (isDemoMode) {
                        setTeamChatState((prev) => ({ ...prev, isInputActive: false }));
                    } else {
                        sendNuiCallback("closeTeamChat");
                    }
                }}
            />
        </HUDWidget>
    );
};

// ==========================================
// COMBINED WIDGET RENDERERS COMPONENT
// ==========================================
export const HUDWidgetRenderers = (props: WidgetRenderersProps) => {
    return (
        <>
            <NotificationsRenderer {...props} />
            <StatusWidgetsRenderer {...props} />
            <MoneyWidgetRenderer {...props} />
            <ClockWidgetRenderer {...props} />
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
