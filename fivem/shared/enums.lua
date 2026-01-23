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
-- NOTIFICATION TYPES
-- ============================================================================
-- Typen für Benachrichtigungen
-- ============================================================================

---@enum NotificationType
NotificationType = {
    SUCCESS = "success",
    ERROR = "error",
    WARNING = "warning",
    INFO = "info",
    SYSTEM = "system",
}

-- ============================================================================
-- VOICE RANGES
-- ============================================================================
-- Voice-Range-Stufen für Voice-Systeme
-- ============================================================================

---@enum VoiceRange
VoiceRange = {
    WHISPER = "whisper",
    NORMAL = "normal",
    SHOUT = "shout",
    MEGAPHONE = "megaphone",
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
-- STATUS TYPES
-- ============================================================================
-- Spieler-Status-Typen
-- ============================================================================

---@enum StatusType
StatusType = {
    HEALTH = "health",
    ARMOR = "armor",
    HUNGER = "hunger",
    THIRST = "thirst",
    STAMINA = "stamina",
    STRESS = "stress",
    OXYGEN = "oxygen",
}

-- ============================================================================
-- CHAT MESSAGE TYPES
-- ============================================================================
-- Typen für Chat-Nachrichten
-- ============================================================================

---@enum ChatMessageType
ChatMessageType = {
    NORMAL = "normal",
    SYSTEM = "system",
    ACTION = "action",
    OOC = "ooc",
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
-- RESOURCE STATES
-- ============================================================================
-- FiveM Resource-Zustände
-- ============================================================================

---@enum ResourceState
ResourceState = {
    STARTED = "started",
    STARTING = "starting",
    STOPPED = "stopped",
    STOPPING = "stopping",
    UNINITIALIZED = "uninitialized",
    UNKNOWN = "unknown",
}

-- ============================================================================
-- BLINKER STATES
-- ============================================================================
-- Fahrzeug-Blinker-Zustände
-- ============================================================================

---@enum BlinkerState
BlinkerState = {
    NONE = 0,
    LEFT = 1,
    RIGHT = 2,
    BOTH = 3,
}

-- ============================================================================
-- LANDING GEAR STATES
-- ============================================================================
-- Flugzeug-Fahrwerk-Zustände (GTA Native)
-- ============================================================================

---@enum LandingGearState
LandingGearState = {
    DEPLOYED = 0,
    CLOSING = 1,
    OPENING = 2,
    RETRACTED = 3,
    BROKEN = 4,
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

--- Validiert ob ein Wert ein gültiger NotificationType ist
--- @param value string Der zu prüfende Wert
--- @return boolean isValid Ob der Wert gültig ist
function IsValidNotificationType(value)
    for _, v in pairs(NotificationType) do
        if v == value then
            return true
        end
    end
    return false
end

--- Validiert ob ein Wert ein gültiger VoiceRange ist
--- @param value string Der zu prüfende Wert
--- @return boolean isValid Ob der Wert gültig ist
function IsValidVoiceRange(value)
    for _, v in pairs(VoiceRange) do
        if v == value then
            return true
        end
    end
    return false
end
