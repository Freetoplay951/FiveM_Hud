-- Utility Updates (Wanted Level, Server Info)
-- Performance optimized with change detection

local lastUtilityData = {
    wantedLevel = nil,
    isEvading = nil,
    playerCount = nil
}

-- ============================================================================
-- DISABLE DEFAULT GTA HUD COMPONENTS
-- ============================================================================

local function DisableDefaultWantedHud()
    -- WANTED_STARS = 1
    SetHudComponentSize(1, 0, 0)
    SetHudComponentPosition(1, 0, 0)
    
    if Config.Debug then
        print('[HUD Utility] Disabled default GTA wanted stars HUD')
    end
end

-- ============================================================================
-- HUD STARTING EVENT HANDLER
-- Register callbacks here that should run BEFORE HUD is visible
-- ============================================================================

AddEventHandler("hud:loading", function()
    -- Disable default GTA wanted stars
    DisableDefaultWantedHud()
    
    -- Send initial server info
    SendNUI('updateUtility', {
        serverName = Config.ServerName or GetConvar('sv_hostname', 'RP Server'),
        maxPlayers = Config.MaxPlayers or GetConvarInt('sv_maxclients', 64),
        playerCount = #GetActivePlayers()
    })
        
    -- Send initial wanted level and evading status
    local playerId = PlayerId()
    local wantedLevel = GetPlayerWantedLevel(playerId)
    local isEvading = Citizen.InvokeNative(0x7E07C78925D5FD96, playerId) ~= 1
    SendNUI('updateUtility', { 
        wantedLevel = wantedLevel,
        isEvading = isEvading
    })
    
    if Config.Debug then
        print('[HUD Utility] Initial data sent via hud:loading event')
    end
end)

-- ============================================================================
-- PLAYER COUNT UPDATE LOOP (every 10 seconds)
-- ============================================================================

CreateThread(function()
    while true do
        Wait(10000)
        local playerCount = #GetActivePlayers()
        if playerCount ~= lastUtilityData.playerCount then
            lastUtilityData.playerCount = playerCount
            SendNUI('updateUtility', {
                playerCount = playerCount
            })
        end
    end
end)

-- ============================================================================
-- WANTED LEVEL UPDATE LOOP (faster for responsive evading status)
-- ============================================================================

CreateThread(function()
    while true do
        Wait(Config.UtilityUpdateInterval or 500)
        
        local playerId = PlayerId()
        
        -- Get wanted level (0-5) - this is client-side
        local wantedLevel = GetPlayerWantedLevel(playerId)
        
        -- Check if player is evading (cops lost sight)
        -- ArePlayerStarsGreyedOut returns true when cops can't see you
        local isEvading = Citizen.InvokeNative(0x7E07C78925D5FD96, playerId) ~= 1
        
        -- Only send if something changed
        local wantedChanged = wantedLevel ~= lastUtilityData.wantedLevel
        local evadingChanged = isEvading ~= lastUtilityData.isEvading
        
        if wantedChanged or evadingChanged then
            lastUtilityData.wantedLevel = wantedLevel
            lastUtilityData.isEvading = isEvading
            SendNUI('updateUtility', { 
                wantedLevel = wantedLevel,
                isEvading = isEvading
            })
        end
    end
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

-- Set wanted level manually
exports('setWantedLevel', function(level)
    local clampedLevel = math.max(0, math.min(5, level or 0))
    SendNUI('updateUtility', { wantedLevel = clampedLevel })
end)

-- Update server info
exports('setServerInfo', function(serverName, playerCount, maxPlayers)
    SendNUI('updateUtility', {
        serverName = serverName,
        playerCount = playerCount,
        maxPlayers = maxPlayers
    })
end)