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
import { StatusType, NotificationData } from "@/types/hud";
import { WidgetPosition, StatusDesign, MinimapShape, SpeedometerType, ResolvedWidgetConfig } from "@/types/widget";
import { DEMO_RADIO_ENABLED } from "./data/demoData";

// Import stores - widgets subscribe to their own data
import { useIsDemoMode } from "@/stores/hudStore";
import { useIsDead } from "@/stores/deathStore";
import { useStatusStore, useIsUnderwater } from "@/stores/statusStore";
import { useMoneyData, usePlayerData } from "@/stores/moneyStore";
import { useVoiceData, useIsVoiceEnabled, useRadioData } from "@/stores/voiceStore";
import { useLocationData, useHeading } from "@/stores/locationStore";
import { useVehicleStore } from "@/stores/vehicleStore";
import {
    useChatStore,
    useChatData,
    useTeamChatData,
    useTeamChatHasAccess,
} from "@/stores/chatStore";

// ==========================================
// LAYOUT-ONLY PROPS INTERFACE
// No widget data - only layout/edit concerns
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

    // Notifications (cross-cutting concern)
    notifications: NotificationData[];
    removeNotification: (id: string) => void;
    displayedNotifications: NotificationData[];
    isUsingEditDemoNotifications: boolean;

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
// NOTIFICATIONS WIDGET
// ==========================================
export const NotificationsRenderer = ({
    editMode,
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
}: LayoutOnlyProps) => {
    const widget = getWidget("notifications");
    const isDead = useIsDead();
    if (!widget) return null;

    const isDeadOverlay = isDead && !editMode;

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
// STATUS WIDGETS - Each subscribes to its own value
// ==========================================
const STATUS_TYPES: StatusType[] = ["health", "armor", "hunger", "thirst", "stamina", "stress", "oxygen"];

const StatusWidgetItem = ({
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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(type)}>
            <StatusWidget
                type={type}
                value={value}
                design={statusDesign}
            />
        </HUDWidget>
    );
};

export const StatusWidgetsRenderer = (props: LayoutOnlyProps) => {
    return (
        <>
            {STATUS_TYPES.map((type) => (
                <StatusWidgetItem
                    key={type}
                    type={type}
                    {...props}
                />
            ))}
        </>
    );
};

// ==========================================
// MONEY WIDGET - Subscribes to money store
// ==========================================
export const MoneyWidgetRenderer = ({
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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <MoneyWidget
                money={money}
                player={player}
            />
        </HUDWidget>
    );
};

// ==========================================
// CLOCK WIDGET - Self-contained, no external data
// ==========================================
export const ClockWidgetRenderer = ({
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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <ClockWidget />
        </HUDWidget>
    );
};

// ==========================================
// VOICE WIDGET - Subscribes to voice store
// ==========================================
export const VoiceWidgetRenderer = ({
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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <VoiceWidget voice={voice} />
        </HUDWidget>
    );
};

// ==========================================
// RADIO WIDGET - Subscribes to voice store
// ==========================================
export const RadioWidgetRenderer = ({
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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <RadioWidget radio={radioDisplay} />
        </HUDWidget>
    );
};

// ==========================================
// LOCATION WIDGET - Subscribes to location store
// ==========================================
export const LocationWidgetRenderer = ({
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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <LocationWidget
                location={location}
                shape={minimapShape}
            />
        </HUDWidget>
    );
};

// ==========================================
// COMPASS WIDGET - Subscribes to location store
// ==========================================
export const CompassWidgetRenderer = ({
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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <CompassWidget heading={heading} />
        </HUDWidget>
    );
};

// ==========================================
// VEHICLE NAME WIDGET - Subscribes to vehicle store
// ==========================================
export const VehicleNameWidgetRenderer = ({
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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
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
// CHAT WIDGET - Subscribes to chat store
// ==========================================
export const ChatWidgetRenderer = ({
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
    const isDemoMode = useIsDemoMode();
    
    // Widget subscribes to its own data
    const chatData = useChatData();
    const addChatMessage = useChatStore((s) => s.addChatMessage);
    const setChatInputActive = useChatStore((s) => s.setChatInputActive);

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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <ChatWidget
                chat={chatData}
                setChatInputActive={setChatInputActive}
                editMode={editMode}
                onSendMessage={(msg) => {
                    if (isDemoMode) {
                        addChatMessage({
                            id: Date.now().toString(),
                            type: "normal",
                            sender: "Du",
                            message: msg,
                            timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
                        });
                        setChatInputActive(false);
                    } else {
                        sendNuiCallback("sendChatMessage", { message: msg });
                    }
                }}
                onClose={() => {
                    if (isDemoMode) {
                        setChatInputActive(false);
                    } else {
                        sendNuiCallback("closeChat");
                    }
                }}
            />
        </HUDWidget>
    );
};

// ==========================================
// TEAM CHAT WIDGET - Subscribes to chat store
// ==========================================
export const TeamChatWidgetRenderer = ({
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
    const isDemoMode = useIsDemoMode();
    
    // Widget subscribes to its own data
    const teamChatData = useTeamChatData();
    const hasTeamAccess = useTeamChatHasAccess();
    const setTeamChatState = useChatStore((s) => s.setTeamChatState);
    const addTeamChatMessage = useChatStore((s) => s.addTeamChatMessage);
    const setTeamChatInputActive = useChatStore((s) => s.setTeamChatInputActive);

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
            onReset={(id) => resetWidget(id, isWidgetDisabled, hasSignaledReady)}
            {...getMultiSelectProps(widget.id)}>
            <TeamChatWidget
                teamChat={teamChatData}
                editMode={editMode}
                onSendMessage={(msg) => {
                    if (isDemoMode) {
                        addTeamChatMessage({
                            id: Date.now().toString(),
                            sender: "Du",
                            rank: "Admin",
                            message: msg,
                            timestamp: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
                        });
                        setTeamChatInputActive(false);
                    } else {
                        sendNuiCallback("sendTeamChatMessage", { message: msg });
                    }
                }}
                onClose={() => {
                    if (isDemoMode) {
                        setTeamChatInputActive(false);
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
export const HUDWidgetRenderers = (props: LayoutOnlyProps) => {
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
