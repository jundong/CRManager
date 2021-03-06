function TestSupplementalConfigurationViewModel (rootVm) {
    var self = this;
    self.rootVm = rootVm;

    self.hasSupplementalConfiguration = false;
    self.playlistSettings = [];
}

TestSupplementalConfigurationViewModel.typesafe = function (that) {
    if (!(that instanceof TestSupplementalConfigurationViewModel)) {
        throw 'This method must be executed on a TestSupplementalConfigurationViewModel';
    }

    return that;
};

TestSupplementalConfigurationViewModel.prototype.inflate = function(supplementalConfiguration) {
    var self = TestSupplementalConfigurationViewModel.typesafe(this),
        i, j,
        playlistSetting,
        supplementalConfigurationField;

    if (supplementalConfiguration === null
            || supplementalConfiguration === undefined
            || Object.keys(supplementalConfiguration).length === 0
            || !supplementalConfiguration.playlist_settings
            || !supplementalConfiguration.playlist_settings.length) {
        return;
    }

    self.hasSupplementalConfiguration = true;

    self.playlistSettings = [];

    for (i = 0; i < supplementalConfiguration.playlist_settings.length; i += 1) {
        playlistSetting = {};

        playlistSetting.title = supplementalConfiguration.playlist_settings[i].title;
        playlistSetting.layers = supplementalConfiguration.playlist_settings[i].layers;

        playlistSetting.fields = [];
        for (j = 0; j < supplementalConfiguration.playlist_settings[i].fields.length; j += 1) {
            supplementalConfigurationField = new TestSupplementalConfigurationFieldViewModel(self.rootVm);
            supplementalConfigurationField.inflate(supplementalConfiguration.playlist_settings[i].fields[j]);
            playlistSetting.fields.push(supplementalConfigurationField);
        }

        self.playlistSettings.push(playlistSetting);
    }
};

TestSupplementalConfigurationViewModel.prototype.toFlatObject = function() {
    var self = TestSupplementalConfigurationViewModel.typesafe(this),
        i, j,
        playlistSetting,
        flatObject = {};

    if (!self.hasSupplementalConfiguration) {
        return null;
    }

    flatObject.playlist_settings = [];

    for (i = 0; i < self.playlistSettings.length; i += 1) {

        playlistSetting = {};
        playlistSetting.title = self.playlistSettings[i].title;
        playlistSetting.layers = self.playlistSettings[i].layers;
        playlistSetting.fields = [];

        for (j = 0; j < self.playlistSettings[i].fields.length; j += 1) {
            playlistSetting.fields.push(self.playlistSettings[i].fields[j].toFlatObject());
        }

        flatObject.playlist_settings.push(playlistSetting);
    }

    return flatObject;
};

TestSupplementalConfigurationViewModel.prototype.validate = function(result, targetName) {
    var self = TestSupplementalConfigurationViewModel.typesafe(this);
    var temp;
    for (var i = 0; i < self.playlistSettings.length; i += 1) {
        for (var j = 0; j < self.playlistSettings[i].fields.length; j += 1) {
            temp = self.playlistSettings[i].fields[j];
            if (util.isNullOrEmpty(temp.value())) {
                result.addCheckResults(translate("Test Configuration Error"), false,
                    translate("{target} is missing required {supplementalConfigurationName} {field} field", {
                        target: targetName,
                        supplementalConfigurationName: self.playlistSettings[i].title,
                        field: self.playlistSettings[i].fields[j].label
                    }));
            }else{
                if(temp.type == "text"){
                    if(isNaN(temp.value())){
                        result.addCheckResults(translate("Test Configuration Error"), false,
                            translate("{target} must be a number.", {
                                target: temp.label
                        }));
                    } else if (temp.label.toLowerCase().indexOf("mbps") > -1 && parseFloat(temp.value()) <= 0) {
                        result.addCheckResults(translate("Test Configuration Error"), false,
                            translate("{name} has bandwidth which must be greater than 0 Mbps", {
                                name: temp.label
                            }));
                    } else if (parseFloat(temp.value()) < 0.0) {
                        result.addCheckResults(translate("Test Configuration Error"), false,
                            translate("{target} must be greater than or equal to 0.", {
                                target: temp.label
                        }));
                    }
                }
            }
        }
    }
    return result;
}

TestSupplementalConfigurationViewModel.prototype.changeLineRate = function (rate) {
    this.playlistSettings.forEach(function (setting) {
        setting.fields.forEach(function (field) {
            field.changeLineRate(rate);
        });
    });
};

function TestSupplementalConfigurationFieldViewModel (rootVm) {
    var self = this;
    self.rootVm = rootVm;
    self.lineRateVm = new LineRateMessageViewModel();

    self.type = null;
    self.value = ko.observable();
    self.options = null;
    self.label = null;
    self.id = null;
    self.displayKey = ko.computed({
                            read: self.readDisplayKey.bind(self),
                            write: self.writeDisplayKey.bind(self)
                        }).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.value.subscribe(function (bandwidth) {
        this.lineRateVm.bandwidth = bandwidth;
        this.lineRateVm.update();
    }, self);
}

TestSupplementalConfigurationFieldViewModel.typesafe = function (that) {
    if (!(that instanceof TestSupplementalConfigurationFieldViewModel)) {
        throw 'This method must be executed on a TestSupplementalConfigurationFieldViewModel';
    }

    return that;
};

TestSupplementalConfigurationFieldViewModel.prototype.inflate = function (field) {
    var self = TestSupplementalConfigurationFieldViewModel.typesafe(this),
        value;

    self.type = field.type;
    self.value(field.value);
    self.options = field.options;
    self.label = field.label;
    self.id = field.id;

    if (self.type !== 'select') {
        return;
    }

    if (self.value() !== null && self.value() !== undefined) {
        value = ko.utils.arrayFirst(self.options, function (item) {
            return item.key === field.value.key;
        });

        if (value !== null && value !== undefined) {
            self.value(value);
        } else {
            self.value(field.options[0]);
        }
    }
};

TestSupplementalConfigurationFieldViewModel.prototype.changeLineRate = function (rate) {
    this.lineRateVm.line_speed = rate;
    this.lineRateVm.update();
};

TestSupplementalConfigurationFieldViewModel.prototype.toFlatObject = function() {
    var self = TestSupplementalConfigurationFieldViewModel.typesafe(this),
        flatObject = {};

    flatObject.type = self.type;
    flatObject.value = self.value();
    flatObject.options = self.options;
    flatObject.label = self.label;
    flatObject.id = self.id;

    return flatObject;
};

TestSupplementalConfigurationFieldViewModel.prototype.readDisplayKey = function () {
    var self = TestSupplementalConfigurationFieldViewModel.typesafe(this),
        value = self.value();

    return value === null || value === undefined
                ? null
                : value.key;
};

TestSupplementalConfigurationFieldViewModel.prototype.writeDisplayKey = function (value) {
    var self = TestSupplementalConfigurationFieldViewModel.typesafe(this),
        foundItem;

    foundItem = ko.utils.arrayFirst(self.options, function (item) {
        return item.key === value;
    });

    self.value(foundItem);
};
