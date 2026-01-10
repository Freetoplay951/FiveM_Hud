-- Utility Updates (Wanted Level, Ping, Server Info)
-- Performance optimized with change detection
-- NOTE: Ping is fetched from server (GetPlayerPing is server-only!)

local lastUtilityData = {
    wantedLevel = nil,
    ping = nil,
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
-- PING RECEIVER (from server)
-- ============================================================================

RegisterNetEvent('hud:receivePing', function(ping)
    if ping ~= lastUtilityData.ping then
        lastUtilityData.ping = ping
        SendNUI('updateUtility', { ping = ping })
    end
end)

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
    
    -- Request initial ping from server (only if enabled)
    if Config.enablePing then
        TriggerServerEvent('hud:requestPing')
    end
    
    -- Send initial wanted level
    local playerId = PlayerId()
    local wantedLevel = GetPlayerWantedLevel(playerId)
    SendNUI('updateUtility', { wantedLevel = wantedLevel })
    
    -- Disable ping widget if not enabled
    if not Config.enablePing then
        SendNUI('updateDisabledWidgets', { ping = true })
    end
    
    if Config.Debug then
        print('[HUD Utility] Initial data sent via hud:loading event')
        if not Config.enablePing then
            print('[HUD Utility] Ping widget disabled via config')
        end
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
-- MAIN UTILITY UPDATE LOOP (Wanted Level & Ping request)
-- ============================================================================

CreateThread(function()
    while true do
        Wait(Config.UtilityUpdateInterval or 500)
        
        local playerId = PlayerId()
        
        -- Get wanted level (0-5) - this is client-side
        local wantedLevel = GetPlayerWantedLevel(playerId)
        
        -- Only send if wanted level changed
        if wantedLevel ~= lastUtilityData.wantedLevel then
            lastUtilityData.wantedLevel = wantedLevel
            SendNUI('updateUtility', { wantedLevel = wantedLevel })
        end
        
        -- Request ping from server (server-side only!)
        if Config.enablePing then
            TriggerServerEvent('hud:requestPing')
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