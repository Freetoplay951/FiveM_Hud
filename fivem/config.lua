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

-- Voice (für pma-voice / mumble-voip / saltychat)
-- 'auto' = automatische Erkennung, 'none' = deaktiviert
Config.VoiceResource = 'auto'

-- Geld (für esx/qb)
Config.Framework = 'auto'              -- 'esx', 'qb', oder 'auto' für automatische Erkennung

-- Minimap
-- WICHTIG: Setze auf FALSE damit die echte GTA Karte angezeigt wird!
-- Das HUD positioniert die GTA-Minimap automatisch an die richtige Stelle.
Config.HideDefaultMinimap = false

-- Debug
Config.Debug = false
