-- Death Screen Handler
-- Based on pure_deathscreen architecture

-- ============================================================================
-- STATE
-- ============================================================================

local deathOpen = false

-- ============================================================================
-- CONFIGURATION (from Config or defaults)
-- ============================================================================

local function GetEarlyRespawnTime()
    return Config and Config.EarlyRespawnTimer or 60
end

local function GetBleedoutTime()
    return Config and Config.BleedoutTimer or 300
end

local function GetHospitalCoords()
    if Config and Config.HospitalCoords then
        return Config.HospitalCoords
    end
    return vector3(311.8, -593.5, 43.28) -- Pillbox Hospital
end

-- ============================================================================
-- OPEN / CLOSE DEATH SCREEN
-- ============================================================================

function OpenDeathScreen()
    if deathOpen then return end
    deathOpen = true
    
    SetNuiFocus(true, true)
    SetNuiFocusKeepInput(true)
    
    local respawnTime = GetEarlyRespawnTime()
    local bleedoutTime = GetBleedoutTime()
    
    -- Send initial activation with timer values - JS handles countdown
    SendNUI("updateDeath", {
        isDead = true,
        respawnTimer = respawnTime,
        waitTimer = bleedoutTime,
        canCallHelp = true,
        canRespawn = false,
        message = "Du wurdest schwer verletzt und benötigst medizinische Hilfe"
    })
    
    -- Control disable loop only
    CreateThread(function()
        while deathOpen do
            Wait(0)
            DisableAllControlActions(0)
        end
    end)
    
    if Config and Config.Debug then
        print('[HUD] Death screen aktiviert, ' .. respawnTime .. ' Sekunden')
    end
end

function CloseDeathScreen()
    if not deathOpen then return end
    deathOpen = false
    
    SetNuiFocus(false, false)
    SetNuiFocusKeepInput(false)
    
    SendNUI("updateDeath", {
        isDead = false,
        respawnTimer = 0,
        waitTimer = 0,
        canCallHelp = true,
        canRespawn = false
    })
    
    if Config and Config.Debug then
        print('[HUD] Death screen closed')
    end
end

-- ============================================================================
-- DEATH DETECTION
-- ============================================================================

AddEventHandler('gameEventTriggered', function(name, data)
    if (name ~= "CEventNetworkEntityDamage") then
        return
    end
    
    local victim = data[1]
    local killer = data[2]
    local died = data[6] == 1
    
    if died and victim == PlayerPedId() then
        OpenDeathScreen()
    end
end)

-- ============================================================================
-- DEATH EVENTS (Framework Integration)
-- ============================================================================

-- ESX Fallback
AddEventHandler('esx:onPlayerDeath', OpenDeathScreen)

-- ESX Ambulancejob
AddEventHandler('esx_ambulancejob:playerDead', OpenDeathScreen)

-- Manual events (recommended for custom death systems)
RegisterNetEvent('hud:openDeathScreen', OpenDeathScreen)
RegisterNetEvent('hud:closeDeathScreen', CloseDeathScreen)

-- Legacy pure_deathscreen events
RegisterNetEvent('pure_deathscreen:open', OpenDeathScreen)
RegisterNetEvent('pure_deathscreen:close', CloseDeathScreen)

-- ============================================================================
-- NUI CALLBACKS
-- ============================================================================

RegisterNUICallback('deathCallHelp', function(_, cb)
    TriggerServerEvent('hud:callMedic', GetEntityCoords(PlayerPedId()))
    
    SendNUI('notify', {
        type = 'info',
        title = 'Hilferuf',
        message = 'Der Rettungsdienst wurde benachrichtigt.',
        duration = 5000
    })
    
    cb({ success = true })
end)

RegisterNUICallback('deathRespawn', function(_, cb)
    local coords = GetHospitalCoords()
    local ped = PlayerPedId()
    
    -- Resurrect player
    NetworkResurrectLocalPlayer(coords.x, coords.y, coords.z, 0.0, true, false)
    
    -- Restore health
    SetEntityHealth(ped, GetEntityMaxHealth(ped))
    ClearPedBloodDamage(ped)
    ClearPedWetness(ped)
    ResetPedVisibleDamage(ped)
    
    -- Trigger framework events
    TriggerEvent('esx_ambulancejob:respawn')
    TriggerServerEvent('hud:playerRespawned')
    
    CloseDeathScreen()
    cb({ success = true })
end)

RegisterNUICallback('deathSyncPosition', function(_, cb)
    local ped = PlayerPedId()
    local c = GetEntityCoords(ped)
    SetEntityCoords(ped, c.x, c.y, c.z)
    cb({ success = true })
end)

-- ============================================================================
-- COOLDOWN UPDATE (from Server)
-- ============================================================================

RegisterNetEvent('hud:helpCooldownUpdate', function(seconds)
    SendNUI("updateDeath", {
        canCallHelp = seconds <= 0
    })
end)

-- Legacy pure_deathscreen cooldown
RegisterNetEvent('pure_deathscreen:cooldownUpdate', function(seconds)
    SendNUI("updateDeath", {
        canCallHelp = seconds <= 0
    })
end)

-- ============================================================================
-- EXTERNAL REVIVE EVENT
-- ============================================================================

RegisterNetEvent('hud:revivePlayer', function(healAmount)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)
    
    -- Resurrect at current position
    NetworkResurrectLocalPlayer(coords.x, coords.y, coords.z, heading, true, false)
    
    -- Set health
    local maxHealth = GetEntityMaxHealth(ped)
    local newHealth = healAmount and math.min(maxHealth, 100 + healAmount) or maxHealth
    SetEntityHealth(ped, newHealth)
    
    -- Cleanup
    ClearPedBloodDamage(ped)
    ClearPedWetness(ped)
    ResetPedVisibleDamage(ped)
    
    CloseDeathScreen()
end)

-- ============================================================================
-- TEST COMMANDS (Debug)
-- ============================================================================

RegisterCommand('test_deathui', function()
    OpenDeathScreen()
end, false)

RegisterCommand('test_deathui_off', function()
    CloseDeathScreen()
end, false)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports('isPlayerDead', function()
    return deathOpen
end)

exports('openDeathScreen', OpenDeathScreen)
exports('closeDeathScreen', CloseDeathScreen)

exports('revivePlayer', function(healAmount)
    TriggerEvent('hud:revivePlayer', healAmount)
end)

exports('setRespawnLocation', function(coords)
    if type(coords) == 'vector3' then
        Config.HospitalCoords = coords
    elseif type(coords) == 'table' then
        Config.HospitalCoords = vector3(coords.x or coords[1], coords.y or coords[2], coords.z or coords[3])
    end
end)
