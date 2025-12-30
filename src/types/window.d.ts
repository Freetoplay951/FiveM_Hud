export {};

declare global {
    interface Window {
        invokeNative?: (...args: unknown[]) => unknown;
        GetParentResourceName?: () => string;
    }
}
