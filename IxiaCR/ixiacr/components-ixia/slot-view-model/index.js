/**
 * Saved configuration for a single test
 *
 * @param rootVm IxiaCRViewModel
 * @constructor
 */
function PortViewModel(rootVm) {
    var self = this;
    self.rootVm = rootVm;

    self.id = ko.observable();
    self.device_id = ko.observable();
    self.slot = ko.observable();
    self.port = ko.observable();
    self.group = ko.observable();
    self.reserved = ko.observable();
    self.selected = ko.observable();
}

PortViewModel.typesafe = function (that) {
    if (!(that instanceof PortViewModel)) {
        throw 'This method must be executed on a PortViewModel';
    }

    return that;
};

PortViewModel.prototype.save = function () {
    var self = PortViewModel.typesafe(this);

    $.ajax({
        type: util.getRequestMethod('save_port'),
        url: util.getConfigSetting('save_port'),
        data: util.formatRequestData('save_port', self.toFlatObject()),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            if (data.result == "SUCCESS") {
                self.updatePorts();
            }
        },
        error: function (jqXhr, textStatus, errorThrown) {
            logger.error(errorThrown);
        }
    });
};

PortViewModel.prototype.updatePorts = function () {
    var self = PortViewModel.typesafe(this);
    foundExisting = ko.utils.arrayFirst(self.rootVm.availablePorts(), function (item) {
        return self.id() == item.id();
    });

    if (foundExisting !== null) {
        self.rootVm.availablePorts.remove(foundExisting);
        ports = self.rootVm.availablePorts();
        ports.push(self);
        self.rootVm.availablePorts(ports.sort(function(pre, next) {
            return (pre.id() < next.id() ? -1 : 1)
        }));
    }
}

PortViewModel.prototype.selectedPort = function (port, event) {
    var self = PortViewModel.typesafe(this),
        id = event.currentTarget.id;

    //We need to update DB here
    if (self.selected()) {
        self.selected(false);
    } else {
        self.selected(true);
    }

    self.save();
}

PortViewModel.prototype.inflate = function (flatPort) {
    var self = PortViewModel.typesafe(this);

    self.id(flatPort.id);
    self.device_id(flatPort.device_id);
    self.slot(flatPort.slot);
    self.port(flatPort.port);
    self.selected(flatPort.selected);
    self.group(flatPort.group);
    self.reserved(flatPort.reserved);
};

PortViewModel.prototype.getNormalizedFlatObject = function (flatObject) {
    var self = ConfiguredTestViewModel.typesafe(this);

    flatObject.device_id = null;
    flatObject.slot = null;
    flatObject.port = null;
    flatObject.selected = null;
    flatObject.reserved = null;
    flatObject.group = null;

    return flatObject;
};

PortViewModel.prototype.toFlatObject = function(){
    var self = PortViewModel.typesafe(this);
    var flatTemplate = {
        id: self.id(),
        device_id: self.device_id(),
        slot: self.slot(),
        port: self.port(),
        selected: self.selected(),
        reserved: self.reserved(),
        group: self.group()
    };

    return flatTemplate;
};

PortViewModel.prototype.clone = function(){
    var self = PortViewModel.typesafe(this);

    var newTest = new PortViewModel(self.rootVm);

    newTest.id(self.id);
    newTest.device_id(self.device_id);
    newTest.slot(self.slot);
    newTest.port(self.port);
    newTest.selected(self.selected);
    newTest.reserved(self.reserved);
    newTest.group(self.group);

    return newTest;
};

module.exports = PortViewModel;