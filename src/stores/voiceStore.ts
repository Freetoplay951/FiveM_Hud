import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { VoiceState, RadioState, RadioMember } from "@/types/hud";
import { DEMO_VOICE, DEMO_RADIO } from "@/components/hud/data/demoData";
import { isNuiEnvironment } from "@/lib/nuiUtils";

interface VoiceStore {
    // Voice state
    voiceActive: boolean;
    voiceRange: "whisper" | "normal" | "shout" | "megaphone";
    isVoiceEnabled: boolean;
    isVoiceMuted: boolean;

    // Radio state
    radioActive: boolean;
    radioChannel: string;
    radioMembers: RadioMember[];

    // Actions
    setVoiceState: (state: Partial<VoiceState>) => void;
    setVoiceActive: (active: boolean) => void;
    setVoiceRange: (range: VoiceState["range"]) => void;
    setIsVoiceEnabled: (enabled: boolean) => void;
    setIsVoiceMuted: (muted: boolean) => void;
    setRadioState: (state: Partial<RadioState>) => void;
    setRadioActive: (active: boolean) => void;
}

const isDemoMode = !isNuiEnvironment();

export const useVoiceStore = create<VoiceStore>((set) => ({
    voiceActive: isDemoMode ? DEMO_VOICE.active : false,
    voiceRange: isDemoMode ? DEMO_VOICE.range : "normal",
    isVoiceEnabled: isDemoMode,
    isVoiceMuted: isDemoMode ? (DEMO_VOICE.isMuted ?? false) : false,

    radioActive: isDemoMode ? DEMO_RADIO.active : false,
    radioChannel: isDemoMode ? DEMO_RADIO.channel : "",
    radioMembers: isDemoMode ? DEMO_RADIO.members : [],

    setVoiceState: (state) =>
        set((prev) => ({
            ...prev,
            voiceActive: state.active ?? prev.voiceActive,
            voiceRange: state.range ?? prev.voiceRange,
            isVoiceMuted: state.isMuted ?? prev.isVoiceMuted,
        })),

    setVoiceActive: (active) => set({ voiceActive: active }),

    setVoiceRange: (range) => set({ voiceRange: range }),

    setIsVoiceEnabled: (enabled) => set({ isVoiceEnabled: enabled }),

    setIsVoiceMuted: (muted) => set({ isVoiceMuted: muted }),

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
export const useIsVoiceMuted = () => useVoiceStore((state) => state.isVoiceMuted);
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
            isMuted: state.isVoiceMuted,
        }))
    );
