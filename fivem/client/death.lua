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
-- CAMERA SYSTEM
-- ============================================================================

local camera = nil
local playerPed = nil
local rotX = 0.0
local rotY = math.rad(45.0)
local cameraRadius = 5.0

local zoom = {
    min = 2.0,
    max = 8.0,
    step = 0.5
}

-- Sync ShapeTest Result
local function GetShapeTestResultSync(shape)
    local handle, hit, coords, normal, entity
    repeat
        handle, hit, coords, normal, entity = GetShapeTestResult(shape)
        Wait(0)
    until handle ~= 1
    return hit, coords
end

function StartDeathCam()
    if camera then return end
    
    playerPed = PlayerPedId()
    
    DoScreenFadeOut(300)
    Wait(300)
    
    camera = CreateCam("DEFAULT_SCRIPTED_CAMERA", true)
    SetCamActive(camera, true)
    RenderScriptCams(true, true, 800, true, false)
    
    DoScreenFadeIn(800)
end

function EndDeathCam()
    if not camera then return end
    
    DoScreenFadeOut(300)
    Wait(300)
    
    RenderScriptCams(false, true, 500, true, false)
    DestroyCam(camera, false)
    
    camera = nil
    playerPed = nil
    
    DoScreenFadeIn(500)
end

-- Smooth camera position tracking
local smoothCamPos = nil
local smoothLerpFactor = 0.08 -- Lower = smoother but slower

function ProcessCamControls()
    if not camera or not playerPed then return end
    
    local playerCoords = GetEntityCoords(playerPed)
    
    -- Mouse Rotation (smoother interpolation)
    local sensitivity = 2.0
    
    local mouseX = GetDisabledControlNormal(0, 1)
    local mouseY = GetDisabledControlNormal(0, 2)
    
    -- Apply dead zone to reduce jitter
    if math.abs(mouseX) < 0.01 then mouseX = 0 end
    if math.abs(mouseY) < 0.01 then mouseY = 0 end
    
    local targetX = rotX - mouseX * sensitivity
    local targetY = rotY - mouseY * sensitivity
    
    -- Smoother lerp for rotation
    rotX = rotX + (targetX - rotX) * 0.08
    rotY = rotY + (targetY - rotY) * 0.08
    
    rotY = math.max(math.rad(15.0), math.min(math.rad(85.0), rotY))
    
    -- Zoom (smoother)
    local targetRadius = cameraRadius
    
    if IsDisabledControlPressed(0, 14) then -- scroll up
        targetRadius = math.min(zoom.max, targetRadius + zoom.step)
    elseif IsDisabledControlPressed(0, 15) then -- scroll down
        targetRadius = math.max(zoom.min, targetRadius - zoom.step)
    end
    
    cameraRadius = cameraRadius + (targetRadius - cameraRadius) * 0.06
    
    -- Camera Direction
    local direction = vector3(
        math.sin(rotY) * math.cos(rotX),
        math.sin(rotY) * math.sin(rotX),
        math.cos(rotY)
    )
    
    local desiredPos = playerCoords + direction * cameraRadius
    
    -- Collision Check
    local hit, hitCoords = GetShapeTestResultSync(
        StartShapeTestLosProbe(playerCoords, desiredPos, -1, playerPed)
    )
    
    local targetPos = desiredPos
    if hit == 1 then
        targetPos = playerCoords + direction * (#(playerCoords - hitCoords) - 0.5)
    end
    
    -- Initialize smooth position if needed
    if not smoothCamPos then
        smoothCamPos = targetPos
    end
    
    -- Smooth camera movement (reduces lag/jitter significantly)
    smoothCamPos = vector3(
        smoothCamPos.x + (targetPos.x - smoothCamPos.x) * smoothLerpFactor,
        smoothCamPos.y + (targetPos.y - smoothCamPos.y) * smoothLerpFactor,
        smoothCamPos.z + (targetPos.z - smoothCamPos.z) * smoothLerpFactor
    )
    
    -- Subtle floating effect
    local time = GetGameTimer() / 1500
    local finalPos = smoothCamPos + vector3(0.0, 0.0, math.sin(time) * 0.03)
    
    -- FOV Dynamic
    local minFov, maxFov = 50.0, 80.0
    local fov = maxFov - ((cameraRadius - zoom.min) / (zoom.max - zoom.min)) * (maxFov - minFov)
    SetCamFov(camera, fov)
    
    -- Apply camera position and look-at
    SetCamCoord(camera, finalPos.x, finalPos.y, finalPos.z)
    PointCamAtCoord(camera, playerCoords.x, playerCoords.y, playerCoords.z)
end

-- ============================================================================
-- OPEN / CLOSE DEATH SCREEN
-- ============================================================================

function OpenDeathScreen()
    if deathOpen then return end
    deathOpen = true
    
    StartDeathCam()
    
    SetNuiFocus(true, true)
    SetNuiFocusKeepInput(true)
    
    SendNUI("updateDeath", {
        isDead = true,
        respawnTimer = GetEarlyRespawnTime(),
        waitTimer = GetBleedoutTime(),
        canCallHelp = true,
        canRespawn = false,
        message = "Du wurdest schwer verletzt und benötigst medizinische Hilfe"
    })
    
    -- Start control disable loop
    CreateThread(function()
        local respawnTime = GetEarlyRespawnTime()
        local bleedoutTime = GetBleedoutTime()
        local startTime = GetGameTimer()
        
        while deathOpen do
            Wait(0)
            DisableAllControlActions(0)
            
            -- Allow mouse & scroll for deathcam
            EnableControlAction(0, 1, true)
            EnableControlAction(0, 2, true)
            EnableControlAction(0, 14, true)
            EnableControlAction(0, 15, true)
            
            ProcessCamControls()
            
            -- Update timers every second
            local elapsed = math.floor((GetGameTimer() - startTime) / 1000)
            local currentRespawnTimer = math.max(0, respawnTime - elapsed)
            local currentBleedoutTimer = math.max(0, bleedoutTime - elapsed)
            
            -- Only update NUI every second
            if elapsed % 1 == 0 then
                SendNUI("updateDeath", {
                    isDead = true,
                    respawnTimer = currentRespawnTimer,
                    waitTimer = currentBleedoutTimer,
                    canCallHelp = true,
                    canRespawn = currentRespawnTimer <= 0,
                    message = "Du wurdest schwer verletzt und benötigst medizinische Hilfe"
                })
            end
        end
    end)
    
    if Config and Config.Debug then
        print('[HUD] Death screen opened')
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
    
    EndDeathCam()
    
    if Config and Config.Debug then
        print('[HUD] Death screen closed')
    end
end

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
