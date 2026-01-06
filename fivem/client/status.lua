-- ============================================================================
-- STATUS MANAGEMENT
-- ============================================================================
-- Supports: es_extended (ESX), qb-core (QB)
-- Status Types: health, armor, hunger, thirst, stamina, stress, oxygen

local Framework = nil
local FrameworkObject = nil

-- Custom status handlers registered by external resources
-- Format: { [statusType] = function(ped) return value end }
local customStatusHandlers = {}

-- ============================================================================
-- FRAMEWORK DETECTION (cached from main.lua)
-- ============================================================================

local function GetFrameworkData()
    if Framework then return Framework, FrameworkObject end
    
    -- Try to get from main.lua exports
    local success, fw = pcall(function()
        return exports[GetCurrentResourceName()]:getFramework()
    end)
    
    if success and fw then
        Framework = fw
        
        if Framework == 'esx' then
            TriggerEvent('esx:getSharedObject', function(obj) FrameworkObject = obj end)
            if not FrameworkObject then
                pcall(function() FrameworkObject = exports['es_extended']:getSharedObject() end)
            end
        elseif Framework == 'qb' then
            pcall(function() FrameworkObject = exports['qb-core']:GetCoreObject() end)
        end
    end
    
    return Framework, FrameworkObject
end

-- ============================================================================
-- STATUS VALUE GETTERS
-- ============================================================================

local function GetHealth(ped)
    local health = GetEntityHealth(ped)
    local maxHealth = GetEntityMaxHealth(ped)
    local healthPercent = math.floor(((health - 100) / (maxHealth - 100)) * 100)
    return math.max(0, math.min(100, healthPercent))
end

local function GetArmor(ped)
    return GetPedArmour(ped)
end

local function GetHunger(ped)
    local fw, fwObj = GetFrameworkData()
    
    if fw == 'esx' and fwObj then
        local playerData = fwObj.GetPlayerData()
        if playerData and playerData.metadata and playerData.metadata.hunger then
            return math.floor(playerData.metadata.hunger)
        end
    elseif fw == 'qb' and fwObj then
        local PlayerData = fwObj.Functions.GetPlayerData()
        if PlayerData and PlayerData.metadata and PlayerData.metadata.hunger then
            return math.floor(PlayerData.metadata.hunger)
        end
    end
    
    return nil -- Not supported
end

local function GetThirst(ped)
    local fw, fwObj = GetFrameworkData()
    
    if fw == 'esx' and fwObj then
        local playerData = fwObj.GetPlayerData()
        if playerData and playerData.metadata and playerData.metadata.thirst then
            return math.floor(playerData.metadata.thirst)
        end
    elseif fw == 'qb' and fwObj then
        local PlayerData = fwObj.Functions.GetPlayerData()
        if PlayerData and PlayerData.metadata and PlayerData.metadata.thirst then
            return math.floor(PlayerData.metadata.thirst)
        end
    end
    
    return nil -- Not supported
end

local function GetStamina(ped)
    -- FiveM native stamina (inverted: 0 = full stamina, 100 = exhausted)
    local exhaustion = GetPlayerSprintStaminaRemaining(PlayerId())
    return math.floor(100 - exhaustion)
end

local function GetStress(ped)
    local fw, fwObj = GetFrameworkData()
    
    if fw == 'esx' and fwObj then
        local playerData = fwObj.GetPlayerData()
        if playerData and playerData.metadata and playerData.metadata.stress then
            return math.floor(playerData.metadata.stress)
        end
    elseif fw == 'qb' and fwObj then
        local PlayerData = fwObj.Functions.GetPlayerData()
        if PlayerData and PlayerData.metadata and PlayerData.metadata.stress then
            return math.floor(PlayerData.metadata.stress)
        end
    end
    
    return nil -- Not supported
end

local function GetOxygen(ped)
    -- FiveM native oxygen (only relevant when underwater)
    local oxygen = GetPlayerUnderwaterTimeRemaining(PlayerId())
    -- oxygen is in seconds (0-10 by default, but can be higher)
    -- Convert to percentage (10 seconds = 100%)
    local maxOxygen = 10.0
    local oxygenPercent = math.floor((oxygen / maxOxygen) * 100)
    return math.max(0, math.min(100, oxygenPercent))
end

local function IsUnderwater(ped)
    return IsEntityInWater(ped) or IsPedSwimmingUnderWater(ped)
end

-- ============================================================================
-- MAIN STATUS UPDATE FUNCTION
-- ============================================================================

local function refreshStatusIcons()
    local ped = PlayerPedId()
    local statusData = {}
    
    -- Health (always available via FiveM native)
    if customStatusHandlers.health then
        statusData.health = customStatusHandlers.health(ped)
    else
        statusData.health = GetHealth(ped)
    end
    
    -- Armor (always available via FiveM native)
    if customStatusHandlers.armor then
        statusData.armor = customStatusHandlers.armor(ped)
    else
        statusData.armor = GetArmor(ped)
    end
    
    -- Hunger (framework dependent)
    if customStatusHandlers.hunger then
        statusData.hunger = customStatusHandlers.hunger(ped)
    else
        statusData.hunger = GetHunger(ped)
    end
    
    -- Thirst (framework dependent)
    if customStatusHandlers.thirst then
        statusData.thirst = customStatusHandlers.thirst(ped)
    else
        statusData.thirst = GetThirst(ped)
    end
    
    -- Stamina (always available via FiveM native)
    if customStatusHandlers.stamina then
        statusData.stamina = customStatusHandlers.stamina(ped)
    else
        statusData.stamina = GetStamina(ped)
    end
    
    -- Stress (framework dependent)
    if customStatusHandlers.stress then
        statusData.stress = customStatusHandlers.stress(ped)
    else
        statusData.stress = GetStress(ped)
    end
    
    -- Oxygen (always available via FiveM native, but only shown underwater)
    if customStatusHandlers.oxygen then
        statusData.oxygen = customStatusHandlers.oxygen(ped)
    else
        statusData.oxygen = GetOxygen(ped)
    end
    
    -- Also send underwater state for conditional display
    statusData.isUnderwater = IsUnderwater(ped)
    
    SendNUI('updateHud', statusData)
end

-- ============================================================================
-- SUPPORTED STATUS CHECK
-- ============================================================================

-- Returns which status widgets are NOT supported (should be disabled)
local function GetUnsupportedStatusWidgets()
    local ped = PlayerPedId()
    local unsupported = {}
    
    -- Check each status type
    -- Health and Armor are always supported (FiveM natives)
    
    -- Hunger
    if not customStatusHandlers.hunger then
        local hunger = GetHunger(ped)
        if hunger == nil then
            unsupported.hunger = true
        end
    end
    
    -- Thirst
    if not customStatusHandlers.thirst then
        local thirst = GetThirst(ped)
        if thirst == nil then
            unsupported.thirst = true
        end
    end
    
    -- Stamina is always supported (FiveM native)
    
    -- Stress
    if not customStatusHandlers.stress then
        local stress = GetStress(ped)
        if stress == nil then
            unsupported.stress = true
        end
    end
    
    -- Oxygen is always supported (FiveM native), but display is conditional
    -- Don't disable it, just hide when not underwater (handled in UI)
    
    return unsupported
end

-- Export for main.lua to use
exports('getUnsupportedStatusWidgets', GetUnsupportedStatusWidgets)
exports('isUnderwater', function()
    return IsUnderwater(PlayerPedId())
end)

-- ============================================================================
-- MAIN STATUS LOOP
-- ============================================================================

AddEventHandler("hud:loaded", function()
    if Config.Debug then
        print('[HUD] Loading Status Icons')
        print('[HUD] Custom handlers registered: ' .. json.encode(customStatusHandlers))
    end
    
    -- Initial refresh
    refreshStatusIcons()
    
    -- Status update loop
    CreateThread(function()
        while true do
            Wait(Config.StatusUpdateInterval or 500)
            refreshStatusIcons()
        end
    end)
end)

-- ============================================================================
-- EXTERNAL STATUS HANDLER REGISTRATION
-- ============================================================================

-- Register a custom handler for a status type
-- This should be called BEFORE hud:loaded (use hud:registerHandlers event)
-- @param statusType string - "health", "armor", "hunger", "thirst", "stamina", "stress", "oxygen"
-- @param handler function(ped) - Function that returns the status value (0-100)
RegisterNetEvent('hud:handleStatus', function(statusType, handler)
    if type(statusType) == 'string' and type(handler) == 'function' then
        customStatusHandlers[statusType] = handler
        if Config.Debug then
            print('[HUD] Custom handler registered for: ' .. statusType)
        end
    else
        if Config.Debug then
            print('[HUD] Invalid handler registration for: ' .. tostring(statusType))
        end
    end
end)

-- Export for direct registration
exports('registerStatusHandler', function(statusType, handler)
    if type(statusType) == 'string' and type(handler) == 'function' then
        customStatusHandlers[statusType] = handler
        if Config.Debug then
            print('[HUD] Custom handler registered via export for: ' .. statusType)
        end
        return true
    end
    return false
end)

-- Unregister a custom handler
exports('unregisterStatusHandler', function(statusType)
    if customStatusHandlers[statusType] then
        customStatusHandlers[statusType] = nil
        if Config.Debug then
            print('[HUD] Custom handler unregistered for: ' .. statusType)
        end
        return true
    end
    return false
end)