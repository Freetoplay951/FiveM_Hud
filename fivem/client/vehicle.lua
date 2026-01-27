-- ============================================================================
-- FUNCTIONS
-- ============================================================================

local hashToModelName = {}
CreateThread(function()
    local allModels = GetAllVehicleModels()
    for _, modelName in ipairs(allModels) do
        local hash = GetHashKey(modelName)
        hashToModelName[hash] = modelName
    end
end)

local function GetSpawnNameFromVehicle(vehicle)
    local modelHash = GetEntityModel(vehicle)
    return hashToModelName[modelHash]
end

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
        return VehicleType.HELICOPTER
    end
    
    -- Flugzeug (Class 16)
    if vehicleClass == 16 or IsThisModelAPlane(model) then
        return VehicleType.PLANE
    end
    
    -- Boot (Class 14)
    if vehicleClass == 14 or IsThisModelABoat(model) then
        return VehicleType.BOAT
    end
    
    -- Fahrrad (Class 13)
    if vehicleClass == 13 or IsThisModelABicycle(model) then
        return VehicleType.BICYCLE
    end
    
    -- Motorrad (Class 8)
    if vehicleClass == 8 or IsThisModelABike(model) then
        return VehicleType.MOTORCYCLE
    end
    
    -- Standard: Auto
    return VehicleType.CAR
end

-- ============================================================================
-- FRAMEWORK ANCHOR DETECTION
-- ============================================================================

local function GetBoatAnchorState(vehicle)
    -- Try various frameworks that support anchor
    
    -- jg-advancedgarages / jg-mechanic anchor system
    local success, result = pcall(function()
        return Entity(vehicle).state.anchor
    end)
    if success and result ~= nil then
        return result
    end
    
    -- ESX boat anchor (some scripts use this)
    success, result = pcall(function()
        return exports['esx_boat']:IsAnchorDropped(vehicle)
    end)
    if success and result ~= nil then
        return result
    end
    
    -- QB-Core boat scripts
    success, result = pcall(function()
        return exports['qb-boat']:GetAnchorState(vehicle)
    end)
    if success and result ~= nil then
        return result
    end
    
    -- Renewed-Vehicles anchor
    success, result = pcall(function()
        return exports['Renewed-Vehiclekeys']:GetBoatAnchor(vehicle)
    end)
    if success and result ~= nil then
        return result
    end
    
    -- okokBoats anchor
    success, result = pcall(function()
        return exports['okokBoats']:IsAnchorDown(vehicle)
    end)
    if success and result ~= nil then
        return result
    end
    
    -- Default: check if vehicle is stationary (basic anchor detection)
    local speed = GetEntitySpeed(vehicle)
    if speed < 0.5 then
        -- Check if handbrake is applied (closest to anchor for boats in vanilla)
        return GetVehicleHandbrake(vehicle)
    end
    
    return false
end

-- ============================================================================
-- VEHICLE DATA COLLECTION
-- ============================================================================

vehicleRotorSpeeds = vehicleRotorSpeeds or {}
local function UpdateHelicopterData(vehicle, data)
    if not DoesEntityExist(vehicle) then
        return
    end

    local velocity = GetEntityVelocity(vehicle)
    local rotation = GetEntityRotation(vehicle, 2)
    local coords   = GetEntityCoords(vehicle)

    -- Geschwindigkeit
    local horizontalSpeed = math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y) * 3.6

    -- Basis-Daten
    data.altitude       = math.floor(coords.z)
    data.airspeed       = math.floor(horizontalSpeed)
    data.verticalSpeed  = math.floor(velocity.z * 3.6)
    data.pitch          = rotation.x
    data.roll           = rotation.y
    data.engineRunning  = GetIsVehicleEngineRunning(vehicle)

    -- Input (Throttle / Collective)
    local throttle = data.engineRunning and GetControlNormal(0, 71) or 0.0

    -- Ziel-Rotor-Speed berechnen (0.0 – 1.0)
    local idleSpeed    = 0.2
    local maxSpeed     = 1.0
    local forwardSpeed = math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)

    local targetRotorSpeed = idleSpeed + throttle * (maxSpeed - idleSpeed)
    targetRotorSpeed = math.max(targetRotorSpeed, idleSpeed + forwardSpeed / 50.0)
    targetRotorSpeed = math.min(targetRotorSpeed, 1.0)

    -- Smooth Lerp: vorheriger Wert → Zielwert
    local currentRotorSpeed = vehicleRotorSpeeds[vehicle] or idleSpeed
    local lerpSpeed         = 0.05 -- je kleiner, desto langsamer / smoother

    currentRotorSpeed = currentRotorSpeed + (targetRotorSpeed - currentRotorSpeed) * lerpSpeed

    -- Animation setzen
    SetHeliBladesSpeed(vehicle, currentRotorSpeed)

    -- Speichern für HUD / NUI
    vehicleRotorSpeeds[vehicle] = currentRotorSpeed
    data.rotorRpm = math.floor(currentRotorSpeed * 100)

    -- Tail-Rotor Health (0–100 %)
    local tailRotorHealth = Citizen.InvokeNative(0x33EE6E2B, vehicle, Citizen.ResultAsFloat())
    data.tailRotorHealth  = math.floor((tailRotorHealth / 1000.0) * 100)
end

local function GetVehicleData(vehicle, vehicleType)
    -- Get display name from game
    local vehicleDisplayName = GetDisplayNameFromVehicleModel(GetEntityModel(vehicle))
    local vehicleName = GetLabelText(vehicleDisplayName)
    
    -- Fallback if label not found
    if vehicleName == "NULL" or vehicleName == "" then
        vehicleName = vehicleDisplayName
    end
    
    local data = {
        inVehicle = true,
        vehicleType = vehicleType,
        vehicleName = vehicleName or json.null,
        vehicleSpawnName = GetSpawnNameFromVehicle(vehicle) or json.null,
        speed = GetEntitySpeed(vehicle) * 3.6, -- m/s zu km/h
        fuel = GetVehicleFuelLevel(vehicle),
        heading = GetEntityHeading(vehicle)
    }

    local function CalcHealthStatus(vehicle, vehicleType)
        local fn = Config and Config.BodyHealth and Config.BodyHealth.calc
        if type(fn) == 'function' then
            local ok, result = pcall(fn, vehicle, vehicleType)
            if not ok then
                print(('[HUD Vehicle] ERROR in custom calc(): %s | vehicle=%s type=%s'):format(result, tostring(vehicle), tostring(vehicleType)))
            elseif IsValidHealthStatus(result) then
                return result
            else
                print(('[HUD Vehicle] WARNING: Invalid return value from calc(): %s | vehicle=%s type=%s'):format(tostring(result), tostring(vehicle), tostring(vehicleType)))
            end
        else
            print('[HUD Vehicle] INFO: No valid custom calc() function found, using fallback.')
        end
        
        if not IsVehicleDriveable(vehicle, false) then
            print("[HUD Vehicle] Using fallback | vehicle is not drivable")
            return VehicleHealthStatus.CRITICAL
        end
        
        local engineHealth = math.max(0, math.floor(GetVehicleEngineHealth(vehicle) / 10))
        local bodyHealth = math.max(0, math.floor(GetVehicleBodyHealth(vehicle) / 10))
        local tankHealth = math.max(0, math.floor(GetVehiclePetrolTankHealth(vehicle) / 10))
        
        local e = tonumber(engineHealth) or 100
        local b = tonumber(bodyHealth) or 100
        local t = tonumber(tankHealth) or 100
        local min = math.min(e, b, t)        
        
        print(('[HUD Vehicle] Using fallback | engine=%s body=%s tank=%s min=%.1f'):format(e, b, t, min))

        if min < 40 then
            return VehicleHealthStatus.CRITICAL
        elseif min < 70 then
            return VehicleHealthStatus.WARNING
        else
            return VehicleHealthStatus.GOOD
        end
    end

    data.healthStatus = CalcHealthStatus(vehicle, vehicleType)
    
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
        
        -- Blinker
        -- 0 = keine Blinker
        -- 1 = linker Blinker an
        -- 2 = rechter Blinker an
        -- 3 = beide Blinker an
        local lights = GetVehicleIndicatorLights(vehicle)
        data.indicatorLeft = lights == 1 or lights == 3
        data.indicatorRight = lights == 2 or lights == 3
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
        
        local state = GetLandingGearState(vehicle)
        
        data.altitude = math.floor(coords.z)
        data.airspeed = math.floor(airspeed)
        data.pitch = rotation.x
        data.roll = rotation.y
        data.landingGear = state == 0 or state == 2
        
        -- Flap Position (für manche Flugzeuge)
        data.flaps = GetVehicleFlightNozzlePosition(vehicle) or 0
        
        -- Vertikale Geschwindigkeit
        data.verticalSpeed = math.floor(velocity.z * 3.6)
    end
    
    -- ================================================================
    -- HELIKOPTER
    -- ================================================================
    if vehicleType == 'helicopter' then
        UpdateHelicopterData(vehicle, data)
    end
    
    -- ================================================================
    -- BOOT
    -- ================================================================
    if vehicleType == 'boat' then
        local velocity = GetEntityVelocity(vehicle)
        
        -- Geschwindigkeit in Knoten (1 m/s ≈ 1.944 Knoten)
        local speedKnots = math.sqrt(velocity.x^2 + velocity.y^2) * 1.944
        data.speedKnots = math.floor(speedKnots)
        
        -- Anchor state from frameworks
        data.anchor = GetBoatAnchorState(vehicle)
        
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

local function refreshVehicle()
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
                inVehicle = false
            })
            
            wasInVehicle = false
            lastVehicle = nil
            cachedVehicleType = nil
        end
    end
end

AddEventHandler("hud:loaded", function()
    if Config.Debug then
        print('[HUD Vehicle] Loading vehicle system')
    end
    
    refreshVehicle()
    
    CreateThread(function()
        while true do
            Wait(Config and Config.VehicleUpdateInterval or 100)
            refreshVehicle()
        end
    end)
end)

-- ============================================================================
-- SEATBELT INTEGRATION
-- ============================================================================

-- Generisches Seatbelt Event
RegisterNetEvent('hud:seatbelt', function(hasSeatbelt)
    SendNUI('updateVehicle', { seatbelt = hasSeatbelt })
end)


AddEventHandler("hud:loaded", function()
    if Config.Debug then
        print('[HUD Vehicle] Loading seatbelt system')
    end
    
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
    
    -- QB-Seatbelt
    if GetResourceState('qb-seatbelt') == 'started' then
        local qbSeatbeltOn = false
        RegisterNetEvent('seatbelt:client:ToggleSeatbelt', function(toggle)
            if toggle == nil then
                qbSeatbeltOn = not qbSeatbeltOn
            else
                qbSeatbeltOn = toggle
            end

            SendNUI('updateVehicle', { seatbelt = qbSeatbeltOn })
        end)
    end
end)

-- ============================================================================
-- ANCHOR INTEGRATION
-- ============================================================================

AddEventHandler('gameEventTriggered', function(name, data)
    if (name ~= "CEventNetworkPlayerEnteredVehicle") then
        return
    end
    
    if (Config.StopVehicleRadioOnEnter ~= true) then
        return
    end
    
    local playerId = GetPlayerFromServerId(data[1])
    local ped = GetPlayerPed(playerId)
    local vehicle = data[2]

    if ped == PlayerPedId() and vehicle ~= 0 then
        SetVehRadioStation(vehicle, "OFF")
        if Config and Config.Debug then
            print('[HUD Vehicle] Vehicle radio disabled')
        end
    end
end)


-- ============================================================================
-- ANCHOR INTEGRATION
-- ============================================================================

-- Manual anchor event
RegisterNetEvent('hud:anchor', function(anchorState)
    SendNUI('updateVehicle', { anchor = anchorState })
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