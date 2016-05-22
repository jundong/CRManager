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
    var self = PortViewModel.typesafe(this),
        refreshDraggables = false;

    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-save-test-alternate-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function(){
            ko.applyBindings(self, document.getElementById('lightbox-save-test-alternate'));
        },
        onClose: function(){
            if (self.name() === '') {
                refreshDraggables = true;
            }
        }
    });
};

PortViewModel.prototype.selectedPort = function (index) {
    var self = PortViewModel.typesafe(this);

    if (index == 0) {
        if (self.port0 == 'selected') {
            self.port0('available');
        } else {
            self.port0('selected');
        }
    }
    else if (index == 1) {
        if (self.port1 == 'selected') {
            self.port1('available');
        } else {
            self.port1('selected');
        }
    }
    else if (index == 2) {
        if (self.port2 == 'selected') {
            self.port2('available');
        } else {
            self.port2('selected');
        }
    }
    else if (index == 3) {
        if (self.port3 == 'selected') {
            self.port3('available');
        } else {
            self.port3('selected');
        }
    }

    //We need to update DB here
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
        status: self.status()
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

    return newTest;
};

module.exports = PortViewModel;