function GlobalSettingsViewModel(rootVm) {
    var self = this;

    self.rootVm = rootVm;

    self.ntpServer1 = ko.observable();
    self.ntpServer2 = ko.observable();
    self.ntpServer3 = ko.observable();
    self.ntpServer4 = ko.observable();
    self.ntpServer5 = ko.observable();
    self.axonBackups = ko.observableArray();
    self.dhcp = ko.observable();
    self.hostname = ko.observable();
    self.chassisId = ko.observable();
    self.licenseStatus = ko.observable();
    self.licenseExpiration = ko.observable();
    self.reservedRemotely = ko.observable();
    self.host = ko.observable();
    self.chassisPrefix = ko.observable();
    self.gateway = ko.observable();
    self.primaryDns = ko.observable();
    self.secondaryDns = ko.observable();
    self.validationResult = ko.observable();
    self.currentBuild = ko.observable();
    self.availableUpdate = ko.observable();
    self.currentDHCP = null;
    self.currentIp = null;
    self.currentSsid = null;
    self.currentWpaKey = null;
    self.wifiEnabled = ko.observable();
    self.ssid = ko.observable();
    self.wpaKey = ko.observable();
    self.admin_notifier_counter = ko.computed(self.calculateNotifications.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.admin_notifier = ko.computed(function() {
        return translate('{number}', {
            number: self.admin_notifier_counter()
        }, 'number');
    });
    self.mac_address = ko.observable();
    self.device_name = ko.observable();
}

GlobalSettingsViewModel.typesafe = function (that) {
    if (!(that instanceof GlobalSettingsViewModel)) {
        throw 'This method must be executed on a GlobalSettingsViewModel';
    }

    return that;
};

GlobalSettingsViewModel.prototype.inflate = function (data) {
    var self = GlobalSettingsViewModel.typesafe(this);

    self.ntpServer1(data.ntp_server1);
    self.ntpServer2(data.ntp_server2);
    self.ntpServer3(data.ntp_server3);
    self.ntpServer4(data.ntp_server4);
    self.ntpServer5(data.ntp_server5);
    self.dhcp(data.dhcp);
    for (var i = 0; i < data.axon_backups.length; i++) {
        self.axonBackups.push(data.axon_backups[i]);
    };
    self.hostname(data.hostname);
    self.chassisId(data.chassis_id);
    self.licenseStatus(data.license_status);
    var expireStatus = 'Never';
    if (data.license_status.updates_expires != 0) {
        expireStatus = util.parseUnixTimestampStringToDate(data.license_status.updates_expires, "EE, MMM dd, yyyy");
    };
    self.licenseExpiration(expireStatus);
    self.reservedRemotely(data.reserved_remotely);
    self.host(data.host);
    self.chassisPrefix(data.chassis_prefix);
    self.gateway(data.gateway);
    self.primaryDns(data.primary_dns);
    self.secondaryDns(data.secondary_dns);
    self.currentBuild(data.build_number);
    self.availableUpdate(data.updates);
    self.wifiEnabled(data.wifi_enabled);
    self.ssid(data.ssid);
    self.wpaKey(data.wpa_key);
    self.mac_address(data.mac_address);
    self.device_name(data.device_name);
    if (self.axonBackups().length >= 1){
        for (var j = 0; j < self.axonBackups().length; j++) {
            var thisDate = util.parseUnixTimestampStringToDate(self.axonBackups()[j].date);
            self.axonBackups()[j].date = thisDate;
            self.axonBackups()[j].displayName = translate('Date: {date} | Build: {build} | Loc: {loc}', {
                date: self.axonBackups()[j].date,
                build: self.axonBackups()[j].build,
                loc: self.axonBackups()[j].device == 'chassis' ? 'chassis' : 'usb'
            }); 
        };
        //self.axonBackups.push({'displayName':'RESTORE TO FACTORY SETTINGS'});\
        self.axonBackups.sort(util.sortArrayByObjectKey('date',false));
    }
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
    self.device_name(self.device_name().trim());
    if (self.device_name() === "") {
        errorMessage += translate("Device name can not be empty.");
    } else if (self.device_name().length > 64) {
        errorMessage += translate("Device name cannot be more than 64 characters.");
    } else {
        self.rootVm.availableDevices().some(function(device){
            if(device.id() != 1 && device.name() == self.device_name()) {

                errorMessage += translate("'{name}' is already used by a remote device", {
                        name: self.device_name()
                    });
                return true;
            }
            return false;
        });
    }

    if (!self.dhcp()) {
       if(util.isNullOrEmpty(self.host()) || util.isNullOrEmpty(self.chassisPrefix()) || util.isNullOrEmpty(self.gateway())){
            errorMessage += translate('host');
            sepChar = ', ';
        }
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
        if(self.primaryDns())
        {
            if(!result.isValidIpAddress(self.primaryDns())){
                    result.addCheckResults(translate("Device Settings"), false, translate("The primary DNS IP is not a valid IP address."));
                }
        }
        if (self.secondaryDns()){
                if(!result.isValidIpAddress(self.secondaryDns())){
                    result.addCheckResults(translate("Device Settings"), false, translate("The secondary DNS IP is not a valid IP address."));
                }
        }
        for (var i = 1; i < 5; i++) {
            var ntpServerName = eval("self.ntpServer"+i);
            if (ntpServerName){
                if(!result.isValidIpAddressOrHostname(ntpServerName())){
                    result.addCheckResults("Device Settings", false, translate('NTP Server {number} does not have a valid IP address or hostname.', {
                        number: i
                    }));
                }
            }
        };
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

    if (self.dhcp() != "false") {
        var flatGlobalSettings = {
            ntp_server1: self.ntpServer1(),
            ntp_server2: self.ntpServer2(),
            ntp_server3: self.ntpServer3(),
            ntp_server4: self.ntpServer4(),
            ntp_server5: self.ntpServer5(),
            dhcp: self.dhcp(),
            hostname: self.hostname(),
            host: "",
            chassis_prefix: "",
            gateway: "",
            primary_dns: self.primaryDns(),
            secondary_dns: self.secondaryDns(),
            device_name: self.device_name()
        };
    } else {
        var flatGlobalSettings = {
            ntp_server1: self.ntpServer1(),
            ntp_server2: self.ntpServer2(),
            ntp_server3: self.ntpServer3(),
            ntp_server4: self.ntpServer4(),
            ntp_server5: self.ntpServer5(),
            hostname: self.hostname(),
            host: self.host(),
            chassis_prefix: self.chassisPrefix(),
            gateway: self.gateway(),
            primary_dns: self.primaryDns(),
            secondary_dns: self.secondaryDns(),
            device_name: self.device_name()
        };
    }

    return flatGlobalSettings;
};

GlobalSettingsViewModel.prototype.changing_IP = function () {
    return this.currentIp !== this.host();
};

GlobalSettingsViewModel.prototype.changing_to_DHCP = function () {
    return this.currentDHCP === 'false' && this.currentDHCP !== this.dhcp();
};

GlobalSettingsViewModel.prototype.wifiToFlatObject = function (data) {
    var self = GlobalSettingsViewModel.typesafe(this);

    var flatWifiSettings = {
        wifi_enabled: self.wifiEnabled(),
        ssid: self.ssid(),
        wpa_key: self.wpaKey()
    };

    return flatWifiSettings;
};
