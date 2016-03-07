"use strict";

function TestResultsViewModel(testVm){
    var self = this;

    self.testVm = testVm;
    self.rootVm = testVm.rootVm;
    self.resultId = ko.observable();
    self.percentComplete = ko.observable();
    self.status = ko.observable();
    self.displayStatus = ko.computed(self.computeDisplayStatus.bind(self));
    self.displayMessage = ko.observable();
    self.selectedTab = ko.observable("chart");
    self.charts = ko.observableArray();
    self.traffics = ko.observableArray([
        {
            value: "Bandwidth",
            text: translate("Bandwidth")
        }
    ]);

    self.testCompleted = ko.observable(false);

    self.selectedTraffic = ko.observable(self.traffics()[0].value);
    self.trafficUnits = ko.observableArray([
        {
            value: "MBS",
            text: translate("MBS")
        },
        {
            value: "GBS",
            text: translate("GBS")
        }
    ]);
    self.selectedTrafficUnit = ko.observable(self.trafficUnits()[0].value);
    self.activeChart = ko.observable();
    self.chartCount = 0;
    self.finalTable = ko.observable();

    self.selectedGroup = ko.observable('Total Bandwidth');

    self.showDataTab = ko.observable();
    self.showApplicationTab = ko.observable();
    self.showVoiceVideoTab = ko.observable();
    self.showVoiceTab = ko.observable();
    self.showVideoTab = ko.observable();
    self.showResponseTimeTab = ko.observable();

    self.chartsVisible = ko.observable(true);
    self.tableVisible = ko.observable(false);
    self.zoomVisible = ko.observable(false);

    self.detailsTabClass = ko.computed(self.computeDetailsTabClass.bind(self));

    self.rotatingMessages = false;
    self.rotatorTimeout = null;
}

TestResultsViewModel.prototype.reset = function(){
    var self = TestResultsViewModel.typesafe(this);

    self.percentComplete(null);
    self.status(null);
    self.displayMessage(null);
    self.charts.removeAll();

    self.testCompleted(false);

    self.selectedTraffic(self.traffics()[0].value);

    self.selectedTrafficUnit(self.trafficUnits()[0].value);
    self.activeChart(null);
    self.chartCount = 0;
    self.finalTable(null);

    self.selectedGroup(translate('Total Bandwidth'));

    self.showDataTab(null);
    self.showApplicationTab(null);
    self.showVoiceVideoTab(null);
    self.showVoiceTab(null);
    self.showVideoTab(null);
    self.showResponseTimeTab(null);

    self.chartsVisible(true);
    self.tableVisible(false);
    self.zoomVisible(false);

    self.rotatingMessages = false;
    self.rotatorTimeout = null;
};

TestResultsViewModel.prototype.setTabVisibility = function(){
    var self = TestResultsViewModel.typesafe(this);

    var trackResultTypes = self.testVm.getTrackResultTypes();

    self.showDataTab(trackResultTypes.indexOf('DataTestResult') !== -1);
    self.showApplicationTab(trackResultTypes.indexOf('ALPTestResult') !== -1);
    self.showVoiceVideoTab(trackResultTypes.indexOf('VoiceTestResult') !== -1 || trackResultTypes.indexOf('VideoTestResult') !== -1);
    self.showVoiceTab(trackResultTypes.indexOf('VoiceTestResult') !== -1);
    self.showVideoTab(trackResultTypes.indexOf('VideoTestResult') !== -1);
    self.showResponseTimeTab(trackResultTypes.indexOf('ALPTestResult') !== -1 && self.testVm.vmConfiguration.hasHTTPTrack());

//    var playerLayers = self.testVm.getPlayerLayers();

//    self.showDataTab(playerLayers.indexOf(2) != -1);
//    self.showApplicationTab(playerLayers.indexOf(7) != -1);
//    self.showVoiceVideoTab(playerLayers.indexOf(4) != -1);
};

TestResultsViewModel.prototype.computeDisplayStatus = function(){
    var self = TestResultsViewModel.typesafe(this);

    var status = self.status();
    if (typeof(status) == 'undefined' || !status) {
        return '';
    }

    status = status.toLowerCase();
    if (status == 'running') {
        return translate('test.status.running');
    }
    if (status == 'completed') {
        return translate('test.status.completed');
    }
    if (status == 'error') {
        return translate('test.status.error');
    }
    if (status == 'aborted') {
        return translate('test.status.aborted');
    }

    return status;
}

TestResultsViewModel.prototype.computeDetailsTabClass = function(){
    var self = TestResultsViewModel.typesafe(this);

    if (!self.testCompleted()) {
        return 'disabled';
    }

    return self.tableVisible() ? 'active' : null
};

TestResultsViewModel.prototype.selectTab = function(tab){
    var self = TestResultsViewModel.typesafe(this);
    
    if(tab == "table" && self.testCompleted()){
        self.chartsVisible(false);
        self.tableVisible(true);
        self.reformatFinalTable();
        self.selectedTab(tab);
        appHistory.push(spirentEnterpriseVm);
        return;
    }else if(tab == "chart"){
        self.chartsVisible(true); 
        self.tableVisible(false);
        self.selectedTab(tab);
        appHistory.push(spirentEnterpriseVm);
        return;
    }
};

TestResultsViewModel.prototype.showTable = function(){
    var self = TestResultsViewModel.typesafe(this);

    if (self.testCompleted()) {
        self.chartsVisible(false);
        self.tableVisible(true);
        self.reformatFinalTable();
    }
};
TestResultsViewModel.prototype.isChartActive = function(chartIndex){
    var self = TestResultsViewModel.typesafe(this);

    if (self.charts()[chartIndex] == undefined || self.charts()[chartIndex] == null) {
        return false;
    }

    return self.charts()[chartIndex].active();
};

TestResultsViewModel.prototype.isGroupActive= function(groupName){
    var self = TestResultsViewModel.typesafe(this);

    return self.selectedGroup() == groupName;
};

TestResultsViewModel.prototype.kickOffDisplayMessageRotation = function(){
    var self = TestResultsViewModel.typesafe(this);

    if (!self.testCompleted() && !self.rotatingMessages) {
        clearTimeout(self.rotatorTimeout);
        self.rotatingMessages = true;

        self.showRandomDisplayMessage();

        self.rotatorTimeout = setTimeout(self.rotateDisplayMessage.bind(self), 20000);
    }
};

TestResultsViewModel.prototype.rotateDisplayMessage = function(){
    var self = TestResultsViewModel.typesafe(this);

    if (!self.testCompleted() && self.rotatingMessages) {
        clearTimeout(self.rotatorTimeout);
        self.showRandomDisplayMessage();

        self.rotatorTimeout = setTimeout(self.rotateDisplayMessage.bind(self), 20000);
    } else {
        self.rotatingMessages = false;
        clearTimeout(self.rotatorTimeout);
    }
};



TestResultsViewModel.prototype.showRandomDisplayMessage = function(){
    var self = TestResultsViewModel.typesafe(this);

    var randomId = Math.floor(Math.random() * self.rootVm.availableDisplayMessages.length);
    self.displayMessage(self.rootVm.availableDisplayMessages[randomId]);
};

TestResultsViewModel.prototype.abortAndSurfaceError = function(data){
    var self = TestResultsViewModel.typesafe(this),
        charts, i;

    charts = self.charts();

    for (i = 1; i < charts.length; i += 1) { // Why are charts 1-indexed?
        if (charts[i] !== undefined) {
            charts[i].chartPoller().stopPolling();
        }
    }

    self.testVm.abortTestWithError(data);

    self.rotatingMessages = false;

    self.displayMessage(data.messages[0].header + ': ' + data.messages[0].content);
};

TestResultsViewModel.prototype.hydrate = function(chartArray){
    var self = TestResultsViewModel.typesafe(this);

    util.applyFunction(self.charts(), "dispose"); //dispose the previous set of ajax pollers
    self.charts(chartArray);
    self.chartCount = 0;

    for(var chartIndex = 0; chartIndex < chartArray.length; chartIndex++){
        if(chartArray[chartIndex]){
            if(self.chartCount == 0)
                chartArray[chartIndex].activate();
            self.chartCount++;
        }
    }

    self.setTabVisibility();
    self.selectedGroup('Total Bandwidth');
    //self.zoomVisible(true);
};

TestResultsViewModel.prototype.logToHistory = function(){
    var self = TestResultsViewModel.typesafe(this);

    if(self.completionCount) self.completionCount++;
    else self.completionCount = 1;

    if(self.completionCount == self.chartCount){
        self.completionCount = 0;

        if (self.status() != 'aborted') {
            self.percentComplete(100);
            self.getFinalTable(self.onGotFinalTable.bind(self));
        }
    }
};

TestResultsViewModel.prototype.getFinalTable = function(successCallback){
    var self = TestResultsViewModel.typesafe(this);

    $.ajax({
        type: util.getRequestMethod('request_final_table'),
        url : util.getConfigSetting('request_final_table'),
        data : util.formatRequestData('request_final_table', self.testVm.vmConfiguration.toFlatObject()),
        dataType : "json",
        success : successCallback,
        error: self.pollAjaxError
    });
};

TestResultsViewModel.prototype.onGotFinalTable = function(data){
    var self = TestResultsViewModel.typesafe(this);
    var finalTable = new TestResultsFinalTableViewModel(self);
    finalTable.inflate(data);
    self.finalTable(finalTable);

    self.status(data.status);
    self.displayMessage(data.display_message);
    self.resultId(data.result_id);
    self.testCompleted(true);
    window.update_user_session();

    var recentTest = new TestHistoryViewModel(self.rootVm.vmDashboard);
    recentTest.setState(self.testVm);
    //self.zoomVisible(true);
    //recentTest.save();
    self.rootVm.getResultHistory();
};
TestResultsViewModel.prototype.reformatFinalTable = function(data){
    var self = TestResultsViewModel.typesafe(this);
    var playersArray = new Array();
    var playerDataCellWidthArray = new Array();
    var playerIndex = 0;
    var tdIndex = 0;
    var trackIndex = 0;
    var thisWidth;
    $('.player-container').each(function(){
        playersArray.push({"index":playerIndex,"tracks":[]});
        playerDataCellWidthArray.push({"index":playerIndex, "data_cells":[]});
        playerIndex+=1;
    });
    for (var i = 0; i < playersArray.length; i++) {
        $('.player-container:eq('+i+')').find('.resultsDataContainer').each(function(){
            playersArray[i].tracks.push({"index":trackIndex,"data_cells":[]});
            trackIndex+=1;
        });
        for (var x = 0; x < playersArray[i].tracks.length; x++) {
            $('.player-container:eq('+i+')').find('.resultsDataContainer:eq('+x+')').find('td').each(function(){
                thisWidth = $(this).width();
                playersArray[i].tracks[x].data_cells.push({"index":tdIndex, "width":thisWidth});
                tdIndex+=1;
            });
            for (var j = 0; j < playersArray[i].tracks[x].data_cells.length; j++) {
                
                if (!playerDataCellWidthArray[i].data_cells[j]){
                    playerDataCellWidthArray[i].data_cells.push({"index":j, "width":playersArray[i].tracks[x].data_cells[j].width});
                } else if (playerDataCellWidthArray[i].data_cells[j].width < playersArray[i].tracks[x].data_cells[j].width){
                    playerDataCellWidthArray[i].data_cells.push({"index":j, "width":playersArray[i].tracks[x].data_cells[j].width});
                }
            };
        };
        $('.player-container:eq('+i+')').find('.resultsDataContainer').each(function(){
            for (var k = 0; k < playerDataCellWidthArray[i].data_cells.length; k++) {
                $(this).find('td:eq('+k+')').each(function(){
                    $(this).width(playerDataCellWidthArray[i].data_cells[k].width)
                });
            };
        });
    };
};
TestResultsViewModel.prototype.getSavedDetailsTable = function(data){
    var self = TestResultsViewModel.typesafe(this);
    var finalTable = new TestResultsFinalTableViewModel(self);
    finalTable.inflate(data);
    self.finalTable(finalTable);

    self.displayMessage(data.display_message);
    self.testCompleted(true);
    //self.zoomVisible(true);
};

TestResultsViewModel.prototype.deactivateCharts = function(){
    var self = TestResultsViewModel.typesafe(this);

    var charts = self.charts();

    for (var i = 0; i < charts.length; i++){
        if (charts[i] != null && charts[i] != undefined) {
            self.charts()[i].deactivate();
        }
    }
};

TestResultsViewModel.prototype.selectGroup = function(group){
    var self = TestResultsViewModel.typesafe(this);

    switch (group) {
        case 'Total Bandwidth':
            self.charts()[1].activate();
            break;
        case 'Transport Data':
            self.charts()[2].activate();
            break;
        case 'Application Data':
            self.charts()[6].activate();
            break;
        case 'Voice Quality Data':
            self.charts()[15].activate();
            break;
        case 'Video Quality Data':
            self.charts()[19].activate();
            break;
    }

    self.selectedGroup(group);
};


TestResultsViewModel.typesafe = function(that){
    if (!(that instanceof TestResultsViewModel)) {
        throw 'This method must be executed on a TestResultsViewModel';
    }

    return that;
};


TestResultsViewModel.prototype.stubGetFinalTable = function(callback){
    var self = TestResultsViewModel.typesafe(this);

    setTimeout(function () {
            var finalTable = new TestResultsFinalTableViewModel(self.resultsVm);
            finalTable.inflate(self.fakeFinalTable());
            self.resultsVm.finalTable(finalTable);

            callback();
        },
        Math.random() * 100);
};

TestResultsViewModel.prototype.fakeFinalTable = function(){
    var self = TestResultsViewModel.typesafe(this);

    var timeValues = new Array();

    var configVm = self.testVm.vmConfiguration;

    var trafficPlayers = configVm.traffic_players();

    var duration = configVm.duration();

    var trackLayerCellMap = new Array();
    trackLayerCellMap[2] = 5;
    trackLayerCellMap[4] = 7;
    trackLayerCellMap[7] = 9;

    var cellMap = [
        { name: translate('Packets Sent (Tx)'), dataType: 'positive'},
        { name: translate('Packets Received (Rx)'), dataType: 'positive'},
        { name: translate('Bandwidth'), dataType: 'positive'},
        { name: translate('Packet Loss'), dataType: 'negative'},
        { name: translate('Avg. Jitter'), dataType: 'positive'},
        { name: translate('Connections Successful'), dataType: 'positive'},
        { name: translate('Connections Unsuccessful'), dataType: 'negative'},
        { name: translate('Transactions Successful'), dataType: 'positive'},
        { name: translate('Transactions Unsuccessful'), dataType: 'negative'}
    ];


    var finalTableArray = new Array();

    for (var i = 0; i < trafficPlayers.length; i++) {
        var player = trafficPlayers[i];
        var playerData = { name: 'Player ' + i};

        var playlist = player.playlist();
        var tracks = playlist.tracks();
        var minTrackLayer = playlist.minTrackLayer();

        playerData.tracks = new Array();

        for (var j = 0; j < tracks.length; j++) {
            var track = tracks[j]();
            var trackData = { name: track.name() };

            trackData.cells = new Array();

            for (var k = 0; k < trackLayerCellMap[minTrackLayer]; k++) {
                var cell = {
                    name: cellMap[k].name,
                    value: Math.floor(Math.random()  * 1000),
                    data_type: cellMap[k].dataType
                };

                cell.chart_data = {};
                cell.chart_data[cellMap[k].name] = new Array();

                for (var l = 0; l < duration * 60; l++) {
                    var datapoint = { x: l * 1000, y: Math.floor(Math.random() * 15000)};

                    cell.chart_data[cellMap[k].name].push(datapoint);
                }

                trackData.cells.push(cell);
            }

            playerData.tracks.push(trackData);
        }

        finalTableArray.push(playerData);
    }

    return finalTableArray;

};


function ChartViewModel(resultsVm, chartObject){
    var self = this;
    
    self.resultsVm = resultsVm;
    self.rootVm = resultsVm.rootVm;
    self.chart = ko.observable(chartObject.chart);
    self.table = ko.observable(chartObject.table);
    self.chartPoller = ko.observable(chartObject.chartPoller);
    self.active = ko.observable(false);
    self.label = ko.observable();
//    self.zoomVisible = ko.observable(true);
}

ChartViewModel.prototype.activate = function(){
    var self = ChartViewModel.typesafe(this);

//    if (self.resultsVm.activeChart() == self) {
//        return;
//    }

    self.resultsVm.deactivateCharts();

    self.active(true);

    self.resultsVm.activeChart(self);

    if (self.resultsVm.testCompleted()) {
        self.chart().enableHover();
    }

    if(self.chart().root && self.chart().root.length > 0){
        self.chart().draw.call(self.chart());
        self.chart().updateChartDecorations.call(self.chart());
    }
};

ChartViewModel.prototype.deactivate = function(){
    var self = ChartViewModel.typesafe(this);

    self.active(false);

    self.chart().disposeScrollers();
};

ChartViewModel.prototype.dispose = function(){
    var self = ChartViewModel.typesafe(this);

    if(self.chartPoller())
        self.chartPoller().dispose();
    self = null;
};

ChartViewModel.typesafe = function(that){
    if (!(that instanceof ChartViewModel)) {
        throw 'This method must be executed on a ChartViewModel';
    }

    return that;
};

function PopinChartViewModel(testVm, chart, label, yAxisLabel, hasAccuracyAlert, accuracyMessage) {
    var self = this;

    self.testVm = testVm;
    self.rootVm = testVm.rootVm;
    self.moduleName = testVm.vmConfiguration.module.split('.').pop();
    self.chart = ko.observable(chart);
    self.label = ko.observable(label);
    self.hasAccuracyAlert = ko.observable(hasAccuracyAlert);
    self.accuracyMessage = ko.observable(accuracyMessage);
    //self.zoomVisible = ko.observable(true);
}

PopinChartViewModel.typesafe = function(that){
    if (!(that instanceof PopinChartViewModel)) {
        throw 'This method must be executed on a PopinChartViewModel';
    }

    return that;
};

PopinChartViewModel.prototype.activate = function(){
    var self = PopinChartViewModel.typesafe(this);

    if(self.chart().root && self.chart().root.length > 0){
        self.chart().draw.call(self.chart());
        self.chart().updateChartDecorations.call(self.chart());
    }
};
