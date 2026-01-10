import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { VoiceState, RadioState, RadioMember } from "@/types/hud";
import { DEMO_VOICE, DEMO_RADIO } from "@/components/hud/data/demoData";
import { isNuiEnvironment } from "@/hooks/useNuiEvents";

interface VoiceStore {
    // Voice state
    voiceActive: boolean;
    voiceRange: "whisper" | "normal" | "shout" | "megaphone";
    isVoiceEnabled: boolean;

    // Radio state
    radioActive: boolean;
    radioChannel: string;
    radioMembers: RadioMember[];

    // Actions
    setVoiceState: (state: Partial<VoiceState>) => void;
    setVoiceActive: (active: boolean) => void;
    setVoiceRange: (range: VoiceState["range"]) => void;
    setIsVoiceEnabled: (enabled: boolean) => void;
    setRadioState: (state: Partial<RadioState>) => void;
    setRadioActive: (active: boolean) => void;
}

const isDemoMode = !isNuiEnvironment();

export const useVoiceStore = create<VoiceStore>((set) => ({
    voiceActive: isDemoMode ? DEMO_VOICE.active : false,
    voiceRange: isDemoMode ? DEMO_VOICE.range : "normal",
    isVoiceEnabled: isDemoMode,

    radioActive: isDemoMode ? DEMO_RADIO.active : false,
    radioChannel: isDemoMode ? DEMO_RADIO.channel : "",
    radioMembers: isDemoMode ? DEMO_RADIO.members : [],

    setVoiceState: (state) =>
        set((prev) => ({
            ...prev,
            voiceActive: state.active ?? prev.voiceActive,
            voiceRange: state.range ?? prev.voiceRange,
        })),

    setVoiceActive: (active) => set({ voiceActive: active }),

    setVoiceRange: (range) => set({ voiceRange: range }),

    setIsVoiceEnabled: (enabled) => set({ isVoiceEnabled: enabled }),

    setRadioState: (state) =>
        set((prev) => ({
            ...prev,
            radioActive: state.active ?? prev.radioActive,
            radioChannel: state.channel ?? prev.radioChannel,
            radioMembers: state.members ?? prev.radioMembers,
        })),

    setRadioActive: (active) => set({ radioActive: active }),
}));

// Selectors
export const useVoiceActive = () => useVoiceStore((state) => state.voiceActive);
export const useVoiceRange = () => useVoiceStore((state) => state.voiceRange);
export const useIsVoiceEnabled = () => useVoiceStore((state) => state.isVoiceEnabled);
export const useRadioActive = () => useVoiceStore((state) => state.radioActive);
export const useRadioChannel = () => useVoiceStore((state) => state.radioChannel);
export const useRadioMembers = () => useVoiceStore((state) => state.radioMembers);
export const useRadioData = () =>
    useVoiceStore(
        useShallow((state) => ({
            active: state.radioActive,
            channel: state.radioChannel,
            members: state.radioMembers,
        }))
    );
export const useVoiceData = () =>
    useVoiceStore(
        useShallow((state) => ({
            active: state.voiceActive,
            range: state.voiceRange,
        }))
    );
