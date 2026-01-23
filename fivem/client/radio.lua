-- Radio Widget Client Script
-- Handles radio channel display and member list

-- ============================================================================
-- VARIABLES
-- ============================================================================

local radioActive = false
local radioChannel = ""
local radioMembers = {}
local VoiceResource = nil

-- ============================================================================
-- UTILITY
-- ============================================================================

local function IsResourceStarted(resourceName)
    local state = GetResourceState(resourceName)
    return state == 'started' or state == 'starting'
end

local function UpdateRadioUI()
    SendNUI("updateRadio", {
        active = radioActive,
        channel = radioChannel,
        members = radioMembers
    })
end

-- ============================================================================
-- VOICE RESOURCE DETECTION
-- ============================================================================

local function DetectVoiceResource()
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
    
    if Config and Config.Debug then
        print('[HUD Radio] Voice resource: ' .. (VoiceResource or 'none'))
    end
end

-- ============================================================================
-- HELPER FUNCTIONS FOR MEMBER MANAGEMENT
-- ============================================================================

local function AddOrUpdateMember(id, name, talking)
    for i, member in ipairs(radioMembers) do
        if member.id == id then
            radioMembers[i].talking = talking
            UpdateRadioUI()
            return
        end
    end
    table.insert(radioMembers, {
        id = id,
        name = name or ("Spieler " .. id),
        talking = talking
    })
    UpdateRadioUI()
end

local function UpdateMemberTalking(id, talking)
    for i, member in ipairs(radioMembers) do
        if member.id == id then
            radioMembers[i].talking = talking
            UpdateRadioUI()
            return
        end
    end
end

local function RemoveMemberById(id)
    for i, member in ipairs(radioMembers) do
        if member.id == id then
            table.remove(radioMembers, i)
            UpdateRadioUI()
            return
        end
    end
end

-- ============================================================================
-- PMA-VOICE INTEGRATION
-- ============================================================================

local function SetupPmaVoice()
    if VoiceResource ~= 'pma-voice' then return end
    
    -- Listen for radio state changes
    AddEventHandler('pma-voice:setTalkingOnRadio', function(isTalking)
        if isTalking then
            radioActive = true
        end
        UpdateRadioUI()
    end)
    
    AddEventHandler('pma-voice:radioActive', function(isActive)
        radioActive = isActive
        if not isActive then
            radioChannel = ""
            radioMembers = {}
        end
        UpdateRadioUI()
    end)
    
    -- Poll for radio channel
    CreateThread(function()
        while true do
            Wait(1000)
            
            if VoiceResource == 'pma-voice' then
                local success, channel = pcall(function()
                    return exports['pma-voice']:getRadioChannel()
                end)
                
                if success and channel and channel > 0 then
                    radioActive = true
                    radioChannel = "Kanal " .. tostring(channel)
                elseif success then
                    radioActive = false
                    radioChannel = ""
                    radioMembers = {}
                end
                
                UpdateRadioUI()
            end
        end
    end)
end

-- ============================================================================
-- SALTYCHAT INTEGRATION
-- ============================================================================

local function SetupSaltyChat()
    if VoiceResource ~= 'saltychat' then return end
    
    RegisterNetEvent('SaltyChat_RadioChannelChanged', function(channel, isPrimary)
        if channel and channel ~= "" then
            radioActive = true
            radioChannel = channel
        else
            radioActive = false
            radioChannel = ""
            radioMembers = {}
        end
        UpdateRadioUI()
    end)
    
    RegisterNetEvent('SaltyChat_RadioTrafficStateChanged', function(name, isSending, isPrimary, activeRelay)
        if isSending then
            -- Add or update member as talking
            local found = false
            for i, member in ipairs(radioMembers) do
                if member.name == name then
                    radioMembers[i].talking = true
                    found = true
                    break
                end
            end
            if not found then
                table.insert(radioMembers, {
                    id = #radioMembers + 1,
                    name = name,
                    talking = true
                })
            end
        else
            -- Set member as not talking
            for i, member in ipairs(radioMembers) do
                if member.name == name then
                    radioMembers[i].talking = false
                    break
                end
            end
        end
        UpdateRadioUI()
    end)
end

-- ============================================================================
-- YACA-VOICE INTEGRATION
-- ============================================================================

local function SetupYacaVoice()
    if VoiceResource ~= 'yaca-voice' then return end
    
    if Config and Config.Debug then
        print('[HUD Radio] Setting up YaCA-Voice radio event handlers')
    end
    
    -- Radio enabled/disabled
    RegisterNetEvent('yaca:external:isRadioEnabled', function(state)
        if Config and Config.Debug then
            print('[HUD Radio] YaCA radio enabled: ' .. tostring(state))
        end
        
        radioActive = state
        if not state then
            radioChannel = ""
            radioMembers = {}
        end
        UpdateRadioUI()
    end)
    
    -- Radio frequency changed
    RegisterNetEvent('yaca:external:setRadioFrequency', function(channel, frequency)
        if Config and Config.Debug then
            print('[HUD Radio] YaCA radio frequency: channel=' .. tostring(channel) .. ', freq=' .. tostring(frequency))
        end
        
        if frequency and frequency ~= "" and frequency ~= "0" then
            radioActive = true
            radioChannel = tostring(frequency)
        else
            radioActive = false
            radioChannel = ""
            radioMembers = {}
        end
        UpdateRadioUI()
    end)
    
    -- Local player talking on radio
    RegisterNetEvent('yaca:external:isRadioTalking', function(isTalking, channel)
        if Config and Config.Debug then
            print('[HUD Radio] YaCA radio talking: ' .. tostring(isTalking) .. ' on channel ' .. tostring(channel))
        end
        
        local localId = GetPlayerServerId(PlayerId())
        local localName = GetPlayerName(PlayerId())
        
        if isTalking then
            AddOrUpdateMember(localId, localName, true)
        else
            UpdateMemberTalking(localId, false)
        end
    end)
    
    -- Receiving radio from another player
    RegisterNetEvent('yaca:external:isRadioReceiving', function(isReceiving, channel, playerId)
        if Config and Config.Debug then
            print('[HUD Radio] YaCA radio receiving: ' .. tostring(isReceiving) .. ' from player ' .. tostring(playerId))
        end
        
        if isReceiving then
            local playerName = nil
            local player = GetPlayerFromServerId(playerId)
            if player and player ~= -1 then
                playerName = GetPlayerName(player)
            end
            AddOrUpdateMember(playerId, playerName, true)
        else
            UpdateMemberTalking(playerId, false)
        end
    end)
end

-- ============================================================================
-- INITIALIZATION
-- ============================================================================

AddEventHandler('onClientResourceStart', function(resourceName)
    if GetCurrentResourceName() ~= resourceName then return end
    
    Wait(2000) -- Wait for voice resources to load
    DetectVoiceResource()
    
    if VoiceResource == 'pma-voice' then
        SetupPmaVoice()
    elseif VoiceResource == 'saltychat' then
        SetupSaltyChat()
    elseif VoiceResource == 'yaca-voice' then
        SetupYacaVoice()
    end
end)

-- ============================================================================
-- MANUAL CONTROL (for custom radio systems)
-- ============================================================================

-- Set radio active state
RegisterNetEvent('hud:setRadioActive', function(active, channel)
    radioActive = active
    radioChannel = channel or ""
    if not active then
        radioMembers = {}
    end
    UpdateRadioUI()
end)

-- Add member to radio
RegisterNetEvent('hud:addRadioMember', function(id, name, avatar)
    local found = false
    for i, member in ipairs(radioMembers) do
        if member.id == id then
            found = true
            break
        end
    end
    if not found then
        table.insert(radioMembers, {
            id = id,
            name = name,
            avatar = avatar,
            talking = false
        })
        UpdateRadioUI()
    end
end)

-- Remove member from radio
RegisterNetEvent('hud:removeRadioMember', function(id)
    for i, member in ipairs(radioMembers) do
        if member.id == id then
            table.remove(radioMembers, i)
            break
        end
    end
    UpdateRadioUI()
end)

-- Set member talking state
RegisterNetEvent('hud:setRadioMemberTalking', function(id, isTalking)
    for i, member in ipairs(radioMembers) do
        if member.id == id then
            radioMembers[i].talking = isTalking
            break
        end
    end
    UpdateRadioUI()
end)

-- Clear all members
RegisterNetEvent('hud:clearRadioMembers', function()
    radioMembers = {}
    UpdateRadioUI()
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports('isRadioActive', function()
    return radioActive
end)

exports('getRadioChannel', function()
    return radioChannel
end)

exports('getRadioMembers', function()
    return radioMembers
end)

exports('setRadioActive', function(active, channel)
    radioActive = active
    radioChannel = channel or ""
    if not active then
        radioMembers = {}
    end
    UpdateRadioUI()
end)

exports('addRadioMember', function(id, name, avatar)
    local found = false
    for i, member in ipairs(radioMembers) do
        if member.id == id then
            found = true
            break
        end
    end
    if not found then
        table.insert(radioMembers, {
            id = id,
            name = name,
            avatar = avatar,
            talking = false
        })
        UpdateRadioUI()
    end
end)

exports('removeRadioMember', function(id)
    for i, member in ipairs(radioMembers) do
        if member.id == id then
            table.remove(radioMembers, i)
            break
        end
    end
    UpdateRadioUI()
end)

exports('setRadioMemberTalking', function(id, isTalking)
    for i, member in ipairs(radioMembers) do
        if member.id == id then
            radioMembers[i].talking = isTalking
            break
        end
    end
    UpdateRadioUI()
end)

exports('clearRadioMembers', function()
    radioMembers = {}
    UpdateRadioUI()
end)
