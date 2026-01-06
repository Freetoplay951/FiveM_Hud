-- ============================================================================
-- FUNCTIONS
-- ============================================================================

--health, armor, hunger, thirst, stamina, stress, oxygen
local function refreshStatusIcons() 
    
end

-- ============================================================================
-- MAIN STATUS LOOP
-- ============================================================================

AddEventHandler("hud:loaded", function()
    if Config.Debug then
        print('[HUD] Loading Status Icons')
    end
    
    refreshStatusIcons()
    
    CreateThread(function()
        while true do
            Wait(Config.StatusUpdateInterval or 500)
            refreshStatusIcons()
        end
    end)
end)

-- ============================================================================
-- EXTERNAL STATUS UPDATES
-- ============================================================================

RegisterNetEvent('hud:handleStatus', function(statusType, callback)
    
end)