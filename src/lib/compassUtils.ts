export const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/**
 * Converts a degree (0-360) to a compass direction (N, NE, E, SE, S, SW, W, NW)
 * @param deg - Heading in degrees
 * @returns Compass direction as a string
 */
export const getDirectionFromDegree = (deg: number): string => {
    // Ensure the degree is between 0 and 360
    deg = ((deg % 360) + 360) % 360;

    // Add 22.5, then floor, to hit exact compass sectors
    return directions[Math.floor((deg + 22.5) / 45) % 8];
};
