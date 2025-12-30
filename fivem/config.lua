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
Config.HideDefaultMinimap = false      -- Standard-Minimap ausblenden (für eigene Minimap)

-- Debug
Config.Debug = false
