function TestTrackViewModel(rootVm) {
    var self = this;

    self.rootVm = rootVm;

    self.name = ko.observable();
    self.id = ko.observable();
    self.description = ko.observable();

    self.customer = ko.observable();
    self.location = ko.observable();
    self.tags = ko.observableArray();
    self.unqualifiedTags = ko.observable();
    self.favorite = ko.observable();
    self.layer = ko.observable();
    self.validationResult = ko.observable();
    self.js_bw_compute = ko.observable();
    self.editable = ko.observable(true);

    self.trackProperties = ko.observableArray();
    self.trafficSettings = ko.observable();
    self.trackBandwidth = ko.computed(self.computeTrackBandwidth.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.isReadOnly = null;
    self.trackResultType = null;
    self.trackObject = null;
    self.trackTypeId = null;

    self.attributes = undefined;

    self.getTrafficInfo = function () {
        logger.info(self.trafficSettings());
    };

    self.displayTags = ko.computed({
        read: self.displayTagsRead.bind(self),
        write: self.displayTagsWrite.bind(self)
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.shouldShowTrackProperties = ko.observable(true);
    self.strings = {
        "There is no track property": translate('There is no track property')
    };
}

TestTrackViewModel.typesafe = function (that) {
    if (!(that instanceof TestTrackViewModel)) {
        throw 'This method must be executed on a TestTrackViewModel';
    }

    return that;
};

TestTrackViewModel.prototype.decideToShowTrackProperties = function() {
    var self = TestTrackViewModel.typesafe(this);
    if(self.trackProperties().length > 0){
        if(self.trackProperties().length == 1 && self.trackProperties()[0].name().toLowerCase() == "playlist"){
            return false;
        }
        return true;
    }
    return false;
};

TestTrackViewModel.prototype.notifyTrackUpdatedSubscribers = function () {
    // do nothing. this is because TestTrackViewModel & TestConfiguredTrackViewModel share signatures
};

TestTrackViewModel.prototype.computeTrackBandwidth = function () {
    var self = TestTrackViewModel.typesafe(this);
    var trafficSettings = self.trafficSettings();
    if (trafficSettings == null || trafficSettings == undefined) {return;}
    var trackProperties = self.trackProperties();if (trackProperties.length == 0) {return;}
    var totalPropertiesBandwidth = 0;
    for (var i = 0; i < trackProperties.length; i++) {totalPropertiesBandwidth += trackProperties[i].bandwidth();}
    return (trafficSettings.value() * totalPropertiesBandwidth);
};

TestTrackViewModel.prototype.matchesSearch = function (searchString) {
    var self = TestTrackViewModel.typesafe(this);

    var searchTerms = searchString.split(' ');

    if (searchTerms.length == 0) {
        return true;
    }

    var name = self.name().toUpperCase();
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
            && customer.indexOf(searchTerms[i].toUpperCase()) == -1
            && location.indexOf(searchTerms[i].toUpperCase()) == -1) {
            return false;
        }
    }

    return true;
};

TestTrackViewModel.prototype.openSaveModal = function () {
    var self = TestTrackViewModel.typesafe(this),
        refreshDraggables = false;

    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-save-track-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function(){
            self.startState = self.toFlatObject();
            ko.applyBindings(self, document.getElementById('lightbox-save-track'));
        },
        onClose: function(){
            if (self.name() === '') {
                refreshDraggables = true;
            }
            self.inflate(self.startState);

            if (refreshDraggables) {
                self.rootVm.refreshTestDraggables();
            }
        }
    });
};

TestTrackViewModel.prototype.clone = function () {
    var self = TestTrackViewModel.typesafe(this);

    var clone = new TestTrackViewModel(self.rootVm);

    clone.name(self.name() + ' [Clone]');
    clone.id(0);
    clone.description(self.description());
    clone.js_bw_compute(self.js_bw_compute());
    clone.customer(self.customer());
    clone.location(self.location());
    clone.tags(self.tags());
    clone.favorite(self.favorite());
    clone.layer(self.layer());

    clone.editable(true);

    clone.cloneTrackProperties(self.trackProperties());
    clone.cloneTrafficSettings(self.trafficSettings());
//    clone.trackBandwidth(self.trackBandwidth());
    clone.shouldShowTrackProperties(self.shouldShowTrackProperties());
    clone.trackResultType = self.trackResultType;
    clone.trackObject = self.trackObject;
    clone.trackTypeId = self.trackTypeId;
    clone.attributes = self.attributes;

    return clone;
};

TestTrackViewModel.prototype.cloneTrackProperties = function (trackProperties) {
    var self = TestTrackViewModel.typesafe(this);

    if (trackProperties == null || trackProperties == undefined) {
        return;
    }

    for (var i = 0; i < trackProperties.length; i++) {
        self.trackProperties.push(trackProperties[i].cloneFor(self));
    }
};

TestTrackViewModel.prototype.cloneTrafficSettings = function (trafficSettings) {
    var self = TestTrackViewModel.typesafe(this);

    if (trafficSettings == null || trafficSettings == undefined) {
        return;
    }

    var clonedTrafficSetting = new TestTrackTrafficSettingsViewModel(self);

    clonedTrafficSetting.inflate(trafficSettings.toFlatObject());

    self.trafficSettings(clonedTrafficSetting);
};

TestTrackViewModel.prototype.openCloneModal = function () {
    var self = TestTrackViewModel.typesafe(this);

    var clone = self.clone();

    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-save-track-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function(){
            self.startState = clone.toFlatObject();
            ko.applyBindings(clone, document.getElementById('lightbox-save-track'));
        },
        onClose: function(){
            clone.inflate(self.startState);
        }
    });
};
TestTrackViewModel.prototype.deleteTrack = function(){
    var self = TestTrackViewModel.typesafe(this);
    
    util.lightbox.close();
    
    var workingVm = new LightboxWorkingViewModel(translate('Delete'), translate('Deleting...'));
    util.lightbox.working(workingVm);
    var id = self.id();
    
    var data = {
        id : id
    };
    
    $.ajax({
        type : util.getRequestMethod('delete_track'),
        url : util.getConfigSetting('delete_track'),
        data : JSON.stringify(data),
        dataType : "json",
        success: function (data, textStatus, jqXhr) {
            var message = data.messages[0];
            if(!message.is_error && message.header == "Success"){
                var callbackFunction = function(){workingVm.status("success");};
                // No neccessary to refresh all tracks from DB
                //self.rootVm.getAvailableTracks(callbackFunction);
                var existingTrack = ko.utils.arrayFirst(self.rootVm.availableTracks(), function (item) {
                    return item.id() === id;
                });
                if (existingTrack !== null) {
                    self.rootVm.availableTracks.remove(existingTrack);
                }
                callbackFunction();
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

TestTrackViewModel.prototype.inflate = function (track) {
    var self = TestTrackViewModel.typesafe(this);
    self.name(track.name);
    self.id(track.id);
    util.setTags(self, track.tags);
    self.layer(track.layer);
    self.js_bw_compute(track.js_bw_compute);

    self.inflateTrackProperties(track.track_properties);
    self.shouldShowTrackProperties(self.decideToShowTrackProperties());
    var trafficSettings = new TestTrackTrafficSettingsViewModel(self);
    self.isReadOnly = track.is_readonly; 
    trafficSettings.inflate(track.traffic_settings);
    self.trafficSettings(trafficSettings);
    self.trackResultType = track.result_object;
    self.trackObject = track.track_object;
    self.trackTypeId = track.track_type_id;
//    self.determineTrackBandwidth();
    self.attributes = track.attributes;
};

TestTrackViewModel.prototype.determineTrackBandwidth = function () {
    var self = TestTrackViewModel.typesafe(this);

    var trafficSettings = self.trafficSettings();
    if (trafficSettings == null || trafficSettings == undefined) {
        return;
    }

    var trackProperties = self.trackProperties();
    if (trackProperties.length == 0) {
        return;
    }

    var totalPropertiesBandwidth = 0;
    for (var i = 0; i < trackProperties.length; i++) {
        totalPropertiesBandwidth += trackProperties[i].bandwidth();
    }

//    self.trackBandwidth(trafficSettings.value * totalPropertiesBandwidth);
};

TestTrackViewModel.prototype.inflateTrackProperties = function (trackProperties) {
    var self = TestTrackViewModel.typesafe(this);

    if (trackProperties == null || trackProperties == undefined) {
        return;
    }

    self.trackProperties.removeAll();

    for (var i = 0; i < trackProperties.length; i++) {
        var trackProperty = new TestTrackPropertyViewModel(self);

        trackProperty.inflate(trackProperties[i]);

        self.trackProperties.push(trackProperty);
    }
};

TestTrackViewModel.prototype.displayTagsRead = function () {
    var self = TestTrackViewModel.typesafe(this);

    if (!self.unqualifiedTags()) {
        self.unqualifiedTags(self.tags().join(', '));
    }
    return util.sanitizeUnqualifiedTagGroup(self.unqualifiedTags());
};

TestTrackViewModel.prototype.displayTagsWrite = function (value) {
    var self = TestTrackViewModel.typesafe(this);

    if (value == null) {
        return;
    }

    var newArray = value.split(',');

    self.tags.removeAll();
    for (var i = 0; i < newArray.length; i++) {
        var trimmedValue = util.trimTag(newArray[i]);

        if (trimmedValue == '') {
            continue;
        }

        if (self.tags().indexOf(trimmedValue) == -1) {
            self.tags.push(trimmedValue);
        }

        if (self.rootVm.availableTags().indexOf(trimmedValue) == -1) {
            self.rootVm.availableTags.push(trimmedValue);
        }
    }
    self.unqualifiedTags(util.sanitizeUnqualifiedTagGroup(value));
    self.unqualifiedTags.valueHasMutated();
};

TestTrackViewModel.prototype.validate = function(result, targetName){
    var self = TestTrackViewModel.typesafe(this);

    if(util.isNullOrEmpty(self.name())){
        result.addCheckResults(translate("Track Property Validation"), false, translate("Track is missing configuration for: name"));
    }

    if(self.name().length > 64){
        result.addCheckResults(translate("Track Property Validation"), false, translate("Track name exceeds maximum character length of 64 characters"));
    }

    var trackProperties = self.trackProperties();
    for (var i = 0; i < trackProperties.length; i++) {
        trackProperties[i].validate(result, targetName);
    }
};

TestTrackViewModel.prototype.save = function () {
    var self = TestTrackViewModel.typesafe(this);

    var name = self.name();
    self.unqualifiedTags(self.tags().join(', '));
    var validationResult = new ValidationResultsViewModel(self);
    self.validate(validationResult, name);
    self.validationResult(validationResult);
    if(!validationResult.is_valid){
        return;
    }

    var foundExisting = ko.utils.arrayFirst(self.rootVm.availableTracks(), function (item) {
        return name.toLowerCase() == item.name().toLowerCase();
    });

    if (foundExisting != null && foundExisting != self) {
        var iteration = 0;

        do {
            self.name(name + ' [' + (iteration++) + ']');

            foundExisting = ko.utils.arrayFirst(self.rootVm.availableTracks(), function (item) {
                return self.name().toLowerCase() == item.name().toLowerCase();
            });
        } while (foundExisting != null && foundExisting != self);
    }

    if (foundExisting == null) {
        self.rootVm.availableTracks.push(self);
        self.rootVm.availableTracks.sort(function(a,b) {return (a.name() > b.name()) ? 1 : ((b.name() > a.name()) ? -1 : 0);} );
    }

    util.lightbox.close();
    var workingVm = new LightboxWorkingViewModel(translate('Save'), translate('Saving...'));
    util.lightbox.working(workingVm);
    var data = self.toFlatObject();
    $.ajax({
        type: util.getRequestMethod('save_track'),
        url: util.getConfigSetting('save_track'),
        data: util.formatRequestData('save_track', data),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            if (data.result == "SUCCESS") {
                self.id(data.items[0].id);
                logger.info('Updated track id: ' + data.items[0].id);
                workingVm.status('success');
            } else {
                workingVm.status('error');
                logger.error({message: 'Failed to save track', data: data, textStatus: textStatus});
            }
        },
        error: function (jqXhr, textStatus, errorThrown) {
            workingVm.status('error');
            logger.error(errorThrown);
        }
    });
};

TestTrackViewModel.prototype.toFlatObject = function () {
    var self = TestTrackViewModel.typesafe(this);

    var flatTrack = {
        name: self.name(),
        id: self.id(),
        tags: util.getTags(self),
        layer: self.layer(),
        js_bw_compute: self.js_bw_compute(),
        result_object: self.trackResultType,
        track_object: self.trackObject,
        track_type_id: self.trackTypeId,
        shouldShowTrackProperties: self.shouldShowTrackProperties(),
        attributes: self.attributes
    };

    var trackProperties = self.trackProperties();

    flatTrack.track_properties = new Array();

    for (var i = 0; i < trackProperties.length; i++) {
        flatTrack.track_properties.push(trackProperties[i].toFlatObject());
    }

    var trafficSettings = self.trafficSettings();

    if (trafficSettings != null && trafficSettings != undefined) {
        flatTrack.traffic_settings = trafficSettings.toFlatObject();
    }

    return flatTrack;
};



function TestConfiguredTrackViewModel(rootVm) {
    var self = this;
    self.rootVm = rootVm;

    self.id = ko.observable();
    self.name = ko.observable();
    self.percentage = ko.observable();
    self.trafficSettings = ko.observable();
    self.layer = ko.observable();
    self.trackProperties = ko.observableArray();
    self.colorId = ko.observable();
    self.js_bw_compute = ko.observable();

    self.expanded = ko.observable(false);

    self.attributes = undefined;

    self.trackResultType = null;
    self.trackObject = null;
    self.trackTypeId = null;

    self.getTrafficInfo = function () {
        if (self.trafficSettings() == null || self.trafficSettings() == undefined) {
            return;
        }

        return self.trafficSettings().unit;
    };

    self.trackUpdatedCallbacks = {};

    self.truncatedName = ko.computed(self.computeTruncatedName.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.trackBandwidth = ko.computed(self.computeTrackBandwidth.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.optionsExpandedClass = ko.computed(self.computeOptionsExpandedClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.shouldShowTrackProperties = ko.observable(true);
    self.strings = {
        "There is no track option": translate('There is no track option')
    };
}

TestConfiguredTrackViewModel.typesafe = function (that) {
    if (!(that instanceof TestConfiguredTrackViewModel)) {
        throw 'This method must be executed on a TestConfiguredTrackViewModel';
    }

    return that;
};

TestConfiguredTrackViewModel.prototype.decideToShowTrackProperties = function() {
    var self = TestConfiguredTrackViewModel.typesafe(this);
    if(self.trackProperties().length > 0){
        if(self.trackProperties().length == 1 && self.trackProperties()[0].name().toLowerCase() == "playlist"){
            return false;
        }
        return true;
    }
    return false;
};

TestConfiguredTrackViewModel.prototype.computeTrackBandwidth = function () {
    var self = TestConfiguredTrackViewModel.typesafe(this);

    if (self.js_bw_compute()){
        eval(self.js_bw_compute());
        return computeFunction();
    }

};

TestConfiguredTrackViewModel.prototype.computeOptionsExpandedClass = function () {
    var self = TestConfiguredTrackViewModel.typesafe(this);

    return self.expanded() ? 'options open' : 'options closed';
};

TestConfiguredTrackViewModel.prototype.onOptionsExpanderClick = function () {
    var self = TestConfiguredTrackViewModel.typesafe(this);

    return self.expanded(!self.expanded());
};

TestConfiguredTrackViewModel.prototype.subscribeTrackUpdated = function (playlist, callback) {
    var self = TestConfiguredTrackViewModel.typesafe(this);

    if (typeof callback == 'function') {
        self.trackUpdatedCallbacks[playlist] = callback;
    }
};

TestConfiguredTrackViewModel.prototype.notifyTrackUpdatedSubscribers= function () {
    var self = TestConfiguredTrackViewModel.typesafe(this);

    for (var index in self.trackUpdatedCallbacks) {
        if (typeof self.trackUpdatedCallbacks[index] == 'function') {
            self.trackUpdatedCallbacks[index]();
        }
    }
};

TestConfiguredTrackViewModel.prototype.computeTruncatedName = function () {
    var self = TestConfiguredTrackViewModel.typesafe(this);

    var name = self.name();

    if (name == undefined) {
        return null;
    }

    if (name.length > 7) {
        return name.substr(0, 7) + '...';
    }

    return name;
};

TestConfiguredTrackViewModel.prototype.inflate = function (configuredTrack) {
    var self = TestConfiguredTrackViewModel.typesafe(this);

    self.id(configuredTrack.id);
    self.name(configuredTrack.name);

    if (configuredTrack.percentage != null && configuredTrack.percentage != undefined) {
        self.percentage(configuredTrack.percentage);
    }

    if (configuredTrack.traffic_settings != null && configuredTrack.traffic_settings != undefined) {
        var trafficSettings = new TestTrackTrafficSettingsViewModel(self);
        trafficSettings.inflate(configuredTrack.traffic_settings);
        self.trafficSettings(trafficSettings);
    }
    self.js_bw_compute(configuredTrack.js_bw_compute);
    self.layer(configuredTrack.layer);
    self.trackResultType = configuredTrack.result_object;
    self.trackObject = configuredTrack.track_object;
    self.trackTypeId = configuredTrack.track_type_id;

    self.attributes = configuredTrack.attributes;

    self.inflateTrackProperties(configuredTrack.track_properties);
    self.shouldShowTrackProperties(self.decideToShowTrackProperties());

//    self.determineTrackBandwidth();
};

TestConfiguredTrackViewModel.prototype.determineTrackBandwidth = function () {
    var self = TestConfiguredTrackViewModel.typesafe(this);

    var trafficSettings = self.trafficSettings();
    if (trafficSettings == null || trafficSettings == undefined) {
        return;
    }

    var trackProperties = self.trackProperties();
    if (trackProperties.length == 0) {
        return;
    }

    var totalPropertiesBandwidth = 0;
    for (var i = 0; i < trackProperties.length; i++) {
        totalPropertiesBandwidth += trackProperties[i].bandwidth();
    }

//    self.trackBandwidth(trafficSettings.value * totalPropertiesBandwidth);
};

TestConfiguredTrackViewModel.prototype.inflateTrackProperties = function (trackProperties) {
    var self = TestConfiguredTrackViewModel.typesafe(this);

    if (trackProperties == null || trackProperties == undefined) {
        return;
    }

    self.trackProperties.removeAll();

    for (var i = 0; i < trackProperties.length; i++) {
        var trackProperty = new TestTrackPropertyViewModel(self);

        trackProperty.inflate(trackProperties[i]);

        self.trackProperties.push(trackProperty);
    }
};

TestConfiguredTrackViewModel.prototype.cloneTrackProperties = function (trackProperties) {
    var self = TestConfiguredTrackViewModel.typesafe(this);

    if (trackProperties == null || trackProperties == undefined) {
        return;
    }

    self.trackProperties.removeAll();

    for (var i = 0; i < trackProperties.length; i++) {
        var trackProperty = new TestTrackPropertyViewModel(self);

        trackProperty.inflate(trackProperties[i].toFlatObject());

        self.trackProperties.push(trackProperty);
    }
};

TestConfiguredTrackViewModel.prototype.cloneTrafficSettings = function (trafficSettings) {
    var self = TestConfiguredTrackViewModel.typesafe(this);

    if (trafficSettings == null || trafficSettings == undefined) {
        return;
    }

    var clonedTrafficSetting = new TestTrackTrafficSettingsViewModel(self);

    clonedTrafficSetting.inflate(trafficSettings.toFlatObject());

    self.trafficSettings(clonedTrafficSetting);
};


TestConfiguredTrackViewModel.prototype.clone = function () {
    var self = TestConfiguredTrackViewModel.typesafe(this);

    var clonedConfiguredTrack = new TestConfiguredTrackViewModel(self.rootVm);

    clonedConfiguredTrack.id = self.id;
    clonedConfiguredTrack.name = self.name;
    clonedConfiguredTrack.percentage(self.percentage());
//    clonedConfiguredTrack.trackBandwidth(self.trackBandwidth());
    clonedConfiguredTrack.layer = self.layer;
    clonedConfiguredTrack.cloneTrackProperties(self.trackProperties());
    clonedConfiguredTrack.cloneTrafficSettings(self.trafficSettings());
    clonedConfiguredTrack.js_bw_compute(self.js_bw_compute());
    clonedConfiguredTrack.trackResultType = self.trackResultType;
    clonedConfiguredTrack.trackObject = self.trackObject;
    clonedConfiguredTrack.trackTypeId = self.trackTypeId;

    clonedConfiguredTrack.attributes = self.attributes;

    clonedConfiguredTrack.colorId(self.colorId());
    clonedConfiguredTrack.shouldShowTrackProperties(self.shouldShowTrackProperties());
    return clonedConfiguredTrack;
};


TestConfiguredTrackViewModel.prototype.toFlatObject = function () {
    var self = TestConfiguredTrackViewModel.typesafe(this);

    var flatTrack = {
        name: self.name(),
        id: self.id(),
        percentage: self.percentage(),
        layer: self.layer(),
        js_bw_compute: self.js_bw_compute(),
        result_object: self.trackResultType,
        track_object: self.trackObject,
        track_type_id: self.trackTypeId,
        shouldShowTrackProperties: self.shouldShowTrackProperties(),
        attributes: self.attributes
    };

    var trackProperties = self.trackProperties();
    flatTrack.track_properties = new Array();

    for (var i = 0; i < trackProperties.length; i++) {
        flatTrack.track_properties.push(trackProperties[i].toFlatObject());
    }

    var trafficSettings = self.trafficSettings();

    if (trafficSettings != null && trafficSettings != undefined) {
        flatTrack.traffic_settings = trafficSettings.toFlatObject();
    }

    return flatTrack;
};

function TestTrackTrafficSettingsViewModel(trackVm) {
    var self = this;
    self.trackVm = trackVm
    self.rootVm = trackVm.rootVm;

    self.max = ko.observable();
    self.min = ko.observable();
    self.value = ko.observable();
    self.value.subscribe(function () {
        self.trackVm.notifyTrackUpdatedSubscribers();
    });
    self.unit = ko.observable();
}

TestTrackTrafficSettingsViewModel.typesafe = function (that) {
    if (!(that instanceof TestTrackTrafficSettingsViewModel)) {
        throw 'This method must be executed on a TestTrackTrafficSettingsViewModel';
    }

    return that;
};

TestTrackTrafficSettingsViewModel.prototype.toFlatObject = function () {
    var self = TestTrackTrafficSettingsViewModel.typesafe(this);

    var flatObject = {
        max: self.max(),
        min: self.min(),
        value: self.value(),
        unit: self.unit()
    };

    return flatObject;
};

TestTrackTrafficSettingsViewModel.prototype.inflate = function (trafficSettings) {
    var self = TestTrackTrafficSettingsViewModel.typesafe(this);

    if (trafficSettings == null || trafficSettings == undefined) {
        return;
    }

    self.max(trafficSettings.max);
    self.min(trafficSettings.min);
    self.value(trafficSettings.value);
    self.unit(trafficSettings.unit);
};

TestTrackTrafficSettingsViewModel.prototype.clone = function () {
    var self = TestTrackTrafficSettingsViewModel.typesafe(this);

    var clone = new TestTrackTrafficSettingsViewModel(self.trackVm);

    clone.max(self.max());
    clone.min(self.min());
    clone.value(self.value());
    clone.unit(self.unit());

    return clone;
};


function TestTrackPropertyViewModel(trackVm) {
    var self = this;
    self.trackVm = trackVm
    self.rootVm = trackVm.rootVm;

    self.name = ko.observable();
    self.name.subscribe(function (value) {
        // alert(value);
    });
    self.type = ko.observable();
    self.value = ko.observable();
    self.options = ko.observableArray();
    self.engine_model = ko.observableArray();
    self.validation = ko.observable();
    self.selectedOption = ko.observable();
    self.selectedOption.subscribe(function (option) {
        if (option == null || option == undefined) {
            return;
        }

        self.value(option.id);
        self.trackVm.notifyTrackUpdatedSubscribers();
    });
    self.optionValue = ko.computed(self.computeOptionValue.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
}

TestTrackPropertyViewModel.typesafe = function (that) {
    if (!(that instanceof TestTrackPropertyViewModel)) {
        throw 'This method must be executed on a TestTrackPropertyViewModel';
    }

    return that;
};

TestTrackPropertyViewModel.prototype.toFlatObject = function () {
    var self = TestTrackPropertyViewModel.typesafe(this);

    var flatObject = {
        name: self.name(),
        type: self.type(),
        value: self.value(),
        options: self.options(),
        engine_model: self.engine_model(),
        validation: self.validation()
    };

    return flatObject;
};

TestTrackPropertyViewModel.prototype.computeOptionValue = function () {
    var self = TestTrackPropertyViewModel.typesafe(this);

    var selectedOption = self.selectedOption();

    if (selectedOption == null || selectedOption == undefined) {
        return null;
    }

    return selectedOption.name;
};

TestTrackPropertyViewModel.prototype.bandwidth = function () {
    var self = TestTrackPropertyViewModel.typesafe(this);

    var selectedOption = self.selectedOption();

    if (selectedOption == null || selectedOption == undefined) {
        return null;
    }

    return selectedOption.bandwidth;
};

TestTrackPropertyViewModel.prototype.getSelectedOption = function (valueObservable) {
    var self = TestTrackPropertyViewModel.typesafe(this);

    var type = self.type();

    if (type == null || type == undefined) {
        return null;
    }

    if (type == 'text' || type == 'read_only') {
        return null;
    }

    var options = self.options();
    var value = valueObservable;

    for (var i = 0; i < options.length; i++) {
        if (options[i].id == value) {
            return options[i];
        }
    }

    return null;
};

TestTrackPropertyViewModel.prototype.inflate = function (trackProperty) {
    var self = TestTrackPropertyViewModel.typesafe(this);

    self.name(trackProperty.name);
    self.type(trackProperty.type);
    self.value(trackProperty.value);
    self.options(trackProperty.options);
    self.engine_model(trackProperty.engine_model);
    self.validation(trackProperty.validation);
    self.selectedOption(self.getSelectedOption(trackProperty.value));
};

TestTrackPropertyViewModel.prototype.clone = function () {
    var self = TestTrackPropertyViewModel.typesafe(this);

    var clone = new TestTrackPropertyViewModel(self.trackVm);

    clone.name(self.name());
    clone.type(self.type());
    clone.value(self.value());
    clone.options(self.options());
    clone.engine_model(self.engine_model());
    clone.validation(self.validation());
    clone.selectedOption(self.selectedOption());

    return clone;
};

TestTrackPropertyViewModel.prototype.cloneFor = function (trackVm) {
    var self = TestTrackPropertyViewModel.typesafe(this);

    var clone = new TestTrackPropertyViewModel(trackVm);

    clone.name(self.name());
    clone.type(self.type());
    clone.value(self.value());
    clone.options(self.options());
    clone.engine_model(self.engine_model());
    clone.validation(self.validation());
    clone.selectedOption(self.selectedOption());

    return clone;
};

TestTrackPropertyViewModel.prototype.validate = function (result, targetName) {
    var self = TestTrackPropertyViewModel.typesafe(this);

    var validationString = self.validation();

    if (validationString == null) {
        return;
    }

    var value = self.value();
    var name = self.name();

    if(util.isNullOrEmpty(value)){
        result.addCheckResults(translate("Track Property Validation"), false, translate('{target} is missing required configuration for: {name}', {
            target: targetName,
            name: name
        }));
    }
    else if (!isNumeric(value)) {
        result.addCheckResults(translate("Track Property Validation"), false, translate('{target} has {name} that is not numeric', {
            target: targetName,
            name: name
        }));
    }

    var numericValue = parseInt(value);

    var validationChecks = validationString.split(';');

    var trackProperties = self.trackVm.trackProperties();

    for (var i = 0; i < validationChecks.length; i++) {
        var validationArray = validationChecks[i].split(',');

        var operator = $.trim(validationArray[0]).toUpperCase();

        var valid = false;
        var message = null;

        var firstComparator = null;
        var secondComparator = null;

        var j = 0;

        if (['<','>','<=','>=','BETWEEN'].indexOf(operator) != -1) {
            firstComparator = $.trim(validationArray[1]);

            if (isNumeric(firstComparator)) {
                firstComparator = parseInt(firstComparator);
            } else {
                for (j = 0; j < trackProperties.length; j++) {
                    if (trackProperties[j].name() == firstComparator) {
                        firstComparator = trackProperties[j].value();
                        break;
                    }
                }
            }
        }

        if (operator == 'BETWEEN') {
            secondComparator = $.trim(validationArray[2]);

            if (isNumeric(secondComparator)) {
                secondComparator = parseInt(secondComparator);
            } else {
                for (j = 0; j < trackProperties.length; j++) {
                    if (trackProperties[j].name() == secondComparator) {
                        secondComparator = trackProperties[j].value();
                        break;
                    }
                }
            }

        }

        switch (operator)
        {
            case "<":
                valid = numericValue < firstComparator;
                message = translate('{name} should be less than {upperBound}', {
                    name: name,
                    upperBound: validationArray[1]
                }); 
                break;
            case ">":
                valid = numericValue > firstComparator;
                message = translate('{name} should be greater than {lowerBound}', {
                    name: name,
                    lowerBound: validationArray[1]
                });
                break;
            case "<=":
                valid = numericValue <= firstComparator;
                message = translate('{name} should be less than or equal to {upperBound}', {
                    name: name,
                    upperBound: validationArray[1]
                });
                break;
            case ">=":
                valid = numericValue >= firstComparator;
                message = translate('{name} should be greater than or equal to {lowerBound}', {
                    name: name,
                    lowerBound: validationArray[1]
                });
                break;
            case "BETWEEN":
                valid = numericValue >= firstComparator && numericValue <= secondComparator;
                message = translate('{name} should be between {lowerBound} and {upperBound}', {
                    name: name,
                    lowerBound: validationArray[1],
                    upperBound: validationArray[2]
                });
                break;
        }

        if (!valid) {
            result.addCheckResults(translate("Track Property Validation"), false, message);
        }
    }
};
