function generateUpdateConfigResponse(data) {
    var timingAccuracies = getTimingAccuraciesFor(data);
    var deviceTimeSyncCapabilities = getDeviceTimeSyncCapabilities(data);

    var random = Math.floor((Math.random()*100) + 1);

    if (random < 10) {
        return JSON.stringify({
            is_error: true,
            messages: [{ header: 'Fail', content: 'Something went horribly wrong.', success: false, is_error: true}]
        });
    }

    if (random < 40) {
        return JSON.stringify({
            is_error: true,
            error_type: 'DEVICE_AUTH',
            device_id: 2,
            messages: [{ header: 'Fail', content: 'Something went horribly wrong.', success: false, is_error: true}]
        });
    }


    return JSON.stringify({
        timing_accuracies: timingAccuracies,
        device_time_sync_capabilities: deviceTimeSyncCapabilities
    });
}

function getDeviceTimeSyncCapabilities(data) {
    var deviceIds = getDevicesFor(data);

    var timeSyncCapabilities = new Array();

    for (var i = 0; i < deviceIds.length; i++) {
        var hasTimeSyncCapability = getRandomHasTimeSyncCapability();

        timeSyncCapabilities.push({
            device_id: deviceIds[i],
            has_time_sync_capability: hasTimeSyncCapability,
            resolution: hasTimeSyncCapability ? getRandomAccuracy() : null
        });
    }

    return timeSyncCapabilities;
}

function getDevicesFor(data) {
    var deviceIds = new Array();

    if (data === null || data === undefined) {
        return deviceIds;
    }

    if (data.traffic_players === null || data.traffic_players === undefined) {
        return deviceIds;
    }

    for (var i = 0; i < data.traffic_players.length; i++) {
        addDeviceIds(data.traffic_players[i], deviceIds);
    }

    return deviceIds;
}

function addDeviceIds(trafficPlayer, deviceIds) {
    if (!isDeviceIdInDeviceIds(trafficPlayer.source.device.id, deviceIds)) {
        deviceIds.push(trafficPlayer.source.device.id);
    }

    if (!isDeviceIdInDeviceIds(trafficPlayer.destination.device.id, deviceIds)) {
        deviceIds.push(trafficPlayer.destination.device.id);
    }
}

function isDeviceIdInDeviceIds(id, deviceIds) {
    for (var i = 0; i < deviceIds.length; i++) {
        if (deviceIds[i] == id) {
            return true;
        }
    }

    return false;
}

function getRandomHasTimeSyncCapability() {
    var random = Math.floor((Math.random()*10) + 1);

    return random > 2;
}

function getTimingAccuraciesFor(data) {
    var tuples = getTuplesFor(data);

    var timingAccuracies = new Array();

    for (var i = 0; i < tuples.length; i++) {

        timingAccuracies.push({
            source_id: tuples[i].sourceId,
            destination_id: tuples[i].destinationId,
            accuracy: getRandomAccuracy()
        });
    }

    return timingAccuracies;
}

function getRandomAccuracy() {
    return Math.random() * 100;
}

function getTuplesFor(data) {
    var tuples = new Array();

    if (data === null || data === undefined) {
        return tuples;
    }

    if (data.traffic_players === null || data.traffic_players === undefined) {
        return tuples;
    }

    for (var i = 0; i < data.traffic_players.length; i++) {
        var tuple = getTupleForTrafficPlayer(data.traffic_players[i]);

        if (!isTupleInTuples(tuple, tuples)) {
            tuples.push(tuple);
        }
    }


    return tuples;
}

function getTupleForTrafficPlayer(trafficPlayer) {
    var tuple = {
        sourceId: trafficPlayer.source.device.id,
        destinationId: trafficPlayer.destination.device.id
    }

    return tuple;
}

function isTupleInTuples(tuple, tuples) {
    for (var i = 0; i < tuples.length; i++) {
        if (tuple.sourceId != tuples[i].sourceId) {
            continue;
        }

        if (tuple.destinationId == tuples[i].destinationId) {
            return true;
        }
    }

    return false;
}

exports.generateUpdateConfigResponse = generateUpdateConfigResponse