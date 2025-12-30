import { useEffect, useCallback } from "react";
import { HudState, VehicleState, MoneyState, VoiceState, LocationState } from "@/types/hud";

interface NuiEventHandlers {
    onUpdateHud?: (data: HudState) => void;
    onUpdateVehicle?: (data: VehicleState) => void;
    onUpdateMoney?: (data: MoneyState) => void;
    onUpdateVoice?: (data: VoiceState) => void;
    onUpdateLocation?: (data: LocationState) => void;
}

export const useNuiEvents = (handlers: NuiEventHandlers) => {
    const handleMessage = useCallback(
        (event: MessageEvent) => {
            const { type, data } = event.data;

            switch (type) {
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
            }
        },
        [handlers]
    );

    useEffect(() => {
        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [handleMessage]);
};

// Utility to check if running in FiveM NUI
export const isNuiEnvironment = (): boolean => {
    return typeof window !== "undefined" && window.invokeNative !== undefined;
};

// Send event back to FiveM
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

// Get parent resource name (FiveM specific)
const GetParentResourceName = (): string => {
    return window.GetParentResourceName?.() ?? "fivem-hud";
};
