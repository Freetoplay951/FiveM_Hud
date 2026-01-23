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

local function GetClosestReviveLocation()
    local playerCoords = GetEntityCoords(PlayerPedId())
    local closestLocation = nil
    local minimumDistance = math.huge

    for _, location in ipairs(Config.ReviveLocations) do
        local c = location.coords
        local locVec3 = vec3(c.x, c.y, c.z)
        local distance = #(locVec3 - playerCoords)

        if distance < minimumDistance then
            minimumDistance = distance
            closestLocation = vector4(c.x, c.y, c.z, c.w or 0.0)
        end
    end

    if not closestLocation then
        local ped = PlayerPedId()
        local fallback = GetEntityCoords(ped)
        closestLocation = vector4(fallback.x, fallback.y, fallback.z, GetEntityHeading(ped))
    end

    return closestLocation
end

-- ============================================================================
-- OPEN / CLOSE DEATH SCREEN
-- ============================================================================

function OpenDeathScreen()
    if deathOpen then return end
    deathOpen = true
    
    ClearPedTasks(PlayerPedId())
    
    SetNuiFocus(true, true)
    SetNuiFocusKeepInput(true)
    
    local respawnTime = GetEarlyRespawnTime()
    local bleedoutTime = GetBleedoutTime()
    
    SendNUI("updateDeath", {
        isDead = true,
        respawnTimer = respawnTime,
        waitTimer = bleedoutTime,
        canCallHelp = true,
        canRespawn = false,
        message = "Du wurdest schwer verletzt und benötigst medizinische Hilfe"
    })
    
    if Config and Config.Debug then
        print('[HUD Death] Death screen activated, ' .. respawnTime .. ' seconds')
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
        print('[HUD Death] Death screen closed')
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

-- ============================================================================
-- NUI CALLBACKS
-- ============================================================================

RegisterNUICallback('deathCallHelp', function(_, cb)
    TriggerServerEvent('hud:callMedic', GetEntityCoords(PlayerPedId()))
    
    SendNUI('notify', {
        type = NotificationType.INFO,
        title = 'Hilferuf',
        message = 'Der Rettungsdienst wurde benachrichtigt.',
        duration = 5000
    })
    
    cb({ success = true })
end)

local function RespawnPlayer(opts)
    local ped = PlayerPedId()
    if not ped or ped == -1 then return false end

    opts = opts or {}

    local x, y, z, w
    if opts.coords then
        x, y, z = opts.coords.x, opts.coords.y, opts.coords.z
        w = opts.coords.w or GetEntityHeading(ped)
    else
        local coords = GetEntityCoords(ped)
        x, y, z = coords.x, coords.y, coords.z
        w = GetEntityHeading(ped)
    end

    NetworkResurrectLocalPlayer(x, y, z, w, true, false)
    SetEntityCoordsNoOffset(ped, x, y, z, false, false, false)

    local maxHealth = GetEntityMaxHealth(ped)
    local health = opts.healAmount
        and math.min(maxHealth, 100 + opts.healAmount)
        or maxHealth

    SetEntityHealth(ped, health)

    ClearPedBloodDamage(ped)
    ClearPedWetness(ped)
    ResetPedVisibleDamage(ped)

    if opts.triggerEvents then
        TriggerEvent('esx_ambulancejob:respawn')
        TriggerServerEvent('hud:playerRespawned')
    end

    CloseDeathScreen()

    return true
end

RegisterNUICallback('deathRespawn', function(_, cb)
    local spawn = GetClosestReviveLocation()

    if not spawn then
        print('[HUD Death] ERROR: No valid revive location!')
        cb({ success = false })
        return
    end

    local success = RespawnPlayer({
        coords = spawn,
        triggerEvents = true
    })

    cb({ success = success })
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

-- ============================================================================
-- EXTERNAL REVIVE EVENT
-- ============================================================================

RegisterNetEvent('hud:revivePlayer', function(healAmount)
    RespawnPlayer({
        healAmount = healAmount
    })
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
