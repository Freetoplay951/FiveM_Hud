-- Minimap Control & Positioning
local minimapEnabled = true
local minimapShape = "square" -- "square" or "round"
local minimapPosition = { x = 0.0, y = 0.0 } -- Will be set from NUI

-- Cache natives for performance
local DisplayRadar = DisplayRadar
local SetRadarBigmapEnabled = SetRadarBigmapEnabled
local SetMinimapComponentPosition = SetMinimapComponentPosition
local SetBlipAlpha = SetBlipAlpha
local GetFirstBlipInfoId = GetFirstBlipInfoId

-- Set minimap shape (square or round)
local function SetMinimapShape(shape)
    minimapShape = shape
    
    if shape == "round" then
        -- Make minimap circular
        SetRadarBigmapEnabled(false, false)
        -- Use mask to create round effect
        RequestStreamedTextureDict("circlemap", false)
        while not HasStreamedTextureDictLoaded("circlemap") do
            Wait(0)
        end
    else
        -- Standard square minimap
        SetRadarBigmapEnabled(false, false)
    end
end

-- Position minimap based on HUD widget position
-- x, y are in screen percentage (0.0 - 1.0)
local function SetMinimapPosition(x, y, width, height)
    -- Store position for later use
    minimapPosition = { x = x, y = y }
    
    -- Convert to GTA's coordinate system
    -- Minimap position is based on anchor point
    local minimapX = x
    local minimapY = y
    local minimapW = width or 0.15 -- Default width
    local minimapH = height or 0.2 -- Default height
    
    -- Set minimap component positions
    -- Component IDs: 0 = main, 1 = mask, 2 = interior, etc.
    SetMinimapComponentPosition("minimap", "L", "B", minimapX, minimapY, minimapW, minimapH)
    SetMinimapComponentPosition("minimap_mask", "L", "B", minimapX, minimapY, minimapW, minimapH)
    SetMinimapComponentPosition("minimap_blur", "L", "B", minimapX, minimapY, minimapW, minimapH)
end

-- Reset minimap to default position
local function ResetMinimapPosition()
    -- Reset to GTA default
    SetMinimapComponentPosition("minimap", "L", "B", 0.0, 0.0, 0.15, 0.2)
    SetMinimapComponentPosition("minimap_mask", "L", "B", 0.0, 0.0, 0.15, 0.2)
    SetMinimapComponentPosition("minimap_blur", "L", "B", 0.0, 0.0, 0.15, 0.2)
end

-- Main minimap visibility thread - optimized with longer wait
CreateThread(function()
    while true do
        if Config.HideDefaultMinimap then
            DisplayRadar(false)
            Wait(1000) -- Longer wait when hidden
        else
            if minimapEnabled then
                DisplayRadar(true)
            else
                DisplayRadar(false)
            end
            Wait(500) -- Check less frequently
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
    if minimapEnabled and not Config.HideDefaultMinimap then
        DisplayRadar(true)
    else
        DisplayRadar(false)
    end
end)

exports("setMinimapShape", function(shape)
    SetMinimapShape(shape)
end)

exports("setMinimapPosition", function(x, y, width, height)
    SetMinimapPosition(x, y, width, height)
end)

exports("resetMinimapPosition", function()
    ResetMinimapPosition()
end)

-- NUI Callbacks for minimap control
RegisterNUICallback("setMinimapPosition", function(data, cb)
    if data.x and data.y then
        SetMinimapPosition(data.x, data.y, data.width, data.height)
    end
    cb({ ok = true })
end)

RegisterNUICallback("setMinimapShape", function(data, cb)
    if data.shape then
        SetMinimapShape(data.shape)
    end
    cb({ ok = true })
end)

-- Event handlers
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
AddEventHandler("hud:setMinimapPosition", function(x, y, width, height)
    SetMinimapPosition(x, y, width, height)
end)
