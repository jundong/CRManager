function TestSidebarViewModel(testVm) {
    var self = this;

    self.testVm = testVm;
    self.rootVm = testVm.rootVm;

    self.getAvailableDevices = self.testVm.getAvailableDevices;
    self.getAvailableTests = self.testVm.getAvailableTests;
    self.getAvailableDatapoints = self.testVm.getAvailableDatapoints;

    self.availableTests = ko.observableArray(self.testVm.availableTests());
    self.testVm.availableTests.subscribe(function () {
        self.applyFilters(self.testVm.availableTests, self.availableTests);
    });

    self.availableDevices = self.testVm.availableDevices;

    self.toggleClass = ko.observable("all-items");
    self.showSearch = ko.observable(false);
    self.showCustom = ko.observable("all-items");

    self.selectedCustomer = ko.observable();
    self.selectedLocation = ko.observable();

    self.applyFilters = function (observableSourceCollection, observableFilteredCollection) {
        var selectedCustomer = self.selectedCustomer();
        var selectedLocation = self.selectedLocation();
        var selectedTags = self.selectedTags();
        var searchString = self.searchString();
        var showCustom = self.showCustom();

        if ((selectedCustomer == translate('All Customers') || selectedCustomer == undefined)
            && (selectedLocation == translate('All Locations') || selectedLocation == undefined)
            && selectedTags.length == 0
            && !showCustom
            && (searchString == null || searchString == '' || searchString == undefined)) {
            observableFilteredCollection(observableSourceCollection());
            return;
        }

        var filteredCollection = observableSourceCollection();

        filteredCollection = self.applyCustomerFilter(selectedCustomer, filteredCollection);

        filteredCollection = self.applyLocationFilter(selectedLocation, filteredCollection);

        filteredCollection = self.applyCustomFilter(showCustom, filteredCollection);

        filteredCollection = self.applyTagsFilter(selectedTags, filteredCollection);

        filteredCollection = self.applySearchFilter(searchString, filteredCollection);

        observableFilteredCollection(filteredCollection);
    };

    self.applyCustomerFilter = function (selectedCustomer, sourceCollection) {
        if (selectedCustomer == translate('All Customers') || selectedCustomer == undefined) {
            return sourceCollection;
        }

        if (sourceCollection.length == 0) {
            return sourceCollection;
        }

        var filteredCollection = new Array();

        for (var i = 0; i < sourceCollection.length; i++) {
            if (sourceCollection[i].customer() == selectedCustomer) {
                filteredCollection.push(sourceCollection[i]);
            }
        }

        return filteredCollection;
    };

    self.applyLocationFilter = function (selectedLocation, sourceCollection) {
        if (selectedLocation == translate('All Locations') || selectedLocation == undefined) {
            return sourceCollection;
        }

        if (sourceCollection.length == 0) {
            return sourceCollection;
        }

        var filteredCollection = new Array();

        for (var i = 0; i < sourceCollection.length; i++) {
            if (sourceCollection[i].location() == selectedLocation) {
                filteredCollection.push(sourceCollection[i]);
            }
        }

        return filteredCollection;
    };

    self.applyCustomFilter = function (showCustom, sourceCollection) {
        if (!showCustom){
            return sourceCollection;
        }

        if (showCustom==="all-items") {
            self.toggleClass(showCustom);
            return sourceCollection;
        }

        if (sourceCollection.length == 0) {
            self.toggleClass(showCustom)
            return sourceCollection;
        }

        var filteredCollection = new Array();
        for (var i = 0; i < sourceCollection.length; i++) {
            if (showCustom === "favorite-items"){
                if (String(sourceCollection[i].favorite()) === "true") {
                    filteredCollection.push(sourceCollection[i]);
                }
            } else if(showCustom === "recommended-items"){
                if (sourceCollection[i] instanceof TestTrackViewModel) {
                    if($.inArray(sourceCollection[i].id(), self.testVm.vmConfiguration.recommendedTrackIds) > -1){
                        filteredCollection.push(sourceCollection[i]);
                    }
                } else if(sourceCollection[i] instanceof TestPlaylistViewModel) {
                    for (var j = 0; j < sourceCollection[i].tracks().length; j++) {
                        if($.inArray(sourceCollection[i].tracks()[j]().id(), self.testVm.vmConfiguration.recommendedTrackIds) > -1){
                            if($.inArray(sourceCollection[i], filteredCollection) == -1){
                                filteredCollection.push(sourceCollection[i]);
                            }
                        }
                    }
                }
            }
        };

        self.toggleClass(showCustom);
        return filteredCollection;
    };

    self.applyTagsFilter = function (selectedTags, sourceCollection) {
        if (selectedTags.length == 0) {
            return sourceCollection;
        }

        if (sourceCollection.length == 0) {
            return sourceCollection;
        }

        var filteredCollection = new Array();

        for (var i = 0; i < sourceCollection.length; i++) {
            var tags = (new Array()).concat(sourceCollection[i].tags());

            var hasSharedTag = util.arraysShareValue(tags, selectedTags, true);

            if (hasSharedTag) {
                filteredCollection.push(sourceCollection[i]);
            }
        }

        return filteredCollection;
    };

    self.applySearchFilter = function (searchString, sourceCollection) {
        if (searchString == null || searchString == undefined || searchString == "") {
            return sourceCollection;
        }

        if (sourceCollection.length == 0) {
            return sourceCollection;
        }

        var filteredCollection = new Array();

        for (var i = 0; i < sourceCollection.length; i++) {
            if (sourceCollection[i].matchesSearch(searchString)) {
                filteredCollection.push(sourceCollection[i]);
            }
        }

        return filteredCollection;
    };

    self.refreshTestDraggables = function () {
        // This feels like a pretty gross hack. This is being done to fix a bug where
        // deleting & then cancelling a draggable's name causes the draggable to
        // lose its formatting. Both timeouts are necessary to assure that ko
        // has enough time to register the change & re-render the layout.
        setTimeout(function(){
            var currentMenuItem = self.selectedMenuItem();

            self.selectedMenuItem('');

            setTimeout(function(){
                    self.selectedMenuItem(currentMenuItem);
                    $(".sidebar .items-container").scroller("update");
            }, 10);
        }, 10);
    };

    self.applyFiltersForAll = function () {
        self.applyFilters(self.testVm.availableTests, self.availableTests);
    };

    self.selectedCustomer.subscribe(function (value) {
        self.applyFiltersForAll();
    });

    self.selectedLocation.subscribe(function (value) {
        self.applyFiltersForAll();
    });

    self.showCustom.subscribe(function (value) {
        self.applyFiltersForAll();
    });

    self.filterLocations = ko.computed(function () {
        var locations = new Array(translate('All Locations'));

        var availableLocations = self.rootVm.availableLocations();

        for (var i = 0; i < availableLocations.length; i++) {
            locations.push(availableLocations[i]);
        }

        return locations;
    });

    self.filterCustomers = ko.computed(function () {
        var customers = new Array(translate('All Customers'));

        var availableCustomers = self.rootVm.availableCustomers();

        for (var i = 0; i < availableCustomers.length; i++) {
            customers.push(availableCustomers[i]);
        }

        return customers;
    });

    self.selectedTags = ko.observableArray();

    self.searchString = ko.observable();

    self.selectedTags.subscribe(function (value) {
        self.applyFiltersForAll();
    });

    self.searchString.subscribe(function (value) {
        self.applyFiltersForAll();
    });

    self.displaySelectedTagsRead = function () {
        var displayTags = self.selectedTags().join(', ');

        return displayTags;
    };

    self.displaySelectedTagsWrite = function (value) {
        if (value == null) {
            return;
        }

        var newArray = value.split(',');

        self.selectedTags.removeAll();
        for (var i = 0; i < newArray.length; i++) {
            var trimmedValue = newArray[i];

            if (trimmedValue == '') {
                continue;
            }

            if (self.selectedTags().indexOf(trimmedValue) == -1) {
                self.selectedTags.push(trimmedValue);
            }
        }
    };

    self.displaySelectedTags = ko.computed({
        read: self.displaySelectedTagsRead,
        write: self.displaySelectedTagsWrite
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.onSelectedTagsClick = function () {
//        if (self.displaySelectedTags() == 'Tags...') {
//
//
//        }
    };

    self.selectedMenuItem = ko.observable('endpoints');

    self.startingTab = 'endpoints';

    self.filterMessage = ko.computed(function(){
    });

    self.lockTestNav = function () {
//        $(window).unbind('scroll');
//        $(window).unbind('resize');
//
//        self.testVm.lockTestNav();
    };

    self.selectedMenuItem.subscribe(function(){
        setTimeout(function(){
            $(".sidebar .items-container").scroller("update");
        }, 10);
    });

    self.getTabClassFor = function (tabName) {
        if (self.selectedMenuItem() == tabName) {
            return 'selected';
        }

        return '';
    };

    self.testsTabClass = ko.computed(function () {
        return self.getTabClassFor('tests')
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.testsVisible = ko.computed(function () {
        return self.selectedMenuItem() == 'tests';
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.showTests = function () {
        self.selectedMenuItem('tests');
        self.showCustom("all-items");
        $('#sidebarSearch').val("").change();
        $('#sidebarSearch').trigger('input')
    };

}

TestSidebarViewModel.typesafe = function (that) {
    if (!(that instanceof TestSidebarViewModel)) {
        throw 'This method must be executed on a TestSidebarViewModel';
    }

    return that;
};


