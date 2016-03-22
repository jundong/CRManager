var emitter = require('emitter'),
    debounce = require('utility-functions').debounce,
    AsyncPoller = require('async-poller'),
    moment = require('moment-timezone'),
    tz = window.jstz.determine();

/**
 * Instance of test configuration - managed by TestViewModel.
 *
 * @param testVm
 * @constructor
 */
function ConfiguredTestViewModel(testVm) {
    var self = this;

    self.testVm = testVm;
    self.rootVm = testVm.rootVm;

    self.defaultDuration = 1;
    self.id = ko.observable();
    self.name = ko.observable();
    self.description = ko.observable();
    self.categories = ko.observableArray();
    self.template_name = ko.observable();
    self.spirent_test_id = ko.observable();
    self.duration = ko.observable(self.defaultDuration);
    self.formattedDuration =  ko.computed(self.computedDurationRead.bind(self));
    self.validation_results = ko.observable();
    self.validation_results_success = true;
    self.bandwidth = ko.observable();
    self.customer = ko.observable();
    self.location = ko.observable();
    self.favorite = ko.observable();
    self.working = ko.observable(false);
    self.traffic_players = ko.observableArray();
    self.tags = ko.observableArray();
    self.unqualifiedTags = ko.observable();
    self.datapoint_ids = new Array();
    self.polling = ko.observable(false);
    self.poller = ko.observable();
    self.isLoaded = ko.observable(false);
    self.isDirty = false;
    self.startState = null;
    self.startingTest = false;

    self.engine = null;
    self.module = null;
    self.isTemplate = false;
    self.isUserSave = false;
    self.recommendedTrackIds = ko.observable();
    self.diagram = null;
    self.isMulticast = undefined;
    self.multicast_settings = undefined;
    self.supplementalConfiguration = null;

    self.defaultPlaylistId = null;

    self.displayTags = ko.computed({
        read: self.displayTagsRead.bind(self),
        write: self.displayTagsWrite.bind(self)
    });
    self.preValidationResult = ko.observable();

    self.devices_status_poller = new AsyncPoller(self.getDevicesStatus.bind(self));
    self.timings_poller = new AsyncPoller(self.getTimingAccuracies.bind(self));
    self.time_sync_poller = new AsyncPoller(self.getDeviceTimeSyncCapabilities.bind(self));

    self.attributes = undefined;
    self.max_players = ko.observable(8); //hard code as 8, data bind in template
}

emitter(ConfiguredTestViewModel.prototype);

ConfiguredTestViewModel.typesafe = function (that) {
    if (!(that instanceof ConfiguredTestViewModel)) {
        throw 'This method must be executed on a ConfiguredTestViewModel';
    }

    return that;
};

ConfiguredTestViewModel.prototype.computedDurationRead = function () {
    var self = ConfiguredTestViewModel.typesafe(this);
    return translate('{value} MIN', {
        value: self.duration()
    });
};

ConfiguredTestViewModel.prototype.getTotalTrafficLabel = function () {
    var self = ConfiguredTestViewModel.typesafe(this);

    var trafficTotal = {};
    var trafficPlayers = self.traffic_players();
    for(var i = 0; i < trafficPlayers.length; i++)
        trafficPlayers[i].aggregateTraffic(trafficTotal);

    var trafficTotalLabel = '';
    for (var key in trafficTotal) {
        if (trafficTotal.hasOwnProperty(key)) {
            trafficTotalLabel += (trafficTotalLabel.length > 0 ? " - " : "") + (isNaN(trafficTotal[key]) ? "" : trafficTotal[key] + " " + key);
        }
    }
    return trafficTotalLabel;
};

// ... This should really be done in a data model, but we don't have any
ConfiguredTestViewModel.prototype.get_device_ids = function () {
    var self = this,
        ids = [],
        traffic_players = self.traffic_players(),
        unique = [];

    traffic_players.forEach(function (player) {
        ids = ids.concat(player.getDeviceIds());
    });

    // Make unique
    ids.forEach(function (id) {
        if (unique.indexOf(id) === -1) {
            unique.push(id);
        }
    });
    ids = unique;

    // Remove inactive devices
    ids = ids.filter(function (id) {
        return self.isDeviceActive(id);
    });

    return ids;
};

ConfiguredTestViewModel.prototype.isDeviceActive = function (id) {
    var self = ConfiguredTestViewModel.typesafe(this),
        existingDevice;
    existingDevice = ko.utils.arrayFirst(self.testVm.availableDevices(), function (item) {
            return (item.id() === id && item.active());
    });
    if (existingDevice) {
        return true;
    }
    return false;
};

ConfiguredTestViewModel.prototype.pollDevicesStatus = function () {
    logger.info('Polling device status');

    var self = ConfiguredTestViewModel.typesafe(this);

    if (!self.get_device_ids().length) {
        // Devices haven't been loaded
        return; // Short-circuit
    }

    self.devices_status_poller.poll();
};

ConfiguredTestViewModel.prototype.getDevicesStatus = function(callback, device_ids) {
    logger.info('Getting devices status');

    var update = this.setDevicesStatus.bind(this);

    callback = callback || function () {};
    device_ids = device_ids || this.get_device_ids(); // Get latest device ID's in case they've changed since last poll

    $.ajax({
        method: 'GET',
        url: util.getConfigSetting("devices_status"),
        data: {
            device_ids: device_ids
        },
        dataType: 'json'
    }).always(function (data, status) {
        if ('success' !== status || data.result && 'FAILURE' === data.result) {
            logger.error('Failed to get device status. Result was: ' + JSON.stringify(data, undefined, 2));
        } else {
            update(data);
        }
        callback(data, status);
    });
};

ConfiguredTestViewModel.prototype.setDevicesStatus = function (devices_data) {
    logger.info('Setting devices status', devices_data);

    var self = ConfiguredTestViewModel.typesafe(this);

    for (var i = 0; i < devices_data.length; i++) {
        var device_data = devices_data[i];
        var device = ko.utils.arrayFirst(self.testVm.availableDevices(), function (item) {
            return item.id() == device_data.id;
        });

        device.inflate(device_data);
    }
};

/**
 * Returns a list of source device IDs to destination device IDs based on
 * current test configuration.
 *
 * @returns {Array} paths
 */
ConfiguredTestViewModel.prototype.get_device_paths = function () {
    var paths = [],
        traffic_players = this.traffic_players(),
        unique = [];

    traffic_players.forEach(function (player) {
        paths = paths.concat(player.getDevicePaths());
    });

    // Make paths unique
    paths.forEach(function (path) {
        if (!unique.some(function (p) { return path.source === p.source && path.destination === p.destination; })) {
            unique.push(path);
        }
    });
    paths = unique;

    return paths;
};

// We should create timing-accuracy emitter out of the *TimingAccuracies() methods - have individual devices subscribe to updates
ConfiguredTestViewModel.prototype.pollTimingAccuracies = function () {
    logger.info('Polling timing accuracies');

    var self = ConfiguredTestViewModel.typesafe(this);

    if (!self.get_device_paths().length) {
        // Traffic players haven't been loaded
        return; // Short-circuit
    }

    self.timings_poller.poll();
};

ConfiguredTestViewModel.prototype.getTimingAccuracies = function (callback, paths) {
    logger.info('Getting timing accuracies');

    var update = this.setTimingAccuracies.bind(this);

    callback = callback || function () {};
    paths = paths || this.get_device_paths(); // Get latest paths in case they've changed since last poll

    $.ajax({
        type: "POST",
        url: util.getConfigSetting("get_timing_accuracies"),
        data: JSON.stringify({paths: paths}),
        dataType: 'json',
        contentType: 'application/json',
        processData: false
    }).always(function (data, status) {
        if ('success' !== status || data.result && 'FAILURE' === data.result) {
            logger.error('Failed to get timing accuracies. Result was: ' + JSON.stringify(data, undefined, 2));
        } else {
            update(data);
        }
        callback(data, status);
    });
};

ConfiguredTestViewModel.prototype.setTimingAccuracies = function (data) {
    logger.info('Setting timing accuracies', data);

    var players = this.traffic_players() || [],
        accuracies = data.paths;

    players.forEach(function (player) {
        player.setTimingAccuracies(accuracies);
    });
};

ConfiguredTestViewModel.prototype.pollDeviceTimeSyncCapabilities = function () {
    logger.info('Polling time sync status');

    var self = ConfiguredTestViewModel.typesafe(this);

    if (!self.get_device_ids().length) {
        // Traffic players haven't been loaded
        return; // Short-circuit
    }

    self.time_sync_poller.poll();
};

ConfiguredTestViewModel.prototype.getDeviceTimeSyncCapabilities = function (callback, device_ids) {
    logger.info('Getting time sync status');

    var update = this.setDeviceTimeSyncCapabilities.bind(this);

    callback = callback || function () {};
    device_ids = device_ids || this.get_device_ids(); // Get latest device ID's in case they've changed since last poll

    $.ajax({
        method: 'GET',
        url: util.getConfigSetting("time_sync_status"),
        data: {
            device_ids: device_ids
        },
        dataType: 'json'
    }).always(function (data, status) {
        if ('success' !== status || data.result && 'FAILURE' === data.result) {
            logger.error('Failed to get time sync status. Result was: ' + JSON.stringify(data, undefined, 2));
        } else {
            update(data);
        }
        callback(data, status);
    });
};

ConfiguredTestViewModel.prototype.setDeviceTimeSyncCapabilities = function (data) {
    logger.info('Setting time sync status', data);

    var self = ConfiguredTestViewModel.typesafe(this);

    self.rootVm.updateDeviceTimeSyncCapabilities(data);
};

/**
 * Loads configuration from an existing test
 *
 * @param testConfiguration TestTemplateViewModel
 * @param loadCompleted
 */
ConfiguredTestViewModel.prototype.loadTest = function (testConfiguration, loadCompleted) {
    var self = ConfiguredTestViewModel.typesafe(this);
    // Avoid errors by forcing Knockout to destroy bindings from previous test
    self.testVm.testConfigurationTemplateName(undefined);
    self.name(testConfiguration.name());
    self.description(testConfiguration.description());
    self.duration(testConfiguration.duration() || self.defaultDuration);
    self.bandwidth(testConfiguration.bandwidth());
    self.id(testConfiguration.id());
    self.traffic_players.removeAll();
    self.categories(testConfiguration.categories());
    self.template_name(testConfiguration.template_name());
    self.spirent_test_id(testConfiguration.spirent_test_id());

    if(testConfiguration.attributes){
        self.attributes = testConfiguration.attributes;
    }

    self.engine = testConfiguration.engine;
    self.module = testConfiguration.module;
    self.emit('changed:module', self.module)
    //self.isTemplate = testConfiguration.isTemplate();
    self.isTemplate = false;
    self.isUserSave = testConfiguration.isUserSave;
    self.recommendedTrackIds = testConfiguration.recommendedTrackIds;
    self.diagram = testConfiguration.diagram;

    self.isMulticast = testConfiguration.isMulticast;
    if (self.isMulticast) {
        if (testConfiguration.multicast_settings) {
            self.multicast_settings = testConfiguration.multicast_settings;
        }
    }

    self.supplementalConfiguration = new TestSupplementalConfigurationViewModel(self.rootVm);
    self.supplementalConfiguration.inflate(testConfiguration.supplementalConfiguration.toFlatObject());
    self.add_player_settings = testConfiguration.add_player_settings;

    self.isDirty = false;

    if (self.isUserSave === undefined
        || self.isUserSave === null) {
        self.isUserSave = false;
    }

    if (testConfiguration.isTemplate()) {
        self.id(-1);
        self.isDirty = true;
    }

    self.datapoint_ids.length = 0;

    self.datapoint_ids = testConfiguration.datapoint_ids();

    if(testConfiguration.traffic_players){
        //
    } else {
        //
    }

    self.pollDevicesStatus();
    self.pollTimingAccuracies();
    self.pollDeviceTimeSyncCapabilities();

    self.customer(testConfiguration.customer());
    self.location(testConfiguration.location());
    self.favorite(testConfiguration.favorite());

    self.tags.removeAll();
    var tags = testConfiguration.tags();
    for (var i = 0; i < tags.length; i++) {
        self.tags.push(tags[i]);
    }
    self.displayTags(tags.join());

    self.isLoaded(true);
    if(testConfiguration.result_types)
        self.result_types = testConfiguration.result_types;
    else
        self.result_types = [1];


    self.setStartState();
    //self.rootVm.getAvailableTests();

    self.updateConfig(self.startState);

    if(loadCompleted)
        loadCompleted();
    else
        self.rootVm.showTest();

    return true
};

ConfiguredTestViewModel.prototype.updateConfig = function (config) {
    var self = ConfiguredTestViewModel.typesafe(this);

    config = config || self.toFlatObject();

    $.ajax({
        type: util.getRequestMethod("config_test"),
        url: util.getConfigSetting("config_test"),
        data: util.formatRequestData("config_test", config),
        dataType: 'json',
        cache: false,
        success: function (data, textStatus, jqXhr) {
            var device;
            if (data.is_error) {
                if (data.error_type === 'DEVICE_AUTH') {
                    device = ko.utils.arrayFirst(self.rootVm.availableDevices(), function(item) {
                        return data.device_id === item.id();
                    });

                    util.lightbox.openDeviceAuthError(self, device, data.messages[0].header, data.messages[0].content);
                } else {
                    util.lightbox.openError(data.messages[0].header, data.messages[0].content);
                }
            }
        },
        error: function (jqXhr, textStatus, errorThrown) { util.logData("config_test failed: "+errorThrown); }
    });
}

ConfiguredTestViewModel.prototype.setStartState = function () {
    var self = ConfiguredTestViewModel.typesafe(this),
        trafficPlayers = self.traffic_players(),
        i;

    for (i = 0; i < trafficPlayers.length; i += 1) {
        if (!trafficPlayers[i].loaded) {
            setTimeout(self.setStartState.bind(self), 10);
            return;
        }
    }

    self.startState = self.toFlatObject();

    self.startStateLessNameAndTags = self.getNormalizedFlatObject(self.toFlatObject());
};

ConfiguredTestViewModel.prototype.getNormalizedFlatObject = function (flatObject) {
    var self = ConfiguredTestViewModel.typesafe(this);

    flatObject.name = null;
    flatObject.description = null;
    flatObject.customer = null;
    flatObject.company = null;
    flatObject.location = null;
    flatObject.favorite = null;
    flatObject.tags = null;

    return flatObject;
};

/**
 * Used to instantiate the test configuration page with an initial traffic player
 * or to add additional players.
 *
 * @param flatData {ConfiguredTestViewModel|Object} Optional
 * @param additional {Boolean} truthy when an initial player already exists
 * @return {Window.TrafficPlayerViewModel}
 */
ConfiguredTestViewModel.prototype.addTrafficPlayer = function (flatData, additional) {
    var self = ConfiguredTestViewModel.typesafe(this),
        flatData = flatData || {},
        trafficPlayer = new TrafficPlayerViewModel(self),
        supplemental_config = self.supplementalConfiguration || {},
        is_multicast = self.isMulticast;

    trafficPlayer.is_primary(!additional);

    if (is_multicast && additional) {
        // User clicked "Add another traffic player" on multicast test
        // Players added to multicast test must be unicast
        is_multicast = false;
        delete flatData.multicast_settings;
    }

    if (additional && self.add_player_settings && self.add_player_settings === 'bandwidth') {
        supplemental_config.hasSupplementalConfiguration = false;
    }

    if (supplemental_config && supplemental_config.hasSupplementalConfiguration) {
        var trafficPlayerSupplementalConfig = new TestSupplementalConfigurationViewModel(self.rootVm);
        trafficPlayerSupplementalConfig.inflate(supplemental_config.toFlatObject());
        trafficPlayer.supplementalConfiguration(trafficPlayerSupplementalConfig);
        trafficPlayer.hasSupplementalConfiguration(true);
    } else {
        trafficPlayer.hasSupplementalConfiguration(false);
    }

    trafficPlayer.inflate(flatData, self.getDefaultPlaylistId(), self.datapoint_ids, is_multicast);

    self.traffic_players.push(trafficPlayer);

    return trafficPlayer;
};

ConfiguredTestViewModel.prototype.getDefaultPlaylistId = function () {
    var self = ConfiguredTestViewModel.typesafe(this),
        tmpl;

    if (self.isMulticast) {
        return self.defaultPlaylistId;
    } else {
        tmpl = ko.utils.arrayFirst(self.rootVm.vmDashboard.hostTests(), function (item) {
            return item.template_name() === self.template_name();
        });

        if (tmpl === null) {
            return self.defaultPlaylistId;
        }
        return tmpl.playlist_ids()[0];
    }
};

ConfiguredTestViewModel.prototype.getPlayerLayers = function () {
    var self = ConfiguredTestViewModel.typesafe(this);

    var playerLayers = new Array();

    var trafficPlayers = self.traffic_players();
    for (var i = 0; i < trafficPlayers.length; i++) {
        var playerLayer = trafficPlayers[i].getPlayerLayer();

        if (playerLayer != null) {
            playerLayers.push(playerLayer);
        }
    }

    return playerLayers;
};

ConfiguredTestViewModel.prototype.getTrackResultTypes = function () {
    var self = ConfiguredTestViewModel.typesafe(this),
        trackResultTypes = [],
        trafficPlayers = self.traffic_players(),
        i,
        playerTrackResultTypes;

    for (i = 0; i < trafficPlayers.length; i += 1) {
        playerTrackResultTypes = trafficPlayers[i].getTrackResultTypes();

        if (playerTrackResultTypes.length > 0) {
            trackResultTypes = self.mergeTrackResultTypes(trackResultTypes, playerTrackResultTypes);
        }
    }

    return trackResultTypes;
};

ConfiguredTestViewModel.prototype.hasHTTPTrack = function () {
    var self = ConfiguredTestViewModel.typesafe(this),
        trafficPlayers = self.traffic_players();

    return trafficPlayers.some(function (player) {
        return player.hasHTTPTrack();
    });
};

ConfiguredTestViewModel.prototype.mergeTrackResultTypes = function (trackResultTypes, playerTrackResultTypes) {
    var i;

    for (i = 0; i < playerTrackResultTypes.length; i += 1) {
        if (trackResultTypes.indexOf(playerTrackResultTypes[i]) === -1) {
            trackResultTypes.push(playerTrackResultTypes[i]);
        }
    }

    return trackResultTypes;
};

ConfiguredTestViewModel.prototype.validate = function(success, result){
    var self = ConfiguredTestViewModel.typesafe(this),
        result = result || new ValidationResultsViewModel(self),
        success = success || function () {};

    if(self.traffic_players().length > 0){
        for(var i = 0; i < self.traffic_players().length; i++){
            self.traffic_players()[i].validate(result, translate("Traffic Player {number}", {
                number: i + 1
            }));
        }

        if (result.is_valid) {
            if (!result.warnings.length) {
                success();
            } else {
                // Show warnings, then try to run the test
                util.lightbox.close();
                util.lightbox.open({
                    url: 'templates/lightbox.tmpl.html',
                    selector: '#lightbox-run-test-validation-template',
                    cancelSelector: '.cancel-button',
                    isModal: false,
                    onOpenComplete: function () {
                        ko.applyBindings(result, document.getElementById('lightbox-run-test-validation'));
                    },
                    onClose: function () {
                        if (result.ignore_warning) {
                            setTimeout(function () {
                                success();
                            }, 500);
                        }
                    }
                });
            }

        } else {
            self.setValidationResults(result);
        }

    }else{
        result.addCheckResults(translate("Test Configuration Error"), false, translate("At least one traffic player is required"));
        self.setValidationResults(result);
    }
    return result;
};

ConfiguredTestViewModel.prototype.runTest = function(){
    if (this.startingTest) {
        return; // Short-circuit
    }

    var self = ConfiguredTestViewModel.typesafe(this);
    var currentConfig = self.toFlatObject();
    var normalizedCurrentConfig = self.getNormalizedFlatObject(self.toFlatObject());
    var formatRequestData = util.formatRequestData('run_test', currentConfig);
    var run_handler = function(){
        self.startingTest = true;
        util.lightbox.working(new LightboxWorkingViewModel(translate("Start"), translate("Validating Test...")));
        $.ajax({
            type: util.getRequestMethod('run_test'),
            url: util.getConfigSetting('run_test'),
            data: formatRequestData,
            dataType: 'json',
            //async: false,
            success: self.parseValidationResults.bind(self)
        }).fail(function () {
            logger.error('Validation failed due to HTTP error');
            util.lightbox.error(translate("Validating test"));
            self.startingTest = false;
        });
    };

    self.startingTest = true;
    util.lightbox.working(new LightboxWorkingViewModel(translate("Start"), translate("Validating Test...")));

    if (self.isDirty || ko.toJSON(normalizedCurrentConfig) !== ko.toJSON(self.startStateLessNameAndTags)) {
        currentConfig.is_dirty = true;
        currentConfig.id = -1;
        self.id(-1);
    }

    self.check_for_conflicts_with_upcoming(formatRequestData, run_handler);
};

ConfiguredTestViewModel.prototype.check_for_conflicts_with_upcoming = function(formatRequestData,callback) {
    var self = this;
    $.ajax({
        type: 'POST',
        url: '/ixia/check_for_conflicts_with_upcoming',
        data: formatRequestData,
        dataType: 'json'
    }).success(function(data, textStatus, jqXhr){
        if(data.conflicts_found && data.conflicts_found === true){
            self.startingTest = false;
            util.lightbox.confirmation_dialog(self,self.get_conflict_message(data),callback)
        }
        else self.parseValidationResults.call(self, data, textStatus, jqXhr);
    }).fail(function () {
        logger.error('Validation failed due to HTTP error');
        util.lightbox.error(translate("Validating test"));
        self.startingTest = false;
    });
}

ConfiguredTestViewModel.prototype.get_conflict_message = function(res) {
    if(res.device.name && res.conflicts.length > 0 && res.conflicts[0].name && res.conflicts[0].datetime && res.conflicts[0].event_info.duration){
        var device_name = res.device.name;
        if(device_name === "Local Chassis" && res.conflicts[0].event_info.attributes.type === "remote_test_run")
        {
            device_name = "Remote Chassis";
        }
        return window.translate("Starting this test will interrupt your scheduled test:<br />\"{name}\" on {devices} at {datetime} for {duration} minute(s).", {
            name: res.conflicts[0].name,
            devices: device_name,
            duration: res.conflicts[0].event_info.duration,
            datetime:  moment.tz(res.conflicts[0].datetime, 'UTC').tz(tz.name()).format('LLL')
        });
    }
    else{
        return window.translate("Starting this test will interrupt your scheduled test.");
    }
}

ConfiguredTestViewModel.prototype.parseValidationResults = function (data, textStatus, jqXhr) {
    var self = ConfiguredTestViewModel.typesafe(this);
    if (data.items !== undefined) {
        if (data.items.length > 0) {
            self.id(data.items[0].id);
            self.rootVm.insertUserTest(self)
        }
    }
    var validation_results = new ValidationResultsViewModel(self);
    validation_results.inflate(data);
    self.setValidationResults(validation_results);
};

ConfiguredTestViewModel.prototype.setValidationResults = function (data) {
    var self = ConfiguredTestViewModel.typesafe(this),
        $lb,
        begin_testing = function () {
            self.startingTest = false;
            self.testVm.beginTesting();
        },
        show_invalid = function(result) {
            $lb = document.getElementById('lightbox-run-test-validation');
            ko.applyBindings(result, $lb);
            self.startingTest = false;
        };

    if (data.is_ready && !data.is_valid) {
        throw new ConfiguredTestViewModelException('Test is ready but invalid - only valid tests can be ready');
    }

    self.validation_results(data);

    if (!data.is_ready && data.is_valid) {
        // Show message until test is ready or validation fails

        self.id(data.id);
        self.startStateLessNameAndTags = self.getNormalizedFlatObject(self.toFlatObject());
        self.isDirty = false;

        var message = translate('Validating Test Configuration...');
        if(data.messages && data.messages.length > 0)
            message = data.messages[0];
        if(message.header == "randomize"){
            var testMessages = [translate("Allocating ports..."),translate("Checking Connection..."),translate("Sending test packets..."),translate("Verifying link..."),translate("Disambiguating systems..."),translate("Generating protocols..."),translate("Visualizing data..."),translate("Initializing network...")];
            message.header = testMessages[Math.floor(Math.random()*testMessages.length)];
        }
        util.lightbox.working(new LightboxWorkingViewModel(translate('Validate'), message.header, null, message.content));

        setTimeout(self.checkTestReady.bind(self), 1000);
        return; // Short-circuit
    }

    // Test is ready or invalid
    util.lightbox.close();
    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-run-test-validation-template',
        cancelSelector: '.cancel-button',
        isModal : data.is_valid,
        onOpenComplete: data.is_ready ? begin_testing : show_invalid.bind(self, data),
        onClose: self.cancelTest.bind(self)
    });
};

ConfiguredTestViewModel.prototype.checkTestReady = function (data, textStatus, jqXhr) {
    var self = ConfiguredTestViewModel.typesafe(this);
    $.ajax({
        type: 'GET',
        url: util.getConfigSetting('get_istestready'),
        dataType: 'json',
        cache: false,
        success: self.parseValidationResults.bind(self)
    }).fail(function () {
        util.lightbox.error(translate('Running test'));
        self.startingTest = false;
    });
};


ConfiguredTestViewModel.prototype.cancelTest = function (callback) {
    var self = ConfiguredTestViewModel.typesafe(this);
    $.ajax({
        type: util.getRequestMethod('cancel_test'),
        url: util.getConfigSetting('cancel_test'),
        dataType: 'json',
        success: function(data, textStatus, jqXhr){
            if(util.lightbox.isOpen)
                util.lightbox.close();

            self.startingTest = false;

            if ($.type(callback) == 'function') {
                callback();
            }

            //If we have results, we should show the results table
            var results = self.testVm.vmResults;
            if (results.percentComplete() > 0) {
                results.getFinalTable(results.onGotFinalTable.bind(results));
            }
        }
    }).fail(function () {
        util.lightbox.error(translate("Canceling test"))
    });
};

ConfiguredTestViewModel.prototype.toJSON = function(){
    var self = ConfiguredTestViewModel.typesafe(this);

    var jsonTest = {
        id: self.id(),
        traffic_players : new Array(),
        name : self.name(),
        duration : self.duration(),
        engine : self.engine,
        spirent_test_id: self.spirent_test_id(),
        module : self.module,
        isTemplate : self.isTemplate,
        is_user_save : self.isUserSave,
        recommended_track_ids : self.recommendedTrackIds,
        diagram: self.diagram
    };

    var traffic_players = self.traffic_players();
    for(var i = 0; i < traffic_players.length; i++)
        jsonTest.traffic_players.push(traffic_players[i].toFlatObject());

    return jsonTest;
};

ConfiguredTestViewModel.prototype.displayTagsRead = function () {
    var self = ConfiguredTestViewModel.typesafe(this);

    if (!self.unqualifiedTags()) {
        self.unqualifiedTags(self.tags().join(', '));
    }
    return util.sanitizeUnqualifiedTagGroup(self.unqualifiedTags());
};

ConfiguredTestViewModel.prototype.displayTagsWrite = function (value) {
    var self = ConfiguredTestViewModel.typesafe(this);

    if (value == null) {
        return;
    }

    var newArray = value.split(',');

    self.tags.removeAll();
    for (var i = 0; i < newArray.length; i++) {
        var trimmedValue = util.trimTag(newArray[i]);

        if (trimmedValue == '') {
            continue;
        }

        if (self.tags().indexOf(trimmedValue) == -1) {
            self.tags.push(trimmedValue);
        }
    }
    self.unqualifiedTags(util.sanitizeUnqualifiedTagGroup(value));
    self.unqualifiedTags.valueHasMutated();
};

ConfiguredTestViewModel.prototype.preValidate = function(result, targetName){
    var self = ConfiguredTestViewModel.typesafe(this);
    errors = [];

    if(util.isNullOrEmpty(self.name())){
        errors.push(translate('name'));
    }

    if(errors.length > 0){
        result.addCheckResults(translate("Test Configuration"), false, translate('Test is missing configuration for: {errors}', {
            errors: errors.join(', ')
        }));
    }

};

ConfiguredTestViewModel.prototype.save = function (obj, event) {
    var self = ConfiguredTestViewModel.typesafe(this);

    var name = self.name();
    self.unqualifiedTags(self.tags().join(', '));
    var preValidationResult = new ValidationResultsViewModel(self);
    self.preValidate(preValidationResult, name);
    self.preValidationResult(preValidationResult);
    if(!preValidationResult.is_valid){
        return;
    }

    var dataLessNameAndTags = self.getNormalizedFlatObject(self.toFlatObject());

    var start = JSON.stringify(self.startStateLessNameAndTags);
    var finish = JSON.stringify(dataLessNameAndTags);
    var testChanged = start !== finish;

    if (testChanged) {
        self.id(-1);
    }

    var name = self.name();
    var id = self.id();

    var newname = '';
    var iteration = 0;

    var foundExisting = ko.utils.arrayFirst(self.rootVm.availableTests(), function (item) {
        return name === item.name() && id !== item.id();
    });
    while (foundExisting != null) {
        newname = name + ' [' + (iteration++) + ']';

        foundExisting = ko.utils.arrayFirst(self.rootVm.availableTests(), function (item) {
            return newname == item.name();
        });
    }
    if(newname != '') {
        self.name(newname);
    }

    var data = self.toFlatObject();

    util.lightbox.close();

    var workingVm = new LightboxWorkingViewModel(translate('Save'), translate('Saving...'));
    util.lightbox.working(workingVm);
    data.is_user_save = true;
    $.ajax({
        type: util.getRequestMethod('save_axon_test'),
        url: util.getConfigSetting('save_axon_test'),
        data: util.formatRequestData('save_axon_test', data),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            if (data.result == "SUCCESS") {
                self.id(data.items[0].id);
                // We save test successfully, so current test is clean
                self.isDirty = false;
                logger.info('Updated axon user test id: ' + data.items[0].id);
                self.isUserSave = true;
                self.rootVm.fillFavoriteTests([self.toFlatObject()]);
                self.rootVm.insertUserTest(self);
                self.startState = self.toFlatObject();
                self.startStateLessNameAndTags = self.getNormalizedFlatObject(self.toFlatObject());
                var completedPollingFunction = function(){
                    util.lightbox.working(new LightboxWorkingViewModel(translate('Refreshing test list...'), translate('Refreshing test list...')));
                    util.lightbox.close();
                };
                // Already insertUserTest, so needn't refresh the tests here
                //self.rootVm.getAvailableTests(completedPollingFunction);
                completedPollingFunction()
            } else {
                workingVm.status('error');
                logger.error({message: 'Failed to save test', data: data, textStatus: textStatus});
            }
        },
        error: function (jqXhr, textStatus, errorThrown) {
            workingVm.status('error');
            logger.error(errorThrown);
        }
    });
};

ConfiguredTestViewModel.prototype.toFlatObject = function () {
    var self = ConfiguredTestViewModel.typesafe(this),
        testConfiguration = {},
        categories = self.categories(),
        datapointIds = self.datapoint_ids,
        trafficPlayers = self.traffic_players(),
        i,
        trafficPlayer;

    testConfiguration.id = self.id();
    testConfiguration.default_player_type = self.isMulticast ? 'multicast' : 'unicast';
    testConfiguration.name = self.name();
    testConfiguration.description = self.description();
    testConfiguration.duration = self.duration();
    testConfiguration.bandwidth = self.bandwidth();
    testConfiguration.tags = util.getTags(self);
    testConfiguration.categories = [];
    testConfiguration.template_name = self.template_name();
    testConfiguration.playlist_ids = [];
    testConfiguration.datapoint_ids = [];
    testConfiguration.traffic_players = [];
    testConfiguration.favorite = self.favorite();
    testConfiguration.spirent_test_id = self.spirent_test_id();

    testConfiguration.engine = self.engine;
    testConfiguration.module = self.module;
    testConfiguration.is_template = self.isTemplate;
    testConfiguration.is_user_save = self.isUserSave;
    testConfiguration.recommended_track_ids = self.recommendedTrackIds;
    testConfiguration.diagram = self.diagram;
    testConfiguration.supplemental_configuration = self.supplementalConfiguration.toFlatObject();
    testConfiguration.add_player_settings = self.add_player_settings;

    for (i = 0; i < categories.length; i++) {
        testConfiguration.categories.push(categories[i]);
    }

    for (i = 0; i < datapointIds.length; i++) {
        testConfiguration.datapoint_ids.push(datapointIds[i]);
    }

    for (i = 0; i < trafficPlayers.length; i++) {
        trafficPlayer = trafficPlayers[i];
        testConfiguration.playlist_ids.push(trafficPlayer.playlist().id());
        testConfiguration.traffic_players.push(trafficPlayer.toFlatObject());
    }

    return testConfiguration;
};

function ConfiguredTestViewModelException(message) {
    this.name = 'ConfiguredTestViewModelException';
    this.message = message;
}
ConfiguredTestViewModelException.prototype = new Error();
ConfiguredTestViewModelException.constructor = ConfiguredTestViewModelException;

module.exports = ConfiguredTestViewModel;