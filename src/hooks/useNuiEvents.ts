import { useEffect, useRef } from "react";
import {
    HudState,
    VehicleState,
    MoneyState,
    VoiceState,
    LocationState,
    NotificationData,
    DeathState,
    ChatMessage,
    TeamChatMessage,
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
    // Chat events - now using createMessage pattern
    onChatOpen?: (data: { isOpen: boolean; isInputActive: boolean }) => void;
    onChatClose?: () => void;
    onChatCreateMessage?: (data: ChatMessage) => void;
    onChatClear?: () => void;
    // Team chat events - now using createMessage pattern
    onTeamChatOpen?: (data: { isOpen: boolean; isInputActive: boolean; hasAccess: boolean; teamType: string; teamName: string; onlineMembers: number; isAdmin: boolean }) => void;
    onTeamChatClose?: () => void;
    onTeamChatCreateMessage?: (data: TeamChatMessage) => void;
    onTeamChatClear?: () => void;
    onUpdateRadio?: (data: RadioState) => void;
}

export const useNuiEvents = (handlers: NuiEventHandlers) => {
    // Use ref to always have access to latest handlers without re-registering listener
    const handlersRef = useRef(handlers);
    
    // Update ref on every render (this is cheap and doesn't cause re-registration)
    useEffect(() => {
        handlersRef.current = handlers;
    });

    // Register event listener ONCE on mount
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const { action, data } = event.data;
            const eventType = action || event.data.type;
            const h = handlersRef.current;

            switch (eventType) {
                case "ping":
                    console.log("[HUD DEBUG] Lua -> Web ping received");
                    sendNuiCallback("pong");
                    break;
                case "updateHud":
                    h.onUpdateHud?.(data);
                    break;
                case "updateVehicle":
                    h.onUpdateVehicle?.(data);
                    break;
                case "updateMoney":
                    h.onUpdateMoney?.(data);
                    break;
                case "updateVoice":
                    h.onUpdateVoice?.(data);
                    break;
                case "updateLocation":
                    h.onUpdateLocation?.(data);
                    break;
                case "updatePlayer":
                    h.onUpdatePlayer?.(data);
                    break;
                case "notify":
                    h.onNotify?.(data);
                    break;
                case "toggleEditMode":
                    h.onToggleEditMode?.(data);
                    break;
                case "setVisible":
                    h.onSetVisible?.(data);
                    break;
                case "updateDeath":
                    h.onUpdateDeath?.(data);
                    break;
                case "setVoiceEnabled":
                    h.onSetVoiceEnabled?.(data);
                    break;
                // New chat events
                case "chatOpen":
                    h.onChatOpen?.(data);
                    break;
                case "chatClose":
                    h.onChatClose?.();
                    break;
                case "chatCreateMessage":
                    h.onChatCreateMessage?.(data);
                    break;
                case "chatClear":
                    h.onChatClear?.();
                    break;
                // New team chat events
                case "teamChatOpen":
                    h.onTeamChatOpen?.(data);
                    break;
                case "teamChatClose":
                    h.onTeamChatClose?.();
                    break;
                case "teamChatCreateMessage":
                    h.onTeamChatCreateMessage?.(data);
                    break;
                case "teamChatClear":
                    h.onTeamChatClear?.();
                    break;
                case "updateRadio":
                    h.onUpdateRadio?.(data);
                    break;
            }
        };

        window.addEventListener("message", handleMessage);
        console.log("[HUD DEBUG] NUI event listener registered");
        
        return () => {
            window.removeEventListener("message", handleMessage);
            console.log("[HUD DEBUG] NUI event listener removed");
        };
    }, []); // Empty deps = register once on mount
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

        // Handle empty responses gracefully
        const text = await response.text();
        if (!text || text.trim() === "") {
            return null;
        }

        try {
            return JSON.parse(text) as TResponse;
        } catch {
            // Response is not JSON, return null
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
