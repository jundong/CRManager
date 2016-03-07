/*global ko:true, translate:true */

// Use SpirentEnterpriseVM as dependency container, because we don't have one

function TestDevicePortViewModel(rootVm) {
    rootVm = rootVm || window.spirentEnterpriseVm;
    var throttle_duration = rootVm.defaultThrottleDuration;

    this.id = ko.observable();
    this.available = ko.observable(false);
    this.allocated_to = ko.observable();
    this.link_status = ko.observable();
    this.line_speed = ko.observable();
    this.portLightTooltips = ko.computed(this.portLightTooltips.bind(this));
    this.portLight1StatusClass = ko.computed(this.portLight1StatusClass.bind(this));
    this.portLight2StatusClass = ko.computed(this.portLight2StatusClass.bind(this));
}

/**
 *
 * @param data
 */
TestDevicePortViewModel.prototype.inflate = function (data) {
    var available = data.available || false;

    this.id(data.port);
    this.available(available);
    this.allocated_to(data.allocated_to);
    this.link_status(data.link_status);
    this.line_speed(data.line_speed);
};

TestDevicePortViewModel.typesafe = function (that) {
    if (!(that instanceof TestDevicePortViewModel)) {
        throw 'This method must be executed on a TestDevicePortViewModel';
    }

    return that;
};

TestDevicePortViewModel.prototype.portLightTooltips = function () {
    var self = TestDevicePortViewModel.typesafe(this),
        speed;

    if (self.link_status() !== "UP") {
        return translate("Link: Down");
    }

    switch (self.line_speed()) {
    case 10:
        speed = "10 mbps";
        break;

    case 100:
        speed = "100 mbps";
        break;

    case 1000:
        speed = "1 gbps";
        break;

    case 10000:
        speed = "10 gbps";
        break;
    }

    return translate("Link: Up | Speed: {speed}", { speed: speed });
};

TestDevicePortViewModel.prototype.portLight1StatusClass = function () {
    return this.link_status();
};
TestDevicePortViewModel.prototype.portLight2StatusClass = function () {
    return 'UP' === this.link_status() ? 'l' + this.line_speed() : '';
};

TestDevicePortViewModel.prototype.toFlatObject = function () {
    var self = TestDevicePortViewModel.typesafe(this);
    return self.id();
};

