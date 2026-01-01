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
    end
    
    if Config and Config.Debug then
        print('[HUD Radio] Voice resource: ' .. (VoiceResource or 'none'))
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
