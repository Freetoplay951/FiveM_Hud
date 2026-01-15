Config = {}

-- HUD Update Intervalle (in ms)
Config.StatusUpdateInterval = 500      -- Wie oft Status-Werte aktualisiert werden
Config.VehicleUpdateInterval = 100     -- Wie oft Fahrzeug-Daten aktualisiert werden
Config.LocationUpdateInterval = 1000   -- Wie oft Location aktualisiert wird

-- Deaktivierte Widgets
Config.DisabledWidgets = {
    -- oxygen = true,
    -- stress = true
}

-- Death Screen Einstellungen
Config.EarlyRespawnTimer = 60          -- Sekunden bis Respawn möglich ist
Config.BleedoutTimer = 300             -- Sekunden bis automatischer Respawn
Config.ReviveLocations = {
    {
        coords = vec4(341.2093, -1396.7168, 31.5093, 48.9265),
    }
}

-- Keybinds
Config.EditModeKey = 'F7'              -- Taste für Edit-Mode
Config.ChatKey = 'T'                   -- Taste für Chat
Config.TeamChatKey = 'Y'               -- Taste für Team-Chat
Config.KeybindsKey = 'K'               -- Taste für Keybinds-Menü

-- Voice (für pma-voice / mumble-voip / saltychat)
-- 'auto' = automatische Erkennung, 'none' = deaktiviert
Config.VoiceResource = 'auto'

-- ============================================================================
-- VOICE RANGE KONFIGURATION
-- ============================================================================
-- Hier kannst du die Voice-Ranges für verschiedene Voice-Systeme konfigurieren.
-- Jede Range benötigt:
--   - bars: Anzahl der Balken (1-3)
--   - color: Farbe (muted-foreground, warning, critical, primary, etc.)
--   - label: Anzeigename im HUD
--
-- Die Ranges werden automatisch erkannt und können für verschiedene
-- Voice-Systeme unterschiedlich sein (pma-voice, saltychat, etc.)
-- ============================================================================

Config.VoiceRanges = {
    -- Standard Ranges (pma-voice, mumble-voip)
    whisper = { bars = 1, color = "muted-foreground", label = "Flüstern" },
    normal = { bars = 2, color = "warning", label = "Normal" },
    shout = { bars = 3, color = "critical", label = "Schreien" },
    
    -- SaltyChat Ranges (numerische Werte werden als String gesendet)
    ["1"] = { bars = 1, color = "muted-foreground", label = "Flüstern" },
    ["2"] = { bars = 2, color = "warning", label = "Normal" },
    ["3"] = { bars = 3, color = "critical", label = "Schreien" },
    
    -- SaltyChat Range-Namen (falls andere Bezeichnungen verwendet werden)
    whisper_range = { bars = 1, color = "muted-foreground", label = "Flüstern" },
    normal_range = { bars = 2, color = "warning", label = "Normal" },
    shouting = { bars = 3, color = "critical", label = "Schreien" },
    megaphone = { bars = 3, color = "primary", label = "Megafon" },
    
    -- TokoVOIP Ranges
    short = { bars = 1, color = "muted-foreground", label = "Kurz" },
    medium = { bars = 2, color = "warning", label = "Mittel" },
    long = { bars = 3, color = "critical", label = "Weit" },
}

-- Geld (für esx/qb)
Config.Framework = 'auto'              -- 'esx', 'qb', oder 'auto' für automatische Erkennung

-- Minimap
-- WICHTIG: Setze auf FALSE damit die echte GTA Karte angezeigt wird!
-- Das HUD positioniert die GTA-Minimap automatisch an die richtige Stelle.
Config.HideDefaultMinimap = false

-- Minimap Form: 'square' (Standard) oder 'round' (Rund)
Config.MinimapShape = 'square'

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


Config.StopVehicleRadioOnEnter = true

-- ============================================================================
-- KAROSSERIE-ZUSTAND (Body Health) KONFIGURATION
-- ============================================================================
-- Schwellwerte für die Ampelfarben-Anzeige des Karosserie-Zustands
-- Werte in Prozent (0% = kaputt, 100% = heile)
-- ============================================================================

Config.BodyHealth = {
    -- Ab welchem Prozent wird Gelb angezeigt? (Warnung)
    yellowThreshold = 70,  -- Unter 70% = Gelb
    -- Ab welchem Prozent wird Rot angezeigt? (Kritisch)
    redThreshold = 40,     -- Unter 40% = Rot
}

-- ============================================================================
-- SERVER INFO
-- ============================================================================

Config.ServerName = "RP Server"        -- Server Name im HUD
Config.MaxPlayers = 128                -- Maximale Spieleranzahl

-- Debug
Config.Debug = true
