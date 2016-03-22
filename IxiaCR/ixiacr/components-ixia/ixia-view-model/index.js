var translate_tests_configurations = require('./test-configurations-adapter.js');

function IxiaViewModel() {
    var self = this;
    var $ = jQuery;

    self.user = ko.observable();

    self.availableDevices = ko.observableArray();
    self.availableTests = ko.observableArray();
    self.enterpriseTests = ko.observableArray();
    self.hostTests = ko.observableArray();
    self.availableTestsByCategory = ko.observableDictionary({});
    self.availableDatapointsMap = ko.observableArray();
    self.availableResultTypes = new Array();
    self.availableDisplayMessages = new Array();
    self.availableCustomers = ko.observableArray();
    self.availableLocations = ko.observableArray();
    self.language = ko.observable();
    self.testResultsHistory = ko.observableArray();
    self.testResultsHistoryHandlers = new Array();
    self.availableDiskSpace = ko.observable(); //will be updated by disk management

    self.startingTab = 'dashboard';

    self.defaultThrottleDuration = 1;

    self.selectedTab = ko.observable();

    self.testTemplateName = ko.observable('placeholder-template');
    self.dashboardTemplateName = ko.observable('placeholder-template');
    self.administrationTemplateName = ko.observable('placeholder-template');
    self.historyTemplateName = ko.observable('placeholder-template');
    self.helpcenterTemplateName = ko.observable('placeholder-template');
    //Use this to keep session flags
    self.syncFlags = ko.observableArray();

    self.dashboardTabClass = ko.computed(function () {
        return 'dashboard ' + self.getTabClassFor('dashboard');
    }).extend({ throttle: self.defaultThrottleDuration });

    self.historyTabClass = ko.computed(function () {
        return 'history ' + self.getTabClassFor('history');
    }).extend({ throttle: self.defaultThrottleDuration });

    self.administrationTabClass = ko.computed(function () {
        return 'administration ' + self.getTabClassFor('administration');
    }).extend({ throttle: self.defaultThrottleDuration });

    self.vmGlobalSettings = new GlobalSettingsViewModel(self);

    self.vmDashboard = new DashboardViewModel(self);
    self.vmTest = new TestViewModel(self);
    self.vmHistory = new HistoryViewModel(self);
    self.vmAdministration = new AdministrationViewModel(self);

    self.completionPercent = 40;
    self.completionMessage = "";
    self.ajaxModels = new Array(translate("Global Settings"),
        translate("Devices"),
        translate("Tests"),
        translate("Result Types"),
        translate("Customers"),
        translate("Locations"),
        translate("Languages"),
        translate("Display Messages"),
        translate("Test Library"),
        translate("Recent Results"));
    self.ajaxModelsToComplete = self.ajaxModels.slice(0);
    self.failedAjaxModels = new Array();
};

IxiaViewModel.typesafe = function (that) {
    if (!(that instanceof IxiaViewModel)) {
        throw 'This method must be executed on a IxiaViewModel';
    }

    return that;
};

IxiaViewModel.prototype.updateAppLoadMessage = function (model, failed) {
    var self = IxiaViewModel.typesafe(this);

    self.ajaxModelsToComplete.splice($.inArray(model, self.ajaxModelsToComplete), 1);
    if (failed) {
        self.failedAjaxModels.push(model);
        logger.error('Get ' + model + ' Failed');
    }

    if (self.ajaxModelsToComplete.length > 1) {
        if (failed) {
            self.completionMessage = translate('Failed to load {name}...', {
                name: model
            });
        } else {
            self.completionMessage = translate('Loaded {name}...', {
                name: model
            });
        }
    } else {
        if (self.failedAjaxModels.length == 0) {
            self.completionMessage = translate('Loading {name}...', {
                name: model
            });
        } else {
            self.header = translate('App Loading Error');
            self.message = translate('The following failed to load:<br>{failed}<br><br>Please contact Spirent support at {link}', {
                failed: self.failedAjaxModels.join('<br>'),
                link: '<a href="http://www.ixiacom.com">www.ixiacom.com</a>'
            });
            util.lightbox.open({
                url: 'html/lightbox_tmpl',
                selector: '#lightbox-error-template',
                cancelSelector: '.ok-button',
                onOpenComplete: function () {
                    ko.applyBindings(self, document.getElementById('lightbox-error'));
                }
            });
            return;
        }
    }

    var completion = self.ajaxModels.length - self.ajaxModelsToComplete.length;
    completion /= self.ajaxModels.length; // 0 to 1
    completion *= 60; // Entire process should take 60% of total completion

    util.lightbox.working(new LightboxWorkingViewModel("Loading", self.completionMessage, self.completionPercent + completion));
};

IxiaViewModel.prototype.init = function (callback) {
    var self = IxiaViewModel.typesafe(this);

    var settingsAjax = self.getGlobalSettings()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[0]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[0], true);
        });

    var devicesAjax = self.getAvailableDevices()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[1]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[1], true);
        });

    var testsAjax = self.getAvailableTests()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[2]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[2], true);
        });

    var languageAjax = self.getLanguage()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[6]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[6], true);
        });

//    var messageAjax = self.getAvailableDisplayMessages()
//        .done(function () {
//            self.updateAppLoadMessage(self.ajaxModels[11]);
//        })
//        .fail(function () {
//            self.updateAppLoadMessage(self.ajaxModels[11], true);
//        });

        self.selectTab(self.startingTab);

        self.initStart = (new Date()).getTime();

    return $.when(
        settingsAjax,
        devicesAjax,
        languageAjax,
        testsAjax
    );
};

IxiaViewModel.prototype.setUser = function (user) {
    var self = IxiaViewModel.typesafe(this);
    self.user = user;
};

IxiaViewModel.prototype.refreshTestDraggables = function () {
    var self = IxiaViewModel.typesafe(this);
    self.vmTest.refreshTestDraggables();
};

IxiaViewModel.prototype.loadTest = function (test) {
    var self = IxiaViewModel.typesafe(this);
    self.vmTest.loadTest(test);
};
IxiaViewModel.prototype.loadRecentTest = function (historyItem) {
    var self = IxiaViewModel.typesafe(this);
    self.vmTest.loadRecentTest(historyItem);
};

IxiaViewModel.prototype.getTabClassFor = function (tabName) {
    var self = IxiaViewModel.typesafe(this);
    if (self.selectedTab() == tabName) {
        return 'selected';
    }

    return '';
};

IxiaViewModel.prototype.showTest = function () {
    var self = IxiaViewModel.typesafe(this);
    self.selectTab('test');
};

IxiaViewModel.prototype.showDashboard = function () {
    var self = IxiaViewModel.typesafe(this);
    self.selectTab('dashboard');
};

IxiaViewModel.prototype.showHistory = function () {
    var self = IxiaViewModel.typesafe(this);
    self.selectTab('history');
};

IxiaViewModel.prototype.showAdministration = function () {
    var self = IxiaViewModel.typesafe(this);
    self.selectTab('administration');
};

IxiaViewModel.prototype.selectTab = function (tabName, done) {
    done = done || function () {};

    var self = IxiaViewModel.typesafe(this);

    function showTab (cb) {
        if($('#' + tabName + '-template').length == 0){
            util.getTemplate('html/' + tabName + '_tmpl', '#' + tabName + '-template', function(template){
                self[tabName + 'TemplateName'](tabName + '-template');
                self.selectedTab(tabName);
                cb();
            });
        } else {
            // added this here, because when template was already loaded somewhere - tab content will never show
            self[tabName + 'TemplateName'](tabName + '-template');
            self.selectedTab(tabName);
            cb();
        }
    }

    switch (tabName) {
        case 'dashboard':
            showTab(function () {
                self.getResultHistory();
                appHistory.push(self);
                done();
            });
            break
        case 'test':
        case 'history':
            showTab(function () {
                appHistory.push(self);
                done();
            });
            break;
        case 'administration':
            if ($('#administration-template').length == 0) {
                util.getTemplate('html/administration_tmpl', '#administration-template', function (template) {
                    var $parent = document.querySelector('#main > .administration'),
                        template = template.get(0).innerHTML;
                    if(!$parent.innerHTML.length > 0)
                        self.vmAdministration.render($parent, template);
                    self.administrationTemplateName('administration-template');

                    self.selectedTab('administration');
                    appHistory.push(self);
                    done();
                });
            } else {
                self.selectedTab('administration');
                self.vmAdministration.selectTab(null);
                appHistory.push(self);
                done();
            }
            break;
        case 'calendar':
            self.selectedTab(tabName);
            self.getResultHistory();
            appHistory.push(self);
            done();
            break;
        case 'testLibrary':
            appHistory.push(self);
            done();
            break;
    }
};

IxiaViewModel.prototype.getGlobalSettings = function (callback, reload) {
    var self = IxiaViewModel.typesafe(this);

    var url = util.getConfigSetting('get_global_settings');
    if (reload)
        url += '?reload=1'

    var ajax = $.ajax({
        type: 'POST',
        url: url,
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            self.vmGlobalSettings.inflate(data);
            if (callback){
                callback();
            }
        }
    });

    return ajax;
};

IxiaViewModel.prototype.getAvailableCustomers = function () {
    var self = IxiaViewModel.typesafe(this);

    self.availableCustomers.removeAll();

    var ajax = $.ajax({
        type: 'GET',
        url: util.getConfigSetting('get_customers'),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            var availableCustomers = data;

            //self.availableCustomers.push("select one");
            for (var i = 0; i < availableCustomers.length; i++) {
                self.availableCustomers.push(availableCustomers[i]);
            }
        }
    });

    return ajax;
};

IxiaViewModel.prototype.getAvailableLocations = function () {
    var self = IxiaViewModel.typesafe(this);

    self.availableLocations.removeAll();

    var ajax = $.ajax({
        type: 'GET',
        url: util.getConfigSetting('get_locations'),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            var availableLocations = data;

            //self.availableLocations.push("select one");
            for (var i = 0; i < availableLocations.length; i++) {
                self.availableLocations.push(availableLocations[i]);
            }
        }
    });

    return ajax;
};

IxiaViewModel.prototype.getLanguage = function() {
    var self = IxiaViewModel.typesafe(this);

    var ajax = $.ajax({
        type: 'GET',
        url: util.getConfigSetting('get_language'),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            self.language(data.language);
        }
    });

    return ajax;
};

IxiaViewModel.prototype.getAvailableTests = function (params, callback) {
    var self = IxiaViewModel.typesafe(this);

    var ajax = $.ajax({
        type: "GET",
        url: util.getConfigSetting("get_ixiacr_tests"),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            self.availableTests.removeAll();
            self.enterpriseTests.removeAll();
            self.hostTests.removeAll();
            self.fillAvailableTests(data);

            if (callback){
                callback();
            }
        }
    });

    return ajax;
};

IxiaViewModel.prototype.fillAvailableTests = function (data){
    var self = IxiaViewModel.typesafe(this);
    var availableTests = data = translate_tests_configurations(data);

    for (var i = 0; i < availableTests.length; i++) {
        var existingTest = null,
            test = new TestTemplateViewModel(self);
        test.inflate(availableTests[i]);

        existingTest = ko.utils.arrayFirst(self.availableTests(), function (item) {
            return (test.id() === item.id());
        });
        if (existingTest === null) {
            self.availableTests.push(test);
        }
    }

    self.availableTests.sort(util.sortArrayByObjectKeyKoObservable("name", true));

    if (self.vmTest.startingTab == 'tests') {
        self.vmTest.initializeAvailableTestsDraggable();
    }
};

IxiaViewModel.prototype.fillFavoriteTests = function (data, offset){
    var self = IxiaViewModel.typesafe(this);
    var enterpriseTests = data = translate_tests_configurations(data);
    var existingTest;

    // Keep favorite test number is consistent with DB in FrontEnd cache
    if (self.vmDashboard.totalEnterpriseTests > self.enterpriseTests().length) {
        for (var i = self.enterpriseTests().length; i < self.vmDashboard.totalEnterpriseTests; i++) {
            self.enterpriseTests.push(undefined);
        }
    } else if (self.vmDashboard.totalEnterpriseTests < self.enterpriseTests().length) {
        for (var i = self.enterpriseTests().length - 1; i >= 0; i--) {
            if (self.enterpriseTests()[i] == undefined) {
                self.enterpriseTests.splice(i, 1);
            }
        }
    }

    for (var i = 0; i < enterpriseTests.length; i++) {
        var test = new TestTemplateViewModel(self);
        test.inflate(enterpriseTests[i]);

        if (offset != undefined) {
            // If offset is set, we query favorite tests from DB, so the favorite property has already been set
            self.enterpriseTests()[offset + i] = test;
            if (i < 5) {
                self.vmDashboard.enterpriseTests.push(test);
            }
        } else {
            // Make sure self.enterpriseTests() has value before we use it
            if (self.enterpriseTests().length == 0 && test.favorite()) {
                self.enterpriseTests.push(test);
                self.vmDashboard.totalEnterpriseTests += 1;
            }

            // Update favorite tests list
            existingTest = ko.utils.arrayFirst(self.enterpriseTests(), function (item) {
                if (item != undefined) {
                    return item.id() === test.id();
                }
                return false;
            });
            if (existingTest !== null) {
                var index = self.enterpriseTests.indexOf(existingTest);
                // Update
                if (test.favorite()) {
                    if (index != -1) {
                        self.enterpriseTests()[index] = test;
                    }
                } else {
                    // Remove
                    if (index != -1) {
                        self.enterpriseTests.remove(existingTest);
                        if (self.vmDashboard.enterpriseTests.indexOf(existingTest) != -1) {
                            if (self.enterpriseTests().length > index) {
                                if (self.enterpriseTests()[index] !== undefined) {
                                    if (self.vmDashboard.enterpriseTests.indexOf(self.enterpriseTests()[index]) == -1) {
                                        self.vmDashboard.enterpriseTests.push(self.enterpriseTests()[index])
                                    }
                                }
                            }
                        }
                        self.vmDashboard.totalEnterpriseTests -= 1;
                    }
                }
            } else {
                // Do nothing if the Frontend cache is empty here
                if (self.enterpriseTests().length == 0 && !test.favorite()) {
                    continue;
                }
                if (self.enterpriseTests()[0].id() < test.id() && test.favorite()) {
                    self.enterpriseTests.unshift(test);
                    self.vmDashboard.totalEnterpriseTests += 1;
                } else if (self.enterpriseTests()[0].id() > test.id() && test.favorite()) {
                    var position = undefined;
                    // First loop to determine whether there is a proper position for insert
                    for (var k = 0; k < self.enterpriseTests().length; k++) {
                        if (self.enterpriseTests()[k] == undefined) {
                            continue;
                        }
                        if (self.enterpriseTests()[k].id() > test.id()) {
                            continue;
                        } else {
                            position = k;
                            break;
                        }
                    }
                    if (position == undefined) {
                        if (self.enterpriseTests()[self.enterpriseTests().length - 1] != undefined) {
                            self.enterpriseTests.push(test);
                        } else {
                            self.enterpriseTests()[self.enterpriseTests().length - 1] = test;
                        }
                    } else {
                        // Second loop to determine the insert position
                        var slice = self.enterpriseTests.slice(position, self.enterpriseTests().length);
                        slice.unshift(test);
                        self.enterpriseTests = self.enterpriseTests.slice(0, position).concat(slice);

                    }
                    self.vmDashboard.totalEnterpriseTests += 1;
                }
            }

            existingTest = ko.utils.arrayFirst(self.vmDashboard.enterpriseTests(), function (item) {
                return item.id() === test.id();
            });
            if (existingTest !== null) {
                // Update
                if (test.favorite()) {
                    var index = self.vmDashboard.enterpriseTests.indexOf(existingTest);
                    self.vmDashboard.enterpriseTests()[index] = test;
                } else {
                    // Remove
                    if (self.vmDashboard.enterpriseTests.indexOf(existingTest) != -1) {
                        self.vmDashboard.enterpriseTests.remove(existingTest);
                    }
                }
            } else {
                if (self.vmDashboard.enterpriseTests().length == 0 && test.favorite()) {
                    self.vmDashboard.enterpriseTests.push(test);
                    continue;
                }
                if (self.vmDashboard.enterpriseTests()[0].id() < test.id() && test.favorite()) {
                    self.vmDashboard.enterpriseTests.unshift(test);
                    if (self.vmDashboard.enterpriseTests().length > 5) {
                        self.vmDashboard.enterpriseTests.pop();
                    }
                }
            }
        }
    }
};

IxiaViewModel.prototype.insertUserTest = function (userTest){
    var self = IxiaViewModel.typesafe(this),
        existingUserTest,
        userTestId,
        flatUserTest;

    userTestId = userTest.id();

    self.updateTestNameInRecentTests(userTest);

    flatUserTest = userTest.toFlatObject();
    self.fillAvailableTests([flatUserTest]);
};

IxiaViewModel.prototype.removeUserTest = function (userTest){
    var self = IxiaViewModel.typesafe(this),
        existingUserTest;

    existingUserTest = ko.utils.arrayFirst(self.availableTests(), function (item) {
        return userTest.id() === item.id() && !item.isTemplate();
    });

    if (existingUserTest !== null) {
        self.availableTests.remove(existingUserTest);
    }

    if (existingUserTest !== null) {
        self.enterpriseTests.remove(existingUserTest);
    }

    existingUserTest = ko.utils.arrayFirst(self.vmDashboard.enterpriseTests(), function (item) {
        return userTest.id() === item.id() && userTest.isUserSave && userTest.favorite();
    });

    if (existingUserTest !== null) {
        self.vmDashboard.enterpriseTests.remove(existingUserTest);
    }
};

IxiaViewModel.prototype.updateTestNameInRecentTests = function (userTest){
    var self = IxiaViewModel.typesafe(this),
        userTestId,
        userTestName,
        testResultsHistory,
        i;

    userTestId = userTest.id();
    userTestName = userTest.name();

    testResultsHistory = self.testResultsHistory();

    for (i = 0; i < testResultsHistory.length; i += 1) {
        if (testResultsHistory[i].test_id == userTestId) {
            testResultsHistory[i].categories.unshift(userTestName);
        }
    }
};

IxiaViewModel.prototype.getResultHistory = function (params, callback) {
    var self = IxiaViewModel.typesafe(this);
    var url = util.getConfigSetting("get_result_history");
    var isRefreshDashboard = true;
    if (params) {
        if (params['result_id']) {
            isRefreshDashboard = false;
            url += '?result_id=' + params['result_id'];
        } else {
            if (params['page']) {
                url += '?page=' + params['page'];
                if (params['page_size']) {
                    url += '&page_size=' + params['page_size'];
                }
            } else {
                if (params['page_size']) {
                    url += '?page_size=' + params['page_size'];
                }
            }
        }
    }
    var ajax = $.ajax({
        type: "GET",
        url: url,
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            if (data['total_number']) {
                self.vmDashboard.totalHistoryResults = data['total_number'];
            }
            self.fillHistoryTestsResults(data['data'], isRefreshDashboard);

            for (var i = 0; i < self.testResultsHistoryHandlers.length; i++) {
                self.testResultsHistoryHandlers[i].updateCache(data['data']);
            }

            if (callback){
                callback();
            }
        }
    });

    return ajax;
};

IxiaViewModel.prototype.fillHistoryTestsResults = function (data, isRefreshDashboard){
    var self = IxiaViewModel.typesafe(this);
    var recentTests = data;
    var existingHistoryResult;
    if (isRefreshDashboard) {
        self.vmDashboard.testResultsHistory.removeAll();
    }

    for (var i = 0; i < recentTests.length; i++) {
        var recentTest = new TestHistoryViewModel(self.vmDashboard);
        recentTest.inflate(recentTests[i]);

        existingHistoryResult = ko.utils.arrayFirst(self.testResultsHistory(), function (item) {
            return item.result_id() === recentTest.result_id();
        });

        if (existingHistoryResult === null) {
            self.testResultsHistory.push(recentTest);
        } else {
            // Update the latest one in the Array
            self.testResultsHistory.replace(existingHistoryResult, recentTest);
        }

        if (isRefreshDashboard) {
            self.vmDashboard.testResultsHistory.push(recentTest);
        } else {
            if (self.vmDashboard.testResultsHistory()[0].result_id() < recentTest.result_id()) {
                self.vmDashboard.testResultsHistory.unshift(recentTest);
            }
        }
    }
    self.testResultsHistory.sort(function(pre, next) {return (pre.result_id() > next.result_id() ? -1 : 1)});
};

IxiaViewModel.prototype.getAvailableDevices = function (callback, responseData) {
    var self = IxiaViewModel.typesafe(this);

    self.availableDevices.removeAll();

    var ajax = $.ajax({
        type: "GET",
        url: util.getConfigSetting("get_devices"),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            var availableDevices = data;
            if (availableDevices.length > 1){
                availableDevices = util.sort_devices(availableDevices);
            }

            for (var i = 0; i < availableDevices.length; i++) {
                var device = new TestDeviceViewModel(self);
                device.inflate(availableDevices[i]);

                self.availableDevices.push(device);
            }
            if (callback){
                callback(responseData);
            }
        }
    });

    return ajax;
};

IxiaViewModel.prototype.updateDeviceTimeSyncCapabilities = function (data) {
    var self = IxiaViewModel.typesafe(this);

    self.availableDevices().forEach(function(device) {
        device.updateTimeSyncCapability(data); // Handles mapping of devices
    });
};

IxiaViewModel.prototype.getResultTypes = function () {
    var self = IxiaViewModel.typesafe(this);

    self.availableResultTypes = new Array();

    var ajax = $.ajax({
        type: "GET",
        url: util.getConfigSetting("get_result_types"),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            var availableResultTypes = data;

            for (var i = 0; i < availableResultTypes.length; i++) {
                self.availableResultTypes.push(new ResultTypeViewModel(availableResultTypes[i]));
            }
        },
        error: function (jqXhr, textStatus, errorThrown) {
            util.logData(textStatus);
        }
    });

    return ajax;
};

IxiaViewModel.prototype.getAvailableDisplayMessages = function () {
    var self = IxiaViewModel.typesafe(this);

    var ajax = $.ajax({
        type: "GET",
        url: util.getConfigSetting("get_display_messages"),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            self.availableDisplayMessages = data;
        },
        error: function (jqXhr, textStatus, errorThrown) {
            util.logData(textStatus);
        }
    });

    return ajax;
};

IxiaViewModel.prototype.addToCategoryView = function (newTest) {
    var self = IxiaViewModel.typesafe(this)
    var categories = newTest.categories();

    for (var i = 0; i < categories.length; i += 1) {
        var category = categories[i];
        if (self.availableTestsByCategory.indexOf(category.type) === -1) {
            self.availableTestsByCategory.set(category.type, {
                categoryName: category.name,
                tests: [newTest]
            });
            self.availableTestsByCategory.items.sort(function(category1, category2){
                return category1.value().categoryName < category2.value().categoryName;
            });
        } else {
            var testsByCategory = self.availableTestsByCategory.get(category.type)().tests;

            var existingTest = ko.utils.arrayFirst(testsByCategory, function (item) {
                return newTest.id() === item.id() && newTest.isUserSave === item.isUserSave;
            });

            if (existingTest !== null) {
                testsByCategory.splice(testsByCategory.indexOf(existingTest), 1);
            }

            // To make 'Throughput Test' at the second position in 'Test Library'
            if (newTest.template_name() == 'Throughput Test') {
                if (testsByCategory.length > 1) {
                    // Insert value
                    testsByCategory.splice(1, 0, newTest);
                } else {
                    testsByCategory.push(newTest);
                }
            } else {
                testsByCategory.push(newTest);
            }
        }
    }
};

IxiaViewModel.prototype.deleteTest = function () {
    var self = IxiaViewModel.typesafe(this);
    logger.info("removeFromCategoryView unimplemented");
    //find test
    //remove from array
    //removeFromCategoryView();
};

IxiaViewModel.prototype.openTestCreationLightbox = function () {
    var self = IxiaViewModel.typesafe(this);
    self.vmTest.openTestCreationLightbox();
};

IxiaViewModel.prototype.openTestCreationLightboxUnlessLoaded = function () {
    var self = IxiaViewModel.typesafe(this);
    if(!self.vmTest.vmConfiguration.isLoaded())
        self.vmTest.openTestCreationLightbox();
    else
        self.showTest();
};

IxiaViewModel.prototype.getState = function(){
    var self = IxiaViewModel.typesafe(this);

    var stateViewModel = {};

    stateViewModel.mainTab = self.selectedTab();
    stateViewModel.testTab = self.vmTest.selectedTab();
    stateViewModel.adminTab = self.vmAdministration.selectedTab();
    stateViewModel.resultsTab = self.vmTest.vmResults.selectedTab();

    return stateViewModel;
};

IxiaViewModel.prototype.restoreState = function(stateViewModel){
    var self = IxiaViewModel.typesafe(this);

    self.selectedTab(stateViewModel.mainTab);
    self.vmTest.selectedTab(stateViewModel.testTab);
    self.vmAdministration.selectedTab(stateViewModel.adminTab);
    self.vmTest.vmResults.selectTab(stateViewModel.resultsTab);
};

module.exports = IxiaViewModel;