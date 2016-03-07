/*global ko:true */

var domify = require('domify'),
    $template = domify(require('./templates/template.js')),
    classes = require('classes'),
    emitter = require('emitter'),
    EndpointVm = require('endpoint-view-model').MulticastViewModel;

/**
 * Manages Tx or Rx configuration for a traffic player when multiple ports can
 * be enabled. When Tx or Rx supports multiple devices, DeviceCollectionViewModel
 * is used (e.g. clients list of multicast player).
 *
 * @param testConfigVm ConfiguredTestViewModel
 * @constructor
 */
function MultiplePortDeviceViewModel(testConfigVm) {
    var self = this;
    self.testConfigVm = testConfigVm;
    self.devices_in_use = undefined; // Used to determine which devices are available
    self.$el = undefined;

    self.endpoints = ko.observableArray([]);

    self.device = undefined; // Immutable

    self.selected_device = ko.observable(); // Used to handle dropdown changes - see .restore()
    self.selected_device_subscription = self.selected_device.subscribe(self.onDeviceChange.bind(self));
    self.networks = ko.observableArray();
    self.selectedPort = ko.observable();
    self.expended = ko.observable(true);
    self.label = ko.observable(); // e.g. "source" or "destination"
    self.deviceName = undefined; // set in .inflate()

    self.strings = {
        'Checking port status ...': window.translate('Checking port status ...'),
        'Confirm for delete the device': window.translate('Confirm for delete the device'),
        "No ports enabled": window.translate("No ports enabled")
    };

    self.timingAccuracy = ko.observable();
    self.timingAccuracyText = ko.computed(function () {
        if (self.timingAccuracy() === undefined) {
            return;
        }

        return window.translate("±{accuracy}ms timing accuracy", {
            accuracy: self.timingAccuracy()
        });
    });
    self.computed_container = [];

    self.lineRate = undefined;
}

emitter(MultiplePortDeviceViewModel.prototype);

MultiplePortDeviceViewModel.prototype.id = function () {
    if (!this.device) {
        return undefined;
    }

    return this.device.id();
};

/**
 * Here so MultiplePortDeviceViewModel and DeviceCollectionViewModel can be use interchangeably
 */
MultiplePortDeviceViewModel.prototype.getDeviceIds = function () {
    var id = this.id();

    return id === undefined ? [] : [id];
};
MultiplePortDeviceViewModel.prototype.set_label = function (label) {
    this.label(label);
};

MultiplePortDeviceViewModel.prototype.set_devices_in_use_observable = function (obs) {
    var self = this;

    self.devices_in_use = obs;

    self.not_last_device = ko.computed(function () {
        return self.devices_in_use().length > 1;
    });
};

MultiplePortDeviceViewModel.typesafe = function (that) {
    if (!(that instanceof MultiplePortDeviceViewModel)) {
        throw 'This method must be executed on a MultiplePortDeviceViewModel';
    }

    return that;
};

MultiplePortDeviceViewModel.prototype.render = function () {
    var self = this,
        $endpoint_container;

    self.$el =  $template.cloneNode(true); // Important! Reusing .$el would result in duplicate KO bindings

    $endpoint_container = self.$el.querySelector('.endpoint-container');

    self.bind();

    self.endpoints().forEach(function (endpoint) {
        $endpoint_container.appendChild(endpoint.render());
    });

    return self.$el;
};

MultiplePortDeviceViewModel.prototype.bind = function(){
    var self = this;

    ko.applyBindings(self, self.$el);
    this.makeDroppable();
};

MultiplePortDeviceViewModel.prototype.inflate = function (device_data) {
    var self = this,
        device = self.testConfigVm.rootVm.availableDevices()[0],
        max_port_number = 4,
        endpoints = [];

    device_data = self.normalize_data(device_data);

    if (device_data.device && device_data.device.id) {
        device = ko.utils.arrayFirst(self.testConfigVm.rootVm.availableDevices(), function (item) {
            return item.id() == device_data.device.id;
        });
    }

    self.device = device;
    self.selected_device(device);

    self.selectedPort(device_data.selectedPort);

    device.ports().forEach(function(port, i){
        var endpointVm = EndpointVm.factory(port.id(), self);

        if (device_data.endpoints && device_data.endpoints.length && device_data.endpoints[i]) {
            endpointVm.inflate(device_data.endpoints[i]);
        }

        endpoints.push(endpointVm);
    });
    self.endpoints(endpoints);

    //error handler for device.port() is not available yet, case when add a device in admin tab and load test.
    if(self.endpoints().length === 0 ){
        for(var i = 1; i <= max_port_number; i++){
            var endpointVm = EndpointVm.factory(i, self);

            if (device_data.endpoints && device_data.endpoints.length && device_data.endpoints[i]) {
                endpointVm.inflate(device_data.endpoints[i]);
            }

            endpoints.push(endpointVm);
        }
        self.endpoints(endpoints);
    }

    self.lineRate = ko.computed(function () {
        var enabled_ports = 0,
            min_rate = 0;

        device.ports().forEach(function (port) {
            var id = port.id();

            if (!self.isPortEnabled(id)()) {
                return; // Short-circuit
            }

            enabled_ports++;

            if (min_rate === 0) {
                min_rate = device.lineRate(id);
                return; // Short-circuit
            }

            min_rate = Math.min(min_rate, device.lineRate(id));
        });

        // Because traffic is distributed evenly across all ports, a number
        // higher than this will exceed line rate on the slowest port
        return min_rate * enabled_ports;
    });

    self.deviceName = ko.computed(function () {
        return self.device.name();
    });
};

/**
 * Performs any transformations necessary to make saved data compatible with
 * latest data structure
 *
 * @param data
 */
MultiplePortDeviceViewModel.prototype.normalize_data = function (data) {
    data = data || {};

    if (!data.device) {
        return data; // Short-circuit
    }

    if (data.port !== undefined && data.endpoint) {
        // Convert old single-port endpoints to multi-port
        data.endpoint.enabled = true;
        data.endpoint.port = data.port;
        data.endpoints = data.endpoints || [];
        data.endpoints[data.port - 1] = data.endpoint;
    }

    return data;
};

/**
 * @param result ValidationResultsViewModel
 * @param targetName context used in validation lightbox. e.g. "Tx ..."
 * @returns ValidationResultsViewModel
 */
MultiplePortDeviceViewModel.prototype.validate = function (result, targetName) {
    var self = MultiplePortDeviceViewModel.typesafe(this),
        name = self.device.name(),
        has_enabled_ports = false;

	targetName = window.translate('{name}, "{device}"', {
		name: targetName,
		device: name
	});

    self.endpoints().forEach(function(endpoint, index) {
        endpoint.validate(result, targetName);
        if (!endpoint.enabled()) {
            return; // short-circuit
        }

        has_enabled_ports = true;

        if (!endpoint.device.device.ports()[index].available()) {
            result.addCheckResults(translate("Test Configuration Error"), false,
                translate("{name} uses unavailable port {port}", {
                name: targetName,
                port: endpoint.port()
            }));
        }
    });

    if (!has_enabled_ports) {
        result.addCheckResults(
            translate("Test Configuration Error"),
            false,
            translate("{name} must have at least one enabled port.",
                {name: targetName}
            )
        );
    }

    return result;
};

MultiplePortDeviceViewModel.prototype.has_enabled_endpoints = function() {
    var enabled = this.endpoints().filter(function(endpoint) {
        return endpoint.enabled();
    });

    return enabled.length;
};

MultiplePortDeviceViewModel.prototype.onDeviceChange = function (device) {
    if(device === this.device){
        return;
    }

    // Remove .selected_device subscription, so events don't fire if/when the VM is restored
    this.selected_device_subscription.dispose();

    this.emit('changed:device', device, this);
};

MultiplePortDeviceViewModel.prototype.restore = function () {
    // Due to Knockout bindings, .selected_device() changes when the <select> changes
    // We need to restore the original value since this VM always represents the original device
    this.selected_device(this.device);
    this.selected_device_subscription = this.selected_device.subscribe(this.onDeviceChange.bind(this));
};

MultiplePortDeviceViewModel.prototype.selectPort = function (portIndex) {
    var self = this;

    self.selectedPort(portIndex);
};

MultiplePortDeviceViewModel.prototype.isPortSelected = function (id) {
    var self = this;

    if(!('isPortSelected_' + id in self.computed_container)){
        self.computed_container['isPortSelected_' + id] = ko.computed(function () {
            return self.selectedPort() === id;
        });
    }

    return self.computed_container['isPortSelected_' + id];
};

MultiplePortDeviceViewModel.prototype.isPortEnabled = function (id) {
    var self = this;

    if(!('isPortEnabled_' + id in self.computed_container)){
        var endpoint;
        self.endpoints().forEach(function(item){
            if(item.port() == id){
                endpoint = item;
            }
        });

        self.computed_container['isPortEnabled_' + id] = ko.computed(function () {
            return endpoint.enabled();
        });
    }

    return self.computed_container['isPortEnabled_' + id];
};


MultiplePortDeviceViewModel.prototype.isPortAvailable = function (port) {
    var self = this;

    if(!('isPortAvailable_' + port.id() in self.computed_container)){
        self.computed_container['isPortAvailable_' + port.id()] = ko.computed(function () {
            return port.available() && self.selectedPort() !== port.id();
        });
    }

    return self.computed_container['isPortAvailable_' + port.id()];
};


MultiplePortDeviceViewModel.prototype.isPortUnavailable = function (port) {
    var self = this;

    if(!('isPortUnavailable_' + port.id() in self.computed_container)){
        self.computed_container['isPortUnavailable_' + port.id()] = ko.computed(function () {
            return !port.available() && self.selectedPort() !== port.id();
        });
    }

    return self.computed_container['isPortUnavailable_' + port.id()];
};

MultiplePortDeviceViewModel.prototype.is_device_selectable = function (id) {
    var self = this;

    if (self.devices_in_use === undefined) {
        // This could be a unicast player which cannot have more than one device
        // Allow any to be selected
        return true;
    }

    if(!('is_device_selectable_' + id in self.computed_container)){
        self.computed_container['is_device_selectable_' + id] = ko.computed(function () {
            var res = true,
                in_use = self.devices_in_use();

            for(var i = 0 ; i < in_use.length; i++){
                res = res && (in_use[i].id() !== id)
            }

            res = res || (self.id() === id);
            return res
        });
    }

    return self.computed_container['is_device_selectable_' + id];
};


MultiplePortDeviceViewModel.prototype.toFlatObject = function(){
    var self = this;

    var flat_object = {
        selectedPort: self.selectedPort(),
        device : self.device ? self.device.toFlatObject() : {}
    };

    flat_object.endpoints = [];

    self.device.ports().forEach(function(port){
        self.endpoints().some(function(endpoint){
            if(endpoint.port() === port.id()){
                flat_object.endpoints.push(endpoint.toFlatObject())
            }
            return endpoint.port() === port.id();
        });
    });

    flat_object.devicePorts = [];
    if (self.device) {
        var devicePorts = self.device.ports();
        for (var i = 0; i < devicePorts.length; i++) {
            flat_object.devicePorts.push(devicePorts[i].toFlatObject());
        }
    }

    flat_object.networks = [];
    for (var i = 0; i < self.networks().length; i++) {
        flat_object.networks.push(self.networks()[i]);
    }
    return flat_object;
};

MultiplePortDeviceViewModel.prototype.remove = function () {
    this.emit('removed', this);
};

MultiplePortDeviceViewModel.prototype.expand_collapse = function () {
    var self = this;

    self.expended(!self.expended());
};

MultiplePortDeviceViewModel.prototype.show_expand_collapse = function () {
    classes(this.$el.querySelector('.expand-collapse')).remove('hidden');
};

MultiplePortDeviceViewModel.prototype.show_timing_accuracy = function () {
    var $accuracy = this.$el.querySelector('.accuracy');

    if (!$accuracy) {
        return; // Short-circuit
    }

    classes($accuracy).remove('hidden');
};

MultiplePortDeviceViewModel.prototype.show_delete = function () {
    classes(this.$el.querySelector('.delete')).remove('hidden');
};

MultiplePortDeviceViewModel.prototype.hide_delete = function () {
    classes(this.$el.querySelector('.delete')).add('hidden');
};

MultiplePortDeviceViewModel.prototype.makeDroppable = function () {
    var self = this,
        draggableClass = mobile.isMobile ? 'draggableIcon' : 'endpoint';

    $(this.$el).droppable({
        drop: function (event, ui) {
            if (ui.draggable.hasClass(draggableClass)) {
                if(self.selectedPort() === undefined) {
                    return; // Short-circuit
                }
                var endpoint_data = ui.helper.data('endpoint'),
                    selected_port = self.selectedPort();
                if (endpoint_data) {
                    endpoint_data = endpoint_data.clone();
//                        endpoint_data.id(0); //treat as new, not in database
                    self.endpoints().some(function(endpoint){
                        if(endpoint.port() === selected_port){
                            if(!endpoint.enabled()){
                                endpoint.$el.querySelector('.enable input').click();
                            }
                            endpoint.inflate(endpoint_data.toFlatObject());
                            return true;
                        }
                        else{
                            return false;
                        }
                    });

                }
            }
        },
        accept: '.' + draggableClass
    });
};

MultiplePortDeviceViewModel.prototype.enabled_endpoints = function () {
    var self = this;

    return self.endpoints().filter(function (endpoint) {
        return endpoint.enabled();
    });
};

module.exports = MultiplePortDeviceViewModel;