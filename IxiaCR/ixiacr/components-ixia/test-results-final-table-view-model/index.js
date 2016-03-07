var Paginator = require('paginator'),
    clients_per_page = 50;

function TestResultsFinalTableViewModel(resultsVm) {
    var self = this;
    self.resultsVm = resultsVm;
    self.rootVm = resultsVm.rootVm;
    self.testVm = resultsVm.testVm;

    self.players = ko.observableArray();
    self.display_messages = ko.observable();
    self.status = ko.observable();

    // Strided lists of Paginator's - indexes match self.players
    self.client_paginators = [];
    self.client_pages = [];
}

TestResultsFinalTableViewModel.typesafe = function (that) {
    if (!(that instanceof TestResultsFinalTableViewModel))
        throw 'This method must be executed on a TestResultsFinalTableViewModel';
    return that;
};

TestResultsFinalTableViewModel.prototype.inflate = function(data){
    var self = TestResultsFinalTableViewModel.typesafe(this);

    var players = self.getPlayers(data);

    self.players(players);
};

TestResultsFinalTableViewModel.prototype.getPlayers = function(playersData){
    var self = TestResultsFinalTableViewModel.typesafe(this);

    var players = [],
        player;

    for (var i = 0; i < playersData.players.length; i++) {
        player = self.getPlayer(playersData.players[i]);
        players.push(player);

        if (player.clients && player.clients()) {
            self.add_paginator(i, player.clients());
        }
    }

    return players;
};

TestResultsFinalTableViewModel.prototype.add_paginator = function(player_index, clients) {
    var paginator = new Paginator(),
        pages = Math.ceil(clients.length / clients_per_page),
        pages_observable = ko.observableArray();
    paginator.pages(pages);

    this.client_paginators[player_index] = paginator;
    this.client_pages[player_index] = pages_observable;

    paginator.on('change', function (page) {
        var begin = (page - 1) * clients_per_page,
            end = begin + clients_per_page,
            clients_page = clients.slice(begin, end);

        pages_observable(clients_page);
    });

    paginator.goto(1);
};

TestResultsFinalTableViewModel.prototype.getPlayer = function(playerData){
    var self = TestResultsFinalTableViewModel.typesafe(this);
    var timingAccuracyValue = playerData.timing_accuracy ? playerData.timing_accuracy.toFixed(3) : 0;
    var timingAccuracy = timingAccuracyValue == 0
        ? translate('No Timing Accuracy Info')
        : translate('Timing Accuracy: +/- {value} ms', {
        value: Math.abs(timingAccuracyValue)
    });

    var player = {
        id: playerData.id || null,
        type: playerData.type,
        get_css_class: function () {
            if (this.type === 'player') {
                return this.type + ' player-' + this.id;
            }
            return this.type;
        },
        name: playerData.name,
        timingAccuracy: timingAccuracy,
        timeSyncAlert: playerData.has_time_sync_alert ? translate('Time Sync Alert: rollover or click icon for details') : null,
        timeSyncAlertClass: playerData.has_time_sync_alert ? 'alert' : null,
        tracks: ko.observableArray()
    };

    var tracks = self.getTracks(playerData.tracks);
    player.tracks(tracks);

    var clients = self.getClients(playerData.clients);
    if (clients.length) {
        // Multicast
        player.clients = ko.observableArray(clients);
    }

    return player;
};

TestResultsFinalTableViewModel.prototype.getTracks = function(tracksData){
    var self = TestResultsFinalTableViewModel.typesafe(this);

    var tracks = new Array();

    for (var i = 0; i < tracksData.length; i++) {
        tracks.push(self.getTrack(tracksData[i]));
    }

    return tracks;
};

TestResultsFinalTableViewModel.prototype.getClients = function(clientsData){
    var self = this,
        clients = [];

    if (!clientsData) {
        return clients;
    }

    for (var i = 0; i < clientsData.length; i++) {
        clients.push(self.getTrack(clientsData[i]));
    }

    return clients;
};

TestResultsFinalTableViewModel.prototype.getTrack = function(trackData){
    var self = TestResultsFinalTableViewModel.typesafe(this);

    var track = {
        name: trackData.name,
        cells: ko.observableArray()
    };

    var cells = self.getCells(trackData.cells, trackData.chart_lightbox);

    track.cells(cells);

    return track;
};

TestResultsFinalTableViewModel.prototype.getCells = function(cellsData, chartLightbox){
    var self = TestResultsFinalTableViewModel.typesafe(this);

    var cells = new Array();

    for (var i = 0; i < cellsData.length; i++) {
        cells.push(self.getCell(cellsData[i], chartLightbox));
    }

    return cells;
};

TestResultsFinalTableViewModel.prototype.getCell = function(cellData, chartLightbox){
    var self = TestResultsFinalTableViewModel.typesafe(this);


    var cell = new TestResultsFinalTableCell(self.testVm);
    cell.inflate(cellData, chartLightbox);

    return cell;
};

function TestResultsFinalTableCell(testVm) {
    var self = this;
    self.testVm = testVm;
    self.rootVm = testVm.rootVm;
    self.resultsVm = testVm.vmResults;

    self.name = null;
    self.value = null;
    self.dataType = null;
    self.detail = null; // e.g. "Join failed"
    self.graphData = null;
    self.classAttribute = null;
    self.hasAccuracyAlert = null;
    self.accuracyMessage = null;
    self.chartLightbox = null;
}

TestResultsFinalTableCell.typesafe = function (that) {
    if (!(that instanceof TestResultsFinalTableCell))
        throw 'This method must be executed on a TestResultsFinalTableCell';
    return that;
};

TestResultsFinalTableCell.prototype.inflate = function(cellData, chartLightbox){
    var self = TestResultsFinalTableCell.typesafe(this);

    self.name = cellData.name;
    self.value = util.commafyNumber(cellData.value);
    self.detail = cellData.detail;
    self.dataType = cellData.data_type;
    self.chartLightbox = cellData.chart_data ? chartLightbox : false;
    if (self.chartLightbox) {
        self.graphData = prepareGraphData(cellData);
    }
    self.yAxisLabel = cellData.name;
    self.hasAccuracyAlert = cellData.has_accuracy_alert;
    self.accuracyMessage = cellData.accuracy_message;

    self.classAttribute = self.hasAccuracyAlert ? self.dataType + ' accuracy-alert' : self.dataType;
    self.classAttribute += ' value';
};

TestResultsFinalTableCell.prototype.showChart = function(vm, e){
    if ($(e.target).is('img')) {
        // Don't interfere with tooltips on touch devices
        return;
    }

    var self = TestResultsFinalTableCell.typesafe(this);
    if (self.chartLightbox == false){
        return
    }

    var settings = { width: 600, height: 400, yAxisLabel: self.yAxisLabel };
    var chart = new Chart(settings);

    var chartVm = new PopinChartViewModel(self.testVm, chart, self.name, self.yAxisLabel, self.hasAccuracyAlert, self.accuracyMessage);

    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-table-cell-chart-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function(){
            ko.applyBindings(chartVm, document.getElementById('lightbox-table-cell-chart'));
            chart.update(self.graphData);
            chart.finish();
        }
    });

};

function prepareGraphData(cellData) {
    var points;
    var chartData = cellData.chart_data;
    for (var property in chartData) {
        var value = chartData[property];
        if ($.type(value) == 'array') {
            points = value;
        }
    }

    return [{
        label: cellData.name,
        points: points
    }];
}

module.exports = TestResultsFinalTableViewModel;