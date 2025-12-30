-- Vehicle HUD Updates
-- Sendet Fahrzeug-Daten an das HUD

-- ============================================================================
-- VARIABLES
-- ============================================================================

local lastVehicle = nil
local wasInVehicle = false
local cachedVehicleType = nil

-- ============================================================================
-- VEHICLE TYPE DETECTION
-- ============================================================================

local function GetVehicleTypeFromModel(vehicle)
    local model = GetEntityModel(vehicle)
    local vehicleClass = GetVehicleClass(vehicle)
    
    -- Helikopter (Class 15)
    if vehicleClass == 15 or IsThisModelAHeli(model) then
        return 'helicopter'
    end
    
    -- Flugzeug (Class 16)
    if vehicleClass == 16 or IsThisModelAPlane(model) then
        return 'plane'
    end
    
    -- Boot (Class 14)
    if vehicleClass == 14 or IsThisModelABoat(model) then
        return 'boat'
    end
    
    -- Fahrrad (Class 13)
    if vehicleClass == 13 or IsThisModelABicycle(model) then
        return 'bicycle'
    end
    
    -- Motorrad (Class 8)
    if vehicleClass == 8 or IsThisModelABike(model) then
        return 'motorcycle'
    end
    
    -- Standard: Auto
    return 'car'
end

-- ============================================================================
-- VEHICLE DATA COLLECTION
-- ============================================================================

local function GetVehicleData(vehicle, vehicleType)
    local data = {
        inVehicle = true,
        vehicleType = vehicleType,
        speed = GetEntitySpeed(vehicle) * 3.6, -- m/s zu km/h
        fuel = GetVehicleFuelLevel(vehicle),
        engineHealth = math.floor(GetVehicleEngineHealth(vehicle) / 10), -- 0-100
        heading = GetEntityHeading(vehicle)
    }
    
    -- ================================================================
    -- AUTO / MOTORRAD
    -- ================================================================
    if vehicleType == 'car' or vehicleType == 'motorcycle' then
        data.gear = GetVehicleCurrentGear(vehicle)
        data.rpm = math.floor(GetVehicleCurrentRpm(vehicle) * 100)
        
        -- Motor Status
        data.engineRunning = GetIsVehicleEngineRunning(vehicle)
        
        -- Lichter
        local lightsOn, highbeamsOn = GetVehicleLightsState(vehicle)
        data.lights = lightsOn == 1
        data.highbeams = highbeamsOn == 1
        
        -- Blinker (Native nicht verfügbar, aber manche Frameworks fügen es hinzu)
        data.indicatorLeft = IsVehicleIndicatorLightOn(vehicle, 0)
        data.indicatorRight = IsVehicleIndicatorLightOn(vehicle, 1)
    end
    
    -- ================================================================
    -- FLUGZEUG
    -- ================================================================
    if vehicleType == 'plane' then
        local velocity = GetEntityVelocity(vehicle)
        local rotation = GetEntityRotation(vehicle, 2)
        local coords = GetEntityCoords(vehicle)
        
        -- Geschwindigkeit = Magnitude des Velocity Vectors
        local airspeed = math.sqrt(velocity.x^2 + velocity.y^2 + velocity.z^2) * 3.6
        
        data.altitude = math.floor(coords.z)
        data.airspeed = math.floor(airspeed)
        data.pitch = rotation.x
        data.roll = rotation.y
        data.landingGear = IsVehicleLandingGearDown(vehicle)
        
        -- Flap Position (für manche Flugzeuge)
        data.flaps = GetVehicleFlightNozzlePosition(vehicle) or 0
        
        -- Vertikale Geschwindigkeit
        data.verticalSpeed = math.floor(velocity.z * 3.6)
    end
    
    -- ================================================================
    -- HELIKOPTER
    -- ================================================================
    if vehicleType == 'helicopter' then
        local velocity = GetEntityVelocity(vehicle)
        local rotation = GetEntityRotation(vehicle, 2)
        local coords = GetEntityCoords(vehicle)
        
        -- Horizontale Geschwindigkeit
        local horizontalSpeed = math.sqrt(velocity.x^2 + velocity.y^2) * 3.6
        
        data.altitude = math.floor(coords.z)
        data.airspeed = math.floor(horizontalSpeed)
        data.verticalSpeed = math.floor(velocity.z * 3.6)
        data.pitch = rotation.x
        data.roll = rotation.y
        
        -- Rotor Health als RPM Indikator
        local mainRotorHealth = GetHeliMainRotorHealth(vehicle)
        local tailRotorHealth = GetHeliTailRotorHealth(vehicle)
        data.rotorRpm = mainRotorHealth > 0 and math.floor(mainRotorHealth * 100) or 0
        data.tailRotorHealth = math.floor(tailRotorHealth * 100)
        
        -- Engine Status
        data.engineRunning = GetIsVehicleEngineRunning(vehicle)
    end
    
    -- ================================================================
    -- BOOT
    -- ================================================================
    if vehicleType == 'boat' then
        local velocity = GetEntityVelocity(vehicle)
        
        -- Geschwindigkeit in Knoten (1 m/s ≈ 1.944 Knoten)
        local speedKnots = math.sqrt(velocity.x^2 + velocity.y^2) * 1.944
        data.speedKnots = math.floor(speedKnots)
        
        -- Anchor (GTA hat kein natives System, aber manche Frameworks)
        data.anchor = false
        
        -- Engine Status
        data.engineRunning = GetIsVehicleEngineRunning(vehicle)
    end
    
    -- ================================================================
    -- FAHRRAD
    -- ================================================================
    if vehicleType == 'bicycle' then
        -- Keine speziellen Daten für Fahrräder
        data.fuel = nil -- Fahrräder haben keinen Treibstoff
    end
    
    return data
end

-- ============================================================================
-- MAIN VEHICLE LOOP
-- ============================================================================

CreateThread(function()
    while true do
        Wait(Config.VehicleUpdateInterval or 100)
        
        local ped = PlayerPedId()
        local inVehicle = IsPedInAnyVehicle(ped, false)
        
        if inVehicle then
            local vehicle = GetVehiclePedIsIn(ped, false)
            
            -- Fahrzeugtyp nur neu berechnen wenn anderes Fahrzeug
            if vehicle ~= lastVehicle then
                cachedVehicleType = GetVehicleTypeFromModel(vehicle)
                lastVehicle = vehicle
            end
            
            -- Fahrzeug-Daten sammeln und senden
            local vehicleData = GetVehicleData(vehicle, cachedVehicleType)
            SendNUI('updateVehicle', vehicleData)
            
            wasInVehicle = true
        else
            -- Spieler hat Fahrzeug verlassen
            if wasInVehicle then
                SendNUI('updateVehicle', {
                    inVehicle = false,
                    vehicleType = 'car',
                    speed = 0
                })
                
                wasInVehicle = false
                lastVehicle = nil
                cachedVehicleType = nil
            end
        end
    end
end)

-- ============================================================================
-- SEATBELT INTEGRATION
-- ============================================================================

-- Generisches Seatbelt Event
RegisterNetEvent('hud:seatbelt', function(hasSeatbelt)
    SendNUI('updateVehicle', { seatbelt = hasSeatbelt })
end)

-- Compatibility mit verschiedenen Seatbelt Scripts
CreateThread(function()
    Wait(2000)
    
    -- seatbelt Resource
    if GetResourceState('seatbelt') == 'started' then
        RegisterNetEvent('seatbelt:toggle', function(hasSeatbelt)
            SendNUI('updateVehicle', { seatbelt = hasSeatbelt })
        end)
    end
    
    -- Renewed-Scripts Seatbelt
    if GetResourceState('Renewed-Seatbelt') == 'started' then
        RegisterNetEvent('Renewed-Seatbelt:BuckleUp', function()
            SendNUI('updateVehicle', { seatbelt = true })
        end)
        RegisterNetEvent('Renewed-Seatbelt:Unbuckle', function()
            SendNUI('updateVehicle', { seatbelt = false })
        end)
    end
end)

-- ============================================================================
-- EXPORTS
-- ============================================================================

exports('isInVehicle', function()
    return wasInVehicle
end)

exports('getVehicleType', function()
    return cachedVehicleType
end)

exports('getVehicleData', function()
    if wasInVehicle and lastVehicle then
        return GetVehicleData(lastVehicle, cachedVehicleType)
    end
    return nil
end)

exports('updateVehicleData', function(data)
    if type(data) == 'table' then
        SendNUI('updateVehicle', data)
    end
end)

-- ============================================================================
-- EVENTS
-- ============================================================================

-- Manuelles Vehicle Update
RegisterNetEvent('hud:updateVehicle', function(data)
    if type(data) == 'table' then
        SendNUI('updateVehicle', data)
    end
end)
