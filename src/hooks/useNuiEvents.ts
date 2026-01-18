import { useEffect, useRef } from "react";
import { useStatusStore } from "@/stores/statusStore";
import { useVehicleStore } from "@/stores/vehicleStore";
import { useVoiceStore } from "@/stores/voiceStore";
import { useLocationStore } from "@/stores/locationStore";
import { useMoneyStore } from "@/stores/moneyStore";
import { useChatStore } from "@/stores/chatStore";
import { useDeathStore } from "@/stores/deathStore";
import { useHUDGlobalStore } from "@/stores/hudStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useUtilityStore } from "@/stores/utilityStore";
import { useKeybindsStore, Keybind } from "@/stores/keybindsStore";
import { isNuiEnvironment, GetParentResourceName } from "@/lib/nuiUtils";
import {
    StatusWidgetState,
    VehicleState,
    MoneyState,
    VoiceState,
    LocationState,
    NotificationData,
    DeathState,
    ChatMessage,
    RadioState,
    TeamChatState,
    TeamChatMessage,
    DisabledWidgets,
} from "@/types/hud";

interface UtilityData {
    wantedLevel?: number;
    isEvading?: boolean;
    serverName?: string;
    playerCount?: number;
    maxPlayers?: number;
}

interface NuiEventHandlers {
    onUpdateHud?: (data: Partial<StatusWidgetState>) => void;
    onUpdateVehicle?: (data: VehicleState) => void;
    onUpdateMoney?: (data: MoneyState) => void;
    onUpdateVoice?: (data: VoiceState) => void;
    onUpdateRadio?: (data: RadioState) => void;
    onUpdateLocation?: (data: LocationState) => void;
    onUpdatePlayer?: (data: { id: number; job: string; rank: string }) => void;
    onUpdateUtility?: (data: UtilityData) => void;
    onNotify?: (data: { type: NotificationData["type"]; title: string; message: string; duration?: number }) => void;
    onToggleEditMode?: (enabled: boolean) => void;
    onSetVisible?: (visible: boolean) => void;
    onUpdateDeath?: (data: DeathState) => void;
    onSetVoiceEnabled?: (enabled: boolean) => void;
    onUpdateDisabledWidgets?: (data: DisabledWidgets) => void;
    onChatUpdate?: (data: { isInputActive?: boolean; message?: ChatMessage; clearChat?: boolean }) => void;
    onTeamChatUpdate?: (
        data: Omit<Partial<TeamChatState>, "isVisible"> & {
            message?: TeamChatMessage;
            clearChat?: boolean;
        },
    ) => void;
    onToggleKeybinds?: (visible?: boolean) => void;
    onUpdateKeybinds?: (data: { keybinds: Keybind[] }) => void;
    onKeybindsUpdate?: (data: { isVisible?: boolean; keybinds?: Keybind[] }) => void;
    onUpdateCommands?: (data: { command: string; description: string }[]) => void;
}

interface UseNuiEventsProps {
    editMode: boolean;
    toggleEditMode: () => void;
}

export const sendNuiCallback = async <TResponse = unknown, TPayload = unknown>(
    eventName: string,
    data?: TPayload,
): Promise<TResponse | null> => {
    if (!isNuiEnvironment()) {
        console.log("[DEV] NUI Callback:", eventName, data);
        return null;
    }

    try {
        const response = await fetch(`https://${GetParentResourceName()}/${eventName}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data ?? {}),
        });

        const text = await response.text();
        if (!text || text.trim() === "") {
            return null;
        }

        try {
            return JSON.parse(text) as TResponse;
        } catch {
            return null;
        }
    } catch (error) {
        console.error("NUI Callback Error:", error);
        return null;
    }
};

/**
 * Bridge hook that connects NUI events directly to Zustand stores.
 * Each store updates independently - no parent re-renders.
 */
export const useNuiEvents = ({ editMode, toggleEditMode }: UseNuiEventsProps) => {
    const hasRegistered = useRef(false);

    useEffect(() => {
        if (!isNuiEnvironment()) return;

        // Typed event handlers using Zustand stores
        const handlers: NuiEventHandlers = {
            onUpdateHud: (data) => {
                useStatusStore.getState().setStatus(data);
            },
            onUpdateVehicle: (data) => {
                useVehicleStore.getState().setVehicleState(data);
            },
            onUpdateMoney: (data) => {
                useMoneyStore.getState().setMoney(data);
            },
            onUpdateVoice: (data) => {
                useVoiceStore.getState().setVoiceState(data);
            },
            onUpdateRadio: (data) => {
                useVoiceStore.getState().setRadioState(data);
            },
            onUpdateLocation: (data) => {
                useLocationStore.getState().setLocation(data);
            },
            onUpdatePlayer: (data) => {
                useMoneyStore.getState().setPlayer(data);
            },
            onUpdateUtility: (data) => {
                const store = useUtilityStore.getState();
                if (data.wantedLevel !== undefined) store.setWantedLevel(data.wantedLevel);
                if (data.isEvading !== undefined) store.setIsEvading(data.isEvading);
                if (data.serverName !== undefined || data.playerCount !== undefined || data.maxPlayers !== undefined) {
                    store.setServerInfo({
                        serverName: data.serverName,
                        playerCount: data.playerCount,
                        maxPlayers: data.maxPlayers,
                    });
                }
            },
            onNotify: (data) => {
                const store = useNotificationStore.getState();
                const notifyFn =
                    { success: store.success, error: store.error, warning: store.warning, info: store.info }[
                        data.type
                    ] || store.info;
                notifyFn(data.title, data.message, data.duration);
            },
            onToggleEditMode: (enabled) => {
                if (enabled && !editMode) toggleEditMode();
                else if (!enabled && editMode) toggleEditMode();
            },
            onSetVisible: (visible) => {
                useHUDGlobalStore.getState().setIsVisible(visible);
            },
            onUpdateDeath: (data) => {
                useDeathStore.getState().setDeathState(data);
            },
            onSetVoiceEnabled: (enabled) => {
                useVoiceStore.getState().setIsVoiceEnabled(enabled);
            },
            onUpdateDisabledWidgets: (data) => {
                useHUDGlobalStore.getState().setDisabledWidgets(data);
            },
            onChatUpdate: (data) => {
                const chatStore = useChatStore.getState();

                if (data.clearChat) {
                    chatStore.clearChatMessages();
                }

                if (data.message) {
                    const messageWithJsTimestamp = {
                        id: data.message.id || Date.now().toString(),
                        type: data.message.type || "normal",
                        sender: data.message.sender || "",
                        message: data.message.message,
                        timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
                    };
                    chatStore.addChatMessage(messageWithJsTimestamp);
                }

                if (typeof data.isInputActive === "boolean") {
                    chatStore.setChatInputActive(data.isInputActive);
                }
            },
            onTeamChatUpdate: (data) => {
                const chatStore = useChatStore.getState();

                const stateUpdate: Partial<TeamChatState> = {};

                if (typeof data.isInputActive === "boolean") stateUpdate.isInputActive = data.isInputActive;
                if (typeof data.hasAccess === "boolean") stateUpdate.hasAccess = data.hasAccess;
                if (data.teamType) stateUpdate.teamType = data.teamType;
                if (data.teamName) stateUpdate.teamName = data.teamName;
                if (typeof data.onlineMembers === "number") stateUpdate.onlineMembers = data.onlineMembers;
                if (typeof data.isAdmin === "boolean") stateUpdate.isAdmin = data.isAdmin;

                if (data.clearChat) {
                    chatStore.clearTeamChatMessages();
                }

                if (data.message) {
                    chatStore.addTeamChatMessage({
                        ...data.message,
                        timestamp: new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
                    });
                }

                if (Object.keys(stateUpdate).length > 0) {
                    chatStore.setTeamChatState(stateUpdate);
                }
            },
            onToggleKeybinds: (visible) => {
                const keybindsStore = useKeybindsStore.getState();
                if (typeof visible === "boolean") {
                    keybindsStore.setVisible(visible);
                } else {
                    keybindsStore.toggleVisible();
                }
            },
            onUpdateKeybinds: (data) => {
                useKeybindsStore.getState().setKeybinds(data.keybinds);
            },
            onKeybindsUpdate: (data: { isVisible?: boolean; keybinds?: Keybind[] }) => {
                const keybindsStore = useKeybindsStore.getState();
                if (typeof data.isVisible === "boolean") {
                    keybindsStore.setVisible(data.isVisible);
                }
                if (data.keybinds) {
                    keybindsStore.setKeybinds(data.keybinds);
                }
            },
            onUpdateCommands: (data) => {
                useChatStore.getState().setCommands(data);
            },
        };

        const actionHandlerMap: Record<string, (data: unknown) => void> = {
            updateHud: handlers.onUpdateHud as (data: unknown) => void,
            updateVehicle: handlers.onUpdateVehicle as (data: unknown) => void,
            updateMoney: handlers.onUpdateMoney as (data: unknown) => void,
            updateVoice: handlers.onUpdateVoice as (data: unknown) => void,
            updateRadio: handlers.onUpdateRadio as (data: unknown) => void,
            updateLocation: handlers.onUpdateLocation as (data: unknown) => void,
            updatePlayer: handlers.onUpdatePlayer as (data: unknown) => void,
            updateUtility: handlers.onUpdateUtility as (data: unknown) => void,
            notify: handlers.onNotify as (data: unknown) => void,
            toggleEditMode: handlers.onToggleEditMode as (data: unknown) => void,
            setVisible: handlers.onSetVisible as (data: unknown) => void,
            updateDeath: handlers.onUpdateDeath as (data: unknown) => void,
            setVoiceEnabled: handlers.onSetVoiceEnabled as (data: unknown) => void,
            updateDisabledWidgets: handlers.onUpdateDisabledWidgets as (data: unknown) => void,
            chatUpdate: handlers.onChatUpdate as (data: unknown) => void,
            teamChatUpdate: handlers.onTeamChatUpdate as (data: unknown) => void,
            toggleKeybinds: handlers.onToggleKeybinds as (data: unknown) => void,
            updateKeybinds: handlers.onUpdateKeybinds as (data: unknown) => void,
            keybindsUpdate: handlers.onKeybindsUpdate as (data: unknown) => void,
            updateCommands: handlers.onUpdateCommands as (data: unknown) => void,
        };

        const handleMessage = (event: MessageEvent) => {
            const { action, data } = event.data;

            if (action === "ping") {
                console.log("[HUD DEBUG] Lua -> Web ping received");
                sendNuiCallback("pong");
                return;
            }

            const handler = actionHandlerMap[action];
            if (handler) {
                handler(data);
            } else if (action) {
                console.warn("[HUD] Unknown NUI event:", action, JSON.stringify(data));
            }
        };

        window.addEventListener("message", handleMessage);

        if (!hasRegistered.current) {
            hasRegistered.current = true;
            console.log("[HUD DEBUG] NUI event listener registered");
            sendNuiCallback("loadedNUI");
        }

        return () => window.removeEventListener("message", handleMessage);
    }, [editMode, toggleEditMode]);
};
