-- Utility Updates (FPS, Wanted Level, Ping, Server Info, Speed Limit)
-- Performance optimized with change detection

local lastUtilityData = {
    fps = nil,
    wantedLevel = nil,
    ping = nil,
    playerCount = nil
}

local lastSpeedLimitData = {
    speedLimit = nil,
    speedZoneActive = nil
}

-- FPS Counter using frame time
local frameCount = 0
local lastFpsUpdate = 0
local currentFps = 60

CreateThread(function()
    while true do
        frameCount = frameCount + 1
        Wait(0)
    end
end)

-- Update FPS every second
CreateThread(function()
    while true do
        Wait(1000)
        currentFps = frameCount
        frameCount = 0
    end
end)

-- Main utility update loop
CreateThread(function()
    while true do
        Wait(Config.UtilityUpdateInterval or 500)
        
        if isHudVisible then
            local ped = PlayerPedId()
            local playerId = PlayerId()
            
            -- Get wanted level (0-5)
            local wantedLevel = GetPlayerWantedLevel(playerId)
            
            -- Get ping/latency
            local ping = GetPlayerPing(GetPlayerServerId(playerId))
            
            -- Get player count
            local playerCount = #GetActivePlayers()
            
            -- Only send if something changed
            local fpsChanged = currentFps ~= lastUtilityData.fps
            local wantedChanged = wantedLevel ~= lastUtilityData.wantedLevel
            local pingChanged = math.abs((ping or 0) - (lastUtilityData.ping or 0)) >= 5
            local playerCountChanged = playerCount ~= lastUtilityData.playerCount
            
            if fpsChanged or wantedChanged or pingChanged or playerCountChanged then
                local updateData = {}
                
                if fpsChanged then
                    updateData.fps = currentFps
                    lastUtilityData.fps = currentFps
                end
                
                if wantedChanged then
                    updateData.wantedLevel = wantedLevel
                    lastUtilityData.wantedLevel = wantedLevel
                end
                
                if pingChanged then
                    updateData.ping = ping
                    lastUtilityData.ping = ping
                end
                
                if playerCountChanged then
                    updateData.playerCount = playerCount
                    lastUtilityData.playerCount = playerCount
                end
                
                SendNUI('updateUtility', updateData)
            end
        end
    end
end)

-- ============================================================================
-- SERVER INFO (sent once on load, updates periodically)
-- ============================================================================

CreateThread(function()
    Wait(2000) -- Wait for HUD to load
    
    -- Send initial server info
    SendNUI('updateUtility', {
        serverName = Config.ServerName or GetConvar('sv_hostname', 'RP Server'),
        maxPlayers = Config.MaxPlayers or GetConvarInt('sv_maxclients', 64),
        playerCount = #GetActivePlayers()
    })
    
    -- Update player count every 10 seconds
    while true do
        Wait(10000)
        if isHudVisible then
            SendNUI('updateUtility', {
                playerCount = #GetActivePlayers()
            })
        end
    end
end)

-- ============================================================================
-- SPEED LIMIT ZONES
-- ============================================================================

local speedZones = Config.SpeedZones or {
    -- Example zones: { coords = vector3(x, y, z), radius = 50.0, limit = 50 }
    -- Add your speed zones in config.lua
}

local currentSpeedZone = nil

CreateThread(function()
    while true do
        Wait(500)
        
        if isHudVisible then
            local ped = PlayerPedId()
            local coords = GetEntityCoords(ped)
            local inVehicle = IsPedInAnyVehicle(ped, false)
            
            local foundZone = nil
            
            if inVehicle then
                for _, zone in ipairs(speedZones) do
                    local dist = #(coords - zone.coords)
                    if dist <= zone.radius then
                        foundZone = zone
                        break
                    end
                end
            end
            
            -- Check if zone changed
            local zoneChanged = (foundZone ~= nil) ~= (currentSpeedZone ~= nil)
            local limitChanged = foundZone and currentSpeedZone and foundZone.limit ~= currentSpeedZone.limit
            
            if zoneChanged or limitChanged then
                currentSpeedZone = foundZone
                
                if foundZone then
                    SendNUI('updateUtility', {
                        speedLimit = foundZone.limit,
                        speedZoneActive = true
                    })
                else
                    SendNUI('updateUtility', {
                        speedZoneActive = false
                    })
                end
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

-- Update FPS manually
exports('setFps', function(fps)
    SendNUI('updateUtility', { fps = fps })
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

-- Set speed limit zone manually (for custom zone systems)
exports('setSpeedLimit', function(limit, active)
    SendNUI('updateUtility', {
        speedLimit = limit,
        speedZoneActive = active
    })
end)

-- Add a speed zone dynamically
exports('addSpeedZone', function(coords, radius, limit)
    table.insert(speedZones, {
        coords = coords,
        radius = radius,
        limit = limit
    })
end)

-- Remove all speed zones
exports('clearSpeedZones', function()
    speedZones = {}
    currentSpeedZone = nil
    SendNUI('updateUtility', { speedZoneActive = false })
end)
