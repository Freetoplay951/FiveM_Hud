MinimapShape = {
    SQUARE = "square",
    ROUND = "round"
}

local function SetMinimapShape(shape)
    print("Shape changed to " .. tostring(shape))
end

RegisterNUICallback("onMinimapShapeChange", function(data, cb)
    local shape = data.shape or MinimapShape.SQUARE
    SetMinimapShape(shape)
    cb({ success = true })
end)