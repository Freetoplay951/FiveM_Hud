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
export function mapPartialState<T extends object>(prev: T, override: Partial<T>): T {
    const result = { ...prev };

    for (const key in override) {
        const typedKey = key as keyof T;
        const value = override[typedKey];

        if (value !== undefined) {
            result[typedKey] = value;
        }
    }

    return result;
}
