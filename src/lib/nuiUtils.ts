/**
 * Utility functions for NUI environment detection.
 * Separated to avoid circular dependencies with stores.
 */

export const isNuiEnvironment = (): boolean => {
    return typeof window !== "undefined" && window.invokeNative !== undefined;
};

export const GetParentResourceName = (): string => {
    return window.GetParentResourceName?.() ?? "rp-hud";
};
