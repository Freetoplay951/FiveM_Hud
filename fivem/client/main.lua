-- Main HUD Client Script
-- Handles HUD visibility, framework detection, and core functionality

-- ============================================================================
-- VARIABLES
-- ============================================================================

local isHudVisible = true
local isEditMode = false
local Framework = nil
local FrameworkObject = nil
local VoiceResource = nil
local isPlayerLoaded = false
local isNuiLoaded = false

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Prüft ob eine Resource gestartet ist
local function IsResourceStarted(resourceName)
    local state = GetResourceState(resourceName)
    return state == 'started' or state == 'starting'
end

-- NUI Message senden
function SendNUI(action, data)
    SendNUIMessage({
        action = action,
        data = data
    })
end

-- ============================================================================
-- FRAMEWORK DETECTION
-- ============================================================================

local function DetectFramework()
    if Config.Framework == 'auto' then
        if IsResourceStarted('es_extended') then
            Framework = 'esx'
            -- ESX Object holen
            while FrameworkObject == nil do
                TriggerEvent('esx:getSharedObject', function(obj) FrameworkObject = obj end)
                if FrameworkObject == nil then
                    FrameworkObject = exports['es_extended']:getSharedObject()
                end
                Wait(100)
            end
        elseif IsResourceStarted('qb-core') then
            Framework = 'qb'
            FrameworkObject = exports['qb-core']:GetCoreObject()
        end
    elseif Config.Framework == 'esx' then
        Framework = 'esx'
        while FrameworkObject == nil do
            TriggerEvent('esx:getSharedObject', function(obj) FrameworkObject = obj end)
            if FrameworkObject == nil then
                FrameworkObject = exports['es_extended']:getSharedObject()
            end
            Wait(100)
        end
    elseif Config.Framework == 'qb' then
        Framework = 'qb'
        FrameworkObject = exports['qb-core']:GetCoreObject()
    end
    
    if Config.Debug then
        print('[HUD] Framework detected: ' .. (Framework or 'none'))
    end
end

-- Voice Resource erkennen
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
        end
    elseif Config.VoiceResource ~= 'none' and IsResourceStarted(Config.VoiceResource) then
        VoiceResource = Config.VoiceResource
    end
    
    -- Voice Widget aktivieren/deaktivieren basierend auf erkanntem System
    SendNUI('setVoiceEnabled', VoiceResource ~= nil)
    
    if Config.Debug then
        print('[HUD] Voice resource detected: ' .. (VoiceResource or 'none'))
        if not VoiceResource then
            print('[HUD] Voice widget disabled - no voice system found')
        end
    end
end

-- ============================================================================
-- HUD VISIBILITY
-- ============================================================================

function SetHudVisible(visible)
    isHudVisible = visible
    SendNUI('setVisible', visible)
end

-- ============================================================================
-- INITIALIZATION
-- ============================================================================

-- Initiale Daten an NUI senden
local function SendInitialData()
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)
    
    -- Status
    local health = GetEntityHealth(ped)
    local maxHealth = GetEntityMaxHealth(ped)
    local healthPercent = math.floor(((health - 100) / (maxHealth - 100)) * 100)
    
    SendNUI('updateHud', {
        health = math.max(0, math.min(100, healthPercent)),
        armor = GetPedArmour(ped),
        hunger = 100,
        thirst = 100,
        stamina = 100,
        stress = 0,
        oxygen = 100
    })
    
    -- Location
    local streetHash, crossingHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local streetName = GetStreetNameFromHashKey(streetHash)
    local zone = GetNameOfZone(coords.x, coords.y, coords.z)
    local zoneName = GetLabelText(zone)
    
    SendNUI('updateLocation', {
        street = streetName,
        area = zoneName ~= "NULL" and zoneName or zone,
        heading = heading
    })
    
    -- Voice Initial
    SendNUI('updateVoice', {
        active = false,
        range = 'normal'
    })
    
    -- Player Info Initial (Server ID)
    local serverId = GetPlayerServerId(PlayerId())
    SendNUI('updatePlayer', {
        id = serverId,
        job = 'Arbeitslos',
        rank = ''
    })
    
    -- Money Initial (defaults, will be updated by framework)
    SendNUI('updateMoney', {
        cash = 0,
        bank = 0,
        blackMoney = 0
    })
    
    -- HUD anzeigen
    SetHudVisible(true)
    
    if Config.Debug then
        print('[HUD] Initial data sent to NUI')
    end
end

-- NUI Callback: NUI hat geladen
RegisterNUICallback('loadedNUI', function(data, cb)
    isNuiLoaded = true
    
    if Config.Debug then
        print('[HUD] NUI loaded callback received')
    end
    
    -- Framework und Voice erkennen (falls noch nicht geschehen)
    if not Framework then
        DetectFramework()
    end
    if not VoiceResource then
        DetectVoiceResource()
    end
    
    -- Initiale Daten senden
    SendInitialData()
    isPlayerLoaded = true
    
    cb('ok')
end)

-- ESX Player Loaded Event
if IsResourceStarted('es_extended') then
    RegisterNetEvent('esx:playerLoaded', function(xPlayer)
        isPlayerLoaded = true
        if Config.Debug then
            print('[HUD] ESX Player loaded')
        end
    end)
end

-- QB-Core Player Loaded Event
if IsResourceStarted('qb-core') then
    RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
        isPlayerLoaded = true
        if Config.Debug then
            print('[HUD] QBCore Player loaded')
        end
    end)
end

-- ============================================================================
-- EDIT MODE
-- ============================================================================

RegisterCommand('hudedit', function()
    isEditMode = not isEditMode
    SetNuiFocus(isEditMode, isEditMode)
    SendNUI('toggleEditMode', isEditMode)
    
    if Config.Debug then
        print('[HUD] Edit mode: ' .. tostring(isEditMode))
    end
end, false)

-- Key Mapping für Edit Mode
RegisterKeyMapping('hudedit', 'HUD Edit Mode', 'keyboard', Config.EditModeKey or 'F7')

-- NUI Callback: Edit Mode schließen
RegisterNUICallback('closeEditMode', function(data, cb)
    if Config.Debug then
        print('[HUD DEBUG] closeEditMode callback received from Web')
    end
    isEditMode = false
    SetNuiFocus(false, false)
    cb({ success = true })
end)

-- NUI Callback: Layout speichern
RegisterNUICallback('saveLayout', function(data, cb)
    if Config.Debug then
        print('[HUD DEBUG] saveLayout callback received from Web')
        print('[HUD DEBUG] Layout data: ' .. json.encode(data))
    end
    -- Layout wird im Browser localStorage gespeichert
    -- Optional: Server-seitige Speicherung hier implementieren
    cb({ success = true })
end)

-- NUI Callback: Pong (Debug response from Web)
RegisterNUICallback('pong', function(data, cb)
    if Config.Debug then
        print('[HUD DEBUG] Web -> Lua pong received')
    end
    cb({ success = true })
end)

-- ============================================================================
-- MONEY UPDATES
-- ============================================================================

local function GetPlayerMoney()
    if not isPlayerLoaded then return nil end
    
    if Framework == 'esx' and FrameworkObject then
        local playerData = FrameworkObject.GetPlayerData()
        if playerData and playerData.accounts then
            local cash = 0
            local bank = 0
            local black = 0
            
            for _, account in ipairs(playerData.accounts) do
                if account.name == 'money' then
                    cash = account.money
                elseif account.name == 'bank' then
                    bank = account.money
                elseif account.name == 'black_money' then
                    black = account.money
                end
            end
            
            return { cash = cash, bank = bank, blackMoney = black }
        end
    elseif Framework == 'qb' and FrameworkObject then
        local PlayerData = FrameworkObject.Functions.GetPlayerData()
        if PlayerData and PlayerData.money then
            return {
                cash = PlayerData.money.cash or 0,
                bank = PlayerData.money.bank or 0,
                blackMoney = PlayerData.money.crypto or 0
            }
        end
    end
    
    return nil
end

-- Geld Update Loop
CreateThread(function()
    while true do
        Wait(Config.StatusUpdateInterval or 500)
        
        if isHudVisible and isPlayerLoaded and Framework then
            local money = GetPlayerMoney()
            if money then
                SendNUI('updateMoney', money)
            end
        end
    end
end)

-- ============================================================================
-- LOCATION UPDATES
-- ============================================================================

CreateThread(function()
    while true do
        Wait(Config.LocationUpdateInterval or 1000)
        
        if isHudVisible then
            local ped = PlayerPedId()
            local coords = GetEntityCoords(ped)
            local heading = GetEntityHeading(ped)
            
            local streetHash, crossingHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
            local streetName = GetStreetNameFromHashKey(streetHash)
            local crossingName = GetStreetNameFromHashKey(crossingHash)
            
            local zone = GetNameOfZone(coords.x, coords.y, coords.z)
            local zoneName = GetLabelText(zone)
            
            SendNUI('updateLocation', {
                street = streetName,
                crossing = crossingName ~= '' and crossingName or nil,
                area = zoneName ~= "NULL" and zoneName or zone,
                heading = heading
            })
        end
    end
end)

-- ============================================================================
-- VOICE UPDATES
-- ============================================================================

CreateThread(function()
    -- Warten bis Voice Resource erkannt
    Wait(2000)
    
    while true do
        Wait(200)
        
        if isHudVisible then
            local isTalking = NetworkIsPlayerTalking(PlayerId())
            local voiceRange = 'normal' -- Unified type: whisper, normal, shout, megaphone
            
            if VoiceResource == 'pma-voice' then
                -- pma-voice Mode holen
                local success, mode = pcall(function()
                    return exports['pma-voice']:getVoiceMode()
                end)
                
                if success and mode then
                    if mode == 1 then
                        voiceRange = 'whisper'
                    elseif mode == 2 then
                        voiceRange = 'normal'
                    elseif mode == 3 then
                        voiceRange = 'shout'
                    end
                end
            elseif VoiceResource == 'saltychat' then
                -- SaltyChat Voice Range
                local success, range = pcall(function()
                    return exports['saltychat']:GetVoiceRange()
                end)
                if success and range then
                    if range == 1 or range == "1" then
                        voiceRange = 'whisper'
                    elseif range == 2 or range == "2" then
                        voiceRange = 'normal'
                    elseif range == 3 or range == "3" then
                        voiceRange = 'shout'
                    end
                end
                
                -- Check for megaphone
                local megaSuccess, isMegaphone = pcall(function()
                    return exports['saltychat']:GetRadioChannel() ~= ""
                end)
                if megaSuccess and isMegaphone then
                    voiceRange = 'megaphone'
                end
            elseif VoiceResource == 'mumble-voip' then
                local success, mode = pcall(function()
                    return exports['mumble-voip']:GetVoiceMode()
                end)
                if success and mode then
                    if mode == 1 then
                        voiceRange = 'whisper'
                    elseif mode == 2 then
                        voiceRange = 'normal'
                    elseif mode == 3 then
                        voiceRange = 'shout'
                    end
                end
            elseif VoiceResource == 'tokovoip' then
                local success, range = pcall(function()
                    return exports['tokovoip_script']:getCurrentProximity()
                end)
                if success and range then
                    if range == "short" then
                        voiceRange = 'whisper'
                    elseif range == "medium" then
                        voiceRange = 'normal'
                    elseif range == "long" then
                        voiceRange = 'shout'
                    end
                end
            end
            
            SendNUI('updateVoice', {
                active = isTalking,
                range = voiceRange
            })
        end
    end
end)

-- ============================================================================
-- PLAYER INFO UPDATES
-- ============================================================================

local function GetPlayerInfo()
    if not isPlayerLoaded then return nil end
    
    local serverId = GetPlayerServerId(PlayerId())
    
    if Framework == 'esx' and FrameworkObject then
        local playerData = FrameworkObject.GetPlayerData()
        if playerData then
            return {
                id = serverId,
                job = playerData.job and playerData.job.label or 'Arbeitslos',
                rank = playerData.job and playerData.job.grade_label or ''
            }
        end
    elseif Framework == 'qb' and FrameworkObject then
        local PlayerData = FrameworkObject.Functions.GetPlayerData()
        if PlayerData then
            return {
                id = serverId,
                job = PlayerData.job and PlayerData.job.label or 'Arbeitslos',
                rank = PlayerData.job and PlayerData.job.grade and PlayerData.job.grade.name or ''
            }
        end
    end
    
    return { id = serverId, job = 'Arbeitslos', rank = '' }
end

CreateThread(function()
    while true do
        Wait(5000)
        
        if isHudVisible and isPlayerLoaded and Framework then
            local playerInfo = GetPlayerInfo()
            if playerInfo then
                SendNUI('updatePlayer', playerInfo)
            end
        end
    end
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports('showHud', function()
    SetHudVisible(true)
end)

exports('hideHud', function()
    SetHudVisible(false)
end)

exports('toggleHud', function()
    isHudVisible = not isHudVisible
    SetHudVisible(isHudVisible)
    return isHudVisible
end)

exports('isHudVisible', function()
    return isHudVisible
end)

exports('isEditMode', function()
    return isEditMode
end)

exports('getFramework', function()
    return Framework
end)

exports('getVoiceResource', function()
    return VoiceResource
end)

-- ============================================================================
-- EVENTS
-- ============================================================================

-- HUD ein/ausblenden über Event
RegisterNetEvent('hud:toggle', function(visible)
    if visible ~= nil then
        SetHudVisible(visible)
    else
        exports[GetCurrentResourceName()]:toggleHud()
    end
end)

-- Edit Mode über Event
RegisterNetEvent('hud:editMode', function(enabled)
    isEditMode = enabled
    SetNuiFocus(isEditMode, isEditMode)
    SendNUI('toggleEditMode', isEditMode)
end)

-- ============================================================================
-- COMMANDS (Debug)
-- ============================================================================

if Config.Debug then
    RegisterCommand('hud_toggle', function()
        local visible = exports[GetCurrentResourceName()]:toggleHud()
        print('[HUD] Visible: ' .. tostring(visible))
    end, false)
    
    RegisterCommand('hud_info', function()
        print('[HUD] Framework: ' .. (Framework or 'none'))
        print('[HUD] Voice: ' .. (VoiceResource or 'none'))
        print('[HUD] Visible: ' .. tostring(isHudVisible))
        print('[HUD] Player Loaded: ' .. tostring(isPlayerLoaded))
    end, false)
end
