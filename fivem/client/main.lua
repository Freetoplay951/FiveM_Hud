local isHudVisible = true
local isEditMode = false
local Framework = nil
local VoiceResource = nil

-- Resource Detection Helper
function IsResourceStarted(resourceName)
    local state = GetResourceState(resourceName)
    return state == 'started' or state == 'starting'
end

-- Framework Detection
CreateThread(function()
    if Config.Framework == 'auto' then
        if IsResourceStarted('es_extended') then
            Framework = 'esx'
            ESX = exports['es_extended']:getSharedObject()
        elseif IsResourceStarted('qb-core') then
            Framework = 'qb'
            QBCore = exports['qb-core']:GetCoreObject()
        end
    elseif Config.Framework == 'esx' then
        Framework = 'esx'
        ESX = exports['es_extended']:getSharedObject()
    elseif Config.Framework == 'qb' then
        Framework = 'qb'
        QBCore = exports['qb-core']:GetCoreObject()
    end
    
    if Config.Debug then
        print('[HUD] Framework detected: ' .. (Framework or 'none'))
    end
end)

-- Voice Resource Detection
CreateThread(function()
    if Config.VoiceResource == 'auto' then
        if IsResourceStarted('pma-voice') then
            VoiceResource = 'pma-voice'
        elseif IsResourceStarted('saltychat') then
            VoiceResource = 'saltychat'
        elseif IsResourceStarted('mumble-voip') then
            VoiceResource = 'mumble-voip'
        end
    elseif Config.VoiceResource ~= 'none' and IsResourceStarted(Config.VoiceResource) then
        VoiceResource = Config.VoiceResource
    end
    
    if Config.Debug then
        print('[HUD] Voice resource detected: ' .. (VoiceResource or 'none'))
    end
end)

-- NUI senden
function SendNUI(action, data)
    SendNUIMessage({
        action = action,
        data = data
    })
end

-- HUD ein/ausblenden
function SetHudVisible(visible)
    isHudVisible = visible
    SendNUIMessage({
        action = 'setVisible',
        data = visible
    })
end

-- Initiale HUD Anzeige beim Ressourcenstart
CreateThread(function()
    -- Kurz warten bis NUI geladen ist
    Wait(500)
    
    -- HUD standardmäßig anzeigen
    SetHudVisible(true)
    
    -- Initiale Daten senden
    local playerPed = PlayerPedId()
    local coords = GetEntityCoords(playerPed)
    local heading = GetEntityHeading(playerPed)
    
    -- Initiale Status-Werte
    SendNUI('updateHud', {
        health = GetEntityHealth(playerPed) - 100,
        armor = GetPedArmour(playerPed),
        hunger = 100,
        thirst = 100,
        stamina = 100,
        stress = 0,
        oxygen = 100
    })
    
    -- Initiale Location
    local streetHash, crossingHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local streetName = GetStreetNameFromHashKey(streetHash)
    local zone = GetNameOfZone(coords.x, coords.y, coords.z)
    local zoneName = GetLabelText(zone)
    
    SendNUI('updateLocation', {
        street = streetName,
        area = zoneName,
        heading = heading
    })
    
    -- Initiale Voice
    SendNUI('updateVoice', {
        active = false,
        range = 'normal'
    })
    
    if Config.Debug then
        print('[HUD] Initial data sent')
    end
end)

-- Edit Mode Toggle
RegisterCommand('hudedit', function()
    isEditMode = not isEditMode
    SetNuiFocus(isEditMode, isEditMode)
    SendNUI('toggleEditMode', isEditMode)
end, false)

RegisterKeyMapping('hudedit', 'HUD Edit Mode', 'keyboard', Config.EditModeKey)

-- NUI Callbacks
RegisterNUICallback('closeEditMode', function(data, cb)
    isEditMode = false
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('saveLayout', function(data, cb)
    -- Layout wird im Browser gespeichert (localStorage)
    -- Optional: Hier zum Server senden für persistente Speicherung
    if Config.Debug then
        print('[HUD] Layout saved')
    end
    cb('ok')
end)

-- Geld Updates
CreateThread(function()
    while true do
        Wait(Config.StatusUpdateInterval)
        
        if isHudVisible and Framework then
            local money = GetPlayerMoney()
            if money then
                SendNUI('updateMoney', money)
            end
        end
    end
end)

function GetPlayerMoney()
    if Framework == 'esx' then
        local playerData = ESX.GetPlayerData()
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
            
            return {
                cash = cash,
                bank = bank,
                blackMoney = black
            }
        end
    elseif Framework == 'qb' then
        local PlayerData = QBCore.Functions.GetPlayerData()
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

-- Location Updates
CreateThread(function()
    while true do
        Wait(Config.LocationUpdateInterval)
        
        if isHudVisible then
            local playerPed = PlayerPedId()
            local coords = GetEntityCoords(playerPed)
            local heading = GetEntityHeading(playerPed)
            
            local streetHash, crossingHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
            local streetName = GetStreetNameFromHashKey(streetHash)
            local crossingName = GetStreetNameFromHashKey(crossingHash)
            
            local zone = GetNameOfZone(coords.x, coords.y, coords.z)
            local zoneName = GetLabelText(zone)
            
            SendNUI('updateLocation', {
                street = streetName,
                crossing = crossingName ~= '' and crossingName or nil,
                area = zoneName,
                heading = heading
            })
        end
    end
end)

-- Voice Updates (dynamisch basierend auf erkannter Voice Resource)
CreateThread(function()
    -- Warten bis Voice Resource erkannt wurde
    Wait(2000)
    
    while true do
        Wait(200)
        
        if isHudVisible and VoiceResource then
            local talking = false
            local range = 'normal'
            
            if VoiceResource == 'pma-voice' then
                -- pma-voice verwendet NetworkIsPlayerTalking
                talking = NetworkIsPlayerTalking(PlayerId())
                
                -- Voice Mode über Export holen (falls verfügbar)
                local success, mode = pcall(function()
                    return exports['pma-voice']:getVoiceMode()
                end)
                
                if success and mode then
                    if mode == 1 then
                        range = 'whisper'
                    elseif mode == 3 then
                        range = 'shout'
                    end
                end
                
            elseif VoiceResource == 'saltychat' then
                talking = NetworkIsPlayerTalking(PlayerId())
                -- SaltyChat hat andere Voice Modes
                
            elseif VoiceResource == 'mumble-voip' then
                talking = NetworkIsPlayerTalking(PlayerId())
            end
            
            SendNUI('updateVoice', {
                active = talking,
                range = range
            })
        elseif isHudVisible and not VoiceResource then
            -- Kein Voice Resource, aber trotzdem Talking-Status senden
            SendNUI('updateVoice', {
                active = NetworkIsPlayerTalking(PlayerId()),
                range = 'normal'
            })
        end
    end
end)

-- Player Info Updates
CreateThread(function()
    while true do
        Wait(5000)
        
        if isHudVisible and Framework then
            local playerInfo = GetPlayerInfo()
            if playerInfo then
                SendNUI('updatePlayer', playerInfo)
            end
        end
    end
end)

function GetPlayerInfo()
    if Framework == 'esx' then
        local playerData = ESX.GetPlayerData()
        if playerData then
            return {
                id = GetPlayerServerId(PlayerId()),
                job = playerData.job and playerData.job.label or 'Arbeitslos',
                rank = playerData.job and playerData.job.grade_label or ''
            }
        end
    elseif Framework == 'qb' then
        local PlayerData = QBCore.Functions.GetPlayerData()
        if PlayerData then
            return {
                id = GetPlayerServerId(PlayerId()),
                job = PlayerData.job and PlayerData.job.label or 'Arbeitslos',
                rank = PlayerData.job and PlayerData.job.grade and PlayerData.job.grade.name or ''
            }
        end
    end
    
    return {
        id = GetPlayerServerId(PlayerId()),
        job = 'Arbeitslos',
        rank = ''
    }
end

-- Exports für andere Resourcen
exports('showHud', function()
    SetHudVisible(true)
end)

exports('hideHud', function()
    SetHudVisible(false)
end)

exports('isHudVisible', function()
    return isHudVisible
end)
