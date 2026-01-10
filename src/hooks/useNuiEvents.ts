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

// Re-export for backwards compatibility
export { isNuiEnvironment } from "@/lib/nuiUtils";

interface NuiEventHandlers {
    onUpdateHud?: (data: Partial<StatusWidgetState>) => void;
    onUpdateVehicle?: (data: VehicleState) => void;
    onUpdateMoney?: (data: MoneyState) => void;
    onUpdateVoice?: (data: VoiceState) => void;
    onUpdateRadio?: (data: RadioState) => void;
    onUpdateLocation?: (data: LocationState) => void;
    onUpdatePlayer?: (data: { id: number; job: string; rank: string }) => void;
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
        }
    ) => void;
}

interface UseNuiEventsProps {
    editMode: boolean;
    toggleEditMode: () => void;
}

export const sendNuiCallback = async <TResponse = unknown, TPayload = unknown>(
    eventName: string,
    data?: TPayload
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

        const handleMessage = (event: MessageEvent) => {
            const { action, data } = event.data;

            switch (action) {
                case "ping":
                    console.log("[HUD DEBUG] Lua -> Web ping received");
                    sendNuiCallback("pong");
                    break;
                case "updateHud":
                    useStatusStore.getState().setStatus(data);
                    break;
                case "updateVehicle":
                    useVehicleStore.getState().setVehicleState(data);
                    break;
                case "updateMoney":
                    useMoneyStore.getState().setMoney(data);
                    break;
                case "updateVoice":
                    useVoiceStore.getState().setVoiceState(data);
                    break;
                case "updateRadio":
                    useVoiceStore.getState().setRadioState(data);
                    break;
                case "updateLocation":
                    useLocationStore.getState().setLocation(data);
                    break;
                case "updatePlayer":
                    useMoneyStore.getState().setPlayer(data);
                    break;
                case "notify": {
                    const store = useNotificationStore.getState();
                    if (data.type === "success") store.success(data.title, data.message);
                    else if (data.type === "error") store.error(data.title, data.message);
                    else if (data.type === "warning") store.warning(data.title, data.message);
                    else if (data.type === "info") store.info(data.title, data.message);
                    break;
                }
                case "toggleEditMode":
                    if (!editMode) toggleEditMode();
                    break;
                case "setVisible":
                    useHUDGlobalStore.getState().setIsVisible(data);
                    break;
                case "updateDeath":
                    useDeathStore.getState().setDeathState(data);
                    break;
                case "setVoiceEnabled":
                    useVoiceStore.getState().setIsVoiceEnabled(data);
                    break;
                case "updateDisabledWidgets":
                    useHUDGlobalStore.getState().setDisabledWidgets(data);
                    break;
                case "chatUpdate":
                    useChatStore.getState().setChatState(data);
                    break;
                case "teamChatUpdate":
                    useChatStore.getState().setTeamChatState(data);
                    break;
                default:
                    if (action) {
                        console.warn("[HUD] Unknown NUI event:", action, data);
                    }
                    break;
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
