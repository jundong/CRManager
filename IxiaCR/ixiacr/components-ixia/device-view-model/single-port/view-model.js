/*global ko:true, EndpointViewModel:true */

var noop = function () {},
    util = require('utility-functions'),
    domify = require('domify'),
    template = domify(require('./templates/template.js')),
    EndpointViewModel = require('endpoint-view-model').UnicastViewModel,
    mobile = {
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|windows phone/i.test(navigator.userAgent)
    },
    emitter = require('emitter');

/**
 * Manages Tx or Rx configuration for a traffic player when only a single port
 * can be used.
 *
 * @param testConfigVm
 * @constructor
 */
function SinglePortDeviceViewModel(testConfigVm) {
    var self = this;
    self.testConfigVm = testConfigVm;
    self.testVm = testConfigVm.testVm;
    self.rootVm = testConfigVm.rootVm;

    self.previousDevice = undefined;
    self.device = ko.observable();

    self.device.subscribe(self.onDeviceChange.bind(self));

    self.selectedPort = ko.observable();
    self.devicePorts = ko.observableArray();

    self.vlan = ko.observable();
    self.networks = ko.observableArray();

    self.endpoint = ko.observable(new EndpointViewModel(testConfigVm.rootVm));

    self.trafficPlayer = null;

    self.deviceName = ko.computed(self.computeDeviceName.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.showNoIpInfo = ko.computed(self.computeShowNoIpInfo.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.showIpInfo = ko.computed(self.computeShowIpInfo.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.showSelectAPort = ko.computed(self.computeShowSelectAPort.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.showEndpointConfiguration = ko.computed(self.computeShowEndpointConfiguration.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.label = ko.observable(); // e.g. "Tx" or "Rx"
    self.portLabel = ko.computed(self.computePortLabel.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.endpointLabel = ko.computed(self.computeEndpointLabel.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.vlanLabel = ko.computed(self.computeVlanLabel.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.ipLabel = ko.computed(self.computeIpLabel.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.ipDetails = ko.computed(self.computeIpDetails.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.lineRate = ko.computed(self.computeLineRate.bind(self));

    self.strings = {
        'Checking port status ...': translate('Checking port status ...')
    };

    self.timingAccuracy = ko.observable();
    self.timingAccuracyText = ko.computed(function () {
        return window.translate("{accuracy}ms offset from {source}", {
            accuracy: self.timingAccuracy(),
            source: self.label()
        });
    });
}

emitter(SinglePortDeviceViewModel.prototype);

module.exports = SinglePortDeviceViewModel;

SinglePortDeviceViewModel.prototype.id = function () {
    if (this.device() === undefined) {
        return undefined;
    }

    return this.device().id();
};

/**
 * Allow substitution with DeviceCollectionViewModel.getDeviceIds()
 */
SinglePortDeviceViewModel.prototype.getDeviceIds = function () {
    return [this.id()];
};

SinglePortDeviceViewModel.prototype.render = function () {
    var render_endpoint = this.render_endpoint.bind(this),
        endpoint_changed = function(endpoint) {
            if (endpoint) {
                render_endpoint(endpoint);
            }
        };

    this.$el = template.cloneNode(true);

    this.$el.querySelector('.port-container .loading').innerHTML = this.strings['Checking port status ...'];

    this.bind();

    if (this.endpoint()) {
        render_endpoint(this.endpoint());
    }

    this.endpoint.subscribe(endpoint_changed);

    return this.$el;
};

SinglePortDeviceViewModel.prototype.render_endpoint = function (endpoint) {
    var $endpoint,
        $endpoint_container = this.$el.querySelector('.endpoint-container');

    $endpoint_container.innerHTML = '';
    $endpoint = endpoint.render();
    $endpoint_container.appendChild($endpoint);
    endpoint.bind();
};

SinglePortDeviceViewModel.prototype.bind = function () {
    ko.applyBindings(this, this.$el);
    this.makeDroppable();
};

SinglePortDeviceViewModel.prototype.makeDroppable = function () {
    var set_endpoint = this.endpoint;
    var draggableClass = mobile.isMobile ? 'draggableIcon' : 'endpoint';

    $(this.$el).droppable({
        drop: function (event, ui) {
            if (ui.draggable.hasClass(draggableClass)) {
                var endpoint = ui.helper.data('endpoint');

                if (endpoint) {
                    endpoint = endpoint.clone();
                    set_endpoint(endpoint);
                }

            }
        },
        accept: '.' + draggableClass
    });
};

SinglePortDeviceViewModel.typesafe = function (that) {
    if (!(that instanceof SinglePortDeviceViewModel)) {
        throw 'This method must be executed on a SinglePortDeviceViewModel';
    }

    return that;
};
SinglePortDeviceViewModel.prototype.inflate = function (data) {
    var self = SinglePortDeviceViewModel.typesafe(this),
        device;

    if (!data) {
        // Use first device as default
        device = self.rootVm.availableDevices()[0];
        self.device(device);
        return; // Short circuit
    }

    device = ko.utils.arrayFirst(self.rootVm.availableDevices(), function (item) { return item.id() == data.device.id; });

    self.device(device);

    self.selectPort(data.port, true);

    if (!self.endpoint()) {
        self.endpoint(new EndpointViewModel(data.endpoint));
    }
    self.endpoint().inflate(data.endpoint);
    self.vlan(data.vlan);
};
SinglePortDeviceViewModel.prototype.computeShowSelectAPort = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    return self.selectedPort() == null;
};

SinglePortDeviceViewModel.prototype.computeShowEndpointConfiguration = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    return self.selectedPort() != null;
};

SinglePortDeviceViewModel.prototype.computeDeviceName = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    if (self.device() == null) {
        return null;
    }

    return self.device().name();
};

SinglePortDeviceViewModel.prototype.computeShowVlan = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    if (self.endpoint() == null) {
        return false;
    }

    return self.endpoint().vlan_id() != null;
};

SinglePortDeviceViewModel.prototype.computeShowNoIpInfo = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    return self.endpoint() == null;
};

SinglePortDeviceViewModel.prototype.computeShowIpInfo = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    return self.endpoint() != null;
};

SinglePortDeviceViewModel.prototype.computeShowNoVlan = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    if (self.endpoint() == null) {
        return false;
    }

    return self.endpoint().vlan_id() == null;
};

SinglePortDeviceViewModel.prototype.computeShowEndpoint = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    return self.endpoint() != null;
};

SinglePortDeviceViewModel.prototype.computeShowNoEndpoint = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    return self.endpoint() == null;
};

SinglePortDeviceViewModel.prototype.computePortLabel = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    var port = self.selectedPort();
    if (port == null) {
        return translate('No Port');
    }

    return translate('Port {port}', {
        port: port
    });
};

SinglePortDeviceViewModel.prototype.computeEndpointLabel = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    var endpoint = self.endpoint();
    if (endpoint == null) {
        return translate('No Endpoint');
    }

    return endpoint.name();
};

SinglePortDeviceViewModel.prototype.computeVlanLabel = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    var endpoint = self.endpoint();
    if (endpoint == null) {
        return translate('No Vlan');
    }

    var vlan = endpoint.vlan_id();
    if (vlan == null) {
        return translate('No Vlan');
    }

    return vlan;
};

SinglePortDeviceViewModel.prototype.computeIpLabel = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    var endpoint = self.endpoint();
    if (endpoint == null) {
        return translate('No IP Info');
    }

    return translate('IP Details');
};

SinglePortDeviceViewModel.prototype.computeIpDetails = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    var endpoint = self.endpoint();
    if (endpoint == null) {
        return translate('No IP Details');
    }

    return translate('Starting IP: {startingIp}, Ending IP: {endingIp}', {
        startingIp: endpoint.ip(),
        endingIp: endpoint.end_ip()
    });
};

SinglePortDeviceViewModel.prototype.computeLineRate = function () {
    var index = this.selectedPort(),
        device = this.device();

    if (null == index || undefined === device) {
        // No device loaded or port is not selected, so line rate is undefined
        return null; // Short-circuit
    }

    return device.lineRate(index);
};

SinglePortDeviceViewModel.prototype.computeShowPort = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    return self.selectedPort() != null;
};

SinglePortDeviceViewModel.prototype.computeShowNoPort = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    return self.selectedPort() == null;
};

SinglePortDeviceViewModel.prototype.computeHasDevice = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    return self.device() != null;
};

SinglePortDeviceViewModel.prototype.computeNoDevice = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    return self.device() == null;
};

SinglePortDeviceViewModel.prototype.portIdInUse = function (id) {
    var self = SinglePortDeviceViewModel.typesafe(this);

    if (self.trafficPlayer == null) {
        return false;
    }

    if (self.selectedPort() == id) {
        return true;
    } else {
        return false
    }

    //return self.trafficPlayer.portIdInUse(id);
};

SinglePortDeviceViewModel.prototype.networkMapUsingSameDevice = function () {
    var self = SinglePortDeviceViewModel.typesafe(this);

    if (self.trafficPlayer == null) {
        return false;
    }

    return self.trafficPlayer.usingSameDevice();
};

SinglePortDeviceViewModel.prototype.onDeviceChange = function (device) {
    var self = SinglePortDeviceViewModel.typesafe(this),
        ports = self.device().ports();

    if (device.id) {
        logger.debug('Device changed to ' + device.id());
    }

    self.selectedPort(null);
    self.endpoint(null);
    self.devicePorts(ports);

    // Emit an event only if device is has changed
    if (device.id && self.previousDevice !== device.id()) {
        self.previousDevice = self.device().id();
        self.emit('changed:device', device);
    }
};

SinglePortDeviceViewModel.prototype.selectPort = function (portIndex, initialInflate) {
    var self = SinglePortDeviceViewModel.typesafe(this),
        endpoint = new EndpointViewModel(self.rootVm);

    if (initialInflate) {
        self.selectedPort(portIndex);
        self.endpoint(endpoint);
    } else {
        self.selectedPort(portIndex);
        if (!self.endpoint()) {
            self.endpoint(endpoint);
        } else {
            self.endpoint(self.endpoint());
        }
    }
};

SinglePortDeviceViewModel.prototype.isPortSelected = function (id) {
    var self = SinglePortDeviceViewModel.typesafe(this);

    return ko.computed(function () {
        return self.selectedPort() === id;
    });
};


SinglePortDeviceViewModel.prototype.isPortAvailable = function (port) {
    var self = SinglePortDeviceViewModel.typesafe(this);

    return ko.computed(function () {
        return port.available() && self.selectedPort() !== port.id();
    });
};


SinglePortDeviceViewModel.prototype.isPortUnavailable = function (port) {
    var self = SinglePortDeviceViewModel.typesafe(this);

    return ko.computed(function () {
        return !port.available() && self.selectedPort() !== port.id();
    });
};

SinglePortDeviceViewModel.prototype.validate = function (result, targetName) {
    var self = SinglePortDeviceViewModel.typesafe(this);

    if (self.selectedPort() == null) {
        result.addCheckResults(translate("Test Configuration Error"), false, translate("{name} is missing a port selection", {
            name: targetName
        }));
    } else { // if port is selected, make sure the end point is configured
        var reqestedBandwidth = parseInt(self.trafficPlayer.traffic_setting().value());
        var ports = self.device().ports();
        var selected_port;
        ports.forEach(function(port) {
            if (port.id() === self.selectedPort()) {
                if (!port.available()) {
                    result.addCheckResults(translate("Test Configuration Error"), false,
                        translate("{name} uses unavailable port {port}", {
                        name: targetName,
                        port: port.id()
                    }));
                }
                selected_port = port;
            }
        });
        var portLineSpeed = selected_port.line_speed();
        if (!isNaN(reqestedBandwidth) && portLineSpeed != null) {
            if (reqestedBandwidth > portLineSpeed) {
                result.addCheckResults(translate("Test Configuration Error"), false,
                    translate("{name} bandwidth '{bandwidth} Mbps' exceeds link capacity '{capacity} Mbps' on port {port}", {
                        name: targetName,
                        bandwidth: reqestedBandwidth,
                        capacity: portLineSpeed,
                        port: self.selectedPort().toString()
                    }));
            }
        }
        if (self.endpoint() != null) {
            self.endpoint().validate(result, targetName);
            currentTrack = self.trafficPlayer.currentPlaylist.tracks();
            if (self.endpoint().use_dhcp() == "v6" && currentTrack.length > 0) {
                for (var i = 0; i < currentTrack.length; i++) {
                    if (currentTrack[i]().trackTypeId == 1 || currentTrack[i]().trackObject == "FixedFrameLengthTrack") {
                        engineCount = currentTrack[i]().trackProperties().length;
                        for (var j = 0; j < engineCount; j++) {
                            if (currentTrack[i]().trackProperties()[j].engine_model().name == "frame_length") {
                                if (currentTrack[i]().trackProperties()[j].engine_model().value[0] == 64) {
                                    result.addCheckResults(translate("Test Configuration Error"), false,
                                        translate("{name} endpoint does not support 64 Byte Frames on DHCPv6", {
                                            name: targetName
                                        }));
                                }
                            }
                        }
                    }
                }
            }
        } else {
            result.addCheckResults(translate("Test Configuration Error"), false,
                translate("{name} endpoint has not been configured", {
                    name: targetName
                }));
        }
    }
};

SinglePortDeviceViewModel.prototype.toFlatObject = function(){
    var self = SinglePortDeviceViewModel.typesafe(this);

    var flatConfig = {
        device : self.device() ? self.device().toFlatObject() : {},
        vlan : self.vlan(),
        networks : self.networks(),
        endpoint : self.endpoint() ? self.endpoint().toFlatObject() : {},
        port: self.selectedPort()
    };

    flatConfig.devicePorts = new Array();
    if (self.device()) {
        var devicePorts = self.device().ports();
        for (var i = 0; i < devicePorts.length; i++) {
            flatConfig.devicePorts.push(devicePorts[i].toFlatObject());
        }
    }

    var networks = self.networks();
    for (var i = 0; i < networks.length; i++) {
        flatConfig.networks.push(networks[i]);
    }
    return flatConfig;
};