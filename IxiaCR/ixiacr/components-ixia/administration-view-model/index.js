/*global ko:true, translate:true, $:true, appHistory:true, ixiaCRVm:true, TestDeviceViewModel:true, TestPlaylistViewModel:true, TestTrackViewModel:true, LightboxWorkingViewModel:true */

var noop = function () {},
    util = require('utility-functions'),
    domify = require('domify'),
    event = require('event'),
    classes = require('classes'),
    validate = require('validate-form'),
    is_host = require('is-host'),
    is_ip = require('is-ip-address'),
    EndpointViewModel = require('endpoint-view-model').UnicastViewModel; // This should be a generic model

function AdministrationViewModel(rootVm) {
    var self = this;

    self.strings = {
        'Field is required': translate('Field is required'),
        "SSID's must be 1 to 32 alphanumeric characters": translate("SSID's must be 1 to 32 alphanumeric characters"),
        'WPA key must be at least 8 characters': translate('WPA key must be at least 8 characters')
    };

    self.rootVm = rootVm;
    self.globalSettingsVm = rootVm.vmGlobalSettings;
    self.selectedTab = ko.observable();
    self.noTabSelected = ko.computed(self.calculateNoTabSelected.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.devicesTabSelected = ko.computed(self.calculateDevicesTabSelected.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.endpointsTabSelected = ko.computed(self.calculateEndpointsTabSelected.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.tracksTabSelected = ko.computed(self.calculateTracksTabSelected.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.playlistsTabSelected = ko.computed(self.calculatePlaylistsTabSelected.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.customersAndLocationsTabSelected = ko.computed(self.calculateCustomersAndLocationsTabSelected.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.changePasswordTabSelected = ko.computed(self.calculateChangePasswordTabSelected.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.upgradeLocationTabSelected = ko.computed(self.calculateUpgradeLocationTabSelected.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.languageTabSelected = ko.computed(self.calculateLanguageTabSelected.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.databaseTabSelected = ko.computed(self.calculateDatabaseTabSelected.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.systemBackupRestoreTabSelected = ko.computed(self.calculateSystemBackupRestoreTabSelected.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.systemSettingsTabSelected = ko.computed(self.calculateSystemSettingsTabSelected.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.ntpServerTabSelected = ko.computed(self.calculateNtpServerTabSelected.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.devicesTabClass = ko.computed(self.calculateDevicesTabClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.endpointsTabClass = ko.computed(self.calculateEndpointsTabClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.tracksTabClass = ko.computed(self.calculateTracksTabClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.playlistsTabClass = ko.computed(self.calculatePlaylistsTabClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.customersAndLocationsTabClass = ko.computed(self.calculateCustomersAndLocationsTabClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.changePasswordTabClass = ko.computed(self.calculateChangePasswordTabClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.upgradeLocationTabClass = ko.computed(self.calculateUpgradeLocationTabClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.languageTabClass = ko.computed(self.calculateLanguageTabClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.databaseTabClass = ko.computed(self.calculateDatabaseTabClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.systemBackupRestoreTabClass = ko.computed(self.calculateSystemBackupRestoreTabClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.diskTabClass = ko.computed(self.calculateDiskTabClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.systemSettingsTabClass = ko.computed(self.calculateSystemSettingsTabClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.ntpServerTabClass = ko.computed(self.calculateNtpServerTabClass.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.getAvailablePlaylists = self.rootVm.getAvailablePlaylists;
    self.getAvailableTracks = self.rootVm.getAvailableTracks;
    self.getAvailableDevices = self.rootVm.getAvailableDevices;
    self.getAvailableEndpoints = self.rootVm.getAvailableEndpoints;
    self.validateOldPassword = ko.observable();
    self.validateNewPassword = ko.observable();
    self.upgradeFile = ko.observable();
    self.fakeUpgrade = false;
    self.fakeUpgradeStep = 0;
    self.okFunction = ko.observable();
    self.lightboxText = ko.observable();
    self.availablePlaylists = ko.observableArray(self.rootVm.availablePlaylists());
    self.availablePlaylistsSummary = ko.computed(function () {
        return translate('Showing {number} Playlists', {
            number: self.availablePlaylists().length
        }, 'number');
    });

    self.language = ko.observable(self.rootVm.language());
    self.languageDisplay = ko.observable();
    self.availableEndpoints = ko.observableArray(self.rootVm.availableEndpoints());
    self.availableEndpointsSummary = ko.computed(function () {
        return translate('Showing {number} Endpoints', {
            number: self.availableEndpoints().length
        }, 'number');
    });
    self.availableDevices = ko.observableArray(self.rootVm.availableDevices());
    self.availableDevicesSummary = ko.computed(function () {
        var length = self.availableDevices().length;
        for (var i = 0; i < self.availableDevices().length; i++) {
            if (self.availableDevices()[i].id() == 1) {
                length -= 1;
                break;
            }
        }

        return translate('Showing {number} Devices', {
            number: length
        }, 'number');
    });
    self.selectedBackup = ko.observable();
    self.selectedBackupExternal = ko.observable();
    self.editDeviceVisible = ko.observable(false);
    self.deviceListVisible = ko.observable(true);
    self.currentDevice = ko.observable(new TestDeviceViewModel(self.rootVm));
    self.editEndpointVisible = ko.observable(false);
    self.endpointListVisible = ko.observable(true);
    self.editPlaylistVisible = ko.observable(false);
    self.playlistListVisible = ko.observable(true);
    self.editTrackVisible = ko.observable(false);
    self.trackListVisible = ko.observable(true);
    self.displayCustomers = ko.computed({
        read: self.displayCustomersRead.bind(self),
        write: self.displayCustomersWrite.bind(self)
    }, self).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.displayLocations = ko.computed({
        read: self.displayLocationsRead.bind(self),
        write: self.displayLocationsWrite.bind(self)
    }, self).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.selectedCustomer = ko.observable();
    self.selectedLocation = ko.observable();
    self.filterLocations = ko.computed(function () {
        var locations = [translate('All Locations')],
            availableLocations = self.rootVm.availableLocations(),
            i;

        for (i = 0; i < availableLocations.length; i += 1) {
            locations.push(availableLocations[i]);
        }

        return locations;
    });

    self.filterCustomers = ko.computed(function () {
        var customers = [translate('All Customers')],
            availableCustomers = self.rootVm.availableCustomers(),
            i;

        for (i = 0; i < availableCustomers.length; i += 1) {
            customers.push(availableCustomers[i]);
        }

        return customers;
    });

    self.selectedTags = ko.observableArray();

    self.searchString = ko.observable();

    self.displaySelectedTags = ko.computed({
        read: self.displaySelectedTagsRead,
        write: self.displaySelectedTagsWrite
    }, self).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.rootVm.availablePlaylists.subscribe(function (playlists) {
        self.applyFilters(self.rootVm.availablePlaylists, ko.observableArray(playlists));
        self.availablePlaylists(playlists);
    });

    self.rootVm.language.subscribe(function () {
        self.language(self.rootVm.language());
    });

    self.language.subscribe(function (language) {
        if (language === "en") {
            self.languageDisplay("English");
        } else if (language === "zh") {
            self.languageDisplay("中文");
        }
    });

    self.rootVm.availableEndpoints.subscribe(function (newEndpoints) {
        self.applyFilters(self.rootVm.availableEndpoints, ko.observableArray(newEndpoints));
        self.availableEndpoints(newEndpoints);
    });

    self.rootVm.availableDevices.subscribe(function (devices) {
        self.applyFilters(self.rootVm.availableDevices,ko.observableArray(devices));
        self.availableDevices(devices);
    });

    self.selectedBackup.subscribe(function (selectedBackup) {
        if (selectedBackup === undefined) {
            self.selectedBackupExternal("");
        } else if (selectedBackup.device === "chassis") {
            self.selectedBackupExternal("False");
        } else {
            self.selectedBackupExternal("True");
        }
    }, self);

    self.selectedCustomer.subscribe(function (value) {
        self.applyFiltersForAll();
    });

    self.selectedLocation.subscribe(function (value) {
        self.applyFiltersForAll();
    });

    self.selectedTags.subscribe(function (value) {
        self.applyFiltersForAll();
    });

    self.searchString.subscribe(function (value) {
        self.applyFiltersForAll();
    });
}

module.exports = AdministrationViewModel;

AdministrationViewModel.prototype.render = function ($parent, template) {
    this.$el = domify(template);
    $parent.appendChild(this.$el);
    this.bind();
    ko.applyBindings(this, this.$el);
};

AdministrationViewModel.prototype.bind = function () {
    var self = this;
};

AdministrationViewModel.prototype.checkForOfflineUpdates = function () {
    var self = this,
        workingVm;

    util.lightbox.close();
    workingVm = new LightboxWorkingViewModel(translate('Checking for offline updates'), translate('Checking for offline updates...'));
    util.lightbox.working(workingVm);
    $.ajax({
        type: util.getRequestMethod('check_updates'),
        url: util.getConfigSetting('check_updates') + '?offline=1',
        dataType: 'json',
        timeout: false,
        success: function (data, textStatus, jqXhr) {
            if ('success' !== textStatus || 'SUCCESS' !== data.result) {
                workingVm.status('error');
                return;
            }

            if (data.updates.available_updates) {
                self.globalSettingsVm.availableUpdate(data.updates);
                self.okFunction = self.beginUpgrade;
                self.lightboxText = translate('Offline update found. Would you like to update to build {build} now?', {build: data.updates.newest_build});
                util.lightbox.open({
                    url: 'html/lightbox_tmpl',
                    selector: '#lightbox-confirmation-template',
                    cancelSelector: '.cancel-button',
                    onOpenComplete: function () {
                        ko.applyBindings(self, document.getElementById('lightbox-confirmation'));
                    }
                });
            } else {
                self.lightboxText = translate('No updates found.', {});
                util.lightbox.open({
                    url: 'html/lightbox_tmpl',
                    selector: '#lightbox-message-template',
                    cancelSelector: '.ok-button',
                    onOpenComplete: function () {
                        ko.applyBindings(self, document.getElementById('lightbox-message'));
                    }
                });

            }
        },
        error: function (jqXhr, textStatus, errorThrown) {
            workingVm.status('error');
        }
    });
};

function mark_invalid($el, message) {
    if (classes($el.parentNode).has('light-select')) {
        // $el is a fancy select box nested inside of a div, so use the parent div
        $el = $el.parentNode;
    }

    var $old = $el.parentNode.querySelectorAll('label.validator-message'),
        $message = document.createElement('label');

    // Remove old validation messages
    [].forEach.call($old, function ($el) {
        $el.parentNode.removeChild($el);
    });

    // Add new message
    classes($message).add('validator-message');
    $message.textContent = message;
    $el.parentNode.appendChild($message);

    classes($el).add('invalid');
}

AdministrationViewModel.prototype.validateGlobalSettings = function () {
    var $form = document.querySelector('#systemSettingsMain'),
        validator = validate($form).use(is_ip).use(is_host).invalid(mark_invalid),
        ip_message = window.translate("Must be an IP address"),
        host_message = window.translate("Must be an IP address or hostname"),
        success = false;

    if (this.globalSettingsVm.dhcp() === 'false') {
        validator.field('host')
            .is('required', window.translate('Field is required'))
            .is('ip', ip_message);
//        validator.field('netmask');
        validator.field('gateway')
            .is('ip', ip_message);
    }

    validator.field('primary_dns')
            .is('ip', ip_message);
    validator.field('secondary_dns')
            .is('ip', ip_message);

    validator.field('ntp1')
        .is('host', host_message);
    validator.field('ntp2')
        .is('host', host_message);
    validator.field('ntp3')
        .is('host', host_message);
    validator.field('ntp4')
        .is('host', host_message);

    validator.validate(function (err, is_valid, reason) {
        if (err) {
            util.lightbox.openError('', '');
            return; // short-circuit
        }

        if (!is_valid) {
            util.lightbox.openError(window.translate('Settings are invalid'), window.translate('Settings are invalid'));
            return; // short-circuit
        }

        success = true;
    }); // Looks async, but everything is synchronous

    return success;
};

AdministrationViewModel.prototype.displaySelectedTagsRead = function () {
    return this.selectedTags().join(', ');
};

AdministrationViewModel.prototype.displaySelectedTagsWrite = function (value) {
    if (!value) {
        return;
    }

    var newArray = value.split(','),
        i,
        trimmedValue;

    this.selectedTags.removeAll();
    for (i = 0; i < newArray.length; i += 1) {
        trimmedValue = newArray[i];

        if (trimmedValue !== '' && this.selectedTags().indexOf(trimmedValue) === -1) {
            this.selectedTags.push(trimmedValue);
        }
    }
};

AdministrationViewModel.prototype.applyFilters = function (sourceCollection, observableFilteredCollection) {
    var selectedCustomer = this.selectedCustomer(),
        selectedLocation = this.selectedLocation(),
        selectedTags = this.selectedTags(),
        searchString = this.searchString(),
        filteredCollection;

    if ((selectedCustomer === translate('All Customers') || selectedCustomer === undefined)
            && (selectedLocation === translate('All Locations') || selectedLocation === undefined)
            && selectedTags.length === 0
            && (searchString === undefined || searchString === '')) {
        observableFilteredCollection(sourceCollection);
        return;
    }

    filteredCollection = sourceCollection;
    filteredCollection = this.applyCustomerFilter(selectedCustomer, filteredCollection);
    filteredCollection = this.applyLocationFilter(selectedLocation, filteredCollection);
    filteredCollection = this.applyTagsFilter(selectedTags, filteredCollection);
    filteredCollection = this.applySearchFilter(searchString, filteredCollection);

    observableFilteredCollection(filteredCollection);
};

AdministrationViewModel.prototype.applyCustomerFilter = function (selectedCustomer, sourceCollection) {
    var i,
        filteredCollection = [];

    if (selectedCustomer === translate('All Customers') || selectedCustomer === undefined) {
        return sourceCollection;
    }

    if (sourceCollection.length === 0) {
        return sourceCollection;
    }

    for (i = 0; i < sourceCollection.length; i += 1) {
        if (sourceCollection[i].customer() === selectedCustomer) {
            filteredCollection.push(sourceCollection[i]);
        }
    }

    return filteredCollection;
};

AdministrationViewModel.prototype.applyLocationFilter = function (selectedLocation, sourceCollection) {
    var i,
        filteredCollection = [];

    if (selectedLocation === translate('All Locations') || selectedLocation === undefined) {
        return sourceCollection;
    }

    if (sourceCollection.length === 0) {
        return sourceCollection;
    }

    for (i = 0; i < sourceCollection.length; i += 1) {
        if (sourceCollection[i].location() === selectedLocation) {
            filteredCollection.push(sourceCollection[i]);
        }
    }

    return filteredCollection;
};

AdministrationViewModel.prototype.applyTagsFilter = function (selectedTags, sourceCollection) {
    var i,
        filteredCollection = [],
        tags,
        hasSharedTag;

    if (selectedTags.length === 0) {
        return sourceCollection;
    }

    if (sourceCollection.length === 0) {
        return sourceCollection;
    }

    for (i = 0; i < sourceCollection.length; i += 1) {
        tags = [].concat(sourceCollection[i].tags());

        hasSharedTag = util.arraysShareValue(tags, selectedTags, true);

        if (hasSharedTag) {
            filteredCollection.push(sourceCollection[i]);
        }
    }

    return filteredCollection;
};

AdministrationViewModel.prototype.applySearchFilter = function (searchString, sourceCollection) {
    var i,
        filteredCollection = [];

    if (searchString === undefined) {
        return sourceCollection;
    }

    if (sourceCollection.length === 0) {
        return sourceCollection;
    }

    for (i = 0; i < sourceCollection.length; i += 1) {
        if (sourceCollection[i].matchesSearch(searchString)) {
            filteredCollection.push(sourceCollection[i]);
        }
    }

    return filteredCollection;
};


AdministrationViewModel.prototype.applyFiltersForAll = function () {
    this.applyFilters(this.rootVm.availableEndpoints(), this.availableEndpoints);
    this.applyFilters(this.rootVm.availablePlaylists(), this.availablePlaylists);
    this.applyFilters(this.rootVm.availableDevices(), this.availableDevices);
};

AdministrationViewModel.typesafe = function (that) {
    if (!(that instanceof AdministrationViewModel)) {
        throw 'This method must be executed on a AdministrationViewModel';
    }

    return that;
};

AdministrationViewModel.prototype.matchesSearch = function (searchString) {
    var self = AdministrationViewModel.typesafe(this),
        searchTerms = searchString.split(' '),
        name,
        i;

    if (searchTerms.length === 0) {
        return true;
    }

    name = self.name().toUpperCase();

    for (i = 0; i < searchTerms.length; i += 1) {
        if (searchTerms[i] && name.indexOf(searchTerms[i].toUpperCase()) === -1) {
            return false;
        }
    }

    return true;
};

AdministrationViewModel.prototype.refreshDevices = function (callback) {
    var self = AdministrationViewModel.typesafe(this),
        deviceIds,
        i;

    callback = callback || noop;

    deviceIds = [];
    for (i = 0; i < self.rootVm.availableDevices().length; i += 1) {
        deviceIds.push(self.rootVm.availableDevices()[i].id());
    }

    self.selectTab("devices");
    callback();
};

AdministrationViewModel.prototype.selectTab = function (tabName) {
    var self = AdministrationViewModel.typesafe(this);

    if (tabName === self.selectedTab()) {
        return;
    }

    $('.administration input.shaded.search').val("").change();
    $('.administration input.shaded.search').trigger('input');

    self.selectedTab(tabName);
    appHistory.push(ixiaCRVm);

    // Keep current active tab clean
    self.clearError(tabName);
};

AdministrationViewModel.prototype.clearError = function (tabName) {
    var self = AdministrationViewModel.typesafe(this);

    if (tabName === "system backup restore") {
        // Using Bootstrap's classes and jQuery selector and DOM manipulation
        $('#backup-uploader > div.error, #backup-uploader > div.validated').remove();
    } else {
        // Handle other error clear task
    }
};

AdministrationViewModel.prototype.calculateNoTabSelected = function () {
    var self = AdministrationViewModel.typesafe(this);

    return !self.selectedTab();
};
AdministrationViewModel.prototype.calculateDevicesTabSelected = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "devices";
};
AdministrationViewModel.prototype.calculateEndpointsTabSelected = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "endpoints";
};
AdministrationViewModel.prototype.calculateTracksTabSelected = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "tracks";
};
AdministrationViewModel.prototype.calculatePlaylistsTabSelected = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "playlists";
};
AdministrationViewModel.prototype.calculateCustomersAndLocationsTabSelected = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "customers and locations";
};
AdministrationViewModel.prototype.calculateChangePasswordTabSelected = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "change password";
};
AdministrationViewModel.prototype.calculateUpgradeLocationTabSelected = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "upgrade location";
};
AdministrationViewModel.prototype.calculateLanguageTabSelected = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "language";
};
AdministrationViewModel.prototype.calculateDatabaseTabSelected = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "database";
};
AdministrationViewModel.prototype.calculateSystemBackupRestoreTabSelected = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "system backup restore";
};
AdministrationViewModel.prototype.calculateSystemSettingsTabSelected = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "system settings";
};
AdministrationViewModel.prototype.calculateNtpServerTabSelected = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "ntp server";
};

AdministrationViewModel.prototype.calculateDevicesTabClass = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "devices" ? "devices selected" : "devices";
};

AdministrationViewModel.prototype.calculateEndpointsTabClass = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "endpoints" ? "endpoints selected" : "endpoints";
};
AdministrationViewModel.prototype.calculateTracksTabClass = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "tracks" ? "tracks selected" : "tracks";
};
AdministrationViewModel.prototype.calculatePlaylistsTabClass = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "playlists" ? "playlists selected" : "playlists";
};

AdministrationViewModel.prototype.calculateCustomersAndLocationsTabClass = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "customers and locations" ? "customers selected" : "customers";
};
AdministrationViewModel.prototype.calculateChangePasswordTabClass = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "change password" ? "change-password selected" : "change-password";
};
AdministrationViewModel.prototype.calculateUpgradeLocationTabClass = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "upgrade location" ? "update selected" : "update";
};
AdministrationViewModel.prototype.calculateLanguageTabClass = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "language" ? "language selected" : "language";
};
AdministrationViewModel.prototype.calculateDatabaseTabClass = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "database" ? "database selected" : "database";
};
AdministrationViewModel.prototype.calculateSystemBackupRestoreTabClass = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "system backup restore" ? "backup-restore selected" : "backup-restore";
};


AdministrationViewModel.prototype.calculateSystemSettingsTabClass = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.selectedTab() === "system settings" ? "system selected" : "system";
};

AdministrationViewModel.prototype.addDevice = function () {
    var self = AdministrationViewModel.typesafe(this),
        device = new TestDeviceViewModel(self.rootVm);

    device.openSaveModal();
};

AdministrationViewModel.prototype.editDevice = function () {
    var self = AdministrationViewModel.typesafe(this);
    // ??
};

AdministrationViewModel.prototype.showDeviceList = function () {
    var self = AdministrationViewModel.typesafe(this);

    self.editDeviceVisible(false);
    self.deviceListVisible(true);
};

AdministrationViewModel.prototype.addEndpoint = function () {
    var self = AdministrationViewModel.typesafe(this),
        endpoint = new EndpointViewModel(self.rootVm);

    endpoint.openSaveModal();
};
AdministrationViewModel.prototype.showEndpointList = function () {
    var self = AdministrationViewModel.typesafe(this);

    self.editEndpointVisible(false);
    self.endpointListVisible(true);
};

AdministrationViewModel.prototype.addPlaylist = function () {
    var self = AdministrationViewModel.typesafe(this),
        playlist = new TestPlaylistViewModel(self.rootVm);

    playlist.openSaveModal();
};
AdministrationViewModel.prototype.showPlaylistList = function () {
    var self = AdministrationViewModel.typesafe(this);

    self.editPlaylistVisible(false);
    self.playlistListVisible(true);
};

AdministrationViewModel.prototype.addTrack = function () {
    var self = AdministrationViewModel.typesafe(this),
        track = new TestTrackViewModel(self.rootVm);

    track.openSaveModal();
};
AdministrationViewModel.prototype.showTrackList = function () {
    var self = AdministrationViewModel.typesafe(this);

    self.editTrackVisible(false);
    self.trackListVisible(true);
};

AdministrationViewModel.prototype.displayCustomersRead = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.rootVm.availableCustomers().join(', ');
};

AdministrationViewModel.prototype.displayCustomersWrite = function (value) {
    var self = AdministrationViewModel.typesafe(this),
        lookupArray = [],
        newArray,
        i,
        trimmedValue,
        loweredValue,
        saveData;

    if (value === undefined) {
        return;
    }

    newArray = value.split(',');

    self.rootVm.availableCustomers.removeAll();
    for (i = 0; i < newArray.length; i += 1) {
        trimmedValue = $.trim(newArray[i]);

        if (trimmedValue) {
            loweredValue = trimmedValue.toLowerCase();
            if (lookupArray.indexOf(loweredValue) === -1) {
                lookupArray.push(loweredValue);
                self.rootVm.availableCustomers.push(trimmedValue);
            }
        }
    }

    saveData = self.rootVm.availableCustomers().join(', ');
    $.ajax({
        type: util.getRequestMethod('save_customers'),
        url: util.getConfigSetting('save_customers'),
        data: util.formatRequestData('save_customers', saveData),
        dataType: 'json'
    });
};

AdministrationViewModel.prototype.displayLocationsRead = function () {
    var self = AdministrationViewModel.typesafe(this);

    return self.rootVm.availableLocations().join(', ');
};

AdministrationViewModel.prototype.displayLocationsWrite = function (value) {
    var self = AdministrationViewModel.typesafe(this),
        lookupArray = [],
        newArray,
        i,
        trimmedValue,
        loweredValue,
        saveData;

    if (!value) {
        return;
    }

    newArray = value.split(',');

    self.rootVm.availableLocations.removeAll();
    for (i = 0; i < newArray.length; i += 1) {
        trimmedValue = $.trim(newArray[i]);

        if (trimmedValue) {
            loweredValue = trimmedValue.toLowerCase();

            if (lookupArray.indexOf(loweredValue) === -1) {
                lookupArray.push(loweredValue);
                self.rootVm.availableLocations.push(trimmedValue);
            }
        }
    }

    saveData = self.rootVm.availableLocations().join(', ');

    $.ajax({
        type: util.getRequestMethod('save_locations'),
        url: util.getConfigSetting('save_locations'),
        data: util.formatRequestData('save_locations', saveData),
        dataType: 'json'
    });
};

AdministrationViewModel.prototype.showTaskStatus = function (data, taskName, taskId, completedPollingFunction, currentStatusCode, previousStatusCode, expectError) {
    var self = AdministrationViewModel.typesafe(this),
        message,
        progress,
        statusComplete = function () {
            var currentDate = new Date();
            completedPollingFunction(taskName, data);
        },
        incomplete_codes = ["404", "500", "502", "504"];

    util.lightbox.close();
    if (data.messages[0].header || data.messages[0].content) {
        message = data.messages[0];
    } else {
        message = translate('Running {task}...', {
            task: taskName.toLowerCase()
        });
    }
    if (data.messages[0].progress) {
        progress = data.messages[0].progress;
    }

    if ((incomplete_codes.indexOf(previousStatusCode) !== -1 && currentStatusCode === "200") || data.status === "complete") {
        util.lightbox.working(new LightboxWorkingViewModel(taskName, message.header, progress));

        function pollAgain(numberOfPreviousPolls) {
            util.lightbox.working(new LightboxWorkingViewModel(taskName, message.header, progress));
            $.ajax({
                type: "POST",
                url: util.getConfigSetting('get_task_status'),
                data: 'task_id=' + taskId,
                dataType: 'json',
                cache: false,
                statusCode: {
                    404: function (jqXhr, textStatus, errorThrown) {
                        setTimeout(function () {
                            self.pollTaskProgress(taskId, taskName, completedPollingFunction, "404", currentStatusCode, expectError)
                        }, 2000);
                        update_user_session();
                    },
                    500: function (jqXhr, textStatus, errorThrown) {
                        setTimeout(function () {
                            self.pollTaskProgress(taskId, taskName, completedPollingFunction, "500", currentStatusCode, expectError)
                        }, 2000);
                        update_user_session();
                    },
                    502: function (jqXhr, textStatus, errorThrown) {
                        setTimeout(function () {
                            self.pollTaskProgress(taskId, taskName, completedPollingFunction, "502", currentStatusCode, expectError)
                        }, 2000);
                        update_user_session();
                    },
                    504: function (jqXhr, textStatus, errorThrown) {
                        setTimeout(function () {
                            self.pollTaskProgress(taskId, taskName, completedPollingFunction, "504", currentStatusCode, expectError)
                        }, 2000);
                        update_user_session();
                    },
                    200: function (data) {
                        if (numberOfPreviousPolls < 15) {
                            numberOfPreviousPolls++;
                            setTimeout(function () {
                                pollAgain(numberOfPreviousPolls)
                            }, 1000);
                            update_user_session();
                        } else {
                            statusComplete();
                        }
                    }
                },
                /*success: function(data){
                 self.showTaskStatus(data, taskName, taskId, completedPollingFunction);}, 1000);
                 },*/
                error: function (jqXhr, textStatus, errorThrown) {
                    // danger: if we get *any* error, we're just assuming it's cool on account of the upgrade
                    // & keep on rolling...
                    if (jqXhr.status === 404 || jqXhr.status === 500 || jqXhr.status === 502 || jqXhr.status === 504) {
                        noop();
                    } else {
                        setTimeout(function () {
                            self.pollTaskProgress(taskId, taskName, completedPollingFunction, "500", currentStatusCode, expectError)
                        }, 2000);
                        update_user_session();
                    }
                }
            });
        }

        if (data.status === "complete") {
            statusComplete();
        } else {
            setTimeout(function () {
                pollAgain(1);
            }, 1000);
        }
    } else {
        if (!data.messages[0].is_error) {
            util.lightbox.working(new LightboxWorkingViewModel(taskName, message.header, progress));
            setTimeout(function () {
                self.pollTaskProgress(taskId, taskName, completedPollingFunction, currentStatusCode, previousStatusCode, expectError)
            }, 1000);
            update_user_session();
        } else {
            var taskStatusVm = util.lightbox.working(new LightboxWorkingViewModel(taskName, message.header, progress));
            taskStatusVm.status('error');
        }
    }
};

AdministrationViewModel.prototype.pollTaskProgress = function (taskId, taskName, completedPollingFunction, currentStatusCode, previousStatusCode, expectError) {
    var self = AdministrationViewModel.typesafe(this);
    $.ajax({
        type: "POST",
        url: util.getConfigSetting('get_task_status'),
        data: 'task_id=' + taskId,
        dataType: 'json',
        cache: false,
        statusCode: {
            404: function (jqXhr, textStatus, errorThrown) {
                setTimeout(function () {
                    self.pollTaskProgress(taskId, taskName, completedPollingFunction, "404", currentStatusCode, expectError)
                }, 2000);
            },
            500: function (jqXhr, textStatus, errorThrown) {
                setTimeout(function () {
                    self.pollTaskProgress(taskId, taskName, completedPollingFunction, "500", currentStatusCode, expectError)
                }, 2000);
            },
            502: function (jqXhr, textStatus, errorThrown) {
                setTimeout(function () {
                    self.pollTaskProgress(taskId, taskName, completedPollingFunction, "502", currentStatusCode, expectError)
                }, 2000);
            },
            504: function (jqXhr, textStatus, errorThrown) {
                setTimeout(function () {
                    self.pollTaskProgress(taskId, taskName, completedPollingFunction, "504", currentStatusCode, expectError)
                }, 2000);
            },
            200: function (data) {
                setTimeout(function () {
                    self.showTaskStatus(data, taskName, taskId, completedPollingFunction, "200", currentStatusCode, expectError)
                }, 1000);
            }
        },
        /*success: function(data){
         self.showTaskStatus(data, taskName, taskId, completedPollingFunction);}, 1000);
         },*/
        error: function (jqXhr, textStatus, errorThrown) {
            // danger: if we get *any* error, we're just assuming it's cool on account of the upgrade
            // & keep on rolling...
            if (expectError) {
                completedPollingFunction(taskName);
                return;
            } else {
                if (jqXhr.status === 404 || jqXhr.status === 500 || jqXhr.status === 502 || jqXhr.status === 504) {
                    noop();
                } else {
                    setTimeout(function () {
                        self.pollTaskProgress(taskId, taskName, completedPollingFunction, "500", currentStatusCode, null, expectError)
                    }, 2000);
                }
            }

        }
    });
};
AdministrationViewModel.prototype.beginUpgrade = function () {
    var self = AdministrationViewModel.typesafe(this);
    util.lightbox.close();
    util.lightbox.working(new LightboxWorkingViewModel(translate("Starting update"), translate("Starting update...")));
    var currentDate = new Date();

    completedPollingFunction = function (taskName) {
        util.lightbox.working(new LightboxWorkingViewModel(taskName, translate('Reloading app...')));
        setTimeout(function () {
            util.lightbox.close();
            window.location = '/logout';
        }, 2000)
    };

    $.ajax({
        url: util.getConfigSetting('upgrade_device'),
        cache: false,
        contentType: false,
        dataType: 'json',
        processData: false,
        type: util.getRequestMethod('upgrade_device'),
        success: function (data) {
            self.showTaskStatus({ "status": "running", "messages": [
                {"header": translate("Starting update"), "content": translate("Starting update")}
            ]}, translate("Update"), data.task_id, completedPollingFunction);
        }
    });
};
AdministrationViewModel.prototype.setLanguage = function () {
    var self = AdministrationViewModel.typesafe(this);
    $.post(util.getConfigSetting('set_language'), JSON.stringify({language: self.language()}), function (response, textStatus) {
        if (response.result == "SUCCESS") {
            window.location.reload();
        } else {
            util.lightbox.close();
            util.lightbox.openError(response.messages[0].header, response.messages[0].content);
            logger.info(textStatus);
            logger.info(response);
        }
    }, 'json');
};
AdministrationViewModel.prototype.rebootChassis = function () {
    var self = AdministrationViewModel.typesafe(this);
    util.lightbox.close();
    util.lightbox.working(new LightboxWorkingViewModel(translate("Rebooting Axon"), translate("Rebooting Axon...")));
    var currentDate = new Date();

    completedPollingFunction = function (taskName) {
        util.lightbox.working(new LightboxWorkingViewModel(taskName, translate('Axon rebooted.  Reloading app...')));
        setTimeout(function () {
            util.lightbox.close();
            window.location = '/logout';
        }, 2000)
    };

    $.ajax({
        url: util.getConfigSetting('reboot_axon'),
        cache: false,
        contentType: false,
        dataType: 'json',
        processData: false,
        type: util.getRequestMethod('reboot_axon'),
        success: function (data) {
            self.showTaskStatus({ "status": "running", "messages": [
                {"header": translate("Rebooting Axon"), "content": translate("Rebooting Axon")}
            ]}, translate("Reboot"), data.task_id, completedPollingFunction);
        }
    });
};
AdministrationViewModel.prototype.shutdownChassis = function () {
    var self = AdministrationViewModel.typesafe(this);
    util.lightbox.close();
    util.lightbox.working(new LightboxWorkingViewModel("Shutting down Axon", "Shutting down Axon..."));
    var currentDate = new Date();

    completedPollingFunction = function (taskName) {
        clearAllIntervals();
        util.lightbox.close();
        self.lightboxText = 'Axon successfully shutdown.';
        util.lightbox.open({
            url: 'templates/lightbox.tmpl.html',
            selector: '#lightbox-message-template',
            cancelSelector: '.ok-button',
            onOpenComplete: function () {
                ko.applyBindings(self, document.getElementById('lightbox-message'));
            }
        });
    };
    // Logout system
    window.location = '/logout';

    $.ajax({
        url: util.getConfigSetting('shutdown_axon'),
        cache: false,
        contentType: false,
        dataType: 'json',
        processData: false,
        type: util.getRequestMethod('shutdown_axon'),
        success: function (data) {
            self.showTaskStatus({ "status": "running", "messages": [
                {"header": "Shutting down Axon", "content": "Shutting down Axon"}
            ]}, "Shutdown", data.task_id, completedPollingFunction, null, null, true);
        }
    });
};
AdministrationViewModel.prototype.changePassword = function (password) {
    var self = AdministrationViewModel.typesafe(this);
    var $oldPassword = $('#oldPassword');
    if (self.validateOldPassword() === "SUCCESS" && $oldPassword.val()) {
        if (self.validateNewPassword() === "confirmed") {
            var workingVm = new LightboxWorkingViewModel(translate('Save'), translate('Saving...'));
            util.lightbox.close();
            util.lightbox.working(workingVm);
            $.ajax({
                type: 'POST',
                url: util.getConfigSetting('set_admin_password'),
                data: '{"password": "' + $('#newPassword').val() + '"}',
                dataType: 'json',
                cache: false,
                success: function (data, textStatus, jqXhr) {
                    if (data.result === "SUCCESS") {
                        workingVm.status('success');
                        $('#newPassword, #newPasswordVerify, #oldPassword').val('');
                        self.validateNewPassword(undefined);
                        self.validateOldPassword(undefined);
                    } else {
                        workingVm.status('error');
                        $('#newPassword, #newPasswordVerify, #oldPassword').val('');
                        self.validateNewPassword(undefined);
                        self.validateOldPassword(undefined);
                    }
                },
                error: function (jqXhr, textStatus, errorThrown) {
                    workingVm.status('error');
                }
            });
        } else {
            $('#newPassword').val('').focus();
            $('#newPasswordVerify').val('');
            self.validateNewPassword('error');
        }
    } else {
        $oldPassword.val('').focus();
        self.validateOldPassword('FAILURE');
    }
};

AdministrationViewModel.prototype.showError = function () {
    var self = AdministrationViewModel.typesafe(this);
};

/**
 * @param vm data bound to click target
 * @param e click event
 * @param confirm (Boolean) True if the user has confirmed it's ok to change IP/DHCP
 */
AdministrationViewModel.prototype.saveGlobalSettings = function (vm, e, confirm) {
    if (!this.validateGlobalSettings()) {
        return; // Short-circuit
    }

    if (!confirm && (this.globalSettingsVm.changing_IP() || this.globalSettingsVm.changing_to_DHCP())) {
        var message = window.translate('Changing the IP address will require you to re-establish a web management session with this Axon.');
        this.runLightboxWarning(message, this.saveGlobalSettings.bind(this, vm, e, true));
        return; // Short-circuit
    }

    var self = AdministrationViewModel.typesafe(this);
    util.lightbox.close();
    var data = self.globalSettingsVm.toFlatObject();
    var workingVm = new LightboxWorkingViewModel(translate('Save'), translate('Saving...'));

    util.lightbox.working(workingVm);
    $.ajax({
        type: util.getRequestMethod('save_global_settings'),
        url: util.getConfigSetting('save_global_settings'),
        data: util.formatRequestData('save_global_settings', data),
        dataType: 'json',
        timeout: 30000,
        success: function (data) {
            if (data.messages[0].is_error === true) {
                workingVm.status('error');
                return;
            }

            if (self.globalSettingsVm.changing_IP()) {
                // IP changed, so tell user to try the new IP
                show_IP_changed_message(self.globalSettingsVm.host());
                return;
            }

            if (self.globalSettingsVm.changing_to_DHCP()) {
                // IP *may* have changed, so tell user
                show_DHCP_enabled_message();
                return;
            }

            //update local chassis new name at front-end
            self.rootVm.availableDevices().some(function(device){
                if(device.id() == 1){
                    device.name(self.globalSettingsVm.device_name());
                    return true;
                }
                return false;
            });

            globalSettingsCallback = function () {
                self.lightboxText = translate('Success');
                util.lightbox.open({
                    url: 'html/lightbox_tmpl',
                    selector: '#lightbox-message-template',
                    cancelSelector: '.ok-button',
                    onOpenComplete: function () {
                        ko.applyBindings(self, document.getElementById('lightbox-message'));
                    }
                });
            };
            self.rootVm.getGlobalSettings(globalSettingsCallback);
        },
        error: function (jqXHR, textStatus) {
            if (textStatus !== "timeout") {
                workingVm.status('error');
                return;
            }

            if (self.globalSettingsVm.changing_IP()) {
                // IP changed, so tell user to try the new IP
                show_IP_changed_message(self.globalSettingsVm.host());
                return;
            }

            if (self.globalSettingsVm.changing_to_DHCP()) {
                // IP changed, so tell user to try the new IP
                show_DHCP_enabled_message();
                return;
            }

            workingVm.status('error');
        }
    });
};

AdministrationViewModel.prototype.beginBackupSystem = function () {
    var self = AdministrationViewModel.typesafe(this);
    util.lightbox.close();
    util.lightbox.working(new LightboxWorkingViewModel(translate("Starting system backup"), translate("Starting system backup...")));
    var currentDate = new Date();

    getCompletedPollingFunction = function (task_id) {
        return function () {
            var data = {'task_id': task_id};

            globalSettingsCallback = function () {
                $.ajax({
                    url: util.getConfigSetting('get_backup_status'),
                    cache: false,
                    contentType: false,
                    dataType: 'json',
                    data: JSON.stringify(data),
                    type: 'POST',
                    success: function (data) {
                        if (data.result === 'SUCCESS') {
                            self.lightboxText = translate('Backup complete');
                            util.lightbox.open({
                                url: 'html/lightbox_tmpl',
                                selector: '#lightbox-message-template',
                                cancelSelector: '.ok-button',
                                onOpenComplete: function () {
                                    ko.applyBindings(self, document.getElementById('lightbox-message'));
                                }
                            });
                            window.location = data.link;
                        } else {
                            util.lightbox.openError(translate('Backup failed'), data.message ? data.message : 'Unknown failure');
                        }
                    }
                });
            };

            util.lightbox.working(new LightboxWorkingViewModel(translate("Refreshing backup list"), translate("Refreshing backup list")));
            self.rootVm.getGlobalSettings(globalSettingsCallback, true);
        };
    };
    $.ajax({
        url: util.getConfigSetting('backup'),
        cache: false,
        contentType: false,
        dataType: 'json',
        processData: false,
        type: util.getRequestMethod('backup'),
        success: function (data) {
            if (data.result === 'SUCCESS') {
                self.showTaskStatus({ "status": "running", "messages": [
                        {"header": translate("Starting system backup..."), "content": translate("Starting system backup...")}
                    ]}, translate("System backup"), data.task_id,
                    getCompletedPollingFunction(data.task_id));
            } else {
                util.lightbox.close();
                util.lightbox.openError(translate('Request failed'), (data.messages && data.messages.length > 0) ? data.messages[0].content : 'Unknown failure');
            }
        }
    });
};

AdministrationViewModel.prototype.beginRestoreSystem = function () {
    var self = AdministrationViewModel.typesafe(this);
    util.lightbox.close();
    util.lightbox.working(new LightboxWorkingViewModel(translate("Starting system restore"), translate("Starting system restore...")));
    var currentDate = new Date();

    completedPollingFunction = function (taskName) {
        util.lightbox.working(new LightboxWorkingViewModel(taskName, translate('Reloading app...')));
        util.lightbox.close();
        window.location = '/logout';
    };
    var ajaxRestoreData = JSON.stringify({"file": self.selectedBackup().filename, "device": self.selectedBackup().device});
    $.ajax({
        url: util.getConfigSetting('restore_backup'),
        cache: false,
        contentType: false,
        data: ajaxRestoreData,
        dataType: 'json',
        processData: false,
        type: util.getRequestMethod('restore_backup'),
        success: function (data) {
            if (data.result === 'SUCCESS') {
                self.showTaskStatus({ "status": "running", "messages": [
                    {"header": translate("Starting system restore..."), "content": translate("Starting system restore...")}
                ]}, translate("System restore"), data.task_id, completedPollingFunction);
            } else {
                util.lightbox.close();
                util.lightbox.openError(translate('Request failed'), (data.messages && data.messages.length > 0) ? data.messages[0].content : 'Unknown failure');
            }
        }
    });
};

AdministrationViewModel.prototype.deleteSystemBackup = function () {
    var self = AdministrationViewModel.typesafe(this);
    util.lightbox.close();
    util.lightbox.working(new LightboxWorkingViewModel(translate("Deleting system backup"), translate("Deleting system backup...")));
    var currentDate = new Date();

    completedPollingFunction = function () {
        util.lightbox.working(new LightboxWorkingViewModel(translate('Reloading backup list...'), translate('Reloading backup list...')));
        self.rootVm.getGlobalSettings(function () {
            util.lightbox.close();
        }, true);
    };
    var ajaxDeleteData = JSON.stringify({"file": self.selectedBackup().filename, "device": self.selectedBackup().device});
    $.ajax({
        url: util.getConfigSetting('delete_backup'),
        cache: false,
        contentType: false,
        data: ajaxDeleteData,
        dataType: 'json',
        processData: false,
        type: util.getRequestMethod('delete_backup'),
        success: function (data) {
            self.showTaskStatus({ "status": "running", "messages": [
                {"header": translate("Deleting system backup..."), "content": translate("Deleting system backup...")}
            ]}, translate("Delete backup"), data.task_id, completedPollingFunction);
        }
    });
};

AdministrationViewModel.prototype.deleteAllSystemBackups = function (callback) {
    var self = AdministrationViewModel.typesafe(this);
    util.lightbox.close();
    util.lightbox.working(new LightboxWorkingViewModel(translate("Deleting system backup"), translate("Deleting system backup...")));
    var currentDate = new Date();

    completedPollingFunction = function () {
        util.lightbox.working(new LightboxWorkingViewModel(translate('Reloading backup list...'), translate('Reloading backup list...')));
        self.rootVm.getGlobalSettings(function () {
            util.lightbox.close();
            if(callback){
                callback();
            }
        }, true);
    };
    $.ajax({
        url: '/ixia/delete_all_backups',
        cache: false,
        contentType: false,
        dataType: 'json',
        processData: false,
        type: 'DELETE',
        success: function (data) {
            self.showTaskStatus({ "status": "running", "messages": [
                {"header": translate("Deleting system backup..."), "content": translate("Deleting system backup...")}
            ]}, translate("Delete backup"), data.task_id, completedPollingFunction);
        }
    });
};

AdministrationViewModel.prototype.archiveSystemBackup = function () {
    var self = AdministrationViewModel.typesafe(this);
    util.lightbox.close();
    util.lightbox.working(new LightboxWorkingViewModel(translate("Archiving system backup"), translate("Archiving system backup...")));
    var currentDate = new Date();

    completedPollingFunction = function (taskName, data) {
        if (data.messages[0].is_error === true) {
            self.header = taskName;
            self.message = data.messages[0].content;
            util.lightbox.open({
                url: 'html/lightbox_tmpl',
                selector: '#lightbox-error-template',
                cancelSelector: '.ok-button',
                onOpenComplete: function () {
                    ko.applyBindings(self, document.getElementById('lightbox-error'));
                }
            });
        } else {
            util.lightbox.working(new LightboxWorkingViewModel(taskName, translate('Reloading backup list...')));
            util.lightbox.close();
            self.rootVm.getGlobalSettings();
        }
    };
    var ajaxArchiveData = JSON.stringify({"file": self.selectedBackup().filename});
    $.ajax({
        url: util.getConfigSetting('archive_backup'),
        cache: false,
        contentType: false,
        data: ajaxArchiveData,
        dataType: 'json',
        processData: false,
        type: util.getRequestMethod('archive_backup'),
        success: function (data) {
            self.showTaskStatus({ "status": "running", "messages": [
                {"header": translate("Archiving system backup..."), "content": translate("Archiving system backup...")}
            ]}, translate("Archive backup"), data.task_id, completedPollingFunction);
        }
    });
};

AdministrationViewModel.prototype.importSystemBackup = function () {
    var self = AdministrationViewModel.typesafe(this);
    util.lightbox.close();
    util.lightbox.working(new LightboxWorkingViewModel(translate("Importing system backup"), translate("Importing system backup...")));
    var currentDate = new Date();

    completedPollingFunction = function (taskName) {
        util.lightbox.working(new LightboxWorkingViewModel(taskName, translate('Reloading backup list...')));
        util.lightbox.close();
        self.rootVm.getGlobalSettings();
    };
    var ajaxImportData = JSON.stringify({"file": self.selectedBackup().filename});
    $.ajax({
        url: util.getConfigSetting('import_backup'),
        cache: false,
        contentType: false,
        data: ajaxImportData,
        dataType: 'json',
        processData: false,
        type: util.getRequestMethod('import_backup'),
        success: function (data) {
            self.showTaskStatus({ "status": "running", "messages": [
                {"header": translate("Importing system backup..."), "content": translate("Importing system backup...")}
            ]}, translate("Import backup"), data.task_id, completedPollingFunction);
        }
    });
};

AdministrationViewModel.prototype.runLightboxWarning = function (text, okFunction) {
    var self = AdministrationViewModel.typesafe(this);

    self.okFunction = function() {
        okFunction.call(self);
    };
    self.lightboxText = text;
    util.lightbox.open({
        url: 'html/lightbox_tmpl',
        selector: '#lightbox-warning-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function () {
            ko.applyBindings(self, document.getElementById('lightbox-warning'));
        }
    });
};

AdministrationViewModel.prototype.getSystemLogs = function () {
    var self = AdministrationViewModel.typesafe(this);
    util.lightbox.close();
    util.lightbox.working(new LightboxWorkingViewModel(translate("Starting log compression..."), translate("Starting log compression...")));
    $.ajax({
        url: util.getConfigSetting('get_ixia_logs'),
        cache: false,
        contentType: false,
        dataType: 'json',
        processData: false,
        type: util.getRequestMethod('get_ixia_logs'),
        success: function (data) {
            if (data.result === 'SUCCESS') {
                util.lightbox.close();
                window.location = data.messages[0].content.url;
            } else {
                util.lightbox.close();
                util.lightbox.openError(translate('Request failed'), (data.messages && data.messages.length > 0) ? data.messages[0].content : 'Unknown failure');
            }
        }
    });
};

function show_IP_changed_message(ip) {
    var message = window.translate("Please visit the new IP: <a href='{URL}'>{IP}</a>", {
        URL: 'https://' + ip + '/logout',
        IP: ip
    });

    util.lightbox.openMessage(message);
}

function show_DHCP_enabled_message() {
    var to_dhcp_message = window.translate("DHCP enabled. This Axon may have a new IP address.");

    util.lightbox.openMessage(to_dhcp_message);
}