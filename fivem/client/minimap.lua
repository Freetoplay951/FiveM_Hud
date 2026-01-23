-- The bars (healthbar, ...) will only be deactivated if you ensure the
-- script before joining the server. Else it won't load the Scaleform (.gfx file).

local function SetMinimapShape(shape)
    local defaultAspectRatio = 1920 / 1080
    local resX, resY = GetActiveScreenResolution()
    local aspectRatio = resX / resY
    local minimapOffset = 0.0
    if aspectRatio > defaultAspectRatio then
        minimapOffset = ((defaultAspectRatio - aspectRatio) / 3.6) - 0.008
    end
        
    if shape == MinimapShape.SQUARE then
        RequestStreamedTextureDict("squaremap", false)
        while not HasStreamedTextureDictLoaded("squaremap") do
            Wait(0)
        end

        SetMinimapClipType(0)
        AddReplaceTexture("platform:/textures/graphics", "radarmasksm", "squaremap", "radarmasksm")
        AddReplaceTexture("platform:/textures/graphics", "radarmask1g", "squaremap", "radarmasksm")

        local sizeXOffset = -0.02
        
        local posXOffset = -0.004
        local posYOffset = 0.04

        SetMinimapComponentPosition("minimap",      "L", "B", 0.0 + minimapOffset + posXOffset, -0.047 + posYOffset, 0.1638 + sizeXOffset, 0.183)
        SetMinimapComponentPosition("minimap_mask", "L", "B", 0.0 + minimapOffset + posXOffset,  0.000 + posYOffset, 0.1280 + sizeXOffset, 0.200)
        SetMinimapComponentPosition("minimap_blur", "L", "B", -0.01 + minimapOffset + posXOffset, 0.025 + posYOffset, 0.2620 + sizeXOffset, 0.300)

        SetBlipAlpha(GetNorthRadarBlip(), 0)
        SetBigmapActive(true, false)
        Wait(50)
        SetBigmapActive(false, false)
    elseif shape == MinimapShape.ROUND then
        RequestStreamedTextureDict("circlemap", false)
        while not HasStreamedTextureDictLoaded("circlemap") do
            Wait(0)
        end

        SetMinimapClipType(1)
        AddReplaceTexture("platform:/textures/graphics", "radarmasksm", "circlemap", "radarmasksm")
        AddReplaceTexture("platform:/textures/graphics", "radarmask1g", "circlemap", "radarmasksm")

        local sizeX = 0.175
        local sizeY = 0.279

        local posXOffset = -0.01
        local posYOffset = 0.04

        SetMinimapComponentPosition("minimap",      "L", "B", -0.0100 + minimapOffset + posXOffset, -0.030 + posYOffset, sizeX, sizeY)
        SetMinimapComponentPosition("minimap_mask", "L", "B",  0.2000 + minimapOffset + posXOffset,  0.000 + posYOffset, sizeX, sizeY)
        SetMinimapComponentPosition("minimap_blur", "L", "B",  0.0000 + minimapOffset + posXOffset,  0.015 + posYOffset, sizeX, sizeY)

        SetBlipAlpha(GetNorthRadarBlip(), 0)
        SetBigmapActive(true, false)
        Wait(50)
        SetBigmapActive(false, false)
    end

    if Config.Debug then
        print('[HUD Minimap] Minimap Shape changed to ' .. tostring(shape))
    end
end

RegisterNUICallback("onMinimapShapeChange", function(data, cb)
    local shape = data.shape or MinimapShape.SQUARE
    SetMinimapShape(shape)
    cb({ success = true })
end)

-- Show/Hide minimap

local isMinimapVisible = true
local function UpdateMinimapVisibility(inVehicle)
    if not Config.MinimapOnlyInVehicle then
        if not isMinimapVisible then
            DisplayRadar(true)
            isMinimapVisible = true
            if Config.Debug then
                print('[HUD Minimap] Minimap visibility: always visible (option disabled)')
            end
        end
        return
    end
    
    if inVehicle and not isMinimapVisible then
        DisplayRadar(true)
        isMinimapVisible = true
        if Config.Debug then
            print('[HUD Minimap] Minimap shown (entered vehicle)')
        end
    elseif not inVehicle and isMinimapVisible then
        DisplayRadar(false)
        isMinimapVisible = false
        if Config.Debug then
            print('[HUD Minimap] Minimap hidden (left vehicle)')
        end
    end
end

CreateThread(function()
    local wasInVehicle = false
    
    Wait(1000)
    local ped = PlayerPedId()
    wasInVehicle = IsPedInAnyVehicle(ped, false)
    UpdateMinimapVisibility(wasInVehicle)
    
    while true do
        Wait(500)
        
        ped = PlayerPedId()
        local inVehicle = IsPedInAnyVehicle(ped, false)
        
        if inVehicle ~= wasInVehicle then
            wasInVehicle = inVehicle
            UpdateMinimapVisibility(inVehicle)
        end
    end
end)

exports('setMinimapVehicleOnly', function(enabled)
    Config.MinimapOnlyInVehicle = enabled
    local ped = PlayerPedId()
    local inVehicle = IsPedInAnyVehicle(ped, false)
    UpdateMinimapVisibility(inVehicle)
end)