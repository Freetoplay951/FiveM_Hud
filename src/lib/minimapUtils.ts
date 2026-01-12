// GTA Default Minimap Größen (relativ zum Viewport)
export const MAP_WIDTH_REL = 0.15;
export const MAP_HEIGHT_REL = 0.188;

/**
 * Berechnet die Minimap-Größe basierend auf der aktuellen Viewport-Größe
 */
export const getMinimapSize = (isRound: boolean = false) => {
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1920;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 1080;

    const widthPx = viewportWidth * MAP_WIDTH_REL;
    const heightPx = viewportHeight * MAP_HEIGHT_REL;

    // Rund = quadratisch, nimmt min von beiden
    if (isRound) {
        const size = Math.min(widthPx, heightPx);
        return { width: size, height: size };
    }

    return { width: widthPx, height: heightPx };
};
