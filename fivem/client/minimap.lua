-- Minimap Shape Enum
MinimapShape = {
    SQUARE = "square",
    ROUND = "round"
}

-- Set minimap shape using GTA natives
local function SetMinimapShape(shape)
    print("Shape changed to " .. tostring(shape))
    
    if shape == MinimapShape.ROUND then
        -- Round minimap (like in certain missions)
        SetMinimapComponentPosition("minimap", "L", "B", 0.0, -0.047, 0.1638, 0.183)
        SetMinimapComponentPosition("minimap_mask", "L", "B", 0.0, 0.0, 0.128, 0.20)
        SetMinimapComponentPosition("minimap_blur", "L", "B", -0.01, 0.025, 0.262, 0.300)
        SetRadarBigmapEnabled(false, false)
    else
        -- Square minimap (default GTA style)
        SetMinimapComponentPosition("minimap", "L", "B", 0.0, -0.047, 0.1638, 0.183)
        SetMinimapComponentPosition("minimap_mask", "L", "B", 0.0, 0.0, 0.128, 0.20)
        SetMinimapComponentPosition("minimap_blur", "L", "B", -0.01, 0.025, 0.262, 0.300)
        SetRadarBigmapEnabled(false, false)
    end
end

RegisterNUICallback("onMinimapShapeChange", function(data, cb)
    local shape = data.shape or MinimapShape.SQUARE
    SetMinimapShape(shape)
    cb({ success = true })
end)