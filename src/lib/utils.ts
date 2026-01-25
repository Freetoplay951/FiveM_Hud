import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Creates a selective state update function that only updates provided fields.
 * Use this when your NUI event sends partial data with different property names.
 *
 * @example
 * setChatState: (state) => set((prev) => mapPartialState(prev, {
 *   chatMessages: state.messages,
 *   chatInputActive: state.isInputActive,
 * }))
 */
export function mapPartialState<T>(prev: T, mappings: { [K in keyof T]?: T[K] | undefined }): T {
    const result = { ...prev };

    for (const key of Object.keys(mappings) as (keyof T)[]) {
        const value = mappings[key];
        if (value !== undefined) {
            result[key] = value as T[keyof T];
        }
    }

    return result;
}
