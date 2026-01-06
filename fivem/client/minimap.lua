-- Minimap Control & Positioning
-- Steuert die GTA V Radar/Minimap Sichtbarkeit und Position

local minimapEnabled = true
local minimapShape = "square"

-- Standard Minimap Position (links unten)
local minimapPosition = {
    x = 0.0,
    y = 0.0,
    width = 0.15,
    height = 0.22
}

-- ============================================================================
-- MINIMAP SHAPE (Square/Round) - Muss vor Initialization definiert sein!
-- ============================================================================

local function SetMinimapShapeInternal(shape)
    minimapShape = shape
    
    if shape == "round" then
        -- Runde Minimap (benötigt circlemap Textur)
        RequestStreamedTextureDict("circlemap", false)
        
        local timeout = 0
        while not HasStreamedTextureDictLoaded("circlemap") and timeout < 100 do
            Wait(10)
            timeout = timeout + 1
        end
        
        if HasStreamedTextureDictLoaded("circlemap") then
            SetMinimapClipType(1) -- 1 = Circle clip
            if Config.Debug then
                print('[HUD Minimap] Shape set to round')
            end
        end
    else
        -- Standard square minimap
        SetMinimapClipType(0) -- 0 = Square clip
        if Config.Debug then
            print('[HUD Minimap] Shape set to square')
        end
    end
end

-- ============================================================================
-- INITIALIZATION
-- ============================================================================

-- Initialisierung beim Ressourcenstart
AddEventHandler('onClientResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then
        return
    end
    
    -- Kurz warten bis alles geladen ist
    Wait(500)
    
    -- Minimap aktivieren falls nicht versteckt
    if not Config.HideDefaultMinimap then
        DisplayRadar(true)
        
        -- Bigmap deaktivieren (erweiterte Karte)
        SetRadarBigmapEnabled(false, false)
        
        -- Radar Zoom auf Standard
        SetRadarZoom(0)
        
        -- Minimap Shape aus Config anwenden
        if Config.MinimapShape then
            SetMinimapShapeInternal(Config.MinimapShape)
        end
        
        if Config.Debug then
            print('[HUD Minimap] Initialized and enabled with shape: ' .. (Config.MinimapShape or 'square'))
        end
    else
        DisplayRadar(false)
        if Config.Debug then
            print('[HUD Minimap] Hidden by config')
        end
    end
end)

-- ============================================================================
-- MAIN LOOP
-- ============================================================================

-- Haupt-Loop für Minimap Kontrolle
CreateThread(function()
    while true do
        -- Minimap Sichtbarkeit steuern
        if Config.HideDefaultMinimap then
            DisplayRadar(false)
            Wait(1000)
        else
            -- Radar anzeigen wenn aktiviert
            if minimapEnabled then
                DisplayRadar(true)
                
                -- Bigmap Status prüfen und ggf. deaktivieren
                if IsBigmapActive() then
                    SetRadarBigmapEnabled(false, false)
                end
            else
                DisplayRadar(false)
            end
            Wait(100)
        end
    end
end)

-- (SetMinimapShapeInternal wurde nach oben verschoben)

-- ============================================================================
-- MINIMAP POSITION
-- ============================================================================

-- Minimap Position von HUD Koordinaten setzen
local function SetMinimapPositionFromHUD(screenX, screenY, width, height)
    -- Bildschirmauflösung holen
    local screenW, screenH = GetActiveScreenResolution()
    
    -- Pixel zu Prozent konvertieren (0.0 - 1.0)
    minimapPosition.x = screenX / screenW
    minimapPosition.y = screenY / screenH
    minimapPosition.width = (width or 200) / screenW
    minimapPosition.height = (height or 180) / screenH
    
    -- Minimap Komponenten positionieren
    -- Anchor: L = Left, B = Bottom
    local x = minimapPosition.x
    local y = minimapPosition.y + minimapPosition.height
    local w = minimapPosition.width
    local h = minimapPosition.height
    
    SetMinimapComponentPosition("minimap", "L", "B", x, y, w, h)
    SetMinimapComponentPosition("minimap_mask", "L", "B", x, y, w, h)
    SetMinimapComponentPosition("minimap_blur", "L", "B", x, y, w, h)
    
    if Config.Debug then
        print(string.format('[HUD Minimap] Position set: x=%.3f, y=%.3f, w=%.3f, h=%.3f', x, y, w, h))
    end
end

-- Minimap Position zurücksetzen
local function ResetMinimapPosition()
    -- Standard GTA V Position
    SetMinimapComponentPosition("minimap", "L", "B", 0.0, -0.047, 0.1638, 0.183)
    SetMinimapComponentPosition("minimap_mask", "L", "B", 0.0, -0.047, 0.1638, 0.183)
    SetMinimapComponentPosition("minimap_blur", "L", "B", 0.0, -0.047, 0.1638, 0.183)
    
    if Config.Debug then
        print('[HUD Minimap] Position reset to default')
    end
end

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports("showMinimap", function()
    minimapEnabled = true
    if not Config.HideDefaultMinimap then
        DisplayRadar(true)
    end
end)

exports("hideMinimap", function()
    minimapEnabled = false
    DisplayRadar(false)
end)

exports("toggleMinimap", function()
    minimapEnabled = not minimapEnabled
    DisplayRadar(minimapEnabled and not Config.HideDefaultMinimap)
    return minimapEnabled
end)

exports("isMinimapVisible", function()
    return minimapEnabled and not Config.HideDefaultMinimap
end)

exports("setMinimapShape", function(shape)
    SetMinimapShapeInternal(shape)
end)

exports("getMinimapShape", function()
    return minimapShape
end)

exports("setMinimapPosition", function(x, y, width, height)
    SetMinimapPositionFromHUD(x, y, width, height)
end)

exports("resetMinimapPosition", function()
    ResetMinimapPosition()
end)

exports("setMinimapZoom", function(zoom)
    -- Zoom: 0-1000 (0 = normal, höher = mehr rausgezoomt)
    SetRadarZoom(math.max(0, math.min(1000, zoom or 0)))
end)

-- ============================================================================
-- NUI CALLBACKS
-- ============================================================================

RegisterNUICallback("setMinimapPosition", function(data, cb)
    if data.x and data.y then
        SetMinimapPositionFromHUD(data.x, data.y, data.width, data.height)
    end
    cb({ success = true })
end)

RegisterNUICallback("setMinimapShape", function(data, cb)
    if data.shape then
        SetMinimapShapeInternal(data.shape)
    end
    cb({ success = true })
end)

-- Callback wenn Shape im Edit Mode geändert wird
RegisterNUICallback("onMinimapShapeChange", function(data, cb)
    if data.shape then
        SetMinimapShapeInternal(data.shape)
        if Config.Debug then
            print('[HUD Minimap] Shape changed via edit mode: ' .. data.shape)
        end
    end
    cb({ success = true })
end)

RegisterNUICallback("toggleMinimap", function(data, cb)
    local visible = exports[GetCurrentResourceName()]:toggleMinimap()
    cb({ success = true, visible = visible })
end)

RegisterNUICallback("resetMinimapPosition", function(data, cb)
    ResetMinimapPosition()
    cb({ success = true })
end)

-- ============================================================================
-- EVENTS
-- ============================================================================

-- Minimap ein/ausblenden
RegisterNetEvent("hud:minimap", function(show)
    if show then
        exports[GetCurrentResourceName()]:showMinimap()
    else
        exports[GetCurrentResourceName()]:hideMinimap()
    end
end)

-- Minimap Form setzen
RegisterNetEvent("hud:setMinimapShape", function(shape)
    SetMinimapShapeInternal(shape)
end)

-- Minimap Position setzen
RegisterNetEvent("hud:setMinimapPosition", function(x, y, w, h)
    SetMinimapPositionFromHUD(x, y, w, h)
end)

-- Minimap Reset
RegisterNetEvent("hud:resetMinimap", function()
    ResetMinimapPosition()
end)

-- ============================================================================
-- COMMANDS (Debug)
-- ============================================================================

if Config.Debug then
    RegisterCommand("minimap_toggle", function()
        local visible = exports[GetCurrentResourceName()]:toggleMinimap()
        print("[HUD Minimap] Visible: " .. tostring(visible))
    end, false)
    
    RegisterCommand("minimap_round", function()
        SetMinimapShapeInternal("round")
    end, false)
    
    RegisterCommand("minimap_square", function()
        SetMinimapShapeInternal("square")
    end, false)
    
    RegisterCommand("minimap_reset", function()
        ResetMinimapPosition()
    end, false)
end
