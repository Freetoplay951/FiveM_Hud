-- Utility Updates (FPS, Wanted Level, Ping)
-- Performance optimized with change detection

local lastUtilityData = {
    fps = nil,
    wantedLevel = nil,
    ping = nil
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
            
            -- Only send if something changed
            local fpsChanged = currentFps ~= lastUtilityData.fps
            local wantedChanged = wantedLevel ~= lastUtilityData.wantedLevel
            local pingChanged = math.abs((ping or 0) - (lastUtilityData.ping or 0)) >= 5 -- 5ms tolerance
            
            if fpsChanged or wantedChanged or pingChanged then
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
                
                SendNUI('updateUtility', updateData)
            end
        end
    end
end)

-- Export to allow other resources to set wanted level
exports('setWantedLevel', function(level)
    local clampedLevel = math.max(0, math.min(5, level or 0))
    SendNUI('updateUtility', { wantedLevel = clampedLevel })
end)

-- Export to manually update FPS (if you want custom FPS calculation)
exports('setFps', function(fps)
    SendNUI('updateUtility', { fps = fps })
end)

-- Export to manually update Ping
exports('setPing', function(ping)
    SendNUI('updateUtility', { ping = ping })
end)
