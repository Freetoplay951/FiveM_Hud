/**
 * Utility functions for formatting values
 */

/**
 * Format a number with locale support
 */
export function formatWithLocale(
    input: number,
    decimalPlaces: number = 0,
    locale?: string
): string {
    return input.toLocaleString(locale, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    });
}

/**
 * Format seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Clamp a value between min and max (default 0-100 for percentages)
 */
export function clampPercent(value: number, min: number = 0, max: number = 100): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Convert heading degrees to compass direction
 */
export function headingToDirection(heading: number): string {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(((heading % 360) + 360) % 360 / 45) % 8;
    return directions[index];
}

/**
 * Format speed with unit (km/h or mph)
 */
export function formatSpeed(speed: number, unit: "kmh" | "mph" = "kmh"): string {
    if (unit === "mph") {
        return `${Math.round(speed * 0.621371)} mph`;
    }
    return `${Math.round(speed)} km/h`;
}

/**
 * Format currency with locale support
 */
export function formatCurrency(
    amount: number,
    locale?: string,
    currency: string = "EUR"
): string {
    return amount.toLocaleString(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

/**
 * Format large numbers with abbreviations (1K, 1M, etc.)
 */
export function formatCompactNumber(amount: number): string {
    if (amount >= 1_000_000) {
        return `${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000) {
        return `${(amount / 1_000).toFixed(1)}K`;
    }
    return formatWithLocale(amount);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate percentage safely (avoid division by zero)
 */
export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return clampPercent((value / total) * 100);
}
