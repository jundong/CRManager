function GlobalSettingsViewModel(rootVm) {
    var self = this;
    self.rootVm = rootVm;

    self.hostname = ko.observable();
    self.host = ko.observable();
    self.gateway = ko.observable();
    self.chassisPrefix = ko.observable();
    self.validationResult = ko.observable();
    self.currentBuild = ko.observable();
    self.availableUpdate = ko.observable();
    self.admin_notifier_counter = ko.computed(self.calculateNotifications.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.admin_notifier = ko.computed(function() {
        return translate('{number}', {
            number: self.admin_notifier_counter()
        }, 'number');
    });
    self.mac_address = ko.observable();
}

GlobalSettingsViewModel.typesafe = function (that) {
    if (!(that instanceof GlobalSettingsViewModel)) {
        throw 'This method must be executed on a GlobalSettingsViewModel';
    }

    return that;
};

GlobalSettingsViewModel.prototype.inflate = function (data) {
    var self = GlobalSettingsViewModel.typesafe(this);

    self.hostname(data.hostname);
    self.host(data.host);
    self.gateway(data.gateway);
    self.currentBuild(data.build_number);
    self.availableUpdate(data.updates);
    self.mac_address(data.mac_address);
    self.chassisPrefix(data.netmask);
};
GlobalSettingsViewModel.prototype.calculateNotifications = function() {
    var self = GlobalSettingsViewModel.typesafe(this);

    if (self.availableUpdate()){
        if (self.availableUpdate().available_updates > 0){
            return 1;
        } else {
            return 0;
        }
    } else {
        return 0;
    }
};
GlobalSettingsViewModel.prototype.validate = function (result) {
    var self = GlobalSettingsViewModel.typesafe(this);

    var errorMessage = '', sepChar = '';
    self.hostname(self.hostname().trim());
    if (self.hostname() === "") {
        errorMessage += translate("Device name can not be empty.");
    } else if (self.hostname().length > 64) {
        errorMessage += translate("Device name cannot be more than 64 characters.");
    } else {
        self.rootVm.availableDevices().some(function(device){
            if(device.id() != 1 && device.name() == self.hostname()) {

                errorMessage += translate("'{name}' is already used by a remote device", {
                        name: self.hostname()
                    });
                return true;
            }
            return false;
        });
    }

    if(errorMessage.length > 0){
        result.addCheckResults(translate("Device Settings"), false, translate('Device is missing configuration for: {errorMessage}', {
            errorMessage: errorMessage
        }));
    } else {
        if(!result.isValidIpAddress(self.host())){
            result.addCheckResults(translate("Device Settings"), false, translate("The chassis IP is not a valid IP address."));
        }
        if(!result.isValidIpAddress(self.gateway())){
            result.addCheckResults(translate("Device Settings"), false, translate("The gateway IP is not a valid IP address."));
        }
    }
};

GlobalSettingsViewModel.prototype.toFlatObject = function (data) {
    var self = GlobalSettingsViewModel.typesafe(this);
    var validationResult = new ValidationResultsViewModel(self);
    self.validate(validationResult);
    self.validationResult(validationResult);
    if(!validationResult.is_valid){
        return;
    }

    var flatGlobalSettings = {
        hostname: self.hostname(),
        host: "",
        gateway: ""
    };

    return flatGlobalSettings;
};

GlobalSettingsViewModel.prototype.changing_IP = function () {
    return this.currentIp !== this.host();
};