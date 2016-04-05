/**
 * CAUTION: This module's name is misleading - it's used as a model not a view model
 */

var is_host = require('is-host');

/**
 * Represents a device (as a copy) in the traffic player
 *
 * @param rootVm IxiaCRViewModel
 * @constructor
 */
function TestDeviceViewModel (rootVm) {
    var self = this;
    self.rootVm = rootVm;

    self.id = ko.observable();
    self.name = ko.observable();
    self.description = ko.observable();
    self.device_type_id = ko.observable();
    self.host = ko.observable();
    self.link = ko.observable();
    self.displayNameCssId = ko.observable();
    self.username = ko.observable();
    self.password = ko.observable();
    self.validationResult = ko.observable();

    self.active = ko.observable(true);

    self.name.subscribe(function () {
        var realName = self.name();
        realName = realName.replace(/ /g,'');
        self.displayNameCssId(realName);
    });
}

module.exports = TestDeviceViewModel;

TestDeviceViewModel.typesafe = function (that) {
    if (!(that instanceof TestDeviceViewModel)) {
        throw 'This method must be executed on a TestDeviceViewModel';
    }

    return that;
};

TestDeviceViewModel.prototype.matchesSearch = function (searchString) {
    var self = TestDeviceViewModel.typesafe(this);

    var searchTerms = searchString.split(' ');

    if (searchTerms.length == 0) {
        return true;
    }

    var name = self.name().toUpperCase();

    if(name == "LOCAL CHASSIS"){
        return true;
    }

    var host = self.host().toUpperCase();
    var customer ='';
    var location ='';
    if (!self.location() == '' || !self.location() == null) {
        location = self.location().toUpperCase();
  }
    if (!self.customer() == '' || !self.customer() == null) {
        customer = self.customer().toUpperCase();
  }

    for (var i = 0; i < searchTerms.length; i++) {
        if (searchTerms[i] == '' || searchTerms[i] == null) {
            continue;
        }

        if (name.indexOf(searchTerms[i].toUpperCase()) == -1
            && host.indexOf(searchTerms[i].toUpperCase()) == -1
            && customer.indexOf(searchTerms[i].toUpperCase()) == -1
            && location.indexOf(searchTerms[i].toUpperCase()) == -1) {
            return false;
        }
    }

    return true;
};

TestDeviceViewModel.prototype.inflate = function (data) {
    var self = TestDeviceViewModel.typesafe(this);

    self.id(data.id);
    self.name(data.name);
    self.description(data.description);
    self.host(data.host);
    self.link(data.link);
    self.device_type_id(data.device_type_id);
    self.username(data.username);
    self.password(data.password);
    self.active(data.active);
};

TestDeviceViewModel.prototype.toFlatObject = function () {
    var self = TestDeviceViewModel.typesafe(this);
    var flatDevice = {
        id: self.id(),
        name: self.name(),
        description: self.description,
        device_type_id: self.device_type_id(),
        host: self.host(),
        link: self.link(),
        username: self.username(),
        password: self.password(),
        active: self.active()
    };

    return flatDevice;
};

TestDeviceViewModel.prototype.openSaveModal = function () {
    var self = TestDeviceViewModel.typesafe(this);

    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-save-device-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function(){
            self.startState = self.toFlatObject();
            ko.applyBindings(self, document.getElementById('lightbox-save-device'));
        },
        onClose: function(){
            self.inflate(self.startState);
        }
    });
};

TestDeviceViewModel.prototype.validate = function (result, targetName) {
    var self = TestDeviceViewModel.typesafe(this),
        errors = [];

    if(util.isNullOrEmpty(self.name())){
        errors.push(translate('name'));
    }
    if(util.isNullOrEmpty(self.host())){
        errors.push(translate('host'));
    }else{
        if(!is_host.validate(self.host())){
            result.addCheckResults(translate("Device Settings"), false, translate('{host} is not a valid hostname, IPv4, or IPv6 address', {
                host: self.host()
            }));
        }
    }

    if(util.isNullOrEmpty(self.username())){
        errors.push(translate('username'));
    }

    if(util.isNullOrEmpty(self.password())){
        errors.push(translate('password'));
    }

    if(errors.length > 0) {
        result.addCheckResults(translate("Device Settings"), false, translate('{name} is missing configuration for: {errors}', {
            name: targetName ? targetName + translate(" device"): translate("Device "),
            errors: errors.join(', ')
        }));
    }


    self.rootVm.availableDevices().forEach(function(device) {
        if (self.host() === device.host() && self.id() !== device.id()) {
            result.addCheckResults(translate("Device Settings"), false, translate('A device {name} already exists for {host}', {
                name: device.name(),
                host: device.host()
            }));
        }
    });
};

TestDeviceViewModel.prototype.clone = function (source) {
    var destination = new TestDeviceViewModel(this.rootVm),
        cloned_properties = [
        ],
        cloned_observable_properties = [
            'id',
            'name',
            'description',
            'device_type_id',
            'host',
            'link',
            'username',
            'password'
        ];

    source = source || this;

    cloned_properties.forEach(function(property) {
        destination[property] = source[property];
    });

    cloned_observable_properties.forEach(function(observable) {
        destination[observable](source[observable]());
    });

    return destination;
};

TestDeviceViewModel.prototype.save = function () {
    var self = TestDeviceViewModel.typesafe(this),
        previous = self.clone(),
        validationResult,
        foundExisting,
        show_error = function(errorData){
            util.lightbox.close();
            util.lightbox.openError(errorData.messages[0].header, errorData.messages[0].content);
        };

    // Prevent duplicates
    foundExisting = ko.utils.arrayFirst(self.rootVm.availableDevices(), function (item) {
        return self.link() == item.link();
    });
    if (foundExisting && foundExisting != self) {
        show_error("Saving device failed. Perhaps this link already exists?");
    }

    util.lightbox.close();
    var workingVm = new LightboxWorkingViewModel(translate('Save'), translate('Saving...'));
    util.lightbox.working(workingVm);
    $.ajax({
        type: util.getRequestMethod('save_device'),
        url: util.getConfigSetting('save_device'),
        data: util.formatRequestData('save_device', self.toFlatObject()),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            if (data.result !== "SUCCESS" || undefined === data.items || undefined === data.items[0] || undefined === data.items[0].id) {
                show_error(data);
                self.name(previous.name());
                logger.error({message: 'Failed to save device', data: data, textStatus: textStatus});
                return;
            }

            self.id(data.items[0].id);

            foundExisting = ko.utils.arrayFirst(self.rootVm.availableDevices(), function (item) {
                return self.name() == item.name();
            });
            var devices = self.rootVm.availableDevices();
            if (foundExisting === null) {
                devices.push(self);
                devices = util.sort_devices(devices);
                self.rootVm.availableDevices(devices);
            } else {
                self.rootVm.availableDevices.remove(foundExisting);
                devices = self.rootVm.availableDevices();
                devices.push(self);
                devices = util.sort_devices(devices);
                self.rootVm.availableDevices(devices);
            }

            if (data.messages[0].header.toUpperCase() === "WARNING") {
                // Show user a warning
                show_error(data);
            } else {
                util.lightbox.close();
            }
        },
        error: function (jqXhr, textStatus, errorThrown) {
            self.name(previous.name());
            workingVm.status('error');
            logger.error(errorThrown);
        }
    });
};

TestDeviceViewModel.prototype.deleteDevice = function(){
	var self = TestDeviceViewModel.typesafe(this);

	util.lightbox.close();

	var workingVm = new LightboxWorkingViewModel(translate('Delete'), translate('Deleting...'));
    util.lightbox.working(workingVm);
	var id = self.id();

	var payload = {
		id : id
	};

	$.ajax({
		type : util.getRequestMethod('delete_device'),
		url : util.getConfigSetting('delete_device'),
		data : JSON.stringify(payload),
		dataType : "json",
		success: function (data, textStatus, jqXhr) {
			var message = data.messages[0];
			if(!message.is_error && message.header == "Success"){
                self.rootVm.availableDevices.remove(function(item) {
                    return item.id() === payload.id;
                })
                workingVm.status("success");
			}else{
				workingVm.status("error");
				workingVm.close(util.lightbox.close.bind(util.lightbox));
			}
        },
		error: function (jqXhr, textStatus, errorThrown) {
            workingVm.status('error');
        }
	});
};
