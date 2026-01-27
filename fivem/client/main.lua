-- Main HUD Client Script
-- Handles HUD visibility, framework detection, and core functionality

-- ============================================================================
-- VARIABLES
-- ============================================================================

local isHudVisible = true
local isEditMode = false
local Framework = nil
local FrameworkObject = nil
local isPlayerLoaded = false
local isNuiLoaded = false
local lastPauseState = false
local showHeading = true

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
    if Config.Framework == FrameworkType.AUTO then
        if IsResourceStarted('es_extended') then
            Framework = FrameworkType.ESX
            -- ESX Object holen
            while FrameworkObject == nil do
                TriggerEvent('esx:getSharedObject', function(obj) FrameworkObject = obj end)
                if FrameworkObject == nil then
                    FrameworkObject = exports['es_extended']:getSharedObject()
                end
                Wait(100)
            end
        elseif IsResourceStarted('qb-core') then
            Framework = FrameworkType.QB
            FrameworkObject = exports['qb-core']:GetCoreObject()
        end
    elseif Config.Framework == FrameworkType.ESX then
        Framework = FrameworkType.ESX
        while FrameworkObject == nil do
            TriggerEvent('esx:getSharedObject', function(obj) FrameworkObject = obj end)
            if FrameworkObject == nil then
                FrameworkObject = exports['es_extended']:getSharedObject()
            end
            Wait(100)
        end
    elseif Config.Framework == FrameworkType.QB then
        Framework = FrameworkType.QB
        FrameworkObject = exports['qb-core']:GetCoreObject()
    end
    
    if Config.Debug then
        print('[HUD Core] Framework detected: ' .. (Framework or 'none'))
    end
end

-- ============================================================================
-- PAUSE MENU DETECTION
-- ============================================================================

CreateThread(function()
    while true do
        Wait(200)
        
        local isPaused = IsPauseMenuActive()
        if isPaused ~= lastPauseState then
            lastPauseState = isPaused
            
            if isPaused then
                SendNUI('setVisible', false)
            else
                SendNUI('setVisible', isHudVisible)
            end
            
            if Config.Debug then
                print('[HUD Core] Pause menu: ' .. tostring(isPaused) .. ', HUD visible: ' .. tostring(not isPaused and isHudVisible))
            end
        end
    end
end)

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

local function SendInitialData()
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)
    
    -- Allow other resources to register their status handlers BEFORE we check support
    -- This event fires synchronously, so handlers registered here will be available
    TriggerEvent("hud:registerHandlers")
    
    -- Small wait to ensure all handlers are registered
    Wait(100)
    
    -- Merge Config.DisabledWidgets with unsupported status widgets
    local disabledWidgets = Config.DisabledWidgets or {}
    
    -- Get unsupported status widgets from status.lua
    local success, unsupportedWidgets = pcall(function()
        return exports[GetCurrentResourceName()]:getUnsupportedStatusWidgets()
    end)
    
    if success and unsupportedWidgets then
        for widgetId, disabled in pairs(unsupportedWidgets) do
            if disabled and disabledWidgets[widgetId] == nil then
                disabledWidgets[widgetId] = true
                if Config.Debug then
                    print('[HUD Core] Auto-disabled unsupported widget: ' .. widgetId)
                end
            end
        end
    end
    
    SendNUI('updateDisabledWidgets', disabledWidgets)
    
    SendNUI('updateUtility', {
        minimapOnlyInVehicle = Config.MinimapOnlyInVehicle,
        locationOnlyInVehicle = Config.LocationOnlyInVehicle
    })
    
    local streetHash, crossingHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local streetName = GetStreetNameFromHashKey(streetHash)
    local zone = GetNameOfZone(coords.x, coords.y, coords.z)
    local zoneName = GetLabelText(zone)
    SendNUI('updateLocation', {
        street = streetName,
        area = zoneName ~= "NULL" and zoneName or zone,
        heading = heading
    })
    
    SendNUI('updateVoice', {
        active = false,
        range = VoiceRange.NORMAL,
        isMuted = false
    })
    
    SendNUI('updatePlayer', {
        id = GetPlayerServerId(PlayerId()),
        job = 'Arbeitslos',
        rank = ''
    })
    
    SendNUI('updateMoney', {
        cash = 0,
        bank = 0,
        blackMoney = 0
    })
    
    -- Fire hud:loading event for utility data (server info, wanted)
    -- This ensures all data is sent BEFORE the HUD becomes visible
    TriggerEvent("hud:loading")
    
    -- Fire hud:loaded AFTER all initial setup
    TriggerEvent("hud:loaded")
    SetHudVisible(true)
    
    if Config.Debug then
        print('[HUD Core] Initial data sent to NUI')
    end
end

-- NUI Callback: NUI hat geladen
RegisterNUICallback('loadedNUI', function(data, cb)
    if GetResourceState('spawnmanager') == 'started' then
        if Config.Debug then
            print('[HUD Core] Disabled spawnmanager autorespawn')
        end
        exports['spawnmanager']:setAutoSpawn(false)
    end
    
    isNuiLoaded = true
    
    if Config.Debug then
        print('[HUD Core] NUI loaded callback received')
    end
    
    if not Framework then
        DetectFramework()
    end
    
    SendInitialData()
    isPlayerLoaded = true
    
    cb({ success = true })
end)

-- ESX Player Loaded Event
if IsResourceStarted('es_extended') then
    RegisterNetEvent('esx:playerLoaded', function(xPlayer)
        isPlayerLoaded = true
        if Config.Debug then
            print('[HUD Core] ESX player loaded')
        end
    end)
end

-- QB-Core Player Loaded Event
if IsResourceStarted('qb-core') then
    RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
        isPlayerLoaded = true
        if Config.Debug then
            print('[HUD Core] QBCore player loaded')
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
        print('[HUD Core] Edit mode: ' .. tostring(isEditMode))
    end
end, false)

-- Key Mapping für Edit Mode
RegisterKeyMapping('hudedit', 'HUD Edit Mode', 'keyboard', Config.EditModeKey or 'F7')

-- NUI Callback: Edit Mode schließen
RegisterNUICallback('closeEditMode', function(data, cb)
    if Config.Debug then
        print('[HUD Core] closeEditMode callback received')
    end
    isEditMode = false
    SetNuiFocus(false, false)
    cb({ success = true })
end)

-- NUI Callback: Layout speichern
RegisterNUICallback('saveLayout', function(data, cb)
    if Config.Debug then
        print('[HUD Core] saveLayout callback received')
        print('[HUD Core] Layout data: ' .. json.encode(data))
    end
    -- Layout is saved in browser localStorage
    -- Optional: Implement server-side storage here
    cb({ success = true })
end)

-- NUI Callback: Pong (Debug response from Web)
RegisterNUICallback('pong', function(data, cb)
    if Config.Debug then
        print('[HUD Core] Pong received from Web')
    end
    cb({ success = true })
end)

-- ============================================================================
-- MONEY UPDATES
-- ============================================================================

local function GetPlayerMoney()
    if not isPlayerLoaded then return nil end
    
    if Framework == FrameworkType.ESX and FrameworkObject then
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
    elseif Framework == FrameworkType.QB and FrameworkObject then
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

-- Geld Update Loop (with change detection)
local lastMoneyData = {
    cash = nil,
    bank = nil,
    blackMoney = nil
}

CreateThread(function()
    while true do
        Wait(Config.StatusUpdateInterval or 500)
        
        if isHudVisible and isPlayerLoaded and Framework then
            local money = GetPlayerMoney()
            if money then
                -- Only send if something changed
                if money.cash ~= lastMoneyData.cash or 
                   money.bank ~= lastMoneyData.bank or 
                   money.blackMoney ~= lastMoneyData.blackMoney then
                    lastMoneyData.cash = money.cash
                    lastMoneyData.bank = money.bank
                    lastMoneyData.blackMoney = money.blackMoney
                    SendNUI('updateMoney', money)
                end
            end
        end
    end
end)

-- ============================================================================
-- LOCATION UPDATES (with change detection)
-- ============================================================================

local lastLocationData = {
    street = nil,
    crossing = nil,
    area = nil,
    heading = nil
}

CreateThread(function()
    while true do
        Wait(Config.LocationUpdateInterval or 1000)
        
        if isHudVisible then
            local ped = PlayerPedId()
            local coords = GetEntityCoords(ped)
            local heading = math.floor(GetEntityHeading(ped))
            
            local streetHash, crossingHash = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
            local streetName = GetStreetNameFromHashKey(streetHash)
            local crossingName = GetStreetNameFromHashKey(crossingHash)
            if crossingName == '' then crossingName = nil end
            
            local zone = GetNameOfZone(coords.x, coords.y, coords.z)
            local zoneName = GetLabelText(zone)
            local area = zoneName ~= "NULL" and zoneName or zone
            
            -- Check if anything changed (heading tolerance of 2 degrees)
            local headingChanged = lastLocationData.heading == nil or math.abs(heading - lastLocationData.heading) >= 2
            local streetChanged = streetName ~= lastLocationData.street
            local crossingChanged = crossingName ~= lastLocationData.crossing
            local areaChanged = area ~= lastLocationData.area
            
            if streetChanged or crossingChanged or areaChanged or headingChanged then
                lastLocationData.street = streetName
                lastLocationData.crossing = crossingName
                lastLocationData.area = area
                lastLocationData.heading = heading
                
                if showHeading == true then
                    SendNUI('updateLocation', {
                        street = streetName,
                        crossing = crossingName,
                        area = area,
                        heading = heading
                    })
                else 
                    SendNUI('updateLocation', {
                        street = streetName,
                        crossing = crossingName,
                        area = area,
                        heading = json.null
                    })
                end
            end
        end
    end
end)


-- ============================================================================
-- PLAYER INFO UPDATES
-- ============================================================================

local function GetPlayerInfo()
    if not isPlayerLoaded then return nil end
    
    local serverId = GetPlayerServerId(PlayerId())
    
    if Framework == FrameworkType.ESX and FrameworkObject then
        local playerData = FrameworkObject.GetPlayerData()
        if playerData then
            return {
                id = serverId,
                job = playerData.job and playerData.job.label or 'Arbeitslos',
                rank = playerData.job and playerData.job.grade_label or ''
            }
        end
    elseif Framework == FrameworkType.QB and FrameworkObject then
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
-- DISABLED WIDGETS
-- ============================================================================

-- Table tracking which widgets are disabled
-- Example: { thirst = true, hunger = true } means thirst and hunger are disabled
local disabledWidgets = {}

-- Update disabled widgets state and sync to NUI
-- @param widgets table - Table of widget IDs to disable (true = disabled, false/nil = enabled)
-- Valid widget IDs: health, armor, hunger, thirst, stamina, stress, oxygen, 
--                   money, clock, compass, vehiclename, voice, radio, 
--                   location, speedometer, notifications, chat, teamchat
function UpdateDisabledWidgets(widgets)
    if type(widgets) ~= 'table' then
        if Config.Debug then
            print('[HUD Widgets] Error: UpdateDisabledWidgets expects a table')
        end
        return
    end
    
    -- Merge with existing disabled widgets
    for widgetId, disabled in pairs(widgets) do
        if disabled then
            disabledWidgets[widgetId] = true
        else
            disabledWidgets[widgetId] = nil
        end
    end
    
    SendNUI('updateDisabledWidgets', disabledWidgets)
    
    if Config.Debug then
        print('[HUD Widgets] Disabled widgets updated: ' .. json.encode(disabledWidgets))
    end
end

-- Set all disabled widgets at once (replaces current state)
-- @param widgets table - Table of widget IDs to disable
function SetDisabledWidgets(widgets)
    if type(widgets) ~= 'table' then
        if Config.Debug then
            print('[HUD Widgets] Error: SetDisabledWidgets expects a table')
        end
        return
    end
    
    disabledWidgets = {}
    for widgetId, disabled in pairs(widgets) do
        if disabled then
            disabledWidgets[widgetId] = true
        end
    end
    
    SendNUI('updateDisabledWidgets', disabledWidgets)
    
    if Config.Debug then
        print('[HUD Widgets] Disabled widgets set: ' .. json.encode(disabledWidgets))
    end
end

-- Enable a specific widget
-- @param widgetId string - The widget ID to enable
function EnableWidget(widgetId)
    disabledWidgets[widgetId] = nil
    SendNUI('updateDisabledWidgets', disabledWidgets)
    
    if Config.Debug then
        print('[HUD Widgets] Widget enabled: ' .. widgetId)
    end
end

-- Disable a specific widget
-- @param widgetId string - The widget ID to disable
function DisableWidget(widgetId)
    disabledWidgets[widgetId] = true
    SendNUI('updateDisabledWidgets', disabledWidgets)
    
    if Config.Debug then
        print('[HUD Widgets] Widget disabled: ' .. widgetId)
    end
end

-- Get current disabled widgets state
function GetDisabledWidgets()
    return disabledWidgets
end

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

-- Widget visibility exports
exports('updateDisabledWidgets', UpdateDisabledWidgets)
exports('setDisabledWidgets', SetDisabledWidgets)
exports('enableWidget', EnableWidget)
exports('disableWidget', DisableWidget)
exports('getDisabledWidgets', GetDisabledWidgets)

exports('getFramework', function()
    return Framework
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

-- Widget visibility Events
RegisterNetEvent('hud:updateDisabledWidgets', function(widgets)
    UpdateDisabledWidgets(widgets)
end)

RegisterNetEvent('hud:setDisabledWidgets', function(widgets)
    SetDisabledWidgets(widgets)
end)

RegisterNetEvent('hud:enableWidget', function(widgetId)
    EnableWidget(widgetId)
end)

RegisterNetEvent('hud:disableWidget', function(widgetId)
    DisableWidget(widgetId)
end)

-- ============================================================================
-- COMMANDS (Debug)
-- ============================================================================

if Config.Debug then
    RegisterCommand('hud_head', function()
        if showHeading == true then
            showHeading = false
            SendNUI('updateLocation', {
                street = streetName,
                crossing = crossingName,
                area = area,
                heading = json.null
            })
        else
            showHeading = true
            SendNUI('updateLocation', {
                street = streetName,
                crossing = crossingName,
                area = area,
                heading = 0
            })
        end
        print(showHeading)
    end, false)
    
    RegisterCommand('hud_toggle', function()
        local visible = exports[GetCurrentResourceName()]:toggleHud()
        print('[HUD Core] Visible: ' .. tostring(visible))
    end, false)
    
    RegisterCommand('hud_info', function()
        print('[HUD Core] Framework: ' .. (Framework or 'none'))
        print('[HUD Core] Voice: ' .. tostring(exports[GetCurrentResourceName()]:getVoiceResource() or 'none'))
        print('[HUD Core] Visible: ' .. tostring(isHudVisible))
        print('[HUD Core] Player loaded: ' .. tostring(isPlayerLoaded))
        print('[HUD Core] Voice muted: ' .. tostring(exports[GetCurrentResourceName()]:isVoiceMuted() or false))
    end, false)
    
    -- Debug command to test widget disabling
    RegisterCommand('hud_disable', function(source, args)
        if args[1] then
            DisableWidget(args[1])
            print('[HUD Widgets] Disabled widget: ' .. args[1])
        else
            print('[HUD Widgets] Usage: /hud_disable <widgetId>')
        end
    end, false)
    
    RegisterCommand('hud_enable', function(source, args)
        if args[1] then
            EnableWidget(args[1])
            print('[HUD Widgets] Enabled widget: ' .. args[1])
        else
            print('[HUD Widgets] Usage: /hud_enable <widgetId>')
        end
    end, false)
end