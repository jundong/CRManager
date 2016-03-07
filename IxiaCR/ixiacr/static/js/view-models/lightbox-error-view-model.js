function LightboxErrorViewModel (header, message) {
    var self = this;

    self.header = ko.observable(header);
    self.message = ko.observable(message);
}

function LightboxDeviceAuthErrorViewModel (testConfigVm, device, header, message) {
    var self = this;

    self.header = ko.observable(header);
    self.message = ko.observable(message);
    self.saveDetails = ko.observable(false);
    self.originalDevice = device;
    self.testConfigVm = testConfigVm;
    self.device = {
        username: ko.observable(device.username()),
        password: ko.observable(device.password())
    };

    self.onAuthenticate = function () {
        self.originalDevice.username(self.device.username());
        self.originalDevice.password(self.device.password());

        if (self.saveDetails()) {
            self.originalDevice.saveAuthentication(function () { self.testConfigVm.updateConfig()});
        } else {
            self.testConfigVm.updateConfig();
        }
    }
}