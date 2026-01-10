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

        // Send loadedNUI callback ONCE on first mount
        if (!hasRegistered.current) {
            hasRegistered.current = true;
            console.log("[HUD DEBUG] NUI event listener registered");
            sendNuiCallback("loadedNUI");
        }

        const handleMessage = (event: MessageEvent) => {
            const { action, data } = event.data;

            switch (action) {
                case "ping":
                    console.log("[HUD DEBUG] Lua -> Web ping received");
                    sendNuiCallback("pong");
                    break;
                case "updateHUDState":
                    useStatusStore.getState().setStatus(data as Partial<StatusWidgetState>);
                    break;
                case "updateVehicleState":
                    useVehicleStore.getState().setVehicleState(data as VehicleState);
                    break;
                case "updateMoneyState":
                    useMoneyStore.getState().setMoney(data as MoneyState);
                    break;
                case "updateVoiceState":
                    useVoiceStore.getState().setVoiceState(data as VoiceState);
                    break;
                case "updateRadioState":
                    useVoiceStore.getState().setRadioState(data as RadioState);
                    break;
                case "updateLocationState":
                    useLocationStore.getState().setLocation(data as LocationState);
                    break;
                case "updatePlayerState":
                    useMoneyStore.getState().setPlayer(data as { id: number; job: string; rank: string });
                    break;
                case "updateDeathState":
                    useDeathStore.getState().setDeathState(data as DeathState);
                    break;
                case "updateChatState":
                    useChatStore.getState().setChatState(data as { isInputActive?: boolean; message?: ChatMessage; clearChat?: boolean });
                    break;
                case "updateTeamChatState":
                    useChatStore.getState().setTeamChatState(data as Omit<Partial<TeamChatState>, "isVisible"> & { message?: TeamChatMessage; clearChat?: boolean });
                    break;
                case "showHUD":
                    useHUDGlobalStore.getState().setIsVisible(true);
                    break;
                case "hideHUD":
                    useHUDGlobalStore.getState().setIsVisible(false);
                    break;
                case "setDisabledWidgets":
                    useHUDGlobalStore.getState().setDisabledWidgets(data as DisabledWidgets);
                    break;
                case "setVoiceEnabled":
                    useVoiceStore.getState().setIsVoiceEnabled((data as { enabled: boolean }).enabled);
                    break;
                case "toggleEditMode":
                    if (!editMode) toggleEditMode();
                    break;
                case "notify": {
                    const store = useNotificationStore.getState();
                    const notifyData = data as { type: NotificationData["type"]; title: string; message: string };
                    if (notifyData.type === "success") store.success(notifyData.title, notifyData.message);
                    else if (notifyData.type === "error") store.error(notifyData.title, notifyData.message);
                    else if (notifyData.type === "warning") store.warning(notifyData.title, notifyData.message);
                    else if (notifyData.type === "info") store.info(notifyData.title, notifyData.message);
                    break;
                }
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [editMode, toggleEditMode]);
};
