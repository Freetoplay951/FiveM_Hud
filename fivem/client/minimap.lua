MinimapShape = {
    SQUARE = "square",
    ROUND = "round"
}

local function SetMinimapShape(shape)
    if shape == MinimapShape.SQUARE then
        RequestStreamedTextureDict("squaremap", false)
        while not HasStreamedTextureDictLoaded("squaremap") do
            Wait(0)
        end

        SetMinimapClipType(0)
        AddReplaceTexture("platform:/textures/graphics", "radarmasksm", "squaremap", "radarmasksm")
        AddReplaceTexture("platform:/textures/graphics", "radarmask1g", "squaremap", "radarmasksm")

        local defaultAspectRatio = 1920 / 1080
        local resX, resY = GetActiveScreenResolution()
        local aspectRatio = resX / resY
        local minimapOffset = 0.0
        if aspectRatio > defaultAspectRatio then
            minimapOffset = ((defaultAspectRatio - aspectRatio) / 3.6) - 0.008
        end

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

        local defaultAspectRatio = 1920 / 1080
        local resX, resY = GetActiveScreenResolution()
        local aspectRatio = resX / resY
        local minimapOffset = 0.0
        if aspectRatio > defaultAspectRatio then
            minimapOffset = ((defaultAspectRatio - aspectRatio) / 3.6) - 0.008
        end

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

    print("Shape changed to " .. tostring(shape))
end

RegisterNUICallback("onMinimapShapeChange", function(data, cb)
    local shape = data.shape or MinimapShape.SQUARE
    SetMinimapShape(shape)
    cb({ success = true })
end)

AddEventHandler("onClientResourceStart", function(res)
    if res ~= GetCurrentResourceName() then return end
    SetMinimapShape(MinimapShape.SQUARE)
end)
