-- Minimap Control & Positioning
-- This script controls the GTA V radar/minimap position to match the HUD widget

local minimapEnabled = true
local minimapShape = "square"
local currentMinimapPos = { x = 0.02, y = 0.95, w = 0.15, h = 0.22 } -- Default position

-- Cache natives for performance
local DisplayRadar = DisplayRadar
local SetRadarBigmapEnabled = SetRadarBigmapEnabled

-- Apply minimap position
local function ApplyMinimapPosition()
    local x, y, w, h = currentMinimapPos.x, currentMinimapPos.y, currentMinimapPos.w, currentMinimapPos.h
    
    -- Set all minimap components to match HUD position
    SetMinimapComponentPosition("minimap", "L", "B", x, y - h, w, h)
    SetMinimapComponentPosition("minimap_mask", "L", "B", x, y - h, w, h)
    SetMinimapComponentPosition("minimap_blur", "L", "B", x, y - h, w, h)
end

-- Set minimap shape
local function SetMinimapShape(shape)
    minimapShape = shape
    
    if shape == "round" then
        -- Request circular mask texture
        RequestStreamedTextureDict("circlemap", false)
        local timeout = 0
        while not HasStreamedTextureDictLoaded("circlemap") and timeout < 100 do
            Wait(10)
            timeout = timeout + 1
        end
        
        if HasStreamedTextureDictLoaded("circlemap") then
            -- Apply circular minimap mask
            AddReplaceTexture("platform:/textures/graphics", "radarmasksm", "circlemap", "noreg")
            SetRadarBigmapEnabled(false, false)
        end
    else
        -- Reset to square minimap
        AddReplaceTexture("platform:/textures/graphics", "radarmasksm", "noreg", "noreg")
        SetRadarBigmapEnabled(false, false)
    end
end

-- Update minimap position from NUI
-- Converts screen coordinates to GTA minimap coordinates
local function SetMinimapPositionFromHUD(screenX, screenY, width, height)
    -- screenX, screenY are pixel positions from the HUD
    -- Convert to GTA's 0-1 coordinate system
    
    local sw, sh = GetActiveScreenResolution()
    
    -- Convert pixel position to percentage (0-1)
    local x = screenX / sw
    local y = screenY / sh
    local w = (width or 200) / sw
    local h = (height or 180) / sh
    
    currentMinimapPos = { x = x, y = y + h, w = w, h = h }
    ApplyMinimapPosition()
end

-- Initialize minimap on resource start
CreateThread(function()
    Wait(500) -- Wait for game to be ready
    
    -- Ensure radar is visible
    DisplayRadar(true)
    SetRadarBigmapEnabled(false, false)
    
    -- Apply default position
    ApplyMinimapPosition()
    
    -- Apply shape if configured
    if minimapShape == "round" then
        SetMinimapShape("round")
    end
end)

-- Main visibility control - optimized with conditional wait
CreateThread(function()
    while true do
        if Config.HideDefaultMinimap then
            DisplayRadar(false)
            Wait(1000)
        else
            DisplayRadar(minimapEnabled)
            Wait(100)
        end
    end
end)

-- Exports
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
end)

exports("setMinimapShape", function(shape)
    SetMinimapShape(shape)
end)

exports("setMinimapPosition", function(x, y, width, height)
    SetMinimapPositionFromHUD(x, y, width, height)
end)

exports("resetMinimapPosition", function()
    currentMinimapPos = { x = 0.02, y = 0.95, w = 0.15, h = 0.22 }
    ApplyMinimapPosition()
end)

-- NUI Callbacks
RegisterNUICallback("setMinimapPosition", function(data, cb)
    if data.x and data.y then
        SetMinimapPositionFromHUD(data.x, data.y, data.width, data.height)
    end
    cb({ ok = true })
end)

RegisterNUICallback("setMinimapShape", function(data, cb)
    if data.shape then
        SetMinimapShape(data.shape)
    end
    cb({ ok = true })
end)

-- Events
RegisterNetEvent("hud:minimap")
AddEventHandler("hud:minimap", function(show)
    if show then
        exports["hud"]:showMinimap()
    else
        exports["hud"]:hideMinimap()
    end
end)

RegisterNetEvent("hud:setMinimapShape")
AddEventHandler("hud:setMinimapShape", function(shape)
    SetMinimapShape(shape)
end)

RegisterNetEvent("hud:setMinimapPosition")
AddEventHandler("hud:setMinimapPosition", function(x, y, w, h)
    SetMinimapPositionFromHUD(x, y, w, h)
end)
