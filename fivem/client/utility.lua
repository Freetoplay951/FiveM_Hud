-- Utility Updates (Wanted Level, Ping, Server Info)
-- Performance optimized with change detection

local lastUtilityData = {
    wantedLevel = nil,
    ping = nil,
    playerCount = nil
}

-- ============================================================================
-- HUD STARTING EVENT HANDLER
-- Register callbacks here that should run BEFORE HUD is visible
-- ============================================================================

AddEventHandler("hud:loading", function()
    -- Send initial server info
    SendNUI('updateUtility', {
        serverName = Config.ServerName or GetConvar('sv_hostname', 'RP Server'),
        maxPlayers = Config.MaxPlayers or GetConvarInt('sv_maxclients', 64),
        playerCount = #GetActivePlayers()
    })
    
    -- Send initial ping
    local playerId = PlayerId()
    local ping = GetPlayerPing(GetPlayerServerId(playerId))
    SendNUI('updateUtility', { ping = ping })
    
    -- Send initial wanted level
    local wantedLevel = GetPlayerWantedLevel(playerId)
    SendNUI('updateUtility', { wantedLevel = wantedLevel })
    
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
        if isHudVisible then
            local playerCount = #GetActivePlayers()
            if playerCount ~= lastUtilityData.playerCount then
                lastUtilityData.playerCount = playerCount
                SendNUI('updateUtility', {
                    playerCount = playerCount
                })
            end
        end
    end
end)

-- ============================================================================
-- MAIN UTILITY UPDATE LOOP (Wanted Level & Ping)
-- ============================================================================

CreateThread(function()
    while true do
        Wait(Config.UtilityUpdateInterval or 500)
        
        if isHudVisible then
            local playerId = PlayerId()
            
            -- Get wanted level (0-5)
            local wantedLevel = GetPlayerWantedLevel(playerId)
            
            -- Get ping/latency
            local ping = GetPlayerPing(GetPlayerServerId(playerId))
            
            -- Only send if something changed
            local wantedChanged = wantedLevel ~= lastUtilityData.wantedLevel
            local pingChanged = math.abs((ping or 0) - (lastUtilityData.ping or 0)) >= 5
            
            if wantedChanged or pingChanged then
                local updateData = {}
                
                if wantedChanged then
                    updateData.wantedLevel = wantedLevel
                    lastUtilityData.wantedLevel = wantedLevel
                end
                
                if pingChanged then
                    updateData.ping = ping
                    lastUtilityData.ping = ping
                end
                
                SendNUI('updateUtility', updateData)
            end
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

-- Update Ping manually
exports('setPing', function(ping)
    SendNUI('updateUtility', { ping = ping })
end)

-- Update server info
exports('setServerInfo', function(serverName, playerCount, maxPlayers)
    SendNUI('updateUtility', {
        serverName = serverName,
        playerCount = playerCount,
        maxPlayers = maxPlayers
    })
end)