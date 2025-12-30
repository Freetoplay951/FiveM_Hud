-- Minimap Control
local minimapEnabled = true

-- Minimap ein/ausblenden basierend auf Config
CreateThread(function()
    while true do
        Wait(0)
        
        if Config.HideDefaultMinimap then
            -- Standard-Minimap ausblenden
            DisplayRadar(false)
        else
            -- Standard-Minimap anzeigen (nur wenn nicht manuell ausgeblendet)
            if minimapEnabled then
                DisplayRadar(true)
            end
        end
    end
end)

-- Minimap dynamisch ein/ausblenden (z.B. im Fahrzeug)
-- CreateThread(function()
--     while true do
--         Wait(500)
--         
--         local playerPed = PlayerPedId()
--         local inVehicle = IsPedInAnyVehicle(playerPed, false)
--         
--         if inVehicle and not Config.HideDefaultMinimap then
--             DisplayRadar(true)
--         else
--             DisplayRadar(false)
--         end
--     end
-- end)

-- Exports
exports('showMinimap', function()
    minimapEnabled = true
    if not Config.HideDefaultMinimap then
        DisplayRadar(true)
    end
end)

exports('hideMinimap', function()
    minimapEnabled = false
    DisplayRadar(false)
end)

exports('toggleMinimap', function()
    minimapEnabled = not minimapEnabled
    if minimapEnabled and not Config.HideDefaultMinimap then
        DisplayRadar(true)
    else
        DisplayRadar(false)
    end
end)

-- Event für Minimap Control
RegisterNetEvent('hud:minimap')
AddEventHandler('hud:minimap', function(show)
    if show then
        exports['hud']:showMinimap()
    else
        exports['hud']:hideMinimap()
    end
end)
