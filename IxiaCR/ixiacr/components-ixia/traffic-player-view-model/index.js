/*global ko:true, TestPlaylistViewModel:true, TestTrafficSettingViewModel:true, DatapointViewModel:true, TestSupplementalConfigurationViewModel:true */
var UnicastDelegate = require('./delegates/unicast.js'),
    MulticastDelegate = require('./delegates/multicast.js');

/**
 * Manages data for unicast and multicast traffic player views - uses delegates.
 *
 * @param testConfigVm
 * @constructor
 */
function TrafficPlayerViewModel(testConfigVm) {
    var self = this;
    self.delegate = undefined;
    self.testConfigVm = testConfigVm;
    self.testVm = testConfigVm.testVm;
    self.rootVm = testConfigVm.rootVm;
    self.primary = undefined; // Used by additional traffic players that require different settings from default player (e.g. throughput)

    self.source = ko.observable();
    self.destination = ko.observable();
    self.playlist = ko.observable();
    self.sharedConfig = ko.observable();
    self.traffic_setting = ko.observable();
    self.line_rate_subscription = undefined;

    self.timingAccuracy = ko.observable(); // Remove once we move unicast timing accuracies to Rx side so they match multicast

    self.datapoints = ko.observableArray();

    self.currentPlaylist = null;
    self.currentPlaylistEditable = false;
    self.currentPlaylistNumTracks = 0;

    self.supplementalConfiguration = ko.observable();
    self.hasSupplementalConfiguration = ko.observable(false);

    self.isExpanded = ko.observable(true);
    self.playlistIsEdit = ko.observable(false);
    self.showCollapsed = ko.computed(self.computeShowCollapsed.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.show_traffic_tip = ko.computed(function () {
        return self.get_source_endpoints().length > 1 || self.get_destination_endpoints().length > 1;
    });

    self.additionalConfigurationVisible = ko.computed(self.computeAdditionalConfigurationVisible.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.openPlaylistVisible = ko.computed(self.computeOpenPlaylistVisible.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.closePlaylistVisible = ko.computed(self.computeClosePlaylistVisible.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.trackContainerVisible = ko.computed(self.computeTrackContainerVisible.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.applicationTrackContainerVisible = ko.computed(self.computeApplicationTrackContainerVisible.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.playlist.subscribe(self.onPlaylistChange.bind(self));
    self.strings = {
        "[Custom]": window.translate("[Custom]")
    };
}

module.exports = TrafficPlayerViewModel;

TrafficPlayerViewModel.typesafe = function (that) {
    if (!(that instanceof TrafficPlayerViewModel)) {
        throw 'This method must be executed on a TrafficPlayerViewModel';
    }

    return that;
};

TrafficPlayerViewModel.prototype.is_primary = function (val) {
    if (val === undefined) {
        return this.primary;
    }

    this.primary = Boolean(val);
};

TrafficPlayerViewModel.prototype.inflate = function (data, default_playlist_id, datapoint_ids, is_multicast) {
    var self = TrafficPlayerViewModel.typesafe(this),
        supplementalConfig,
        i,
        datapoint;

    // Delegate unicast-/multicast-specific behavior
    self.delegate = is_multicast ? new MulticastDelegate(this) : new UnicastDelegate(this);
    self.delegate.inflate(data);

    // Traffic setting
    self.traffic_setting(new TestTrafficSettingViewModel(self.testConfigVm, self));
    if (data.traffic_settings && data.traffic_settings.length > 0) {
        self.traffic_setting().inflate(data.traffic_settings[0]);
    }

    self.line_rate_subscription = self.source().lineRate.subscribe(self.changeLineRate.bind(self));

    if (data.supplemental_configuration) {
        supplementalConfig = new TestSupplementalConfigurationViewModel(self.rootVm);
        supplementalConfig.inflate(data.supplemental_configuration);
        self.supplementalConfiguration(supplementalConfig);
        self.hasSupplementalConfiguration(true);
    }


    self.loaded = true;
};

TrafficPlayerViewModel.prototype.changeLineRate = function (rate) {
    if (this.traffic_setting() && this.traffic_setting().lineRateVm.line_speed === rate) {
        // Line rate hasn't actually changed
        return; // Short-circuit
    }

    logger.info('Line rate changed: ' + rate);

    this.traffic_setting().changeLineRate(rate);
    if (this.hasSupplementalConfiguration()) {
        this.supplementalConfiguration().changeLineRate(rate);
    }
};

TrafficPlayerViewModel.prototype.aggregateTraffic = function (trafficTotal) {
    var self = TrafficPlayerViewModel.typesafe(this),
        unit = self.traffic_setting().unit(),
        val = parseFloat(self.traffic_setting().value());

    trafficTotal[unit] = trafficTotal[unit] || 0;
    trafficTotal[unit] += val;
};

TrafficPlayerViewModel.prototype.toFlatObject = function(){
    var self = TrafficPlayerViewModel.typesafe(this);

    var flatTrafficPlayer = {
        playlist: self.playlist().toFlatObject(),
        traffic_settings: new Array(),
        datapoints: new Array()
    };

    var datapoints = self.datapoints();
    for (var i = 0; i < datapoints.length; i++) {
        flatTrafficPlayer.datapoints.push(datapoints[i].toFlatObject());
    }

    flatTrafficPlayer.traffic_settings.push(self.traffic_setting().toFlatObject());

    if (self.hasSupplementalConfiguration()) {
        flatTrafficPlayer.supplemental_configuration = self.supplementalConfiguration().toFlatObject();
    }

    flatTrafficPlayer = self.delegate.toFlatObject(flatTrafficPlayer);

    return flatTrafficPlayer;
};

TrafficPlayerViewModel.prototype.onDeviceChange = function () {
    if (this.line_rate_subscription) {
        this.line_rate_subscription.dispose();
    }
    this.line_rate_subscription = this.source().lineRate.subscribe(this.changeLineRate.bind(this));

    this.testConfigVm.pollDevicesStatus();
    this.testConfigVm.pollTimingAccuracies();
    this.testConfigVm.pollDeviceTimeSyncCapabilities();
    this.testConfigVm.updateConfig();
};

TrafficPlayerViewModel.prototype.onPlaylistChange = function (newValue) {
    var self = TrafficPlayerViewModel.typesafe(this);
    if(self.playlistIsEdit()){
        self.playlistIsEdit(false);

        var playlists = self.testConfigVm.testVm.availablePlaylists();
        for(var i = 0; i < playlists.length; i++){
            if(playlists[i].isEdit())
                playlists[i].isEdit(false);
        }
    }
};

TrafficPlayerViewModel.prototype.setTimingAccuracies = function (accuracies) {
    if (!this.delegate) {
        return; // Short-circuit
    }

    this.delegate.setTimingAccuracies(accuracies);
};

TrafficPlayerViewModel.prototype.launchTimingHelp = function () {
    var self = TrafficPlayerViewModel.typesafe(this);

    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-timing-help-template',
        cancelSelector: '.cancel-button'
    });
};

TrafficPlayerViewModel.prototype.getPlayerLayer = function () {
    var self = TrafficPlayerViewModel.typesafe(this);

    return self.playlist().getTrackLayer();
};

TrafficPlayerViewModel.prototype.hasHTTPTrack = function () {
    var self = TrafficPlayerViewModel.typesafe(this);

    return self.playlist().hasHTTPTrack();
};

TrafficPlayerViewModel.prototype.computeOpenPlaylistVisible = function () {
    var self = TrafficPlayerViewModel.typesafe(this);

    if (self.playlist() == null) {
        return false;
    }

    return !self.playlist().isEdit() && !self.playlistIsEdit();
};

TrafficPlayerViewModel.prototype.computeClosePlaylistVisible = function () {
    var self = TrafficPlayerViewModel.typesafe(this);

    if (self.playlist() == null) {
        return false;
    }

    return self.playlist().isEdit() && self.playlistIsEdit();
};

TrafficPlayerViewModel.prototype.computeTrackContainerVisible = function () {
    var self = TrafficPlayerViewModel.typesafe(this);

    if (self.playlist() == null) {
        return false;
    }

    return self.playlist().isEdit() && self.playlistIsEdit() && self.getPlayerLayer() < 4;
};

TrafficPlayerViewModel.prototype.computeApplicationTrackContainerVisible = function () {
    var self = TrafficPlayerViewModel.typesafe(this);

    if (self.playlist() == null) {
        return false;
    }

    return self.playlist().isEdit() && self.playlistIsEdit() && self.getPlayerLayer() >= 4;
};

TrafficPlayerViewModel.prototype.computeAdditionalConfigurationVisible = function () {
    var self = TrafficPlayerViewModel.typesafe(this);

    return self.datapoints().length > 0
};

TrafficPlayerViewModel.prototype.computeShowCollapsed = function () {
    var self = TrafficPlayerViewModel.typesafe(this);

    return !self.isExpanded();
};

TrafficPlayerViewModel.prototype.portIdInUse = function (id) {
    var self = TrafficPlayerViewModel.typesafe(this);

    return self.source().selectedPort() == id
        || self.destination().selectedPort() == id;
};

TrafficPlayerViewModel.prototype.usingSameDevice = function () {
    var self = TrafficPlayerViewModel.typesafe(this);

    return self.source().device() == self.destination().device();
};

TrafficPlayerViewModel.prototype.getDeviceIds = function () {
    if (!this.delegate) {
        return [];
    }

    return this.delegate.getDeviceIds();
};

TrafficPlayerViewModel.prototype.getDevicePaths = function () {
    if (this.source() === undefined || this.destination() === undefined) {
        return [];
    }

    var source_ids = this.source().getDeviceIds(),
        destination_ids = this.destination().getDeviceIds(),
        paths = [];

    source_ids.forEach(function (source_id) {
        destination_ids.forEach(function(destination_id) {
            paths.push({
                source: source_id,
                destination: destination_id
            });
        });
    });

    return paths;
};

TrafficPlayerViewModel.prototype.removeTrack = function (playlist, track) {
    var self = TrafficPlayerViewModel.typesafe(this);
    var trackId = track.id();
    var tracks = playlist().tracks();
    for (i = 0; i < tracks.length; i++) {
        if (tracks[i]().id() == trackId) {
            playlist().tracks.splice(i, 1);
        }
    }
    if(playlist().isReadOnly && playlist().name().indexOf(self.strings["[Custom]"]) == -1){
        playlist().name(self.strings["[Custom]"] + " " + playlist().name());
        playlist().isNameChanged = true;
    }
};
TrafficPlayerViewModel.prototype.deleteTrafficPlayer = function (playerId) {
    var self = TrafficPlayerViewModel.typesafe(this),
        id = playerId(),
        newTrafficPlayers = [];

    logger.info('Deleting traffic player ' + id);

    self.testConfigVm.traffic_players().splice(id, 1);

    for (var i = 0; i < self.testConfigVm.traffic_players().length; i++) {
        newTrafficPlayers.push(self.testConfigVm.traffic_players()[i]);
    }

    self.testConfigVm.traffic_players.removeAll();
    for (var i = 0; i < newTrafficPlayers.length; i++) {
        self.testConfigVm.traffic_players.push(newTrafficPlayers[i]);
    }

    logger.info('Deleted traffic player ' + id);
};

TrafficPlayerViewModel.prototype.editPlaylist = function () {
    var self = TrafficPlayerViewModel.typesafe(this);
//    if (self.playlist().editable()) {
//        self.playlistIsEdit(true);
//        self.playlist().isEdit(true);
//        return;
//    }

    var clonedPlaylist = self.playlist().clone(self);
    self.playlist(clonedPlaylist);
    self.playlistIsEdit(true);
    self.playlist().isEdit(true);
};

TrafficPlayerViewModel.prototype.closePlaylist = function () {
    var self = TrafficPlayerViewModel.typesafe(this);
    self.playlistIsEdit(false);
    self.playlist().isEdit(false);
};

/**
 * Performs validation in (left-to-right) reading order
 *
 * @param result ValidationResultsViewModel
 * @param targetName context used in validation lightbox. e.g. "Tx ..."
 * @returns ValidationResultsViewModel
 */
TrafficPlayerViewModel.prototype.validate = function (result, targetName){
    var self = TrafficPlayerViewModel.typesafe(this);
    var isValidSrcDes = true;
    var source = self.source();
    var destination = self.destination();

    if(source != null){
        source.validate(result, translate("{name} {label}", {
            name: targetName,
            label: self.delegate.strings.source
        }));
    }else{
        result.addCheckResults(translate("Test Configuration Error"), false, translate("{name} {label} is missing", {
            name: targetName,
            label: self.delegate.strings.source
        }));
        isValidSrcDes = false;
    }

    if(self.playlist() != null){
//        if(!self.canAcceptPlaylist(self.playlist())){
//            var layers = self.playlist().getTrackLayers();
//            var message = translate('The "{playlistName}" playlist contains tracks with layer(s) {givenLayers}, but this test only supports layer(s): {acceptableLayers}. Please use a different playlist.', {
//                playlistName: self.playlist().name(),
//                givenLayers: layers.join(', '),
//                acceptableLayers: "axon.testcases.spirent.network_stress" === self.testConfigVm.module ? '1, 2' : '1, 2, 3'
//            });
//
//            result.addCheckResults(translate("Test Configuration Error"), false, message);
//        }
        self.playlist().validate(result, targetName);
    }else{
        result.addCheckResults(translate("Test Configuration Error"), false, translate("{name} is missing a Playlist", {
            name: targetName
        }));
    }

    if(self.traffic_setting() != null){
        self.traffic_setting().validate(result, targetName);
    }else{
        result.addCheckResults(translate("Test Configuration Error"), false, translate("{name} is missing its traffic settings", {
            name: targetName
        }));
    }

    var datapoints = self.datapoints();
    if(datapoints.length > 0){
        for(var i = 0; i < datapoints.length; i++)
            datapoints[i].validate(result, targetName);
    }

    if(self.supplementalConfiguration() != null){
        self.supplementalConfiguration().validate(result, targetName);
    }

    // Perform multicast-/unicast-specific validation
    self.delegate.validate(result, targetName);

    if(destination != null){
        destination.validate(result, translate("{name} {label}", {
            name: targetName,
            label: self.delegate.strings.destination
        }));
    }else{
        result.addCheckResults(translate("Test Configuration Error"), false, translate("{name} {label} is missing", {
            name: targetName,
            label: self.delegate.strings.destination
        }));
    }

    // Check if src and des use same device, port, and vlan_id
    this.validate_port_and_vlans(source, destination, result, targetName);

    return result;
};


TrafficPlayerViewModel.prototype.canAcceptPlaylist = function (playlist) {
    return this.delegate.canAcceptPlaylist(playlist);
};




TrafficPlayerViewModel.prototype.canAcceptTrack = function (track) {
    return this.delegate.canAcceptTrack(track);
};

/**
 * @param src MultiplePortDeviceViewModel
 * @param dst {MultiplePortDeviceViewModel|DeviceCollectionViewModel}
 * @param result ValidationResultsViewModel
 * @param targetName context used in validation lightbox. e.g. "Tx ..."
 * @return ValidationResultsViewModel
 */
TrafficPlayerViewModel.prototype.validate_port_and_vlans = function (src, dst, result, targetName) {
    var src_endpoints = src.enabled_endpoints(),
        message;

    dst.enabled_endpoints().some(function (dst_endpoint) {
        return src_endpoints.some(function (src_endpoint) {
            var duplicate = src_endpoint.device.id() === dst_endpoint.device.id()
                && src_endpoint.port() === dst_endpoint.port()
                && src_endpoint.vlan_id() === dst_endpoint.vlan_id();

            if (duplicate) {
                message = window.translate("{name} server and client VLAN ID must be different when choosing same port on same device ({device}, port {port}, VLAN {vlan}).", {
                    name: targetName,
                    device: src_endpoint.device.device.name(),
                    port: src_endpoint.port(),
                    vlan: src_endpoint.vlan_id()
                });

                result.addCheckResults(window.translate("Test Configuration Error"), false, message);
                return true;
            }
        });
    });

    return result;
};

TrafficPlayerViewModel.prototype.get_supported_layers = function () {
    var self = this;

    if(self.testConfigVm && self.testConfigVm.attributes && self.testConfigVm.attributes.supported_layers){
        return self.testConfigVm.attributes.supported_layers;
    }
    else{
        return [2,7];
    }
};

TrafficPlayerViewModel.prototype.get_source_endpoints = function () {
    if (!this.source()) {
        return [];
    }

    return this.source().enabled_endpoints();
};

TrafficPlayerViewModel.prototype.get_destination_endpoints = function () {
    if (!this.destination()) {
        return [];
    }

    return this.destination().enabled_endpoints();
};