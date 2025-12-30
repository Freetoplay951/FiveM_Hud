Config = {}

-- HUD Update Intervalle (in ms)
Config.StatusUpdateInterval = 500      -- Wie oft Status-Werte aktualisiert werden
Config.VehicleUpdateInterval = 100     -- Wie oft Fahrzeug-Daten aktualisiert werden
Config.LocationUpdateInterval = 1000   -- Wie oft Location aktualisiert wird

-- Status Einstellungen
Config.EnableHunger = true
Config.EnableThirst = true
Config.EnableStress = true
Config.EnableOxygen = true
Config.EnableStamina = true

-- Keybinds
Config.EditModeKey = 'F7'              -- Taste für Edit-Mode
Config.ChatKey = 'T'                   -- Taste für Chat
Config.TeamChatKey = 'Y'               -- Taste für Team-Chat

-- Voice (für pma-voice / mumble-voip / saltychat)
-- 'auto' = automatische Erkennung, 'none' = deaktiviert
Config.VoiceResource = 'auto'

-- Geld (für esx/qb)
Config.Framework = 'auto'              -- 'esx', 'qb', oder 'auto' für automatische Erkennung

-- Minimap
-- WICHTIG: Setze auf FALSE damit die echte GTA Karte angezeigt wird!
-- Das HUD positioniert die GTA-Minimap automatisch an die richtige Stelle.
Config.HideDefaultMinimap = false

-- ============================================================================
-- TEAM-CHAT KONFIGURATION (Staff-Ränge)
-- ============================================================================
-- Hier kannst du die Staff-Ränge für den Team-Chat definieren.
-- Jeder Rang benötigt:
--   - name: Anzeigename im Chat
--   - permission: Ace-Permission die der Spieler braucht
--   - color: Farbe für den Chat (hex oder Name)
--   - icon: Icon-Typ ('shield' oder 'crown')
--   - isAdmin: Hat Admin-Rechte im Team-Chat (kann z.B. Nachrichten löschen)
--
-- Die Reihenfolge bestimmt die Hierarchie (erster Eintrag = höchster Rang)
-- ============================================================================

Config.TeamChatRanks = {
    {
        id = "owner",
        name = "Owner",
        permission = "hud.staff.owner",
        color = "#f59e0b",  -- Amber
        icon = "crown",
        isAdmin = true
    },
    {
        id = "superadmin",
        name = "Super-Admin",
        permission = "hud.staff.superadmin",
        color = "#ef4444",  -- Red
        icon = "crown",
        isAdmin = true
    },
    {
        id = "admin",
        name = "Admin",
        permission = "hud.staff.admin",
        color = "#a855f7",  -- Purple
        icon = "shield",
        isAdmin = true
    },
    {
        id = "moderator",
        name = "Moderator",
        permission = "hud.staff.moderator",
        color = "#3b82f6",  -- Blue
        icon = "shield",
        isAdmin = false
    },
    {
        id = "supporter",
        name = "Supporter",
        permission = "hud.staff.supporter",
        color = "#22c55e",  -- Green
        icon = "shield",
        isAdmin = false
    },
    -- Füge hier weitere Ränge hinzu:
    -- {
    --     id = "helper",
    --     name = "Helfer",
    --     permission = "hud.staff.helper",
    --     color = "#06b6d4",  -- Cyan
    --     icon = "shield",
    --     isAdmin = false
    -- },
}

-- Allgemeine Permission die ALLEN Staff-Rängen Zugriff gibt (optional)
Config.TeamChatGeneralPermission = "hud.staff"

-- Team-Chat Name (wird oben im Chat angezeigt)
Config.TeamChatName = "Team-Chat"

-- Debug
Config.Debug = false
