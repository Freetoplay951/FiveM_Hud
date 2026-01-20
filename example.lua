shared = {
    SetFuel = function(vehicle, fuel)
		local fuel = type(fuel) == "number" and fuel or tonumber(fuel)

        if GetResourceState("LegacyFuel") == "started" then
            exports["LegacyFuel"]:SetFuel(vehicle, fuel)
        elseif GetResourceState("ox_fuel") == "started" then
            Entity(vehicle).state.fuel = fuel
        elseif GetResourceState("lc_fuel") == "started" then
            exports['lc_fuel']:SetFuel(vehicle, fuel)
        elseif GetResourceState("sna-fuel") == "started" or GetResourceState("esx-sna-fuel") == "started" then
            exports['esx-sna-fuel']:SetFuel(vehicle, fuel)
        elseif GetResourceState("okokGasStation") == "started" then
            exports['okokGasStation']:SetFuel(vehicle, fuel)
        elseif GetResourceState("ti_fuel") == "started" then
            exports['ti_fuel']:setFuel(vehicle, fuel)
        elseif GetResourceState("cdn-fuel") == "started" then
            exports['cdn-fuel']:SetFuel(vehicle, fuel)
        elseif GetResourceState("ps-fuel") == "started" then
            exports['ps-fuel']:SetFuel(vehicle, fuel)
        elseif GetResourceState("qb-fuel") == "started" then
            exports['qb-fuel']:SetFuel(vehicle, fuel)
        elseif GetResourceState("rcore_fuel") == "started" then
            exports['rcore_fuel']:SetVehicleFuel(vehicle, fuel)
        elseif GetResourceState("x-fuel") == "started" then
            exports['x-fuel']:SetFuel(vehicle, fuel)
        elseif GetResourceState("BigDaddy-Fuel") == "started" then
            exports['BigDaddy-Fuel']:SetFuel(vehicle, fuel)
        elseif GetResourceState("myFuel") == "started" then
            exports['myFuel']:SetFuel(vehicle, fuel)
        elseif GetResourceState("Renewed-Fuel") == "started" then
            exports['Renewed-Fuel']:SetFuel(vehicle, fuel)
        else
            SetVehicleFuelLevel(vehicle, fuel)
        end
    end,

    GetFuel = function(vehicle)
        if GetResourceState("LegacyFuel") == "started" then
            return exports["LegacyFuel"]:GetFuel(vehicle)
        elseif GetResourceState("ox_fuel") == "started" then
            return Entity(vehicle).state.fuel
        elseif GetResourceState("lc_fuel") == "started" then
            return exports['lc_fuel']:GetFuel(vehicle)
        elseif GetResourceState("sna-fuel") == "started" or GetResourceState("esx-sna-fuel") == "started" then
            return exports['esx-sna-fuel']:GetFuel(vehicle)
        elseif GetResourceState("okokGasStation") == "started" then
            return exports['okokGasStation']:GetFuel(vehicle)
        elseif GetResourceState("ti_fuel") == "started" then
            return exports['ti_fuel']:getFuel(vehicle)
        elseif GetResourceState("cdn-fuel") == "started" then
            return exports['cdn-fuel']:GetFuel(vehicle)
        elseif GetResourceState("ps-fuel") == "started" then
            return exports['ps-fuel']:GetFuel(vehicle)
        elseif GetResourceState("qb-fuel") == "started" then
            return exports['qb-fuel']:GetFuel(vehicle)
        elseif GetResourceState("rcore_fuel") == "started" then
            return exports['rcore_fuel']:GetVehicleFuelLiters(vehicle)
        elseif GetResourceState("x-fuel") == "started" then
            return exports['x-fuel']:GetFuel(vehicle)
        elseif GetResourceState("BigDaddy-Fuel") == "started" then
            return exports['BigDaddy-Fuel']:GetFuel(vehicle)
        elseif GetResourceState("myFuel") == "started" then
            return exports['myFuel']:GetFuel(vehicle)
        elseif GetResourceState("Renewed-Fuel") == "started" then
            return Entity(vehicle).state.fuel
        else
            return GetVehicleFuelLevel(vehicle)
        end
    end,

	Notify = function(msg, type, source)
        if GetResourceState("okokNotify") == "started" then
            if not source then 
                exports['okokNotify']:Alert('Notification', msg, 6000, type or 'info')
            else 
                TriggerClientEvent('okokNotify:Alert', source, 'Notification', msg, 6000, type or 'info') 
            end
        elseif GetResourceState("infinity-notify") == "started" then
            if not source then 
                TriggerEvent('infinity-notify:sendNotify', msg, type)
            else 
                TriggerClientEvent('infinity-notify:sendNotify', source, msg, type) 
            end
        elseif GetResourceState("ox_lib") == "started" then
            if not source then 
                exports.ox_lib:notify({description = msg, type = type or "success"})
            else 
                TriggerClientEvent('ox_lib:notify', source, { type = type or "success", description = msg }) 
            end
        elseif GetResourceState("t-notify") == "started" then
            if not source then 
                exports['t-notify']:Custom({title = 'Notification', style = type, message = msg, sound = true})
            else 
                TriggerClientEvent('t-notify:client:Custom', source, { style = type, duration = 6000, title = title, message = msg, sound = true, custom = true}) 
            end
        elseif GetResourceState("aty_uikitv2") == "started" then
            if not source then 
                exports['aty_uikitv2']:AddNotify({type = type, message = msg})
            else 
                TriggerClientEvent('aty_uikitv2:Notify', source, {type = type, message = msg}) 
            end
        elseif GetResourceState("qb-core") == "started" then
            if source then 
                TriggerClientEvent("QBCore:Notify", source, msg, type) 
            else 
                TriggerEvent("QBCore:Notify", msg, type)
            end
        elseif GetResourceState("es_extended") == "started" then
            if source then 
                TriggerClientEvent("esx:showNotification", source, msg) 
            else 
                TriggerEvent("esx:showNotification", msg) 
            end
        else
            print(msg)
        end
	end,

	RemoveKeyExport = function(plate, model)
        if GetResourceState("qb-vehiclekeys") == "started" then
            TriggerEvent("qb-vehiclekeys:client:RemoveKeys", plate)

        elseif GetResourceState("qs-vehiclekeys") == "started" then
            exports['qs-vehiclekeys']:RemoveKeys(plate, model)

        elseif GetResourceState("okokGarage") == "started" then
            TriggerServerEvent("okokGarage:RemoveKeys", plate, GetPlayerServerId(PlayerId()))

        elseif GetResourceState("Renewed") == "started" then
            exports['Renewed-Vehiclekeys']:removeKey(plate)

        elseif GetResourceState("wasabi_carlock") == "started" then
            exports['wasabi_carlock']:RemoveKey(plate)

        elseif GetResourceState("MrNewbScripts") == "started" then
            exports.MrNewbVehicleKeys:RemoveKeysByPlate(plate)

        elseif GetResourceState("ak47_vehiclekeys") == "started" then
            exports['ak47_vehiclekeys']:RemoveKey(plate, false)

        elseif GetResourceState("mk_vehiclekeys") == "started" then
            exports['mk_vehiclekeys']:RemoveKey(plate)

        elseif GetResourceState("sna-vehiclekeys") == "started" then
             TriggerServerEvent('qb-vehiclekeys:server:RemoveKey', plate)

        elseif GetResourceState("dusa_vehiclekeys") == "started" then
            exports['dusa_vehiclekeys']:RemoveKey(plate)
            
		end
    end,

    KeyExport = function(vehicle, plate)
       if GetResourceState("qb-vehiclekeys") == "started" then
            TriggerEvent("vehiclekeys:client:SetOwner", plate)
            TriggerEvent("qb-vehiclekeys:client:AddKeys", plate)

        elseif GetResourceState("okokGarage") == "started" then
            TriggerServerEvent("okokGarage:GiveKeys", plate)

        elseif GetResourceState("tgiann-hotwire") == "started" then
            exports["tgiann-hotwire"]:SetNonRemoveableIgnition(vehicle, true)

        elseif GetResourceState("Renewed-Vehiclekeys") == "started" then
            exports['Renewed-Vehiclekeys']:addKey(plate)

        elseif GetResourceState("wasabi_carlock") == "started" then
            exports['wasabi_carlock']:GiveKey(plate)

        elseif GetResourceState("MrNewbScripts") == "started" then
            exports.MrNewbVehicleKeys:GiveKeysByPlate(plate)

        elseif GetResourceState("ak47_vehiclekeys") == "started" then
            exports['ak47_vehiclekeys']:GiveKey(plate, false)

        elseif GetResourceState("mk_vehiclekeys") == "started" then
            exports['mk_vehiclekeys']:AddKey(vehicle)

        elseif GetResourceState("sna-vehiclekeys") == "started" then
            TriggerEvent("vehiclekeys:client:SetOwner", plate)

        elseif GetResourceState("dusa_vehiclekeys") == "started" then
            exports['dusa_vehiclekeys']:AddKey(plate)

        elseif GetResourceState("cxa-vehiclekeys") == "started" then
            TriggerServerEvent("cxa-vehiclekeys:server:addKeys", plate, GetEntityModel(vehicle))
        end
    end
}

function getShared()
    return shared
end

exports('getShared', getShared)