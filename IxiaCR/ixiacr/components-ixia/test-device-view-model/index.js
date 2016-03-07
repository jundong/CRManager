/**
 * CAUTION: This module's name is misleading - it's used as a model not a view model
 */

var is_host = require('is-host');

/**
 * Represents a device (as a copy) in the traffic player
 *
 * @param rootVm SpirentEnterpriseViewModel
 * @constructor
 */
function TestDeviceViewModel (rootVm) {
    var self = this;
    self.rootVm = rootVm;

    self.id = ko.observable();
    self.name = ko.observable();
    self.displayNameCssId = ko.observable();
    self.ports = ko.observableArray();
    self.device_type_id = ko.observable();
    self.supports_flowmon = null;
    self.updating_port_status = ko.computed(function () {
        if (!self.ports().length) {
            return true; // Short-circuit
        }

        var updating = false;

        self.ports().forEach(function (port) {
            if (undefined === port.link_status()) {
                updating = true;
            }
        });

        return updating;
    });

    self.host = ko.observable();
    self.hasTimeSync = ko.observable();
    self.timeSyncResolution = ko.observable();

    self.username = ko.observable();
    self.password = ko.observable();

    self.customer = ko.observable();
    self.location = ko.observable();
    self.tags = ko.observableArray();
    self.unqualifiedTags = ko.observable();
    self.favorite = ko.observable();
    self.validationResult = ko.observable();

    self.active = ko.observable(true);

    self.displayTimeSyncResolution = ko.computed(function () {
        return self.hasTimeSync() ? translate('NTP Sync OK') : translate('No NTP Sync');
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.timeSyncLabel = ko.computed(function (){
        return self.hasTimeSync() ? translate("Time Sync Resolution") : translate("Has Time Sync");
    });
    self.timeSyncValue = ko.computed(function (){
        return self.hasTimeSync() && self.timeSyncResolution() ? self.timeSyncResolution().toFixed(3) + translate("ms") : translate("No");
    });

    self.displayTags = ko.computed({
        read: self.displayTagsRead.bind(self),
        write: self.displayTagsWrite.bind(self)
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.name.subscribe(function () {
        var realName = self.name();
        realName = realName.replace(/ /g,'');
        self.displayNameCssId(realName);
    });

    self.timeSyncClass = ko.computed(function () {
        return self.hasTimeSync() ? 'available' : 'unavailable';
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.features = ko.observableArray();
}

module.exports = TestDeviceViewModel;

TestDeviceViewModel.typesafe = function (that) {
    if (!(that instanceof TestDeviceViewModel)) {
        throw 'This method must be executed on a TestDeviceViewModel';
    }

    return that;
};

TestDeviceViewModel.prototype.matchesSearch = function (searchString) {
    var self = TestDeviceViewModel.typesafe(this);

    var searchTerms = searchString.split(' ');

    if (searchTerms.length == 0) {
        return true;
    }

    var name = self.name().toUpperCase();

    if(name == "LOCAL CHASSIS"){
        return true;
    }

    var host = self.host().toUpperCase();
    var customer ='';
    var location ='';
    if (!self.location() == '' || !self.location() == null) {
        location = self.location().toUpperCase();
  }
    if (!self.customer() == '' || !self.customer() == null) {
        customer = self.customer().toUpperCase();
  }

    for (var i = 0; i < searchTerms.length; i++) {
        if (searchTerms[i] == '' || searchTerms[i] == null) {
            continue;
        }

        if (name.indexOf(searchTerms[i].toUpperCase()) == -1
            && host.indexOf(searchTerms[i].toUpperCase()) == -1
            && customer.indexOf(searchTerms[i].toUpperCase()) == -1
            && location.indexOf(searchTerms[i].toUpperCase()) == -1) {
            return false;
        }
    }

    return true;
};

TestDeviceViewModel.prototype.inflate = function (data) {
    var self = TestDeviceViewModel.typesafe(this),
        map = {
            name: 'name',
            device_type_id: 'device_type_id',
            auth_id: 'username',
            password: 'password',
            has_time_sync: 'hasTimeSync',
            time_sync_resolution: 'timeSyncResolution'
        },
        key,
        observable,
        ports = self.ports(),
        port,
        found;

    self.id(data.id);
	self.host(data.host || '');
    if (undefined !== data.supports_flowmon) {
        self.supports_flowmon = data.supports_flowmon;
    }

    // Update properties (observables) using map
    for (key in map) {
        if (data[key]) {
            observable = map[key];
            self[observable](data[key])
        }
    }

    if (data.tags) {
        util.setTags(self, data.tags);
    }

    if (!self.ports().length && undefined !== data.num_ports) {
        // Stub out ports until we have real data
        for (var i = 0; i < data.num_ports; i++) {
            port = new TestDevicePortViewModel(self.rootVm);
            port.id(i+1);
            ports.push(port);
        }
    } else if (undefined !== data.ports && data.ports instanceof Array) {
        // Use real data
        data.ports.forEach(function (port_data) {
            found = false;

            ports.forEach(function(port) {
                if (port.id() === port_data.port) {
                    found = true;
                    port.inflate(port_data);
                }
            });

            if (!found) {
                port = new TestDevicePortViewModel(self.rootVm);
                port.inflate(port_data);
                ports.push(port);
            }
        });
    }

    // Order by port ID
    ports.sort(function(a, b) {
        return a.id() - b.id();
    });

    self.ports(ports);

    // ENT-4739 the devices status endpoint is not consistent with device info
    // loaded during initial page-load, and supported features should rarely
    // change, so only update features if this data is include and truthy.
    if (data.features) {
        self.features(data.features);
    }
};

TestDeviceViewModel.prototype.toFlatObject = function () {
    var self = TestDeviceViewModel.typesafe(this);
    var flatDevice = {
        id: self.id(),
        name: self.name(),
        device_type_id: self.device_type_id(),
        ports: self.ports().length,
        host: self.host(),
        tags: util.getTags(self),
        auth_id: self.username(),
        password: self.password(),
        active: self.active()
    };

    return flatDevice;
};

TestDeviceViewModel.prototype.lineRate = function (port_index) {
    var port;

    // Get port by port_index
    this.ports().some(function (p) {
        if (p.id() === port_index) {
            port = p;
            return true; // Stop the loop
        }

        return false; // Continue
    });

    if (!port) {
        return; // Short-circuit
    }

    return port.line_speed();
};

TestDeviceViewModel.prototype.updateTimeSyncCapability = function (timeSyncCapabilities) {
    var self = TestDeviceViewModel.typesafe(this);

    if (timeSyncCapabilities === null
        || timeSyncCapabilities === undefined) {
        return;
    }

    var id = self.id();

    for (var i = 0; i < timeSyncCapabilities.length; i++) {
        if (id == timeSyncCapabilities[i].device_id) {
            self.hasTimeSync(timeSyncCapabilities[i].has_time_sync_capability);
            self.timeSyncResolution(timeSyncCapabilities[i].resolution);
            return;
        }
    }
};

TestDeviceViewModel.prototype.displayTagsRead = function () {
    var self = TestDeviceViewModel.typesafe(this);

    if (!self.unqualifiedTags()) {
        self.unqualifiedTags(self.tags().join(', '));
    }
    return util.sanitizeUnqualifiedTagGroup(self.unqualifiedTags());
};

TestDeviceViewModel.prototype.displayTagsWrite = function (value) {
    var self = TestDeviceViewModel.typesafe(this);

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

TestDeviceViewModel.prototype.openSaveModal = function () {
    var self = TestDeviceViewModel.typesafe(this);

    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-save-device-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function(){
            self.startState = self.toFlatObject();
            ko.applyBindings(self, document.getElementById('lightbox-save-device'));
        },
        onClose: function(){
            self.inflate(self.startState);
        }
    });
};

TestDeviceViewModel.prototype.validate = function (result, targetName) {
    var self = TestDeviceViewModel.typesafe(this),
        errors = [];

    if(util.isNullOrEmpty(self.name())){
        errors.push(translate('name'));
    }
    if(util.isNullOrEmpty(self.host())){
        errors.push(translate('host'));
    }else{
        if(!is_host.validate(self.host())){
            result.addCheckResults(translate("Device Settings"), false, translate('{host} is not a valid hostname, IPv4, or IPv6 address', {
                host: self.host()
            }));
        }
    }

    if(util.isNullOrEmpty(self.username())){
        errors.push(translate('username'));
    }

    if(util.isNullOrEmpty(self.password())){
        errors.push(translate('password'));
    }

    if(errors.length > 0) {
        result.addCheckResults(translate("Device Settings"), false, translate('{name} is missing configuration for: {errors}', {
            name: targetName ? targetName + translate(" device"): translate("Device "),
            errors: errors.join(', ')
        }));
    }


    self.rootVm.availableDevices().forEach(function(device) {
        if (self.host() === device.host() && self.id() !== device.id()) {
            result.addCheckResults(translate("Device Settings"), false, translate('A device {name} already exists for {host}', {
                name: device.name(),
                host: device.host()
            }));
        }
    });
};

TestDeviceViewModel.prototype.clone = function (source) {
    var destination = new TestDeviceViewModel(this.rootVm),
        cloned_properties = [
            'is_aonic',
            'supports_flowmon'
        ],
        cloned_observable_properties = [
            'id',
            'name',
            'ports',
            'device_type_id',
            'host',
            'hasTimeSync',
            'timeSyncResolution',
            'username',
            'password',
            'customer',
            'location',
            'tags',
            'unqualifiedTags',
            'favorite',
            'validationResult'
        ];

    source = source || this;

    cloned_properties.forEach(function(property) {
        destination[property] = source[property];
    });

    cloned_observable_properties.forEach(function(observable) {
        destination[observable](source[observable]());
    });

    return destination;
};

TestDeviceViewModel.prototype.save = function () {
    var self = TestDeviceViewModel.typesafe(this),
        previous = self.clone(),
        validationResult,
        foundExisting,
        show_error = function(errorData){
            util.lightbox.close();
            util.lightbox.openError(errorData.messages[0].header, errorData.messages[0].content);
        };

    self.tags().length > 0 ? self.unqualifiedTags(self.tags().join(', ')) : self.unqualifiedTags("");

    // Validate
    validationResult = new ValidationResultsViewModel(self);
    self.validate(validationResult, self.name());
    self.validationResult(validationResult);
    if(!validationResult.is_valid){
        return;
    }

    // Prevent duplicates
    foundExisting = ko.utils.arrayFirst(self.rootVm.availableDevices(), function (item) {
        return self.name() == item.name();
    });
    if (foundExisting && foundExisting != self) {
        var iteration = 0;

        do {
            self.name(self.name() + ' [' + (iteration++) + ']');

            foundExisting = ko.utils.arrayFirst(self.rootVm.availableDevices(), function (item) {
                return self.name() == item.name();
            });
        } while (foundExisting != null && foundExisting != self);
    }

    util.lightbox.close();
    var workingVm = new LightboxWorkingViewModel(translate('Save'), translate('Saving...'));
    util.lightbox.working(workingVm);
    $.ajax({
        type: util.getRequestMethod('save_device'),
        url: util.getConfigSetting('save_device'),
        data: util.formatRequestData('save_device', self.toFlatObject()),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            if (data.result !== "SUCCESS" || undefined === data.items || undefined === data.items[0] || undefined === data.items[0].id) {
                show_error(data);
                self.name(previous.name());
                logger.error({message: 'Failed to save device', data: data, textStatus: textStatus});
                return;
            }

            self.id(data.items[0].id);

            foundExisting = ko.utils.arrayFirst(self.rootVm.availableDevices(), function (item) {
                return self.name() == item.name();
            });
            var devices = self.rootVm.availableDevices();
            if (foundExisting === null) {
                devices.push(self);
                devices = util.sort_devices(devices);
                self.rootVm.availableDevices(devices);
            } else {
                self.rootVm.availableDevices.remove(foundExisting);
                devices = self.rootVm.availableDevices();
                devices.push(self);
                devices = util.sort_devices(devices);
                self.rootVm.availableDevices(devices);
            }

            if (data.messages[0].header.toUpperCase() === "WARNING") {
                // Show user a warning
                show_error(data);
            } else {
                util.lightbox.close();
            }
        },
        error: function (jqXhr, textStatus, errorThrown) {
            self.name(previous.name());
            workingVm.status('error');
            logger.error(errorThrown);
        }
    });
};

TestDeviceViewModel.prototype.deleteDevice = function(){
	var self = TestDeviceViewModel.typesafe(this);

	util.lightbox.close();

	var workingVm = new LightboxWorkingViewModel(translate('Delete'), translate('Deleting...'));
    util.lightbox.working(workingVm);
	var id = self.id();

	var payload = {
		id : id
	};

	$.ajax({
		type : util.getRequestMethod('delete_device'),
		url : util.getConfigSetting('delete_device'),
		data : JSON.stringify(payload),
		dataType : "json",
		success: function (data, textStatus, jqXhr) {
			var message = data.messages[0];
			if(!message.is_error && message.header == "Success"){
                self.rootVm.availableDevices.remove(function(item) {
                    return item.id() === payload.id;
                })
                workingVm.status("success");
			}else{
				workingVm.status("error");
				workingVm.close(util.lightbox.close.bind(util.lightbox));
			}
        },
		error: function (jqXhr, textStatus, errorThrown) {
            workingVm.status('error');
        }
	});
};
