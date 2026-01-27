import { create } from "zustand";
import { isNuiEnvironment } from "@/lib/nuiUtils";

export type ProgressbarColor = "primary" | "success" | "warning" | "critical" | "info";

export interface ProgressbarState {
    isActive: boolean;
    label: string;
    progress: number; // 0-100
    duration: number; // in ms
    startTime: number; // timestamp when started
    canCancel: boolean;
    color: ProgressbarColor;
}

interface ProgressbarStoreState extends ProgressbarState {
    // Actions
    startProgressbar: (data: { label: string; duration: number; canCancel?: boolean; color?: ProgressbarColor }) => void;
    updateProgress: (progress: number) => void;
    cancelProgressbar: () => void;
    finishProgressbar: () => void;
}

const isDemoMode = !isNuiEnvironment();

const initialState: ProgressbarState = {
    isActive: false,
    label: "",
    progress: 0,
    duration: 0,
    startTime: 0,
    canCancel: false,
    color: "primary",
};

export const useProgressbarStore = create<ProgressbarStoreState>((set) => ({
    ...initialState,

    startProgressbar: (data) =>
        set({
            isActive: true,
            label: data.label,
            progress: 0,
            duration: data.duration,
            startTime: Date.now(),
            canCancel: data.canCancel ?? false,
            color: data.color ?? "primary",
        }),

    updateProgress: (progress) =>
        set({
            progress: Math.min(100, Math.max(0, progress)),
        }),

    cancelProgressbar: () =>
        set({
            ...initialState,
        }),

    finishProgressbar: () =>
        set({
            ...initialState,
        }),
}));

// Selectors
export const useProgressbarActive = () => useProgressbarStore((state) => state.isActive);
export const useProgressbarLabel = () => useProgressbarStore((state) => state.label);
export const useProgressbarProgress = () => useProgressbarStore((state) => state.progress);
export const useProgressbarDuration = () => useProgressbarStore((state) => state.duration);
export const useProgressbarStartTime = () => useProgressbarStore((state) => state.startTime);
export const useProgressbarCanCancel = () => useProgressbarStore((state) => state.canCancel);
export const useProgressbarColor = () => useProgressbarStore((state) => state.color);
export const useProgressbarData = () =>
    useProgressbarStore((state) => ({
        isActive: state.isActive,
        label: state.label,
        progress: state.progress,
        duration: state.duration,
        startTime: state.startTime,
        canCancel: state.canCancel,
        color: state.color,
    }));
