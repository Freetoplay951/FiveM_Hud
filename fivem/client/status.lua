-- Status Updates (Health, Armor, etc.)
local cachedStamina = 100

CreateThread(function()
    while true do
        Wait(Config.StatusUpdateInterval)
        
        local playerPed = PlayerPedId()
        
        local health = GetEntityHealth(playerPed)
        local maxHealth = GetEntityMaxHealth(playerPed)
        local armor = GetPedArmour(playerPed)
        
        -- Health normalisieren (GTA gibt 100-200 zurück, wir wollen 0-100)
        local healthPercent = math.floor(((health - 100) / (maxHealth - 100)) * 100)
        healthPercent = math.max(0, math.min(100, healthPercent))
        
        local data = {
            health = healthPercent,
            armor = armor
        }
        
        -- Hunger/Thirst (ESX)
        if Framework == 'esx' then
            if Config.EnableHunger and IsResourceStarted('esx_status') then
                local success, status = pcall(function()
                    return exports['esx_status']:getStatus('hunger')
                end)
                if success and status then
                    data.hunger = status.percent
                end
                
                local successThirst, thirst = pcall(function()
                    return exports['esx_status']:getStatus('thirst')
                end)
                if successThirst and thirst then
                    data.thirst = thirst.percent
                end
            end
        end
        
        -- Hunger/Thirst (QB-Core)
        if Framework == 'qb' then
            local PlayerData = QBCore.Functions.GetPlayerData()
            if PlayerData and PlayerData.metadata then
                if Config.EnableHunger then
                    data.hunger = PlayerData.metadata.hunger or 100
                end
                if Config.EnableThirst then
                    data.thirst = PlayerData.metadata.thirst or 100
                end
                if Config.EnableStress then
                    data.stress = PlayerData.metadata.stress or 0
                end
            end
        end
        
        -- Stamina (korrigiert - keine ungültige Native mehr)
        if Config.EnableStamina then
            local sprinting = IsPedSprinting(playerPed)
            local swimming = IsPedSwimming(playerPed)
            
            if sprinting or swimming then
                -- Stamina verringert sich beim Sprinten/Schwimmen
                cachedStamina = math.max(0, cachedStamina - 2)
            else
                -- Stamina regeneriert sich
                cachedStamina = math.min(100, cachedStamina + 1)
            end
            
            data.stamina = cachedStamina
        end
        
        -- Oxygen (Unterwasser)
        if Config.EnableOxygen then
            local underwater = IsPedSwimmingUnderWater(playerPed)
            if underwater then
                data.oxygen = GetPlayerUnderwaterTimeRemaining(PlayerId()) * 10
            else
                data.oxygen = 100
            end
        end
        
        SendNUI('updateHud', data)
    end
end)

-- Stress Events (QB-Core Beispiel)
-- Wird nach Framework-Detection registriert
CreateThread(function()
    Wait(1000) -- Warten bis Framework erkannt wurde
    
    if Framework == 'qb' then
        RegisterNetEvent('hud:client:UpdateStress')
        AddEventHandler('hud:client:UpdateStress', function(stress)
            if Config.EnableStress then
                SendNUI('updateHud', {
                    stress = stress
                })
            end
        end)
    end
end)

-- Externe Status Updates (für andere Resourcen)
RegisterNetEvent('hud:updateStatus')
AddEventHandler('hud:updateStatus', function(statusType, value)
    local data = {}
    data[statusType] = value
    SendNUI('updateHud', data)
end)

-- Exports
exports('updateStatus', function(statusType, value)
    local data = {}
    data[statusType] = value
    SendNUI('updateHud', data)
end)
