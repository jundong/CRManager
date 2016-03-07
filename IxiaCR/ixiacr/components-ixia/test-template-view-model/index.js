var MulticastSettingsViewModel = require('multicast-settings');

/**
 * Saved configuration for a single test
 *
 * @param rootVm SpirentEnterpriseViewModel
 * @constructor
 */
function TestTemplateViewModel(rootVm) {
    var self = this;
    self.rootVm = rootVm;
    self.vmDashboard = rootVm.vmDashboard;

    self.id = ko.observable();
    self.name = ko.observable();
    self.description = ko.observable();
    self.duration = ko.observable();
    self.bandwidth = ko.observable();
    self.isTemplate = ko.observable(false);
    self.isFactoryTest = ko.observable(false);
    self.categories = ko.observableArray();
    self.template_name = ko.observable();
    self.playlist_ids = ko.observableArray();
    self.datapoint_ids = ko.observableArray();
    self.spirent_test_id = ko.observable();

    self.engine = null;
    self.module = null;
    self.diagram = null;
    self.isUserSave = false;
    self.recommendedTrackIds = null;

    self.isMulticast = undefined;
    self.multicast_settings = undefined;
    self.supplementalConfiguration = null;
    self.add_player_settings = undefined; // What settings should additional players have (e.g. "same", "bandwidth", etc.)

    self.favorite = ko.observable();
    self.customer = ko.observable();
    self.location = ko.observable();
    self.tags = ko.observableArray();
    self.unqualifiedTags = ko.observable();

    self.displayTags = ko.computed({
        read: self.displayTagsRead.bind(self),
        write: self.displayTagsWrite.bind(self)
    });
    self.attributes = undefined;
    self.result_id = undefined; //this is used to tell if the template is correct for a test result which the test is created using user saved test
}

TestTemplateViewModel.typesafe = function (that) {
    if (!(that instanceof TestTemplateViewModel)) {
        throw 'This method must be executed on a TestTemplateViewModel';
    }

    return that;
};

TestTemplateViewModel.prototype.matchesSearch = function (searchString) {
    var self = TestTemplateViewModel.typesafe(this);

    var searchTerms = searchString.split(' ');

    if (searchTerms.length == 0) {
        return true;
    }

    var name = self.name().toUpperCase();

    for (var i = 0; i < searchTerms.length; i++) {
        if (searchTerms[i] == '' || searchTerms[i] == null) {
            continue;
        }

        if (name.indexOf(searchTerms[i].toUpperCase()) == -1) {
            return false;
        }
    }

    return true;
};

TestTemplateViewModel.prototype.openSaveModal = function () {
    var self = TestTemplateViewModel.typesafe(this),
        refreshDraggables = false;

    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-save-test-alternate-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function(){
            self.startState = {
                name: self.name(),
                tags: self.tags(),
                favorite: self.favorite(),
                customer: self.customer(),
                location: self.location()
            };
            ko.applyBindings(self, document.getElementById('lightbox-save-test-alternate'));
        },
        onClose: function(){
            if (self.name() === '') {
                refreshDraggables = true;
            }
            self.name(self.startState.name);
            self.tags(self.startState.tags);
            self.favorite(self.startState.favorite);
            self.customer(self.startState.customer);
            self.location(self.startState.location);

            if (refreshDraggables) {
                self.rootVm.refreshTestDraggables();
            }
        }
    });
};

TestTemplateViewModel.prototype.inflate = function (flatTest) {
    var self = TestTemplateViewModel.typesafe(this);

    self.id(flatTest.id);
    self.name(flatTest.name);
    self.description(flatTest.description);
    self.duration(flatTest.duration);
    self.bandwidth(flatTest.bandwidth);
    self.isTemplate(flatTest.is_template)
    self.isFactoryTest(flatTest.isFactoryTest);
    self.spirent_test_id(flatTest.spirent_test_id);

    self.engine = flatTest.engine;
    self.module = flatTest.module;
    if (flatTest.test_type) {
        self.diagram = {
            test_type: flatTest.test_type,
            test_type_display_name: flatTest.test_type_display_name,
            traffic_type: flatTest.traffic_type,
            traffic_type_display_name: flatTest.traffic_type_display_name,
            traffic_direction: flatTest.traffic_direction
        };
    } else {
        // Make sure we initialize the diagram
        if (self.diagram === null) {
            var tmplTest = ko.utils.arrayFirst(self.vmDashboard.tmplTests(), function (item) {
                return item.template_name() === flatTest.template_name;
            });
            if (tmplTest !== null && self.diagram === null) {
                self.diagram = {
                    test_type: tmplTest.diagram.test_type,
                    test_type_display_name: tmplTest.diagram.test_type_display_name,
                    traffic_type: tmplTest.diagram.traffic_type,
                    traffic_type_display_name: tmplTest.diagram.traffic_type_display_name,
                    traffic_direction: tmplTest.diagram.traffic_direction
                }
            }
        }
    }
    self.isUserSave = flatTest.is_user_save;
    self.recommendedTrackIds = flatTest.recommended_track_ids;
    self.template_name(flatTest.template_name);

    self.isMulticast = flatTest.default_player_type && flatTest.default_player_type === 'multicast';

    self.supplementalConfiguration = new TestSupplementalConfigurationViewModel(self.rootVm);
    self.supplementalConfiguration.inflate(flatTest.supplemental_configuration);
    self.add_player_settings = flatTest.add_player_settings;

    util.setObservableArray(self.categories, flatTest.categories);
    util.setObservableArray(self.playlist_ids, flatTest.playlist_ids);
    util.setObservableArray(self.datapoint_ids, []);

    if(flatTest.traffic_players){
        self.traffic_players = flatTest.traffic_players;
    }
    if(flatTest.result_types){
        self.result_types = flatTest.result_types;
    }

    util.setTags(self, flatTest.tags);

    self.attributes = flatTest.attributes;
    if(flatTest.result_id){
        self.result_id = parseInt(flatTest.result_id);
    }

    if (flatTest.example_configuration) {
        self.merge_example_configuration(flatTest.example_configuration);
    }
};

TestTemplateViewModel.prototype.merge_example_configuration = function (configuration) {
    configuration = configuration || {};

    this.traffic_players = this.traffic_players || configuration.traffic_players;
};

TestTemplateViewModel.prototype.displayTagsRead = function () {
    var self = TestTemplateViewModel.typesafe(this);

    if (!self.unqualifiedTags()) {
        self.unqualifiedTags(self.tags().join(', '));
    }
    return util.sanitizeUnqualifiedTagGroup(self.unqualifiedTags());
};

TestTemplateViewModel.prototype.displayTagsWrite = function (value) {
    var self = TestTemplateViewModel.typesafe(this);

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

        if (self.rootVm.availableTags().indexOf(trimmedValue) == -1) {
            self.rootVm.availableTags.push(trimmedValue);
        }
    }
    self.unqualifiedTags(util.sanitizeUnqualifiedTagGroup(value));
    self.unqualifiedTags.valueHasMutated();
};

TestTemplateViewModel.prototype.save = function (options) {
    var self = TestTemplateViewModel.typesafe(this);
    options.success = options.success || $.noop;
    options.error = options.error || $.noop;

    var name = self.name();
    self.unqualifiedTags(self.tags().join(', '));

    var foundExisting = ko.utils.arrayFirst(self.rootVm.availableTests(), function (item) {
        return name == item.name();
    });

    if (foundExisting != null && foundExisting != self) {
        var iteration = 0;

        do {
            self.name(name + ' [' + (iteration++) + ']');

            foundExisting = ko.utils.arrayFirst(self.rootVm.availableTests(), function (item) {
                return self.name() == item.name();
            });
        } while (foundExisting != null && foundExisting != self);
    }

    var data = self.toFlatObject();
    data = ko.toJSON(data);

    util.logData(data);

    util.lightbox.close();

    var workingVm = new LightboxWorkingViewModel(translate('Save'), translate('Saving...'));
    util.lightbox.working(workingVm);

    $.ajax({
        type: 'POST',
        url: util.getConfigSetting('save_test_template'),
        data: data,
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            if(data.result == "SUCCESS"){
                //TODO: this shouldn't be necessary- the save method should eventually return items & the id.
                if (data.items !== undefined
                    && data.items !== null) {
                    self.id(data.items[0].id);
                }

                options.success(self);
                var completedPollingFunction = function(){
                    util.lightbox.working(new LightboxWorkingViewModel(translate('Refreshing test list...'), translate('Refreshing test list...')));
                    util.lightbox.close();
                };
                self.rootVm.getAvailableTests(completedPollingFunction);
            }else{
                options.error(textStatus);
                workingVm.status('error');
            }
        },
        error: function (jqXhr, textStatus, errorThrown) {
            options.error(textStatus);
            logger.error(errorThrown);
            workingVm.status('error');
        }
    });
};

TestTemplateViewModel.prototype.toFlatObject = function(){
    var self = TestTemplateViewModel.typesafe(this);
    var flatTemplate = {
        id: self.id(),
        default_player_type: self.isMulticast ? 'multicast' : 'unicast',
        tags: {
            favorite: self.favorite(),
            company: self.customer(),
            location: self.location(),
            user_defined: self.tags()
        },
        engine: self.engine,
        module: self.module,
        is_template: self.isTemplate,
        is_user_save: self.isUserSave,
        spirent_test_id: self.spirent_test_id,
        recommended_track_ids: self.recommendedTrackIds,
        supplemental_configuration: self.supplementalConfiguration.toFlatObject()
    };

    return flatTemplate;
};

TestTemplateViewModel.prototype.clone = function(){
    var self = TestTemplateViewModel.typesafe(this);

    var newTest = new TestTemplateViewModel(self.rootVm);

    newTest.isMulticast = self.isMulticast;
    newTest.name(self.name());
    newTest.description(self.description());
    newTest.duration(self.duration());
    newTest.bandwidth(self.bandwidth());
    newTest.spirent_test_id(self.spirent_test_id());

    newTest.engine = self.engine;
    newTest.module = self.module;
    newTest.isTemplate = self.isTemplate;
    newTest.isUserSave = self.isUserSave;
    newTest.recommendedTrackIds = self.recommendedTrackIds;

    newTest.categories(self.categories());
    newTest.template_name(self.template_name());
    newTest.playlist_ids(self.playlist_ids());
    newTest.datapoint_ids(self.datapoint_ids());

    if(self.traffic_players){
        newTest.traffic_players = self.traffic_players;
    }
    if(self.result_types){
        newTest.result_types = self.result_types;
    }

    newTest.supplementalConfiguration = new TestSupplementalConfigurationViewModel(self.rootVm);
    newTest.supplementalConfiguration.inflate(self.supplementalConfiguration.toFlatObject());

    newTest.tags(self.tags());

    return newTest;
};

TestTemplateViewModel.prototype.getDeactiveDevices = function () {
    var self = TestTemplateViewModel.typesafe(this);
    if (self.isTemplate()) {
        return []
    }

    var traffic_players = self.traffic_players,
        active_devices = self.rootVm.availableDevices().filter(function (device) { return device.active(); }),
        active_ids = active_devices.map(function (device) { return device.id(); }),
        deactiveDevices = [];

    traffic_players.forEach(function(player, i) {
        var deactive_str,
            index = i + 1,
            source_devices = player.source.devices || [player.source],
            destination_devices = player.destination.devices || [player.destination];

        source_devices.forEach(function (device) {
            var id = device.device.id;

            if (active_ids.indexOf(id) === -1) {
                deactive_str = "Traffic Player " + index + " destination Device " + device.device.name;
                deactiveDevices.push(deactive_str);
            }
        });

        destination_devices.forEach(function (device) {
            var id = device.device.id;

            if (active_ids.indexOf(id) === -1) {
                deactive_str = "Traffic Player " + index + " destination Device " + device.device.name;
                deactiveDevices.push(deactive_str);
            }
        });
    });

    return deactiveDevices;
};

TestTemplateViewModel.prototype.resetDevices = function() {
    var self = TestTemplateViewModel.typesafe(this);
    if (self.isTemplate()) {
        return []
    }

    var localDevice,
        devices,
        active_devices = self.rootVm.availableDevices().filter(function (device) { return device.active(); }),
        active_ids = active_devices.map(function (device) { return device.id(); });

    localDevice = ko.utils.arrayFirst(self.rootVm.availableDevices(), function (item) {
        return (item.id() == 1);
    });

    for(var i = 0; i < self.traffic_players.length; i++) {
        devices = self.traffic_players[i].source.devices || [self.traffic_players[i].source.device];

        self.traffic_players[i].source.devices = devices.map(function (device) {
            if (active_ids.indexOf(device.device.id) !== -1) {
                device.device.name = localDevice.name();
                device.device.auth_id = localDevice.username();
                device.device.device_type_id = localDevice.device_type_id();
                device.device.host = localDevice.host();
                device.device.id = localDevice.id();
                device.device.password = localDevice.password();
                device.device.ports = localDevice.ports();
            }

            return device;
        });

        devices = self.traffic_players[i].destination.devices || [self.traffic_players[i].destination];
        self.traffic_players[i].destination.devices = devices.map(function (device) {
            if (active_ids.indexOf(device.device.id) === -1) {
                device.device.name = localDevice.name();
                device.device.auth_id = localDevice.username();
                device.device.device_type_id = localDevice.device_type_id();
                device.device.host = localDevice.host();
                device.device.id = localDevice.id();
                device.device.password = localDevice.password();
                device.device.ports = localDevice.ports();
            }

            return device;
        });
    }
};

module.exports = TestTemplateViewModel;