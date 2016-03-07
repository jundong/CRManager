/*global LineRateMessageViewModel: true */

function TestTrafficSettingViewModel (testConfigVm, trafficPlayerVm) {
    var self = this;
    self.testConfigVm = testConfigVm;
    self.trafficPlayerVm = trafficPlayerVm;
    self.rootVm = testConfigVm.rootVm;
    self.lineRateVm = new LineRateMessageViewModel();

    self.trafficPlayerVm.playlist.subscribe(self.playlistChanged.bind(self));

    self.availableTypes = new Array();
    self.availableTypes[1] = translate('Bandwidth');
    self.availableTypes[2] = translate('Bandwidth');
    self.availableUnits = new Array();
    self.availableUnits[1] = translate('Mbps');
    self.availableUnits[2] = translate('Mbps');

    self.filteredTypes = ko.computed(self.computedFilteredTypes.bind(self));

    self.type_id = ko.observable();
    self.type_name = ko.computed(self.computedTypeNameRead.bind(self));

    self.value = ko.observable();
    self.unit = ko.computed(self.computedUnitRead.bind(self));
    self.playlistChanged(self.trafficPlayerVm.playlist());
    self.value.subscribe(function (bandwidth) {
        this.lineRateVm.bandwidth = bandwidth;
        this.lineRateVm.update();
    }, self);
}

TestTrafficSettingViewModel.typesafe = function (that) {
    if (!(that instanceof TestTrafficSettingViewModel)) {
        throw 'This method must be executed on a TestTrafficSettingViewModel';
    }
    return that;
};

TestTrafficSettingViewModel.prototype.minTrackLayerChanged = function (newValue) {
    var self = TestTrafficSettingViewModel.typesafe(this);
    if(newValue < 4) {
        if (self.testConfigVm.module.indexOf("network_stress") != -1 || self.testConfigVm.module.indexOf("sla") != -1) {
            self.value(undefined);
        } else {
            if (self.value() === 0 || self.value() === undefined || self.value() === null || self.value() === ""){
                self.value("10");                
            } else {
                self.value(self.value());
            }
        }
        self.type_id(2);
    } else {
        self.value(undefined);
        self.type_id(1);
    }
};

TestTrafficSettingViewModel.prototype.playlistChanged = function (newValue) {
    var self = TestTrafficSettingViewModel.typesafe(this);

    if (newValue ==  null || newValue == undefined) {
        return;
    }
    newValue.minTrackLayer.subscribe(self.minTrackLayerChanged.bind(self));

    var minTrackLayer = newValue.minTrackLayer();

    self.minTrackLayerChanged(minTrackLayer)
};

TestTrafficSettingViewModel.prototype.computedFilteredTypes = function(){
    var self = TestTrafficSettingViewModel.typesafe(this);
    return ko.utils.arrayFilter(self.availableTypes, function(item) { return item; });
};

TestTrafficSettingViewModel.prototype.computedTypeNameRead = function(){
    var self = TestTrafficSettingViewModel.typesafe(this);
    return self.availableTypes[self.type_id()];
};

TestTrafficSettingViewModel.prototype.computedUnitRead = function() {
    var self = TestTrafficSettingViewModel.typesafe(this);
    return self.availableUnits[self.type_id()];
}

TestTrafficSettingViewModel.prototype.validate = function (result, targetName){
    var self = TestTrafficSettingViewModel.typesafe(this);

    if (self.trafficPlayerVm.playlist().getTrackLayer() >= 4) {
        return result;
    }
    if (self.testConfigVm.module.indexOf("network_stress") != -1 || self.testConfigVm.module.indexOf("sla") != -1) {
        return result;
    }

    var value = self.value();
    if(!value || value == ''){
        result.addCheckResults(translate("Test Configuration Error"), false, translate("{name} is missing traffic settings", {
            name: targetName
        }));
    }
    else if(!isNumeric(value)){
        result.addCheckResults(translate("Test Configuration Error"), false, translate("{name} has traffic settings that are not numeric", {
            name: targetName
        }));
    }
    else if(self.testConfigVm.module.indexOf("network_performance_modeling") != -1 && parseFloat(value) <= 0){
        result.addCheckResults(translate("Test Configuration Error"), false, translate("{name} has bandwidth which must be greater than 0 Mbps", {
            name: targetName
        }));
    }

    return result;
};

TestTrafficSettingViewModel.prototype.inflate = function(traffic_setting){
    var self = TestTrafficSettingViewModel.typesafe(this);

    self.type_id(traffic_setting.type_id);
    self.value(traffic_setting.value);

    self.playlistChanged(self.trafficPlayerVm.playlist());
};

TestTrafficSettingViewModel.prototype.changeLineRate = function (rate) {
    this.lineRateVm.line_speed = rate;
    this.lineRateVm.update();
};

TestTrafficSettingViewModel.prototype.toFlatObject = function(){
    var self = TestTrafficSettingViewModel.typesafe(this);

    var flatSettings = {
        type_id: self.type_id(),
        value: self.value(),
        unit: self.unit()
    };

    return flatSettings;
};