-- ============================================================================
-- VOICE SYSTEM
-- Handles voice detection, mute states, and range updates for all voice systems
-- Supports: pma-voice, saltychat, mumble-voip, tokovoip, yaca-voice
-- ============================================================================

local VoiceResource = nil
local lastVoiceData = {
    active = nil,
    range = nil,
    isMuted = nil
}

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

local function IsResourceStarted(resourceName)
    local state = GetResourceState(resourceName)
    return state == 'started' or state == 'starting'
end

-- ============================================================================
-- VOICE RESOURCE DETECTION
-- ============================================================================

local function DetectVoiceResource()
    if Config.VoiceResource == 'auto' then
        if IsResourceStarted('pma-voice') then
            VoiceResource = 'pma-voice'
        elseif IsResourceStarted('saltychat') then
            VoiceResource = 'saltychat'
        elseif IsResourceStarted('mumble-voip') then
            VoiceResource = 'mumble-voip'
        elseif IsResourceStarted('tokovoip') then
            VoiceResource = 'tokovoip'
        elseif IsResourceStarted('yaca-voice') then
            VoiceResource = 'yaca-voice'
        end
    elseif Config.VoiceResource ~= 'none' and IsResourceStarted(Config.VoiceResource) then
        VoiceResource = Config.VoiceResource
    end
    
    -- Voice Widget aktivieren/deaktivieren basierend auf erkanntem System
    SendNUI('setVoiceEnabled', VoiceResource ~= nil)
    
    if Config.Debug then
        print('[HUD Voice] Voice resource detected: ' .. (VoiceResource or 'none'))
        if not VoiceResource then
            print('[HUD Voice] Voice widget disabled - no voice system found')
        end
    end
    
    return VoiceResource
end

-- ============================================================================
-- MUTE DETECTION FUNCTIONS
-- ============================================================================

local function GetPmaVoiceMuted()
    -- pma-voice uses mumble internally
    local success, isMuted = pcall(function()
        return exports['pma-voice']:isMuted()
    end)
    if success then
        return isMuted == true
    end
    
    -- Fallback: check MumbleIsPlayerMuted native
    local playerServerId = GetPlayerServerId(PlayerId())
    local success2, muted = pcall(function()
        return MumbleIsPlayerMuted(playerServerId)
    end)
    if success2 then
        return muted == true
    end
    
    return false
end

local function GetSaltyChatMuted()
    local success, isMuted = pcall(function()
        return exports['saltychat']:GetPluginState() == "disabled" or exports['saltychat']:GetMicrophoneMuted()
    end)
    if success then
        return isMuted == true
    end
    
    local success2, micMuted = pcall(function()
        return exports['saltychat']:IsMicrophoneMuted()
    end)
    if success2 then
        return micMuted == true
    end
    
    return false
end

local function GetMumbleVoipMuted()
    local success, isMuted = pcall(function()
        return exports['mumble-voip']:isMuted()
    end)
    if success then
        return isMuted == true
    end
    
    local playerServerId = GetPlayerServerId(PlayerId())
    local success2, muted = pcall(function()
        return MumbleIsPlayerMuted(playerServerId)
    end)
    if success2 then
        return muted == true
    end
    
    return false
end

local function GetTokoVoipMuted()
    local success, isMuted = pcall(function()
        return exports['tokovoip_script']:isMuted()
    end)
    if success then
        return isMuted == true
    end
    
    return false
end

local function GetYacaVoiceMuted()
    return lastVoiceData.isMuted or false
end

-- Get mute state based on detected voice resource
local function GetVoiceMuted()
    if VoiceResource == 'pma-voice' then
        return GetPmaVoiceMuted()
    elseif VoiceResource == 'saltychat' then
        return GetSaltyChatMuted()
    elseif VoiceResource == 'mumble-voip' then
        return GetMumbleVoipMuted()
    elseif VoiceResource == 'tokovoip' then
        return GetTokoVoipMuted()
    elseif VoiceResource == 'yaca-voice' then
        return GetYacaVoiceMuted()
    end
    return false
end

-- ============================================================================
-- UI UPDATE FUNCTION
-- ============================================================================

local function UpdateVoiceUI()
    SendNUI('updateVoice', {
        active = lastVoiceData.active or false,
        range = lastVoiceData.range or VoiceRange.NORMAL,
        isMuted = lastVoiceData.isMuted or false
    })
end

-- ============================================================================
-- YACA-VOICE EVENT HANDLERS
-- ============================================================================

local function SetupYacaVoice()
    if VoiceResource ~= 'yaca-voice' then return end
    
    if Config.Debug then
        print('[HUD Voice] Setting up YaCA-Voice event handlers')
    end
    
    RegisterNetEvent('yaca:external:pluginStateChanged', function(state)
        -- state: CONNECTED, NOT_CONNECTED, WRONG_TS_SERVER
        if Config.Debug then
            print('[HUD Voice] YaCA plugin state: ' .. tostring(state))
        end
        
        if state == "CONNECTED" then
            SendNUI('setVoiceEnabled', true)
        else
            SendNUI('setVoiceEnabled', false)
        end
    end)
    
    RegisterNetEvent('yaca:external:voiceRangeUpdate', function(range)
        -- range: number (1, 2, 3, etc.)
        if Config.Debug then
            print('[HUD Voice] YaCA voice range: ' .. tostring(range))
        end
        
        -- Map numeric range to VoiceRange enum
        local rangeMap = {
            [1] = VoiceRange.WHISPER,
            [2] = VoiceRange.NORMAL,
            [3] = VoiceRange.SHOUT
        }
        
        lastVoiceData.range = rangeMap[range] or VoiceRange.NORMAL
        UpdateVoiceUI()
    end)
    
    RegisterNetEvent('yaca:external:isTalking', function(isTalking)
        if Config.Debug then
            print('[HUD Voice] YaCA isTalking: ' .. tostring(isTalking))
        end
        
        lastVoiceData.active = isTalking
        UpdateVoiceUI()
    end)
    
    RegisterNetEvent('yaca:external:microphoneMuteStateChanged', function(isMuted)
        if Config.Debug then
            print('[HUD Voice] YaCA mic muted: ' .. tostring(isMuted))
        end
        
        lastVoiceData.isMuted = isMuted
        UpdateVoiceUI()
    end)
    
    RegisterNetEvent('yaca:external:isRadioTalking', function(isTalking, channel)
        if Config.Debug then
            print('[HUD Voice] YaCA radio talking: ' .. tostring(isTalking) .. ' on channel ' .. tostring(channel))
        end
        
        -- Could be used for radio UI updates
    end)
    
    RegisterNetEvent('yaca:external:isRadioReceiving', function(isReceiving, channel, members)
        if Config.Debug then
            print('[HUD Voice] YaCA radio receiving: ' .. tostring(isReceiving) .. ' on channel ' .. tostring(channel))
        end
        
        -- Could be used for radio UI updates
    end)
end

-- ============================================================================
-- VOICE UPDATE LOOP (für polling-basierte Systeme)
-- ============================================================================

CreateThread(function()
    -- Warten bis Voice Resource erkannt
    Wait(2000)
    
    while true do
        Wait(200)
        
        -- Skip loop for YaCA as it uses events
        if VoiceResource == 'yaca-voice' then
            Wait(5000)
        else
            local isHudVisible = exports[GetCurrentResourceName()]:isHudVisible()
            
            if isHudVisible and VoiceResource then
                local isTalking = NetworkIsPlayerTalking(PlayerId())
                local voiceRange = VoiceRange.NORMAL
                local isMuted = GetVoiceMuted()
                
                if VoiceResource == 'pma-voice' then
                    -- pma-voice Mode holen
                    local success, mode = pcall(function()
                        return exports['pma-voice']:getVoiceMode()
                    end)
                    
                    if success and mode then
                        if mode == 1 then
                            voiceRange = VoiceRange.WHISPER
                        elseif mode == 2 then
                            voiceRange = VoiceRange.NORMAL
                        elseif mode == 3 then
                            voiceRange = VoiceRange.SHOUT
                        end
                    end
                elseif VoiceResource == 'saltychat' then
                    -- SaltyChat Voice Range
                    local success, range = pcall(function()
                        return exports['saltychat']:GetVoiceRange()
                    end)
                    if success and range then
                        if range == 1 or range == "1" then
                            voiceRange = VoiceRange.WHISPER
                        elseif range == 2 or range == "2" then
                            voiceRange = VoiceRange.NORMAL
                        elseif range == 3 or range == "3" then
                            voiceRange = VoiceRange.SHOUT
                        end
                    end
                    
                    -- Check for megaphone
                    local megaSuccess, isMegaphone = pcall(function()
                        return exports['saltychat']:GetRadioChannel() ~= ""
                    end)
                    if megaSuccess and isMegaphone then
                        voiceRange = VoiceRange.MEGAPHONE
                    end
                elseif VoiceResource == 'mumble-voip' then
                    local success, mode = pcall(function()
                        return exports['mumble-voip']:GetVoiceMode()
                    end)
                    if success and mode then
                        if mode == 1 then
                            voiceRange = VoiceRange.WHISPER
                        elseif mode == 2 then
                            voiceRange = VoiceRange.NORMAL
                        elseif mode == 3 then
                            voiceRange = VoiceRange.SHOUT
                        end
                    end
                elseif VoiceResource == 'tokovoip' then
                    local success, range = pcall(function()
                        return exports['tokovoip_script']:getCurrentProximity()
                    end)
                    if success and range then
                        if range == "short" then
                            voiceRange = VoiceRange.WHISPER
                        elseif range == "medium" then
                            voiceRange = VoiceRange.NORMAL
                        elseif range == "long" then
                            voiceRange = VoiceRange.SHOUT
                        end
                    end
                end
                
                -- Only send if something changed
                if isTalking ~= lastVoiceData.active or voiceRange ~= lastVoiceData.range or isMuted ~= lastVoiceData.isMuted then
                    lastVoiceData.active = isTalking
                    lastVoiceData.range = voiceRange
                    lastVoiceData.isMuted = isMuted
                    
                    UpdateVoiceUI()
                end
            end
        end
    end
end)

-- ============================================================================
-- INITIALIZATION
-- ============================================================================

AddEventHandler('hud:registerHandlers', function()
    DetectVoiceResource()
    
    if VoiceResource == 'yaca-voice' then
        SetupYacaVoice()
    end
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports('getVoiceResource', function()
    return VoiceResource
end)

exports('isVoiceMuted', function()
    return lastVoiceData.isMuted or false
end)

-- ============================================================================
-- EVENTS
-- ============================================================================

RegisterNetEvent('hud:setVoiceMuted', function(muted)
    lastVoiceData.isMuted = muted
    UpdateVoiceUI()
end)

-- ============================================================================
-- DEBUG COMMANDS
-- ============================================================================

if Config.Debug then
    RegisterCommand('hud_voice_info', function()
        print('[HUD Voice] Voice Resource: ' .. (VoiceResource or 'none'))
        print('[HUD Voice] Active: ' .. tostring(lastVoiceData.active or false))
        print('[HUD Voice] Range: ' .. tostring(lastVoiceData.range or 'unknown'))
        print('[HUD Voice] Muted: ' .. tostring(lastVoiceData.isMuted or false))
    end, false)
    
    RegisterCommand('hud_mute', function()
        local currentMuted = lastVoiceData.isMuted or false
        exports[GetCurrentResourceName()]:setVoiceMuted(not currentMuted)
        print('[HUD Voice] Muted: ' .. tostring(not currentMuted))
    end, false)
end
