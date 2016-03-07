/*global ko, console, util, document, TestConfiguredTrackViewModel, $ */
function TestPlaylistViewModel(rootVm) {
    'use strict';
    var self = this;
    self.rootVm = rootVm;

    self.tracks = ko.observableArray();
    self.tracks.subscribe(function () {
        self.subscribeToAllTracks();
        self.setMinTrackLayer.bind(self);
        self.calculatePercentagesForApplicationLayerTracks.bind(self);
        self.notifyPlaylistUpdatedSubscribers();
    });
    self.noTrack = ko.observable(false);

    self.minTrackLayer = ko.observable();

    self.name = ko.observable();
    self.name.subscribe(function (newName) {
        if(newName){
            self.nameError(false);
        }
    });
    self.nameError = ko.observable(false);
    self.isNameChanged = false;
    self.id = ko.observable();

    self.editable = ko.observable(false);
    self.isReadOnly = null;
    self.isEdit = ko.observable(false);
    self.redraw = ko.observable(false);

    self.customer = ko.observable();
    self.location = ko.observable();
    self.tags = ko.observableArray();
    self.unqualifiedTags = ko.observable();
    self.favorite = ko.observable();

    self.playlistUpdatedCallbacks = [];

    self.rendering = false;
    self.settingPercentages = false;

    self.truncatedName = ko.computed(self.calculateTruncatedName.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.displayTags = ko.computed({
        read: self.displayTagsRead.bind(self),
        write: self.displayTagsWrite.bind(self)
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.sliderTooltip = {
        value1Name: ko.observable(),
        value1Index: ko.observable(),
        value1Percentage: ko.observable(),
        value2Name: ko.observable(),
        value2Index: ko.observable(),
        value2Percentage: ko.observable()
    };

    self.dirtyOnChangeBeforeChange = null;
    self.dirtyOnchange = null;
    self.strings = {
        'Test Configuration Error': translate('Test Configuration Error'),
        "Playlist requires at least one track": translate("Playlist requires at least one track"),
        'Playlist contains deleted track: ': translate('Playlist contains deleted track: '),
        'Playlist contains deleted tracks: ': translate('Playlist contains deleted tracks: '),
        'Update': translate('Update'),
        'Updating...': translate('Updating...'),
        'Save': translate('Save'),
        'Saving': translate('Saving...'),
        '(copy)': translate('(copy)'),
        'This playlist is built-in and cannot be edited. Save a copy instead ?': translate('This playlist is built-in and cannot be edited. Save a copy instead ?')
    };
    self.parent = undefined; //not used for original, used when cloned;
}

/**
 * Marks object dirty when values change
 */
TestPlaylistViewModel.prototype.markDirtyOnChange = function () {
    var prev = this.name(),
        dirtyOnChangeBeforeChange = this.dirtyOnChangeBeforeChange,
        dirtyOnChange;

    if (dirtyOnChangeBeforeChange) {
        this.dirtyOnChangeBeforeChange.dispose();
    }

    if (dirtyOnChange) {
        this.dirtyOnChange.dispose();
    }

    // Store previous name before change
    this.dirtyOnChangeBeforeChange = this.name.subscribe(function (val) {
        if (typeof val === 'string') {
            prev = val.trim();
        }
    }, this, 'beforeChange');

    // Compare new name with old and mark dirty if appropriate
    this.dirtyOnChange = this.name.subscribe(function (val) {
        if (typeof val === 'string') {
            val = val.trim();
        }

        if (val !== prev) {
            this.isEdit(true);
            this.isNameChanged = true;
        }
    }, this);
};

TestPlaylistViewModel.typesafe = function (that) {
    'use strict';
    if (!(that instanceof TestPlaylistViewModel)) {
        throw 'This method must be executed on a TestPlaylistViewModel';
    }

    return that;
};

TestPlaylistViewModel.prototype.matchesSearch = function (searchString) {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        searchTerms = searchString.split(' '),
        name,
        i,
        upperCasedTerms;

    if (searchTerms.length === 0) {
        return true;
    }

    name = self.name().toUpperCase();

    upperCasedTerms = [];

    for (i = 0; i < searchTerms.length; i += 1) {
        if (searchTerms[i] !== '' && searchTerms[i] !== null) {
            upperCasedTerms.push(searchTerms[i].toUpperCase());
        }
    }

    for (i = 0; i < upperCasedTerms.length; i += 1) {
        if (name.indexOf(upperCasedTerms[i]) !== -1) {
            return true;
        }
    }

    return false;
};

TestPlaylistViewModel.prototype.printPercentages = function (message) {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        tracks = self.tracks(),
        i;

    logger.info(message);
    for (i = 0; i < tracks.length; i += 1) {
        logger.info('Track ' + i + ': ' + tracks[i]().percentage());
    }
};

TestPlaylistViewModel.prototype.addPlaylistUpdatedCallback = function (callback) {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this);

    if (typeof callback !== 'function') {
        return;
    }

    self.playlistUpdatedCallbacks.push(callback);
};

TestPlaylistViewModel.prototype.notifyPlaylistUpdatedSubscribers = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        i;

    for (i = 0; i < self.playlistUpdatedCallbacks.length; i += 1) {
        if (typeof self.playlistUpdatedCallbacks[i] === 'function') {
            self.playlistUpdatedCallbacks[i]();
        }
    }
};

TestPlaylistViewModel.prototype.calculateTruncatedName = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        name = self.name();

    if (name === undefined) {
        return null;
    }

    if (name.length > 25) {
        return name.substr(0, 25) + '...';
    }

    return name;
};

TestPlaylistViewModel.prototype.inflate = function (playlist) {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        i,
        configuredTrack;

    self.tracks.removeAll();

    for (i = 0; i < playlist.tracks.length; i += 1) {
        configuredTrack = new TestConfiguredTrackViewModel(self.rootVm);
        if (!playlist.tracks[i].js_bw_compute){
            playlist.tracks[i].js_bw_compute="var computeFunction=function(){var trafficSettings = self.trafficSettings();if (trafficSettings == null || trafficSettings == undefined) {return;}var trackProperties = self.trackProperties();if (trackProperties.length == 0) {return;}var totalPropertiesBandwidth = 0;for (var i = 0; i < trackProperties.length; i++) {totalPropertiesBandwidth += trackProperties[i].bandwidth();}return (trafficSettings.value() * totalPropertiesBandwidth);};";
        }
        configuredTrack.inflate(playlist.tracks[i]);
        configuredTrack.colorId(i);

        self.tracks.push(ko.observable(configuredTrack));
    }
    self.isReadOnly = playlist.is_readonly;
    self.setMinTrackLayer();
    self.calculatePercentagesForApplicationLayerTracks();

    self.tracks.subscribe(function () {
        self.subscribeToAllTracks();
        self.setMinTrackLayer.bind(self);
        self.calculatePercentagesForApplicationLayerTracks.bind(self);
        self.notifyPlaylistUpdatedSubscribers();
    });

    self.name(playlist.name);
    self.id(playlist.id);
    util.setTags(self, playlist.tags);
};
TestPlaylistViewModel.prototype.deletePlaylist = function(){
    var self = TestPlaylistViewModel.typesafe(this);

    util.lightbox.close();
    
    var workingVm = new LightboxWorkingViewModel(translate('Delete'), translate('Deleting...'));
    util.lightbox.working(workingVm);
    var id = self.id();

    var data = {
        id : id
    };

    $.ajax({
        type : util.getRequestMethod('delete_playlist'),
        url : util.getConfigSetting('delete_playlist'),
        data : JSON.stringify(data),
        dataType : "json",
        success: function (data, textStatus, jqXhr) {
            var message = data.messages[0];
            if(!message.is_error && message.header == "Success"){
                var callbackFunction = function(){workingVm.status("success");};
                //self.rootVm.getAvailablePlaylists(callbackFunction);
                // Update playlist
                var existingPlaylist = ko.utils.arrayFirst(self.rootVm.availablePlaylists(), function (item) {
                            return (item.id() === self.id());
                });
                if (existingPlaylist !== null) {
                    self.rootVm.availablePlaylists.remove(existingPlaylist);
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

TestPlaylistViewModel.prototype.isApplicationLayer = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this);

    return self.getTrackLayer() >= 4;
};

TestPlaylistViewModel.prototype.calculatePercentagesForApplicationLayerTracks = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        tracks,
        bandwidth,
        totalBandwidth,
        totalPercentage,
        percentage,
        i;

    if (!self.isApplicationLayer()) {
        return;
    }

    tracks = self.tracks();

    totalBandwidth = 0;
    for (i = 0; i < tracks.length; i += 1) {
        bandwidth = tracks[i]().computeTrackBandwidth();
        totalBandwidth += bandwidth;
    }

    totalPercentage = 0;
    for (i = 0; i < tracks.length; i += 1) {
        percentage = Math.round((tracks[i]().computeTrackBandwidth() / totalBandwidth) * 100);

        if (percentage === 0) {
            percentage = 1;
        }
        tracks[i]().percentage(percentage);
        totalPercentage += percentage;
    }

    if (isNaN(totalPercentage) || totalPercentage === 0) {
        return;
    }

    if (totalPercentage === 100) {
        return;
    }

    if (totalPercentage < 100) {
        self.evenOutPercentageUnder100(totalPercentage);
        return;
    }

    self.evenOutPercentageOver100(totalPercentage);
};

TestPlaylistViewModel.prototype.evenOutPercentageUnder100 = function (totalPercentage) {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        tracks = self.tracks(),
        i,
        currentPercentage;

    for (i = tracks.length - 1; i >= 0; i -= 1) {
        currentPercentage = tracks[i]().percentage();
        if (currentPercentage < 99) {
            tracks[i]().percentage(currentPercentage + 1);
            totalPercentage += 1;
        }

        if (totalPercentage === 100) {
            return;
        }
    }

    self.evenOutPercentageUnder100(totalPercentage);
};

TestPlaylistViewModel.prototype.evenOutPercentageOver100 = function (totalPercentage) {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        tracks = self.tracks(),
        i,
        currentPercentage;

    for (i = tracks.length - 1; i >= 0; i -= 1) {
        currentPercentage = tracks[i]().percentage();
        if (currentPercentage > 1) {
            tracks[i]().percentage(currentPercentage - 1);
            totalPercentage -= 1;
        }

        if (totalPercentage === 100) {
            return;
        }
    }

    self.evenOutPercentageOver100(totalPercentage);
};

TestPlaylistViewModel.prototype.setMinTrackLayer = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        minLayer = 7,
        tracks = self.tracks(),
        i,
        layer;

    for (i = 0; i < tracks.length; i += 1) {
        layer = tracks[i]().layer();

        if (minLayer > layer) {
            minLayer = layer;
        }
    }

    self.minTrackLayer(minLayer);
};

TestPlaylistViewModel.prototype.subscribeToAllTracks = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        tracks = self.tracks(),
        i;

    for (i = 0; i < tracks.length; i += 1) {
        tracks[i]().subscribeTrackUpdated(self, self.trackUpdated.bind(self));
    }
};

TestPlaylistViewModel.prototype.trackUpdated = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this);

    self.calculatePercentagesForApplicationLayerTracks();
    self.notifyPlaylistUpdatedSubscribers();
};


TestPlaylistViewModel.prototype.clone = function (TrafficPlayerVm) {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        clonedPlaylist,
        tracks,
        i,
        configuredTrack,
        observableConfiguredTrack,
        tags;

    clonedPlaylist = new TestPlaylistViewModel(self.rootVm);

    tracks = self.tracks();
    for (i = 0; i < tracks.length; i += 1) {
        configuredTrack = tracks[i]().clone();
        observableConfiguredTrack = ko.observable(configuredTrack);
        clonedPlaylist.tracks.push(observableConfiguredTrack);
    }

    clonedPlaylist.setMinTrackLayer();
    clonedPlaylist.calculatePercentagesForApplicationLayerTracks();
    clonedPlaylist.tracks.subscribe(function () {
        clonedPlaylist.subscribeToAllTracks();
        clonedPlaylist.setMinTrackLayer();
        clonedPlaylist.calculatePercentagesForApplicationLayerTracks();
        clonedPlaylist.notifyPlaylistUpdatedSubscribers();
    });

    clonedPlaylist.name(self.name());
    clonedPlaylist.id(-1);

    clonedPlaylist.editable(true);
    clonedPlaylist.isEdit(false);
    clonedPlaylist.isReadOnly = self.isReadOnly;
    clonedPlaylist.isNameChanged = self.isNameChanged;
    clonedPlaylist.redraw(false);

    clonedPlaylist.customer(self.customer());
    clonedPlaylist.location(self.location());
    clonedPlaylist.favorite(self.favorite());

    clonedPlaylist.tags.removeAll();
    tags = self.tags();
    for (i = 0; i < tags.length; i += 1) {
        clonedPlaylist.tags.push(tags[i]);
    }

    clonedPlaylist.parent = TrafficPlayerVm;

    return clonedPlaylist;
};

TestPlaylistViewModel.prototype.validate = function (result) {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this);
    var deletedTracks = []; //store the deleted tracks
    if (self.tracks().length === 0) {
        result.addCheckResults(self.strings["Test Configuration Error"], false, self.strings["Playlist requires at least one track"]);
        return result; //short- circuit
    }
    // check if tracks in this playlist existing or had been deleted
    for(var i = 0; i < self.tracks().length; i++){
        var existingTrack = ko.utils.arrayFirst(self.rootVm.availableTracks(), function (item) {
            return item.id() === self.tracks()[i]().id();
        });
        if (!existingTrack) {
            deletedTracks.push(self.tracks()[i]);
        }
    }
    if (deletedTracks.length > 0) {
        var deletedTracksNames = '';
        for (var i = 0; i < deletedTracks.length; i++) {
            if (i == deletedTracks.length - 1)
                deletedTracksNames += deletedTracks[i]().name();
            else
                deletedTracksNames += deletedTracks[i]().name() + ", ";
        }
        result.addCheckResults(self.strings["Test Configuration Error"], false,
                                (deletedTracks.length == 1 ? self.strings["Playlist contains deleted track: "]
                                                            : self.strings["Playlist contains deleted tracks: "]
                                                            + deletedTracksNames));
    }
    return result;
};

TestPlaylistViewModel.prototype.displayTagsRead = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this);

    if (!self.unqualifiedTags()) {
        self.tags().length > 0 ? self.unqualifiedTags(self.tags().join(', ')) : self.unqualifiedTags('');
    }
    return util.sanitizeUnqualifiedTagGroup(self.unqualifiedTags());
};

TestPlaylistViewModel.prototype.displayTagsWrite = function (value) {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        newArray,
        trimmedArray,
        i,
        trimmedValue;

    if (value === null) {
        return;
    }

    newArray = value.split(',');

    trimmedArray = [];
    for (i = 0; i < newArray.length; i += 1) {
        trimmedValue = util.trimTag(newArray[i]);

        if (trimmedValue !== '') {
            trimmedArray.push(trimmedValue);
        }
    }

    self.tags.removeAll();

    for (i = 0; i < trimmedArray.length; i += 1) {
        if (self.tags().indexOf(trimmedArray[i]) === -1) {
            self.tags.push(trimmedArray[i]);
        }

        if (self.rootVm.availableTags().indexOf(trimmedArray[i]) === -1) {
            self.rootVm.availableTags.push(trimmedArray[i]);
        }
    }
    self.unqualifiedTags(util.sanitizeUnqualifiedTagGroup(value));
    self.unqualifiedTags.valueHasMutated();
};

TestPlaylistViewModel.prototype.toFlatObject = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        flatPlaylist,
        tracks,
        i;

    flatPlaylist = {
        tracks: [],
        name: self.name(),
        id: self.id(),
        tags: util.getTags(self)
    };

    tracks = self.tracks();
    for (i = 0; i < tracks.length; i += 1) {
        flatPlaylist.tracks.push(tracks[i]().toFlatObject());
    }

    return flatPlaylist;
};

TestPlaylistViewModel.prototype.openSaveModal = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        refreshDraggables = false;
    
//    if (self.sliderControl) {
//        self.sliderControl.setPercentages();
//    }

    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-save-playlist-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function () {
            self.markDirtyOnChange();
            self.nameError(false);
            self.noTrack(false);
            // Create a memento
            self.startState = self.toFlatObject();
            self.startState.favorite = self.favorite();
            self.startState.customer = self.customer();
            self.startState.location = self.location();

            ko.applyBindings(self, document.getElementById('lightbox-save-playlist'));
        },
        onClose: function(){
            if (self.name() === '') {
                refreshDraggables = true;
            }
            self.name(self.startState.name);
            self.tags(self.startState.tags);
            self.favorite(self.startState.favorite);
            self.customer(self.startState.customer);
            self.location(self.startState.location);

            if (refreshDraggables) {
                self.rootVm.refreshTestDraggables();
            }
        }
    });
};

TestPlaylistViewModel.prototype.save = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        readonly = self.isReadOnly,
        payload,
        workingVm = new LightboxWorkingViewModel(self.strings['Update'], self.strings['Updating...']);

    //check madatory for playlist name
    if(self.name().trim().length == 0 || self.name() === undefined){
        self.nameError(true);
        return;
    }

    //check for empty playlist
    if(self.tracks().length == 0){
        self.noTrack(true);
        return;
    }

    self.tags().length > 0 ? self.unqualifiedTags(self.tags().join(', ')) : self.unqualifiedTags('');

    payload = self.clone();
    payload = payload.toFlatObject();
    if(readonly) {
        if(!self.isNameChanged){
            if (!confirm(self.strings['This playlist is built-in and cannot be edited. Save a copy instead ?'])) {
            // Don't save
            return;
            }
            payload.name = self.name() + ' ' + self.strings['(copy)'];
        }
        payload.id = null;
        payload.isEdit = true;
        payload.isNameChanged = true;
    }else{
        if(!self.isNameChanged){
            var existingPlaylist = ko.utils.arrayFirst(self.rootVm.availablePlaylists(), function (item) {
                return payload.name === item.name();
            });
            if (existingPlaylist !== null) {
                payload.id = existingPlaylist.id();
            } else {
                //in case user has deleted the playlist, then go back to player and save with the current name
                payload.id = null;
                workingVm = new LightboxWorkingViewModel(self.strings['Save'], self.strings['Saving...']);
            }
        }else{
            payload.id = null;
            payload.isEdit = true;
            payload.isNameChanged = true;
        }
    }

    //check playlist name duplication and change it if it is
    if(readonly || (!readonly && self.isNameChanged)){
        var playListName = payload.name,
            iteration = 0;
        var foundExisting = ko.utils.arrayFirst(self.rootVm.availablePlaylists(), function (item) {
            return playListName.toLowerCase() === item.name().toLowerCase() && payload.id !== item.id();
        });
        while (foundExisting !== null && foundExisting !== self) {
           playListName = playListName + ' [' + (iteration++) + ']';
           if(playListName.toLowerCase() == self.startState.name.toLowerCase()){
               continue;
           }
           foundExisting = ko.utils.arrayFirst(self.rootVm.availablePlaylists(), function (item) {
             return playListName.toLowerCase() == item.name().toLowerCase();
           });
        }

        if(playListName != '') {
            payload.name = playListName;
        }

        workingVm = new LightboxWorkingViewModel(translate('Save'), translate('Saving...'));
    }

    util.lightbox.close();
    util.lightbox.working(workingVm);
    $.ajax({
        type: util.getRequestMethod('save_playlist'),
        url: util.getConfigSetting('save_playlist'),
        data: util.formatRequestData('save_playlist', payload),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            if (data.result == "SUCCESS") {
                self.id(data.items[0].id);
                self.isReadOnly = false;
                self.name(payload.name);

                var savedState = self.clone();
                savedState.id(data.items[0].id);
                savedState.name(payload.name);
                savedState.isNameChanged = false;

                if (self.id() && self.id() !== payload.id) {
                    // New playlist
                    self.rootVm.availablePlaylists.push(savedState);
                } else {
                    // Update playlist
                    var existingPlaylist = ko.utils.arrayFirst(self.rootVm.availablePlaylists(), function (item) {
                        return (item.id() === payload.id);
                    });
                    if (existingPlaylist !== null) {
                        self.rootVm.availablePlaylists.remove(existingPlaylist);
                        self.rootVm.availablePlaylists.push(savedState);
                    }
                }
                self.rootVm.availablePlaylists.sort(function(a,b) {return (a.name() > b.name()) ? 1 : ((b.name() > a.name()) ? -1 : 0);} );
                logger.info('Updated playlist id: ' + data.items[0].id);
                workingVm.status('success');
            } else {
                workingVm.status('error');
                logger.error({message: 'Failed to save playlist', data: data, textStatus: textStatus});
            }
        },
        error: function (a, b, errorThrown) {
            workingVm.status('error');
            logger.error(errorThrown);
        },
        complete: function(){
            self.isNameChanged = false;
        }
    });
};

TestPlaylistViewModel.prototype.canAcceptTrack = function (track) {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        player_type = self.parent.isMulticast?'multicast':'unicast',
        supported_layers = self.parent.get_supported_layers(),
        tracks = self.tracks();

    if (tracks.length === 0) {
        return supported_layers.indexOf(track.layer()) > -1 && self.parent.canAcceptTrack(track);
    }

    return tracks[0]().layer() === track.layer() && self.parent.canAcceptTrack(track);
};

TestPlaylistViewModel.prototype.getTrackLayer = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        tracks = self.tracks();

    if (tracks.length === 0) {
        return null;
    }

    return tracks[0]().layer();
};

TestPlaylistViewModel.prototype.getTrackLayers = function () {
    var tracks = this.tracks() || [],
        layers;

    layers = tracks.reduce(function (final, track) {
        var layer = track().layer();

        if (-1 === final.indexOf(layer)) {
            final.push(layer);
        }

        return final;
    }, []);

    return layers
};

TestPlaylistViewModel.prototype.getTrackResultTypes = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        tracks = self.tracks(),
        i,
        trackResultTypes = [],
        track;

    for (i = 0; i < tracks.length; i += 1) {
        track = tracks[i]();
        if (trackResultTypes.indexOf(track.trackResultType) === -1
            && track.trackResultType !== null
            && track.trackResultType !== undefined) {
            trackResultTypes.push(track.trackResultType);
        }
    }

    return trackResultTypes;
};

TestPlaylistViewModel.prototype.hasHTTPTrack = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        tracks = self.tracks();

    return tracks.some(function (track) {
        return track().trackObject === 'HttpProtocolTrack';
    });
};

TestPlaylistViewModel.prototype.getNextColorId = function () {
    'use strict';
    var self = TestPlaylistViewModel.typesafe(this),
        tracks = self.tracks(),
        track,
        colorIdDictionary = [],
        i, colorCount;

    for (i = 0; i < 9; i += 1) {
        colorIdDictionary[i] = 0;
    }

    for (i = 0; i < tracks.length; i += 1) {
        track = tracks[i]();
        colorIdDictionary[track.colorId()] += 1;
    }

    colorCount = 0;
    while (true) {
        colorCount += 1;
        for (i = 0; i < 9; i += 1) {
            if (colorIdDictionary[i] < colorCount) {
                return i;
            }
        }
    }
};