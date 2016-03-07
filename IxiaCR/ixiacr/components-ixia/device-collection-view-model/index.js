var domify = require('domify'),
    emitter = require('emitter'),
    $template = domify(require('./templates/index.js')),
    events = require('event'),
    DeviceVm = require('device-view-model').MultiplePortDeviceViewModel;

/**
 * Manages a collection of device view models - used on test configuration pane.
 *
 * @param testConfigVm
 * @param if_multi
 * @constructor
 */
function DeviceCollectionViewModel(testConfigVm, if_multi) {
    var self = this;
    self.testConfigVm = testConfigVm;
    self.testVm = testConfigVm.testVm;
    self.rootVm = testConfigVm.rootVm;

    self.devices = ko.observableArray([]);
    self.cached_view_models = [];

    self.$el =  undefined;

    self.trafficPlayer = null;

    self.strings = {
        "Checking port status ...": window.translate("Checking port status ..."),
        "{name} must have at least 1 client device": window.translate("{name} must have at least 1 client device")
    };

    self.if_multi = false;

    if(if_multi){
        self.if_multi = if_multi;
    }

    self.label = ko.observable(); // e.g. "Rx" - used by child devices

    self.devicekotrigger = ko.observable('');

    self.another_device_available = ko.computed(function() {
        self.devicekotrigger();
        return self.rootVm.availableDevices().length > self.devices().length ;
    });

    self.lineRate = ko.computed(function () {
        var min_rate;

        self.devices().forEach(function (device) {
            if (min_rate === undefined) {
                min_rate = device.device.lineRate();
                return; // Short-circuit
            }

            min_rate = Math.min(min_rate, device.device.lineRate());
        });

        return min_rate;
    });
}

emitter(DeviceCollectionViewModel.prototype);

DeviceCollectionViewModel.prototype.render = function () {
    var self = this,
        $devices = undefined;

    self.$el =  $template.cloneNode(true);
    $devices = self.$el.querySelector('.devices');

    self.bind();

    self.devices().forEach(function (device) {
        $devices.appendChild(device.render());

        device.show_expand_collapse();
        device.show_timing_accuracy();

        if (self.devices().length > 1) {
            device.show_delete();
        }
    });

    return self.$el;
};


DeviceCollectionViewModel.prototype.bind = function () {
    var self = this;

    ko.applyBindings(self, self.$el);

    self.devices.subscribe(self.onDevicesArrayChange.bind(self));
};

/**
 * @param result ValidationResultsViewModel
 * @param targetName context used in validation lightbox. e.g. "Tx ..."
 * @returns ValidationResultsViewModel
 */
DeviceCollectionViewModel.prototype.validate = function (result, targetName) {
    var devices = this.devices(),
        message = '';

    if (!devices.length) {
        message = window.translate("{name} must have at least 1 client device", {
            name: targetName
        });
        result.addCheckResults(message, false, message);
    }

    devices.forEach(function (device) {
        device.validate(result, targetName);
    });

    return result;
};

DeviceCollectionViewModel.prototype.add_device_handler = function () {
    var self = this,
        $devices = self.$el.querySelector('.devices'),
        deviceVm = self.add_device();

    $devices.appendChild(deviceVm.$el); // deviceVm.render() called in .add_device()
}

DeviceCollectionViewModel.prototype.add_device = function (device_data) {
    var self = this,
        deviceVm;

    if(!device_data){
        // Look for an unused device

        var existing_ids = self.devices().map(function (device) { return device.id(); });

        var unused = self.rootVm.availableDevices().filter(function (device) {
            return existing_ids.indexOf(device.id()) === -1;
        });

        if (unused.length === 0) {
            // All devices are already in the list, so don't let them add another
            return; // Short-circuit
        }

        device_data = {
            device: {id: unused[0].id()},
            endpoints: undefined
        };
    }

    if (device_data.device.id in self.cached_view_models){
        // Load from cache
        deviceVm = self.cached_view_models[device_data.device.id];
        deviceVm.restore();
    } else {
        // Create a new view model
        deviceVm = new DeviceVm(this.testConfigVm);
        deviceVm.set_label(this.label());
        deviceVm.set_devices_in_use_observable(this.devices);
        deviceVm.inflate(device_data);
    }

    deviceVm.once('changed:device', self.onDeviceChange.bind(self));
    deviceVm.once('removed', self.onDeviceRemoved.bind(self));

    self.devices.push(deviceVm);

    self.cached_view_models[deviceVm.id()] = deviceVm;

    // Render after .devices() is updated, so
    // MultiplePortDeviceViewModel.is_device_selectable() is evaluated with current list
    deviceVm.render();
    deviceVm.show_expand_collapse();
    deviceVm.show_timing_accuracy();

    if (self.devices().length > 1) {
        self.devices().forEach(function (device) {
            device.show_delete();
        });
    }

    return deviceVm;
};

DeviceCollectionViewModel.prototype.inflate = function (data) {
    var self = this,
        devices;

    data = data || {};
    devices = data.devices || [];

    if (!devices || !devices.length) {
        // Add a default device
        self.add_device();
        return;
    }

    devices.map(function (device_data) {
        self.add_device(device_data);
    });
};

DeviceCollectionViewModel.prototype.getDeviceIds = function () {
    var self = this;

    return self.devices().map(function (item) {
        return item.id();
    });
};

DeviceCollectionViewModel.prototype.setTimingAccuracies = function (accuracies) {
    var self = this;

    self.devices().forEach(function (device) {
        accuracies.some(function (accuracy) {
            // Accuracies should all use source device, so only need to check destination
            if (device.id() === accuracy.destination) {
                accuracy = Math.abs(accuracy.accuracy).toFixed(3);
                device.timingAccuracy(accuracy);
                return true;
            }
        });
    });
};

/**
 * Replace a device view-model with a new one
 * Called when user selects a new device - indirectly triggers .onDevicesArrayChange() via .add_device()
 *
 * @param device DeviceViewModel
 * @param previous MultiplePortDeviceViewModel Note the difference between first parameter's type
 */
DeviceCollectionViewModel.prototype.onDeviceChange = function(device, previous) {
    // Remove from list now, so MultiplePortDeviceViewModel.is_device_selectable is
    // evaluated with a correct list of devices
    this.devices.remove(previous);

    var device_data = {
            device: {id: device.id()},
            endpoints: undefined
        },
        deviceVm = this.add_device(device_data),
        $parent = this.$el.querySelector('.devices');

    $parent.insertBefore(deviceVm.$el, previous.$el);

    previous.off();
    $parent.removeChild(previous.$el);
};

/**
 * @param device MultiplePortDeviceViewModel
 */
DeviceCollectionViewModel.prototype.onDeviceRemoved = function(device) {
    device.off();
    this.devices.remove(device);

    if (this.devices().length === 1) {
        this.devices()[0].hide_delete();
    }

    this.$el.querySelector('.devices').removeChild(device.$el);
};

/**
 * Called when devices are added or deleted
 */
DeviceCollectionViewModel.prototype.onDevicesArrayChange = function(){
    if (this.devicekotrigger() === '') {
        this.devicekotrigger(' ');
    }
    else{
        this.devicekotrigger('');
    }

    this.emit('changed:device', null);
};

DeviceCollectionViewModel.prototype.toFlatObject = function(){
    var self = this;

    var flat_object = {};

    flat_object.devices = [];
    self.devices().forEach(function(device){
        var device_flat = device.toFlatObject();
        if(device_flat){
            flat_object.devices.push(device_flat);
        }
    });

    return flat_object;
};

DeviceCollectionViewModel.prototype.endpoints = function(){
    return this.devices().reduce(function (prev, curr) {
        var endpoints = curr.endpoints();
        curr = prev.concat(endpoints);
        return curr;
    }, []);
};

DeviceCollectionViewModel.prototype.enabled_endpoints = function () {
    return this.endpoints().filter(function (endpoint) {
        return endpoint.enabled();
    });
};

module.exports = DeviceCollectionViewModel;