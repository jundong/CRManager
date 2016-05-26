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
    //available, reserved, selected
    self.port0 = ko.observable();
    self.port1 = ko.observable();
    self.port2 = ko.observable();
    self.port3 = ko.observable();
    self.group = ko.observable();
    self.selected = ko.observable();
    self.status = ko.observableArray();
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

    if (id == 'port0') {
        if (self.port0() == 'selected') {
            self.port0('available');
            self.status()[0] = 0;
        } else {
            self.port0('selected');
            self.status()[0] = 1;
        }
    }
    else if (id == 'port1') {
        if (self.port1() == 'selected') {
            self.port1('available');
            self.status()[1] = 0;
        } else {
            self.port1('selected');
            self.status()[1] = 1;
        }
    }
    else if (id == 'port2') {
        if (self.port2() == 'selected') {
            self.port2('available');
            self.status()[2] = 0;
        } else {
            self.port2('selected');
            self.status()[2] = 1;
        }
    }
    else if (id == 'port3') {
        if (self.port3() == 'selected') {
            self.port3('available');
            self.status()[3] = 0;
        } else {
            self.port3('selected');
            self.status()[3] = 1;
        }
    }

    //We need to update DB here
    var selected = '';
    for (var i = 0; i < self.status().length; i++) {
        if (i == 0) {
            selected = selected + self.status()[i];
        } else {
            selected = selected + ':' + self.status()[i];
        }
    }
    self.selected(selected);
    //self.updatePorts();
    self.save();
}

PortViewModel.prototype.inflate = function (flatPort) {
    var self = PortViewModel.typesafe(this);

    self.id(flatPort.id);
    self.device_id(flatPort.device_id);
    self.slot(flatPort.slot);
    self.port0(flatPort.port0);
    self.port1(flatPort.port1);
    self.port2(flatPort.port2);
    self.port3(flatPort.port3);
    self.selected(flatPort.selected);
    self.group(flatPort.group);
    self.status(flatPort.status);
};

PortViewModel.prototype.getNormalizedFlatObject = function (flatObject) {
    var self = ConfiguredTestViewModel.typesafe(this);

    flatObject.device_id = null;
    flatObject.slot = null;
    flatObject.port0 = null;
    flatObject.port1 = null;
    flatObject.port2 = null;
    flatObject.port3 = null;
    flatObject.selected = null;
    flatObject.status = null;
    flatObject.group = null;

    return flatObject;
};

PortViewModel.prototype.toFlatObject = function(){
    var self = PortViewModel.typesafe(this);
    var flatTemplate = {
        id: self.id(),
        device_id: self.device_id(),
        slot: self.slot(),
        port0: self.port0(),
        port1: self.port1(),
        port2: self.port2(),
        port3: self.port3(),
        selected: self.selected(),
        status: self.status(),
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
    newTest.port0(self.port0);
    newTest.port1(self.port1);
    newTest.port2(self.port2);
    newTest.port3(self.port3);
    newTest.selected(self.selected);
    newTest.status(self.status);
    newTest.group(self.group);

    return newTest;
};

module.exports = PortViewModel;