var lastUpdated = null;
var startTime = null;
var duration = null;
var elapsedTime = null;
var running = false;

function generateResultsSeries() {
    if (startTime == null && running) {
        startTime = new Date();
        lastUpdated = startTime;
    } else {
        lastUpdated = new Date();
    }
    
    lastUpdatedTime = lastUpdated.getTime();

    elapsedTime = lastUpdatedTime - startTime.getTime();

    percentage = (elapsedTime / duration) * 100;

    var error = (Math.random() * 100) > 99.8;

    var result = {
        lastUpdated: lastUpdatedTime,
        EndOfStream: elapsedTime > duration,
        stop: elapsedTime > duration,
        percentage_complete: percentage,
        data: {
            Sent: [
                    { x : elapsedTime, y : getRandomY(elapsedTime, duration) }
                ],
            Recieved: [
                    { x : elapsedTime, y : getRandomY(elapsedTime, duration) }
                ]
        }
    }

    if (error) {
        result.is_error = true;
        result.messages = [
            {
                'content': 'The defibrilator seized the mecha-crank and all hope is lost!', 
                'header': 'Computer Malfunction & Error', 
                'is_error': true
            }
        ];
    }

    if (elapsedTime > duration) {
        endGeneration();
    }

    // console.log('Elapsed: ' + elapsedTime + ', Duration: ' + duration);

    return JSON.stringify(result);
}

function getRandomY(elapsedTime, duration) {
    if(elapsedTime > 1000 && elapsedTime < duration - 1000){
        return Math.random()*0.1 + 11;
    }else{
        return 0;
    }
}

function endGeneration() {
    running = false;
}

function setDuration(minutes) {
    duration = minutes * 15 * 1000;
}

function setRunning() {
    running = true;
    startTime = null;
}

function generateFinalTable() {
    var finalTable = getFinalTable();
    return JSON.stringify(finalTable);
}

function getFinalTable() {
    var finalTable = {};

    finalTable.status = getRandomStatus();
    finalTable.display_message = finalTable.status == 'pass' ? 'Your test completed successfully.' : 'Your test failed.';
    finalTable.result_id = 1;

    finalTable.players = new Array();

    for (var i = 0; i < 4; i++) {
        finalTable.players.push(getPlayer(i));
    }

    return finalTable;
}

function getRandomStatus() {
    return getRandomBool(20) ? "pass" : "fail";
}

function getPlayer(index) {
    var player = {};

    player.name = 'Player ' + index;
    player.timing_accuracy = getRandomTimeSyncAccuracy();
    player.has_time_sync_alert = getRandomHasTimeSyncAlert();
    player.tracks = new Array();

    for (var i = 0; i < 4; i++) {
        player.tracks.push(getTrack(i, player.has_time_sync_alert, player.timing_accuracy));
    }

    return player;
}

function getTrack(index, hasTimingAlert, accuracy) {
    var track = {};

    track.name = 'Track ' + index;
    track.cells = new Array();

    for (var i = 0; i < 4; i++) {
        track.cells.push(getCell(i, hasTimingAlert, accuracy));
    }

    return track;
}

function getCell(index, hasTimingAlert, accuracy) {
    var cell = {};

    cell.name = 'Cell ' + index;
    cell.value = getRandomCellValue();
    cell.data_type = getRandomDataType();
    cell.has_accuracy_alert = hasTimingAlert ? getRandomBool(80) : false;
    cell.accuracy_message = cell.has_accuracy_alert ? getAccuracyMessage(cell.value, accuracy) : null;
    cell.chart_data = getChartData(cell.name);

    return cell;
}

function getAccuracyMessage(value, accuracy) {
    var fixedAccuracy = accuracy.toFixed(3);
    var min = (value - accuracy).toFixed(3);
    var max = (value + accuracy).toFixed(3);
    return 'Possible error = +/- ' + fixedAccuracy + ' ms | Max time ' 
        + max + ' | Min time ' + min;
}

function getRandomCellValue() {
    return Math.floor(Math.random()*80000);
}

function getRandomDataType() {
    return getRandomBool(20) ? "positive" : "negative";
}

function getRandomHasTimeSyncAlert() {
    return getRandomBool(60);
}

function getRandomBool(failurePercent) {
    var random = Math.floor((Math.random()*100) + 1);

    return random > failurePercent;
}

function getRandomTimeSyncAccuracy() {
    return Math.random() * 100;
}

function getChartData(cellName) {
    var chartData = {};

    chartData[cellName] = new Array();

    for (var i = 0; i <= duration; i += 1000) {
        chartData[cellName].push({
            x: i,
            y: getRandomY()
        });
    }

    return chartData;
}

exports.generateResultsSeries = generateResultsSeries;
exports.endGeneration = endGeneration;
exports.setDuration = setDuration;
exports.setRunning = setRunning;
exports.generateFinalTable = generateFinalTable;
