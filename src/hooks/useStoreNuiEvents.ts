import { useEffect } from "react";
import { isNuiEnvironment } from "@/hooks/useNuiEvents";
import { useStatusStore } from "@/stores/statusStore";
import { useVehicleStore } from "@/stores/vehicleStore";
import { useVoiceStore } from "@/stores/voiceStore";
import { useLocationStore } from "@/stores/locationStore";
import { useMoneyStore } from "@/stores/moneyStore";
import { useChatStore } from "@/stores/chatStore";
import { useDeathStore } from "@/stores/deathStore";
import { useHUDGlobalStore } from "@/stores/hudStore";
import { useNotificationStore } from "@/stores/notificationStore";

interface UseStoreNuiEventsProps {
    editMode: boolean;
    toggleEditMode: () => void;
}

/**
 * Bridge hook that connects NUI events directly to Zustand stores.
 * Each store updates independently - no parent re-renders.
 */
export const useStoreNuiEvents = ({
    editMode,
    toggleEditMode,
}: UseStoreNuiEventsProps) => {
    useEffect(() => {
        if (!isNuiEnvironment()) return;

        const handleMessage = (event: MessageEvent) => {
            const { action, data } = event.data;

            switch (action) {
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
                case "notify":
                    // Use notification store directly
                    const notificationStore = useNotificationStore.getState();
                    if (data.type === "success") notificationStore.success(data.title, data.message);
                    else if (data.type === "error") notificationStore.error(data.title, data.message);
                    else if (data.type === "warning") notificationStore.warning(data.title, data.message);
                    else if (data.type === "info") notificationStore.info(data.title, data.message);
                    break;
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [editMode, toggleEditMode]);
};
