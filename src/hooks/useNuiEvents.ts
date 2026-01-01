import { useEffect, useCallback } from "react";
import {
    HudState,
    VehicleState,
    MoneyState,
    VoiceState,
    LocationState,
    NotificationData,
    DeathState,
    ChatState,
    TeamChatState,
    RadioState,
} from "@/types/hud";

interface NuiEventHandlers {
    onUpdateHud?: (data: Partial<HudState>) => void;
    onUpdateVehicle?: (data: VehicleState) => void;
    onUpdateMoney?: (data: MoneyState) => void;
    onUpdateVoice?: (data: VoiceState) => void;
    onUpdateLocation?: (data: LocationState) => void;
    onUpdatePlayer?: (data: { id: number; job: string; rank: string }) => void;
    onNotify?: (data: { type: NotificationData["type"]; title: string; message: string; duration?: number }) => void;
    onToggleEditMode?: (enabled: boolean) => void;
    onSetVisible?: (visible: boolean) => void;
    onUpdateDeath?: (data: DeathState) => void;
    onSetVoiceEnabled?: (enabled: boolean) => void;
    onUpdateChat?: (data: ChatState) => void;
    onUpdateTeamChat?: (data: TeamChatState) => void;
    onUpdateRadio?: (data: RadioState) => void;
}

export const useNuiEvents = (handlers: NuiEventHandlers) => {
    const handleMessage = useCallback(
        (event: MessageEvent) => {
            const { action, data } = event.data;
            const eventType = action || event.data.type;

            switch (eventType) {
                case "ping":
                    console.log("[HUD DEBUG] Lua -> Web ping received");
                    sendNuiCallback("pong");
                    break;
                case "updateHud":
                    handlers.onUpdateHud?.(data);
                    break;
                case "updateVehicle":
                    handlers.onUpdateVehicle?.(data);
                    break;
                case "updateMoney":
                    handlers.onUpdateMoney?.(data);
                    break;
                case "updateVoice":
                    handlers.onUpdateVoice?.(data);
                    break;
                case "updateLocation":
                    handlers.onUpdateLocation?.(data);
                    break;
                case "updatePlayer":
                    handlers.onUpdatePlayer?.(data);
                    break;
                case "notify":
                    handlers.onNotify?.(data);
                    break;
                case "toggleEditMode":
                    handlers.onToggleEditMode?.(data);
                    break;
                case "setVisible":
                    handlers.onSetVisible?.(data);
                    break;
                case "updateDeath":
                    handlers.onUpdateDeath?.(data);
                    break;
                case "setVoiceEnabled":
                    handlers.onSetVoiceEnabled?.(data);
                    break;
                case "updateChat":
                    handlers.onUpdateChat?.(data);
                    break;
                case "updateTeamChat":
                    handlers.onUpdateTeamChat?.(data);
                    break;
                case "updateRadio":
                    handlers.onUpdateRadio?.(data);
                    break;
            }
        },
        [handlers]
    );

    useEffect(() => {
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [handleMessage]);
};

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

        return (await response.json()) as TResponse;
    } catch (error) {
        console.error("NUI Callback Error:", error);
        return null;
    }
};

const GetParentResourceName = (): string => {
    return window.GetParentResourceName?.() ?? "rp-hud";
};
