-- Status Updates (Health, Armor, Hunger, Thirst, etc.)
-- Sendet regelmäßig Spieler-Status an das HUD

-- ============================================================================
-- VARIABLES
-- ============================================================================

local cachedStamina = 100.0
local lastStaminaUpdate = 0

-- ============================================================================
-- MAIN STATUS LOOP
-- ============================================================================

CreateThread(function()
    while true do
        Wait(Config.StatusUpdateInterval or 500)
        
        local ped = PlayerPedId()
        
        -- Health berechnen (GTA gibt 100-200 zurück)
        local health = GetEntityHealth(ped)
        local maxHealth = GetEntityMaxHealth(ped)
        local healthPercent = 0
        
        if maxHealth > 100 then
            healthPercent = math.floor(((health - 100) / (maxHealth - 100)) * 100)
        else
            healthPercent = health
        end
        healthPercent = math.max(0, math.min(100, healthPercent))
        
        -- Armor
        local armor = GetPedArmour(ped)
        
        -- Status Daten
        local statusData = {
            health = healthPercent,
            armor = armor
        }
        
        -- ================================================================
        -- ESX STATUS
        -- ================================================================
        if Framework == 'esx' and FrameworkObject then
            -- esx_status Integration
            if Config.EnableHunger or Config.EnableThirst then
                local success, _ = pcall(function()
                    local status = exports['esx_status']
                    
                    if Config.EnableHunger then
                        local hungerStatus = status:getStatus('hunger')
                        if hungerStatus then
                            statusData.hunger = hungerStatus.percent or 100
                        end
                    end
                    
                    if Config.EnableThirst then
                        local thirstStatus = status:getStatus('thirst')
                        if thirstStatus then
                            statusData.thirst = thirstStatus.percent or 100
                        end
                    end
                end)
            end
        end
        
        -- ================================================================
        -- QB-CORE STATUS
        -- ================================================================
        if Framework == 'qb' and FrameworkObject then
            local PlayerData = FrameworkObject.Functions.GetPlayerData()
            
            if PlayerData and PlayerData.metadata then
                if Config.EnableHunger then
                    statusData.hunger = PlayerData.metadata.hunger or 100
                end
                if Config.EnableThirst then
                    statusData.thirst = PlayerData.metadata.thirst or 100
                end
                if Config.EnableStress then
                    statusData.stress = PlayerData.metadata.stress or 0
                end
            end
        end
        
        -- ================================================================
        -- STAMINA (Universal)
        -- ================================================================
        if Config.EnableStamina then
            -- Stamina über Ped Status berechnen
            local isSprinting = IsPedSprinting(ped)
            local isSwimming = IsPedSwimming(ped)
            local isClimbing = IsPedClimbing(ped)
            local isJumping = IsPedJumping(ped)
            
            local now = GetGameTimer()
            local deltaTime = (now - lastStaminaUpdate) / 1000.0
            lastStaminaUpdate = now
            
            if isSprinting or isSwimming or isClimbing or isJumping then
                -- Stamina verringern
                local drainRate = 2.0
                if isSwimming then drainRate = 3.0 end
                if isClimbing then drainRate = 4.0 end
                
                cachedStamina = math.max(0, cachedStamina - (drainRate * deltaTime * 10))
            else
                -- Stamina regenerieren
                local regenRate = 1.5
                if not IsPedWalking(ped) and not IsPedRunning(ped) then
                    regenRate = 3.0 -- Schnellere Regeneration im Stillstand
                end
                
                cachedStamina = math.min(100, cachedStamina + (regenRate * deltaTime * 10))
            end
            
            statusData.stamina = math.floor(cachedStamina)
        end
        
        -- ================================================================
        -- OXYGEN (Nur im Wasser anzeigen)
        -- ================================================================
        if Config.EnableOxygen then
            local isUnderwater = IsPedSwimmingUnderWater(ped)
            local isInWater = IsPedSwimming(ped)

            if isUnderwater then
                local remainingAir = GetPlayerUnderwaterTimeRemaining(PlayerId())
                local maxAir = 10.0 -- FiveM Standard

                local oxygen = (remainingAir / maxAir) * 100
                statusData.oxygen = math.floor(math.max(0, math.min(100, oxygen)))
                statusData.showOxygen = true
            elseif isInWater then
                statusData.oxygen = 100
                statusData.showOxygen = true
            else
                -- Nicht im Wasser - Widget ausblenden
                statusData.oxygen = 100
                statusData.showOxygen = false
            end
        end
        
        -- Status an NUI senden
        SendNUI('updateHud', statusData)
    end
end)

-- ============================================================================
-- QB-CORE STRESS EVENT
-- ============================================================================

CreateThread(function()
    Wait(1500) -- Warten bis Framework erkannt
    
    if Framework == 'qb' then
        RegisterNetEvent('hud:client:UpdateStress', function(stress)
            if Config.EnableStress then
                SendNUI('updateHud', { stress = stress })
            end
        end)
    end
end)

-- ============================================================================
-- EXTERNAL STATUS UPDATES
-- ============================================================================

-- Event für externe Status Updates
RegisterNetEvent('hud:updateStatus', function(statusType, value)
    local data = {}
    data[statusType] = value
    SendNUI('updateHud', data)
end)

-- Mehrere Status auf einmal
RegisterNetEvent('hud:updateStatuses', function(statuses)
    if type(statuses) == 'table' then
        SendNUI('updateHud', statuses)
    end
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports('updateStatus', function(statusType, value)
    local data = {}
    data[statusType] = value
    SendNUI('updateHud', data)
end)

exports('updateStatuses', function(statuses)
    if type(statuses) == 'table' then
        SendNUI('updateHud', statuses)
    end
end)

exports('setHealth', function(value)
    SendNUI('updateHud', { health = math.max(0, math.min(100, value)) })
end)

exports('setArmor', function(value)
    SendNUI('updateHud', { armor = math.max(0, math.min(100, value)) })
end)

exports('setHunger', function(value)
    SendNUI('updateHud', { hunger = math.max(0, math.min(100, value)) })
end)

exports('setThirst', function(value)
    SendNUI('updateHud', { thirst = math.max(0, math.min(100, value)) })
end)

exports('setStress', function(value)
    SendNUI('updateHud', { stress = math.max(0, math.min(100, value)) })
end)

exports('setOxygen', function(value)
    SendNUI('updateHud', { oxygen = math.max(0, math.min(100, value)) })
end)

exports('setStamina', function(value)
    cachedStamina = math.max(0, math.min(100, value))
    SendNUI('updateHud', { stamina = math.floor(cachedStamina) })
end)
