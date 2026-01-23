-- ============================================================================
-- ENUMS / CONSTANTS
-- ============================================================================
-- Diese Datei definiert alle Enum-Werte für das HUD-System.
-- Verwende diese Konstanten anstelle von Strings, um Tippfehler zu vermeiden.
-- ============================================================================

-- ============================================================================
-- VEHICLE HEALTH STATUS
-- ============================================================================
-- Verwendung: Config.BodyHealth.calc() Rückgabewert
-- ============================================================================

---@enum VehicleHealthStatus
VehicleHealthStatus = {
    GOOD = "good",
    WARNING = "warning",
    CRITICAL = "critical",
}

-- ============================================================================
-- VEHICLE TYPES
-- ============================================================================
-- Wird verwendet für Fahrzeug-Typ-Erkennung
-- ============================================================================

---@enum VehicleType
VehicleType = {
    CAR = "car",
    MOTORCYCLE = "motorcycle",
    BICYCLE = "bicycle",
    BOAT = "boat",
    HELICOPTER = "helicopter",
    PLANE = "plane",
}

-- ============================================================================
-- VOICE COLORS
-- ============================================================================
-- Farben für Voice-Range-Anzeige
-- ============================================================================

---@enum VoiceColor
VoiceColor = {
    MUTED = "muted-foreground",
    WARNING = "warning",
    CRITICAL = "critical",
    PRIMARY = "primary",
}

-- ============================================================================
-- TEAM CHAT ICONS
-- ============================================================================
-- Icons für Staff-Ränge im Team-Chat
-- ============================================================================

---@enum TeamChatIcon
TeamChatIcon = {
    SHIELD = "shield",
    CROWN = "crown",
}

-- ============================================================================
-- MINIMAP SHAPES
-- ============================================================================
-- Formen der Minimap
-- ============================================================================

---@enum MinimapShape
MinimapShape = {
    SQUARE = "square",
    ROUND = "round",
}

-- ============================================================================
-- FRAMEWORK TYPES
-- ============================================================================
-- Unterstützte Frameworks
-- ============================================================================

---@enum FrameworkType
FrameworkType = {
    AUTO = "auto",
    ESX = "esx",
    QB = "qb",
}

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

--- Validiert ob ein Wert ein gültiger VehicleHealthStatus ist
--- @param value string Der zu prüfende Wert
--- @return boolean isValid Ob der Wert gültig ist
function IsValidHealthStatus(value)
    return value == VehicleHealthStatus.GOOD 
        or value == VehicleHealthStatus.WARNING 
        or value == VehicleHealthStatus.CRITICAL
end

--- Validiert ob ein Wert ein gültiger VehicleType ist
--- @param value string Der zu prüfende Wert
--- @return boolean isValid Ob der Wert gültig ist
function IsValidVehicleType(value)
    for _, v in pairs(VehicleType) do
        if v == value then
            return true
        end
    end
    return false
end
