var translate_tests_configurations = require('./test-configurations-adapter.js'),
    EndpointViewModel = require('endpoint-view-model').UnicastViewModel;

function IxiaViewModel() {
    var self = this;
    var $ = jQuery;

    self.user = ko.observable();

    self.availableTracks = ko.observableArray();
    self.availablePlaylists = ko.observableArray();
    self.availableDevices = ko.observableArray();
    self.availableEndpoints = ko.observableArray();
    self.availableTests = ko.observableArray();
    self.favoriteTests = ko.observableArray();
    self.factoryTests = ko.observableArray();
    self.userTests = ko.observableArray();
    self.availableTestsByCategory = ko.observableDictionary({});
    self.availableTracksMap = null;
    self.availableDatapointsMap = ko.observableArray();
    self.availableResultTypes = new Array();
    self.availableDisplayMessages = new Array();
    self.availableCustomers = ko.observableArray();
    self.availableLocations = ko.observableArray();
    self.language = ko.observable();
    self.availableTags = ko.observableArray();
    self.testResultsHistory = ko.observableArray();
    self.testResultsHistoryHandlers = new Array();
    self.availableDiskSpace = ko.observable(); //will be updated by disk management

    self.allTests = [];

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

    self.testLibraryTabClass = ko.computed(function () {
        return 'library ' + self.getTabClassFor('testLibrary');
    }).extend({ throttle: self.defaultThrottleDuration });

    self.testTabClass = ko.computed(function () {
        return 'player ' + self.getTabClassFor('test');
    }).extend({ throttle: self.defaultThrottleDuration });

    self.calendarTabClass = ko.computed(function () {
        return 'calendar ' + self.getTabClassFor('calendar');
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
        translate("Tracks"),
        translate("Devices"),
        translate("Endpoints"),
        translate("Tests"),
        translate("Datapoints"),
        translate("Result Types"),
        translate("Customers"),
        translate("Locations"),
        translate("Languages"),
        translate("Tags"),
        translate("Display Messages"),
        translate("Playlists"),
        translate("Test Library"),
        translate("Favorite Tests"),
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
                link: '<a href="www.ixiacom.com">www.ixiacom.com</a>'
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
            self.updateAppLoadMessage(self.ajaxModels[2]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[2], true);
        });

//    //    var testsAjax = self.getAvailableTests()
//    //        .done(function () {
//    //            //self.updateAppLoadMessage(self.ajaxModels[4]);
//    //        })
//    //        .fail(function () {
//    //            self.updateAppLoadMessage(self.ajaxModels[4], true);
//    //        });
//

//    var favoriteTestsAjax = self.getFavoriteTests()
//        .done(function () {
//            self.updateAppLoadMessage(self.ajaxModels[14]);
//        })
//        .fail(function () {
//            self.updateAppLoadMessage(self.ajaxModels[14], true);
//        });
//
//    var historyResults = self.getResultHistory()
//        .done(function () {
//            self.updateAppLoadMessage(self.ajaxModels[15]);
//        })
//        .fail(function () {
//            self.updateAppLoadMessage(self.ajaxModels[15], true);
//        });

//    var resultTypesAjax = self.getResultTypes()
//        .done(function () {
//            self.updateAppLoadMessage(self.ajaxModels[6]);
//        })
//        .fail(function () {
//            self.updateAppLoadMessage(self.ajaxModels[6], true);
//        });
//
//    var customersAjax = self.getAvailableCustomers()
//        .done(function () {
//            self.updateAppLoadMessage(self.ajaxModels[7]);
//        })
//        .fail(function () {
//            self.updateAppLoadMessage(self.ajaxModels[7], true);
//        });

    var languageAjax = self.getLanguage()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[9]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[9], true);
        });

//    var tagsAjax = self.getAvailableTags()
//        .done(function () {
//            self.updateAppLoadMessage(self.ajaxModels[10]);
//        })
//        .fail(function () {
//            self.updateAppLoadMessage(self.ajaxModels[10], true);
//        });

//    var messageAjax = self.getAvailableDisplayMessages()
//        .done(function () {
//            self.updateAppLoadMessage(self.ajaxModels[11]);
//        })
//        .fail(function () {
//            self.updateAppLoadMessage(self.ajaxModels[11], true);
//        });

    self.selectTab(self.startingTab);

    self.initStart = (new Date()).getTime();

//    return $.when(
//        settingsAjax,
//        tracksAjax,
//        playlistAjax,
//        devicesAjax,
//        endpointAjax,
//        tmplsTestsAjax,
//        favoriteTestsAjax,
//        historyResults,
//        dataPointsAjax,
//        resultTypesAjax,
//        customersAjax,
//        locationsAjax,
//        languageAjax,
//        tagsAjax,
//        messageAjax
//    );

      return $.when(
        settingsAjax,
        devicesAjax,
        languageAjax
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

IxiaViewModel.prototype.showCalendar = function () {
    var self = IxiaViewModel.typesafe(this);
    self.selectTab('calendar');
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
            //self.vmGlobalSettings.inflate(data);
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

IxiaViewModel.prototype.getAvailableTags = function () {
    var self = IxiaViewModel.typesafe(this);

    self.availableTags.removeAll();

    var ajax = $.ajax({
        type: 'GET',
        url: util.getConfigSetting('get_tags'),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            var availableTags = data;

            for (var i = 0; i < availableTags.length; i++) {
                self.availableTags.push(availableTags[i]);
            }
        }
    });

    return ajax
};

IxiaViewModel.prototype.getAvailableTagsAsAutoSuggestData = function () {
    var self = IxiaViewModel.typesafe(this);
    var tags = self.availableTags();

    var data = new Array();

    for (var i = 0; i < tags.length; i++) {
        data.push({"value": tags[i]});
    }

    return data;
};

IxiaViewModel.prototype.getTmplTests = function (callback) {
    var self = IxiaViewModel.typesafe(this);

    self.vmDashboard.tmplTests.removeAll();

    var ajax = $.ajax({
        type: "GET",
        url: util.getConfigSetting("get_test_templates"),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            for (var i = 0; i < data.length; i++) {
                self.factoryTests().push(data[i]);
            };
            self.fillAvailableTestsWithResults(data, true);
        }
    });

    return ajax;
};

IxiaViewModel.prototype.getFavoriteTests = function (params, callback) {
    var self = IxiaViewModel.typesafe(this);
    var offset = 0;
    var url = util.getConfigSetting("get_favorite_tests");
    if (params) {
        if (params['page']) {
            offset = params['page'];
            url += '?page=' + params['page'];
            if (params['page_size']) {
                offset = (offset - 1) * params['page_size'];
                url += '&page_size=' + params['page_size'];
            } else {
                offset = (offset - 1) * 5;
            }
        } else {
            if (params['page_size']) {
                url += '?page_size=' + params['page_size'];
            }
        }
    }
    var ajax = $.ajax({
        type: "GET",
        url: url,
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            self.vmDashboard.totalFavoriteTests = data['total_number'];
            self.vmDashboard.favoriteTests.removeAll();

            self.fillFavoriteTests(data['data'], offset);
            self.fillAvailableTestsWithResults(data['data'], false);

            if (callback){
                callback();
            }
        }
    });

    return ajax;
};

IxiaViewModel.prototype.getAvailableTests = function (params, callback) {
    var self = IxiaViewModel.typesafe(this);
    var url = util.getConfigSetting("get_axon_tests");
    if (params) {
        if (params['test_id']) {
            url += '?test_id=' + params['test_id'];
            if(params['result_id']) {
                url += '&result_id=' + params['result_id'];
            }
        } else {
            if (params['filters']) {
                url += '?filters=' + params['filters'];
            }
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
            for (var i = 0; i < data.length; i++) {
                if (data[i].is_user_save) {
                    self.userTests().push(data[i]);
                }
            };
            self.fillAvailableTestsWithResults(data, false);

            if (callback){
                callback();
            }
        }
    });

    return ajax;
};

IxiaViewModel.prototype.fillAvailableTestsWithResults = function (data, isFactoryTest){
    var self = IxiaViewModel.typesafe(this);
    var availableTests = data = translate_tests_configurations(data);
    var existingTest;

    for (var i = 0; i < availableTests.length; i++) {
        var test = new TestTemplateViewModel(self);
        test.inflate(availableTests[i]);
        test.isFactoryTest(isFactoryTest);
        test.isTemplate(isFactoryTest);

        if (isFactoryTest) {
            existingTest = ko.utils.arrayFirst(self.availableTests(), function (item) {
                return (test.id() === item.id()) && item.isTemplate();
            });
            if (existingTest === null) {
                self.availableTests.push(test);
                self.allTests.push(test);
            }

            // Update template tests list
            existingTest = ko.utils.arrayFirst(self.vmDashboard.tmplTests(), function (item) {
                return (item.id() === test.id() && item.isFactoryTest() && item.isTemplate());
            });
            if (existingTest === null) {
                // To make 'Throughput Test' at the second position in 'Test Library'
                if (test.template_name() == 'Throughput Test') {
                    if (self.vmDashboard.tmplTests().length > 1) {
                        // Insert value
                        self.vmDashboard.tmplTests.splice(1, 0, test);
                    } else {
                        self.vmDashboard.tmplTests.push(test);
                    }
                } else {
                    self.vmDashboard.tmplTests.push(test);
                }
            }
            self.addToCategoryView(test);
        } else if (test.isUserSave) {
            if(test.result_id){
                //code pass for loading test result from test_results
                self.allTests.push(test);
            }
            else {
                //code pass for loading user saved test
                existingTest = ko.utils.arrayFirst(self.availableTests(), function (item) {
                    return (test.id() === item.id()) && item.isUserSave;
                });
                if (existingTest === null) {
                    self.availableTests.push(test);
//                    self.allTests.push(test);
                } else {
                    self.availableTests.remove(existingTest);
                    self.availableTests.push(test);
//                    self.allTests.pop(existingTest);
//                    self.allTests.push(test);
                }
                self.addToCategoryView(test);
            }
        } else {
            existingTest = ko.utils.arrayFirst(self.allTests, function (item) {
                return (test.id() === item.id()) && !item.isUserSave;
            });
            if (existingTest === null) {
                self.allTests.push(test);
            } else {
                self.allTests.pop(existingTest);
                self.allTests.push(test);
            }
        }
    }

    self.availableTests.sort(util.sortArrayByObjectKeyKoObservable("name", true));

    if (self.vmTest.startingTab == 'tests') {
        self.vmTest.initializeAvailableTestsDraggable();
    }
};

IxiaViewModel.prototype.fillFavoriteTests = function (data, offset){
    var self = IxiaViewModel.typesafe(this);
    var favoriteTests = data = translate_tests_configurations(data);
    var existingTest;

    // Keep favorite test number is consistent with DB in FrontEnd cache
    if (self.vmDashboard.totalFavoriteTests > self.favoriteTests().length) {
        for (var i = self.favoriteTests().length; i < self.vmDashboard.totalFavoriteTests; i++) {
            self.favoriteTests.push(undefined);
        }
    } else if (self.vmDashboard.totalFavoriteTests < self.favoriteTests().length) {
        for (var i = self.favoriteTests().length - 1; i >= 0; i--) {
            if (self.favoriteTests()[i] == undefined) {
                self.favoriteTests.splice(i, 1);
            }
        }
    }

    for (var i = 0; i < favoriteTests.length; i++) {
        var test = new TestTemplateViewModel(self);
        test.inflate(favoriteTests[i]);

        if (offset != undefined) {
            // If offset is set, we query favorite tests from DB, so the favorite property has already been set
            self.favoriteTests()[offset + i] = test;
            if (i < 5) {
                self.vmDashboard.favoriteTests.push(test);
            }
        } else {
            // Make sure self.favoriteTests() has value before we use it
            if (self.favoriteTests().length == 0 && test.favorite()) {
                self.favoriteTests.push(test);
                self.vmDashboard.totalFavoriteTests += 1;
            }

            // Update favorite tests list
            existingTest = ko.utils.arrayFirst(self.favoriteTests(), function (item) {
                if (item != undefined) {
                    return item.id() === test.id();
                }
                return false;
            });
            if (existingTest !== null) {
                var index = self.favoriteTests.indexOf(existingTest);
                // Update
                if (test.favorite()) {
                    if (index != -1) {
                        self.favoriteTests()[index] = test;
                    }
                } else {
                    // Remove
                    if (index != -1) {
                        self.favoriteTests.remove(existingTest);
                        if (self.vmDashboard.favoriteTests.indexOf(existingTest) != -1) {
                            if (self.favoriteTests().length > index) {
                                if (self.favoriteTests()[index] !== undefined) {
                                    if (self.vmDashboard.favoriteTests.indexOf(self.favoriteTests()[index]) == -1) {
                                        self.vmDashboard.favoriteTests.push(self.favoriteTests()[index])
                                    }
                                }
                            }
                        }
                        self.vmDashboard.totalFavoriteTests -= 1;
                    }
                }
            } else {
                // Do nothing if the Frontend cache is empty here
                if (self.favoriteTests().length == 0 && !test.favorite()) {
                    continue;
                }
                if (self.favoriteTests()[0].id() < test.id() && test.favorite()) {
                    self.favoriteTests.unshift(test);
                    self.vmDashboard.totalFavoriteTests += 1;
                } else if (self.favoriteTests()[0].id() > test.id() && test.favorite()) {
                    var position = undefined;
                    // First loop to determine whether there is a proper position for insert
                    for (var k = 0; k < self.favoriteTests().length; k++) {
                        if (self.favoriteTests()[k] == undefined) {
                            continue;
                        }
                        if (self.favoriteTests()[k].id() > test.id()) {
                            continue;
                        } else {
                            position = k;
                            break;
                        }
                    }
                    if (position == undefined) {
                        if (self.favoriteTests()[self.favoriteTests().length - 1] != undefined) {
                            self.favoriteTests.push(test);
                        } else {
                            self.favoriteTests()[self.favoriteTests().length - 1] = test;
                        }
                    } else {
                        // Second loop to determine the insert position
                        var slice = self.favoriteTests.slice(position, self.favoriteTests().length);
                        slice.unshift(test);
                        self.favoriteTests = self.favoriteTests.slice(0, position).concat(slice);

                    }
                    self.vmDashboard.totalFavoriteTests += 1;
                }
            }

            existingTest = ko.utils.arrayFirst(self.vmDashboard.favoriteTests(), function (item) {
                return item.id() === test.id();
            });
            if (existingTest !== null) {
                // Update
                if (test.favorite()) {
                    var index = self.vmDashboard.favoriteTests.indexOf(existingTest);
                    self.vmDashboard.favoriteTests()[index] = test;
                } else {
                    // Remove
                    if (self.vmDashboard.favoriteTests.indexOf(existingTest) != -1) {
                        self.vmDashboard.favoriteTests.remove(existingTest);
                    }
                }
            } else {
                if (self.vmDashboard.favoriteTests().length == 0 && test.favorite()) {
                    self.vmDashboard.favoriteTests.push(test);
                    continue;
                }
                if (self.vmDashboard.favoriteTests()[0].id() < test.id() && test.favorite()) {
                    self.vmDashboard.favoriteTests.unshift(test);
                    if (self.vmDashboard.favoriteTests().length > 5) {
                        self.vmDashboard.favoriteTests.pop();
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

    existingUserTest = ko.utils.arrayFirst(self.userTests(), function (item) {
        return userTestId === item.id;
    });

    if (existingUserTest !== null) {
        self.userTests.remove(existingUserTest);
    }

    self.updateTestNameInRecentTests(userTest);

    flatUserTest = userTest.toFlatObject();
    self.fillAvailableTestsWithResults([flatUserTest], false);
    self.userTests().push(flatUserTest);
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

    existingUserTest = ko.utils.arrayFirst(self.allTests, function (item) {
        return userTest.id() === item.id() && !item.isTemplate();
    });

    if (existingUserTest !== null) {
        self.allTests.pop(existingUserTest);
    }

    existingUserTest = ko.utils.arrayFirst(self.favoriteTests(), function (item) {
        return userTest.id() === item.id() && userTest.isUserSave && userTest.favorite();
    });

    if (existingUserTest !== null) {
        self.favoriteTests.remove(existingUserTest);
    }

    existingUserTest = ko.utils.arrayFirst(self.vmDashboard.favoriteTests(), function (item) {
        return userTest.id() === item.id() && userTest.isUserSave && userTest.favorite();
    });

    if (existingUserTest !== null) {
        self.vmDashboard.favoriteTests.remove(existingUserTest);
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

IxiaViewModel.prototype.getAvailableDatapoints = function () {
    var self = IxiaViewModel.typesafe(this);

    self.availableDatapointsMap.removeAll();

    var ajax = $.ajax({
        type: "GET",
        url: util.getConfigSetting("get_datapoints"),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            var availableDatapoints = data;

            for (var i = 0; i < availableDatapoints.length; i++) {
                var datapoint = availableDatapoints[i];
                self.availableDatapointsMap()[datapoint.id] = datapoint;
            }
        }
    });

    return ajax;
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

IxiaViewModel.prototype.getAvailableEndpoints = function (callback) {
    var self = IxiaViewModel.typesafe(this);

    self.availableEndpoints.removeAll();

    var ajax = $.ajax({
        type: "GET",
        url: util.getConfigSetting("get_endpoints"),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            var availableEndpoints = data;

            for (var i = 0; i < availableEndpoints.length; i++) {
                var endpoint = new EndpointViewModel(self);
                endpoint.inflate(availableEndpoints[i]);
                self.availableEndpoints.push(endpoint);
            }

            self.availableEndpoints.sort(util.sortArrayByObjectKeyKoObservable("name", true));
            if (callback){
                callback();
            }
        }
    });

    return ajax;
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