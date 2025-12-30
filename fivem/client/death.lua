-- Death Screen Handler
-- Handles player death state and sends updates to the NUI

local isDead = false
local respawnTimer = 0
local waitTimer = 0
local canCallHelp = true
local lastDeathTime = 0

-- Config
local RESPAWN_WAIT_TIME = 60 -- Seconds before respawn is allowed
local HELP_COOLDOWN = 30 -- Seconds before calling help again

-- Send death state to NUI
local function UpdateDeathNUI()
    SendNUI("updateDeath", {
        isDead = isDead,
        respawnTimer = respawnTimer,
        waitTimer = waitTimer,
        canCallHelp = canCallHelp,
        canRespawn = respawnTimer <= 0,
        message = "Du wurdest schwer verletzt und benötigst medizinische Hilfe"
    })
end

-- Check if player is dead
local function CheckPlayerDeath()
    local ped = PlayerPedId()
    return IsEntityDead(ped) or IsPedDeadOrDying(ped, true)
end

-- Main death loop
CreateThread(function()
    while true do
        local playerDead = CheckPlayerDeath()
        
        if playerDead and not isDead then
            -- Player just died
            isDead = true
            lastDeathTime = GetGameTimer()
            respawnTimer = RESPAWN_WAIT_TIME
            waitTimer = RESPAWN_WAIT_TIME
            canCallHelp = true
            
            -- Disable controls while dead
            SetEntityHealth(PlayerPedId(), 0)
            
            UpdateDeathNUI()
        elseif not playerDead and isDead then
            -- Player respawned
            isDead = false
            respawnTimer = 0
            waitTimer = 0
            UpdateDeathNUI()
        end
        
        if isDead then
            -- Update timers
            if respawnTimer > 0 then
                respawnTimer = respawnTimer - 1
            end
            if waitTimer > 0 then
                waitTimer = waitTimer - 1
            end
            
            UpdateDeathNUI()
            
            -- Disable certain controls while dead
            DisableControlAction(0, 1, true) -- Look Left/Right
            DisableControlAction(0, 2, true) -- Look Up/Down
            DisableControlAction(0, 24, true) -- Attack
            DisableControlAction(0, 25, true) -- Aim
            DisableControlAction(0, 37, true) -- Select Weapon
            DisableControlAction(0, 47, true) -- Weapon special ability
            DisableControlAction(0, 58, true) -- Weapon special ability 2
            DisableControlAction(0, 140, true) -- Melee Attack Light
            DisableControlAction(0, 141, true) -- Melee Attack Alternate
            DisableControlAction(0, 142, true) -- Melee Attack Heavy
            DisableControlAction(0, 143, true) -- Melee Block
            
            Wait(1000) -- Update every second
        else
            Wait(500)
        end
    end
end)

-- NUI Callbacks
RegisterNUICallback("deathCallHelp", function(data, cb)
    if isDead and canCallHelp then
        canCallHelp = false
        
        -- Trigger server event to call EMS/medics
        TriggerServerEvent("hud:callMedic")
        
        -- Notify player
        SendNUI("notify", {
            type = "info",
            title = "Hilferuf",
            message = "Der Rettungsdienst wurde benachrichtigt.",
            duration = 5000
        })
        
        -- Cooldown for calling help again
        SetTimeout(HELP_COOLDOWN * 1000, function()
            if isDead then
                canCallHelp = true
                UpdateDeathNUI()
            end
        end)
        
        UpdateDeathNUI()
    end
    cb({ ok = true })
end)

RegisterNUICallback("deathRespawn", function(data, cb)
    if isDead and respawnTimer <= 0 then
        -- Respawn at hospital
        local hospitalCoords = vector3(311.8, -593.5, 43.28) -- Pillbox Hospital
        
        isDead = false
        
        -- Revive player
        local ped = PlayerPedId()
        NetworkResurrectLocalPlayer(hospitalCoords.x, hospitalCoords.y, hospitalCoords.z, 0.0, true, false)
        SetEntityHealth(ped, GetEntityMaxHealth(ped))
        ClearPedBloodDamage(ped)
        
        -- Notify
        SendNUI("notify", {
            type = "success",
            title = "Respawn",
            message = "Du wurdest im Krankenhaus wiederbelebt.",
            duration = 5000
        })
        
        UpdateDeathNUI()
    end
    cb({ ok = true })
end)

RegisterNUICallback("deathSyncPosition", function(data, cb)
    -- Force position sync with server (useful for desync issues)
    local ped = PlayerPedId()
    local coords = GetEntityCoords(ped)
    
    TriggerServerEvent("hud:syncPosition", coords.x, coords.y, coords.z)
    
    SendNUI("notify", {
        type = "info",
        title = "Sync",
        message = "Position wurde synchronisiert.",
        duration = 3000
    })
    
    cb({ ok = true })
end)

-- Server events
RegisterNetEvent("hud:revivePlayer")
AddEventHandler("hud:revivePlayer", function()
    local ped = PlayerPedId()
    isDead = false
    
    NetworkResurrectLocalPlayer(GetEntityCoords(ped), GetEntityHeading(ped), true, false)
    SetEntityHealth(ped, GetEntityMaxHealth(ped))
    ClearPedBloodDamage(ped)
    
    UpdateDeathNUI()
end)

-- Exports
exports("isPlayerDead", function()
    return isDead
end)

exports("setPlayerDead", function(dead, customMessage)
    isDead = dead
    if dead then
        respawnTimer = RESPAWN_WAIT_TIME
        waitTimer = RESPAWN_WAIT_TIME
        canCallHelp = true
    else
        respawnTimer = 0
        waitTimer = 0
    end
    UpdateDeathNUI()
end)

exports("revivePlayer", function()
    isDead = false
    respawnTimer = 0
    waitTimer = 0
    UpdateDeathNUI()
end)
