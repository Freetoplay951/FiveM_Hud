local lastVehicle = nil
local wasInVehicle = false

-- Fahrzeug Typ bestimmen
function GetVehicleType(vehicle)
    local vehicleClass = GetVehicleClass(vehicle)
    local model = GetEntityModel(vehicle)
    
    -- Helikopter
    if IsThisModelAHeli(model) then
        return 'helicopter'
    end
    
    -- Flugzeug
    if IsThisModelAPlane(model) then
        return 'plane'
    end
    
    -- Boot
    if IsThisModelABoat(model) then
        return 'boat'
    end
    
    -- Standard: Auto
    return 'car'
end

-- Fahrzeug Updates
CreateThread(function()
    while true do
        Wait(Config.VehicleUpdateInterval)
        
        local playerPed = PlayerPedId()
        local inVehicle = IsPedInAnyVehicle(playerPed, false)
        
        if inVehicle then
            local vehicle = GetVehiclePedIsIn(playerPed, false)
            local vehicleType = GetVehicleType(vehicle)
            
            local data = {
                inVehicle = true,
                vehicleType = vehicleType,
                speed = GetEntitySpeed(vehicle) * 3.6, -- m/s zu km/h
                fuel = GetVehicleFuelLevel(vehicle),
                engineHealth = GetVehicleEngineHealth(vehicle) / 10, -- 0-100
                heading = GetEntityHeading(vehicle)
            }
            
            -- Auto-spezifische Daten
            if vehicleType == 'car' then
                data.gear = GetVehicleCurrentGear(vehicle)
                data.rpm = GetVehicleCurrentRpm(vehicle) * 100
            end
            
            -- Flugzeug-spezifische Daten
            if vehicleType == 'plane' then
                local velocity = GetEntityVelocity(vehicle)
                local rotation = GetEntityRotation(vehicle, 2)
                
                data.altitude = GetEntityCoords(vehicle).z
                data.airspeed = #velocity * 3.6 -- Airspeed in km/h
                data.pitch = rotation.x
                data.roll = rotation.y
                data.landingGear = IsVehicleLandingGearDown(vehicle) and true or false
                data.flaps = GetVehicleFlightNozzlePosition(vehicle) or 0
            end
            
            -- Helikopter-spezifische Daten
            if vehicleType == 'helicopter' then
                local velocity = GetEntityVelocity(vehicle)
                local rotation = GetEntityRotation(vehicle, 2)
                
                data.altitude = GetEntityCoords(vehicle).z
                data.airspeed = math.sqrt(velocity.x^2 + velocity.y^2) * 3.6 -- Horizontale Geschwindigkeit
                data.verticalSpeed = velocity.z * 3.6 -- Vertikale Geschwindigkeit
                data.pitch = rotation.x
                data.roll = rotation.y
                data.rotorRpm = GetHeliMainRotorHealth(vehicle) > 0 and 100 or 0
            end
            
            -- Boot-spezifische Daten
            if vehicleType == 'boat' then
                data.anchor = false -- GTA hat kein natives Anker-System
            end
            
            SendNUI('updateVehicle', data)
            
            lastVehicle = vehicle
            wasInVehicle = true
        else
            if wasInVehicle then
                -- Spieler hat Fahrzeug verlassen
                SendNUI('updateVehicle', {
                    inVehicle = false,
                    vehicleType = 'car',
                    speed = 0
                })
                wasInVehicle = false
                lastVehicle = nil
            end
        end
    end
end)

-- Seatbelt Support (optional, falls vorhanden)
if GetResourceState('seatbelt') == 'started' then
    RegisterNetEvent('seatbelt:toggle')
    AddEventHandler('seatbelt:toggle', function(hasSeatbelt)
        SendNUI('updateVehicle', {
            seatbelt = hasSeatbelt
        })
    end)
end
