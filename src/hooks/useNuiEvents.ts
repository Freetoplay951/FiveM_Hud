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

interface UseNuiEventsProps {
    editMode: boolean;
    toggleEditMode: () => void;
}

export const isNuiEnvironment = (): boolean => {
    return typeof window !== "undefined" && window.invokeNative !== undefined;
};

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

const GetParentResourceName = (): string => {
    return window.GetParentResourceName?.() ?? "rp-hud";
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
                    useStatusStore.getState().setStatus(data);
                    break;
                case "updateVehicleState":
                    useVehicleStore.getState().setVehicleState(data);
                    break;
                case "updateMoneyState":
                    useMoneyStore.getState().setMoney(data);
                    break;
                case "updateVoiceState":
                    useVoiceStore.getState().setVoiceState(data);
                    break;
                case "updateRadioState":
                    useVoiceStore.getState().setRadioState(data);
                    break;
                case "updateLocationState":
                    useLocationStore.getState().setLocation(data);
                    break;
                case "updatePlayerState":
                    useMoneyStore.getState().setPlayer(data);
                    break;
                case "updateDeathState":
                    useDeathStore.getState().setDeathState(data);
                    break;
                case "updateChatState":
                    useChatStore.getState().setChatState(data);
                    break;
                case "updateTeamChatState":
                    useChatStore.getState().setTeamChatState(data);
                    break;
                case "showHUD":
                    useHUDGlobalStore.getState().setIsVisible(true);
                    break;
                case "hideHUD":
                    useHUDGlobalStore.getState().setIsVisible(false);
                    break;
                case "setDisabledWidgets":
                    useHUDGlobalStore.getState().setDisabledWidgets(data);
                    break;
                case "setVoiceEnabled":
                    useVoiceStore.getState().setIsVoiceEnabled(data.enabled);
                    break;
                case "toggleEditMode":
                    if (!editMode) toggleEditMode();
                    break;
                case "notify": {
                    const store = useNotificationStore.getState();
                    if (data.type === "success") store.success(data.title, data.message);
                    else if (data.type === "error") store.error(data.title, data.message);
                    else if (data.type === "warning") store.warning(data.title, data.message);
                    else if (data.type === "info") store.info(data.title, data.message);
                    break;
                }
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [editMode, toggleEditMode]);
};
