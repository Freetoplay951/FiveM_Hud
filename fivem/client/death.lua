-- Death Screen Handler
-- Verwaltet den Spieler-Tod Zustand und sendet Updates an das HUD

-- ============================================================================
-- CONFIGURATION
-- ============================================================================

local RESPAWN_WAIT_TIME = 60 -- Sekunden bis Respawn möglich ist
local HELP_COOLDOWN = 30 -- Sekunden zwischen Hilferufen
local HOSPITAL_COORDS = vector3(311.8, -593.5, 43.28) -- Pillbox Hospital

-- ============================================================================
-- VARIABLES
-- ============================================================================

local isDead = false
local respawnTimer = 0
local waitTimer = 0
local canCallHelp = true
local deathTime = 0

-- ============================================================================
-- NUI UPDATE
-- ============================================================================

local function UpdateDeathNUI()
    SendNUI('updateDeath', {
        isDead = isDead,
        respawnTimer = respawnTimer,
        waitTimer = waitTimer,
        canCallHelp = canCallHelp,
        canRespawn = respawnTimer <= 0,
        message = "Du wurdest schwer verletzt und benötigst medizinische Hilfe"
    })
end

-- ============================================================================
-- DEATH CHECK
-- ============================================================================

local function IsPlayerDead()
    local ped = PlayerPedId()
    return IsEntityDead(ped) or IsPedDeadOrDying(ped, true)
end

-- ============================================================================
-- DEATH HANDLING
-- ============================================================================

local function OnPlayerDeath()
    isDead = true
    deathTime = GetGameTimer()
    respawnTimer = RESPAWN_WAIT_TIME
    waitTimer = RESPAWN_WAIT_TIME
    canCallHelp = true
    
    -- Ragdoll aktivieren
    local ped = PlayerPedId()
    SetPedToRagdoll(ped, 1000, 1000, 0, false, false, false)
    
    UpdateDeathNUI()
    
    if Config and Config.Debug then
        print('[HUD] Player died')
    end
end

local function OnPlayerRevive()
    isDead = false
    respawnTimer = 0
    waitTimer = 0
    canCallHelp = true
    
    UpdateDeathNUI()
    
    if Config and Config.Debug then
        print('[HUD] Player revived')
    end
end

-- ============================================================================
-- MAIN DEATH LOOP
-- ============================================================================

CreateThread(function()
    while true do
        local playerDead = IsPlayerDead()
        
        if playerDead and not isDead then
            -- Spieler ist gerade gestorben
            OnPlayerDeath()
            
        elseif not playerDead and isDead then
            -- Spieler wurde wiederbelebt
            OnPlayerRevive()
        end
        
        if isDead then
            -- Timer aktualisieren
            if respawnTimer > 0 then
                respawnTimer = respawnTimer - 1
            end
            if waitTimer > 0 then
                waitTimer = waitTimer - 1
            end
            
            UpdateDeathNUI()
            
            -- Controls deaktivieren während tot
            local ped = PlayerPedId()
            
            DisableControlAction(0, 1, true)   -- Look LR
            DisableControlAction(0, 2, true)   -- Look UD
            DisableControlAction(0, 24, true)  -- Attack
            DisableControlAction(0, 25, true)  -- Aim
            DisableControlAction(0, 37, true)  -- Select Weapon
            DisableControlAction(0, 44, true)  -- Cover
            DisableControlAction(0, 47, true)  -- Weapon Special
            DisableControlAction(0, 58, true)  -- Weapon Special 2
            DisableControlAction(0, 140, true) -- Melee Light
            DisableControlAction(0, 141, true) -- Melee Alternate
            DisableControlAction(0, 142, true) -- Melee Heavy
            DisableControlAction(0, 143, true) -- Melee Block
            DisableControlAction(0, 263, true) -- Melee Attack 1
            DisableControlAction(0, 264, true) -- Melee Attack 2
            
            -- Kamera-Einschränkungen (optional)
            -- DisableControlAction(0, 0, true) -- Kamera Rotation
            
            Wait(1000)
        else
            Wait(500)
        end
    end
end)

-- ============================================================================
-- NUI CALLBACKS
-- ============================================================================

-- Hilfe rufen
RegisterNUICallback('deathCallHelp', function(data, cb)
    if isDead and canCallHelp then
        canCallHelp = false
        
        -- Server Event für Medic-Ruf
        TriggerServerEvent('hud:callMedic', GetEntityCoords(PlayerPedId()))
        
        -- Notification
        SendNUI('notify', {
            type = 'info',
            title = 'Hilferuf',
            message = 'Der Rettungsdienst wurde benachrichtigt.',
            duration = 5000
        })
        
        -- Cooldown Timer
        SetTimeout(HELP_COOLDOWN * 1000, function()
            if isDead then
                canCallHelp = true
                UpdateDeathNUI()
            end
        end)
        
        UpdateDeathNUI()
    end
    
    cb({ success = true })
end)

-- Respawn
RegisterNUICallback('deathRespawn', function(data, cb)
    if isDead and respawnTimer <= 0 then
        local ped = PlayerPedId()
        
        -- Spieler wiederbeleben
        NetworkResurrectLocalPlayer(
            HOSPITAL_COORDS.x,
            HOSPITAL_COORDS.y,
            HOSPITAL_COORDS.z,
            0.0,
            true,
            false
        )
        
        -- Health wiederherstellen
        SetEntityHealth(ped, GetEntityMaxHealth(ped))
        ClearPedBloodDamage(ped)
        ClearPedWetness(ped)
        ResetPedVisibleDamage(ped)
        
        -- Status zurücksetzen
        isDead = false
        respawnTimer = 0
        waitTimer = 0
        
        -- Notification
        SendNUI('notify', {
            type = 'success',
            title = 'Respawn',
            message = 'Du wurdest im Krankenhaus wiederbelebt.',
            duration = 5000
        })
        
        UpdateDeathNUI()
        
        -- Server über Respawn informieren
        TriggerServerEvent('hud:playerRespawned')
    end
    
    cb({ success = true })
end)

-- Position synchronisieren
RegisterNUICallback('deathSyncPosition', function(data, cb)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    
    TriggerServerEvent('hud:syncPosition', coords.x, coords.y, coords.z)
    
    SendNUI('notify', {
        type = 'info',
        title = 'Sync',
        message = 'Position wurde synchronisiert.',
        duration = 3000
    })
    
    cb({ success = true })
end)

-- ============================================================================
-- SERVER EVENTS
-- ============================================================================

-- Spieler wiederbeleben (von außen)
RegisterNetEvent('hud:revivePlayer', function(healAmount)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)
    
    -- Wiederbeleben an aktueller Position
    NetworkResurrectLocalPlayer(coords.x, coords.y, coords.z, heading, true, false)
    
    -- Health setzen
    local maxHealth = GetEntityMaxHealth(ped)
    local newHealth = healAmount and math.min(maxHealth, 100 + healAmount) or maxHealth
    SetEntityHealth(ped, newHealth)
    
    -- Aufräumen
    ClearPedBloodDamage(ped)
    ClearPedWetness(ped)
    ResetPedVisibleDamage(ped)
    
    -- Status zurücksetzen
    OnPlayerRevive()
end)

-- Spieler töten (für Skripte)
RegisterNetEvent('hud:killPlayer', function(customMessage)
    local ped = PlayerPedId()
    SetEntityHealth(ped, 0)
    
    -- Optional: Custom Message
    if customMessage then
        Wait(100)
        SendNUI('updateDeath', {
            isDead = true,
            respawnTimer = respawnTimer,
            waitTimer = waitTimer,
            canCallHelp = canCallHelp,
            canRespawn = false,
            message = customMessage
        })
    end
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports('isPlayerDead', function()
    return isDead
end)

exports('getDeathTimer', function()
    return respawnTimer
end)

exports('canPlayerRespawn', function()
    return isDead and respawnTimer <= 0
end)

exports('setPlayerDead', function(dead, customMessage)
    if dead then
        isDead = true
        respawnTimer = RESPAWN_WAIT_TIME
        waitTimer = RESPAWN_WAIT_TIME
        canCallHelp = true
        
        if customMessage then
            SendNUI('updateDeath', {
                isDead = true,
                respawnTimer = respawnTimer,
                waitTimer = waitTimer,
                canCallHelp = canCallHelp,
                canRespawn = false,
                message = customMessage
            })
        else
            UpdateDeathNUI()
        end
    else
        OnPlayerRevive()
    end
end)

exports('revivePlayer', function(healAmount)
    TriggerEvent('hud:revivePlayer', healAmount)
end)

exports('setRespawnLocation', function(coords)
    if type(coords) == 'vector3' then
        HOSPITAL_COORDS = coords
    elseif type(coords) == 'table' then
        HOSPITAL_COORDS = vector3(coords.x or coords[1], coords.y or coords[2], coords.z or coords[3])
    end
end)
