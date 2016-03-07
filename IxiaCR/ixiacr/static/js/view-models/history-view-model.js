
function HistoryViewModel(rootVm) {
    var self = this;
    self.rootVm = rootVm;
    self.vmDashboard = self.rootVm.vmDashboard

    self.availableStatuses = ko.observableArray([
        {value: 'All Statuses', text: translate('All Statuses')}, 
        {value: 'Pass', text: translate('Pass')},
        {value: 'Fail', text: translate('Fail')},
        {value: 'Completed', text: translate('Completed')}
        ]);

    //86400000 = 1 day in milliseconds
    self.availableDateFilters = new Array();

    var date = new Date();
    self.selectedEndDate = ko.observable((date.getMonth()+1) + '/' + date.getDate() + '/' + date.getFullYear());
    var startTime = date.getTime();
    for(var i = 1; i < 4; i++){
        self.availableDateFilters.push({ text: translate("{number} days", {
            number: i * 30
        }, 'number'), value: startTime - (86400000 * i * 30) });
    }
    self.availableDateFilters.push({ text: translate("custom"), value: 0 });

    self.selectedStatus = ko.observable();
    self.selectedTags = ko.observableArray();
    self.searchString = ko.observable();
    self.selectedStartDate = ko.observable();


    self.selectedDateFilter = ko.observable();
    self.selectedDateFilterDisplay = ko.computed(function(){
        for(var i = 0; i < self.availableDateFilters.length; i++)
            if(self.availableDateFilters[i].value == self.selectedDateFilter())
                return self.availableDateFilters[i].text;
        return "";
    });
    self.showDateFilters = ko.computed(function(){ return self.selectedDateFilter() == 0; });
    self.selectedCustomer = ko.observable();
    self.selectedLocation = ko.observable();
    self.showSearch = ko.observable(false);
    self.filteredHistoryItems = ko.observable();
    self.rootVm.testResultsHistoryHandlers.push(self);

    self.applyFilters = function () {
        var observableSourceCollection = self.rootVm.testResultsHistory;
        var observableFilteredCollection = self.filteredHistoryItems;

        var selectedCustomer = self.selectedCustomer();
        var selectedLocation = self.selectedLocation();
        var selectedTags = self.selectedTags();
        var selectedStartDate = self.selectedStartDate();
        var selectedEndDate = self.selectedEndDate();
        var searchString = self.searchString();
        var selectedStatus = self.selectedStatus();

        if (self.isDefaultSelect(selectedCustomer)
            && self.isDefaultSelect(selectedLocation)
            && self.isDefaultSelect(selectedStatus)
            && selectedTags.length == 0
            && (searchString == null || searchString == '' || searchString == undefined)
            && self.isDefaultDate(selectedStartDate)
            && self.isDefaultDate(selectedEndDate)) {
            observableFilteredCollection(observableSourceCollection());
            return;
        }

        var filteredCollection = observableSourceCollection();

        filteredCollection = self.applyCustomerFilter(selectedCustomer, filteredCollection);

        filteredCollection = self.applyLocationFilter(selectedLocation, filteredCollection);

        filteredCollection = self.applyTagsFilter(selectedTags, filteredCollection);

        filteredCollection = self.applySearchFilter(searchString, filteredCollection);

        filteredCollection = self.applyStatusFilter(selectedStatus, filteredCollection);

        filteredCollection = self.applyDateGreaterThanFilter(selectedStartDate, filteredCollection);

        filteredCollection = self.applyDateLessThanFilter(selectedEndDate, filteredCollection);

        observableFilteredCollection(filteredCollection);
    };

    self.updateCache = function(data) {
        var existingHistoryResult;
        var recentTests = data;
        for (var i = 0; i < recentTests.length; i++) {
            if (self.filteredHistoryItems() != undefined) {
                var recentTest = new TestHistoryViewModel(self.vmDashboard);
                recentTest.inflate(recentTests[i]);
                existingHistoryResult = ko.utils.arrayFirst(self.filteredHistoryItems(), function (item) {
                    return item.result_id() === recentTest.result_id();
                });
                if (existingHistoryResult === null) {
                    self.filteredHistoryItems().unshift(recentTest);
                }
            } else {
                break;
            }
        }
    }

    self.applyStatusFilter = function (selectedStatus, sourceCollection) {
        if (self.isDefaultSelect(selectedStatus) || sourceCollection.length == 0) {
            return sourceCollection;
        }

        var filteredCollection = new Array();

        for (var i = 0; i < sourceCollection.length; i++) {
            if (sourceCollection[i].endResult().toUpperCase() == selectedStatus.toUpperCase()) {
                filteredCollection.push(sourceCollection[i]);
            }
        }

        return filteredCollection;
    };

    self.applyCustomerFilter = function (selectedCustomer, sourceCollection) {
        if (self.isDefaultSelect(selectedCustomer) || sourceCollection.length == 0) {
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
        if (self.isDefaultSelect(selectedLocation) || sourceCollection.length == 0) {
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
        if (searchString == null || searchString == undefined) {
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

    self.selectedCustomer.subscribe(function (value) {
        self.applyFilters(self.rootVm.testResultsHistory, self.filteredHistoryItems);
    });

    self.selectedLocation.subscribe(function (value) {
        self.applyFilters(self.rootVm.testResultsHistory, self.filteredHistoryItems);
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

    self.dateStringToMiliseconds = function(dateString){
        if(typeof dateString == 'int'){
            return dateString;
        } else if(typeof dateString == 'string'){
            var parsedDate=Date.parseString(dateString);
            return parsedDate.getTime();
        }
        return new Date(dateString).getTime()
    };

    self.isDefaultSelect = function(selectValue){
        return selectValue == undefined || selectValue.indexOf("All") == 0;
    };

    self.isDefaultDate = function(dateString){
        return dateString == '' || dateString == null || dateString == undefined;
    };

    self.applyDateGreaterThanFilter = function (selectedDate, sourceCollection) {
        if (self.isDefaultDate(selectedDate) || sourceCollection.length == 0){
            return sourceCollection;
        }

        var milliseconds = Date.parse(selectedDate),
            filteredCollection = [],
            i;

        for (i = 0; i < sourceCollection.length; i++) {
            if (Date.parseString(sourceCollection[i].date()) >= milliseconds) {
                filteredCollection.push(sourceCollection[i]);
            }
        }

        return filteredCollection;
    };

    self.applyDateLessThanFilter = function (selectedDate, sourceCollection) {
        if (self.isDefaultDate(selectedDate) || sourceCollection.length == 0){
            return sourceCollection;
        }

        var milliseconds = Date.parse(selectedDate),
            filteredCollection = [],
            i;

        milliseconds += 24 * 60 * 60 * 1000; // we want to be less than tomorrow @ midnight

        for (i = 0; i < sourceCollection.length; i++) {
            if (Date.parseString(sourceCollection[i].date()) < milliseconds) {
                filteredCollection.push(sourceCollection[i]);
            }
        }

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

    self.selectedTags.subscribe(function (value) { self.applyFilters(); });
    self.searchString.subscribe(function (value) { self.applyFilters(); });
    self.selectedStatus.subscribe(function(value){ self.applyFilters(); });
    self.selectedStartDate.subscribe(function(value){  self.applyFilters(); });
    self.selectedEndDate.subscribe(function(value){ self.applyFilters(); });
    self.selectedDateFilter.subscribe(function(value){
        if(value != 0){
            var startDate = new Date(value),
                endDate = new Date();
            self.selectedStartDate((startDate.getMonth()+1) + '/' + startDate.getDate() + '/' + startDate.getFullYear());
            self.selectedEndDate((endDate.getMonth()+1) + '/' + endDate.getDate() + '/' + endDate.getFullYear());
        }
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
};