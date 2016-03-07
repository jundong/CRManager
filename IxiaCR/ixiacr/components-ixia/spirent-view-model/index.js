var translate_tests_configurations = require('./test-configurations-adapter.js'),
    EndpointViewModel = require('endpoint-view-model').UnicastViewModel;

function SpirentViewModel() {
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

SpirentViewModel.typesafe = function (that) {
    if (!(that instanceof SpirentViewModel)) {
        throw 'This method must be executed on a SpirentViewModel';
    }

    return that;
};

SpirentViewModel.prototype.updateAppLoadMessage = function (model, failed) {
    var self = SpirentViewModel.typesafe(this);

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
                link: '<a href="http://support.spirentforbusiness.com">support.spirentforbusiness.com</a>'
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

SpirentViewModel.prototype.init = function (callback) {
    var self = SpirentViewModel.typesafe(this);

    var settingsAjax = self.getGlobalSettings()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[0]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[0], true);
        });

    var tracksAjax = self.getAvailableTracks()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[1]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[1], true);
        });

    var devicesAjax = self.getAvailableDevices()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[2]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[2], true);
        });

    var endpointAjax = self.getAvailableEndpoints()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[3]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[3]);
        });

    //    var testsAjax = self.getAvailableTests()
    //        .done(function () {
    //            //self.updateAppLoadMessage(self.ajaxModels[4]);
    //        })
    //        .fail(function () {
    //            self.updateAppLoadMessage(self.ajaxModels[4], true);
    //        });

    var tmplsTestsAjax = self.getTmplTests()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[13]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[13], true);
        });

    var favoriteTestsAjax = self.getFavoriteTests()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[14]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[14], true);
        });

    var historyResults = self.getResultHistory()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[15]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[15], true);
        });

    var dataPointsAjax = self.getAvailableDatapoints()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[5]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[5], true);
        });

    var resultTypesAjax = self.getResultTypes()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[6]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[6], true);
        });

    var customersAjax = self.getAvailableCustomers()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[7]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[7], true);
        });

    var locationsAjax = self.getAvailableLocations()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[8]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[8], true);
        });

    var languageAjax = self.getLanguage()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[9]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[9], true);
        });

    var tagsAjax = self.getAvailableTags()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[10]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[10], true);
        });

    var messageAjax = self.getAvailableDisplayMessages()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[11]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[11], true);
        });

    var playlistAjax = self.getAvailablePlaylists()
        .done(function () {
            self.updateAppLoadMessage(self.ajaxModels[12]);
        })
        .fail(function () {
            self.updateAppLoadMessage(self.ajaxModels[12], true);
        });


    self.selectTab(self.startingTab);

    self.initStart = (new Date()).getTime();

    return $.when(
        settingsAjax,
        tracksAjax,
        playlistAjax,
        devicesAjax,
        endpointAjax,
        tmplsTestsAjax,
        favoriteTestsAjax,
        historyResults,
        dataPointsAjax,
        resultTypesAjax,
        customersAjax,
        locationsAjax,
        languageAjax,
        tagsAjax,
        messageAjax
    );
};

SpirentViewModel.prototype.setUser = function (user) {
    var self = SpirentViewModel.typesafe(this);
    self.user = user;
};

SpirentViewModel.prototype.refreshTestDraggables = function () {
    var self = SpirentViewModel.typesafe(this);
    self.vmTest.refreshTestDraggables();
};

SpirentViewModel.prototype.loadTest = function (test) {
    var self = SpirentViewModel.typesafe(this);
    self.vmTest.loadTest(test);
};
SpirentViewModel.prototype.loadRecentTest = function (historyItem) {
    var self = SpirentViewModel.typesafe(this);
    self.vmTest.loadRecentTest(historyItem);
};

SpirentViewModel.prototype.getTabClassFor = function (tabName) {
    var self = SpirentViewModel.typesafe(this);
    if (self.selectedTab() == tabName) {
        return 'selected';
    }

    return '';
};

SpirentViewModel.prototype.showTest = function () {
    var self = SpirentViewModel.typesafe(this);
    self.selectTab('test');
};

SpirentViewModel.prototype.showDashboard = function () {
    var self = SpirentViewModel.typesafe(this);
    self.selectTab('dashboard');
};

SpirentViewModel.prototype.showCalendar = function () {
    var self = SpirentViewModel.typesafe(this);
    self.selectTab('calendar');
};

SpirentViewModel.prototype.showHistory = function () {
    var self = SpirentViewModel.typesafe(this);
    self.selectTab('history');
};

SpirentViewModel.prototype.showAdministration = function () {
    var self = SpirentViewModel.typesafe(this);
    self.selectTab('administration');
};

SpirentViewModel.prototype.selectTab = function (tabName, done) {
    done = done || function () {};

    var self = SpirentViewModel.typesafe(this);

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

SpirentViewModel.prototype.getGlobalSettings = function (callback, reload) {
    var self = SpirentViewModel.typesafe(this);

    var url = util.getConfigSetting('get_global_settings');
    if (reload)
        url += '?reload=1'

    var ajax = $.ajax({
        type: 'POST',
        url: url,
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            self.vmGlobalSettings.axonBackups.removeAll();
            self.vmGlobalSettings.currentDHCP = data.dhcp;
            self.vmGlobalSettings.currentIp = data.host;
            self.vmGlobalSettings.currentSsid = data.ssid;
            self.vmGlobalSettings.currentWpaKey = data.wpa_key;
            self.vmGlobalSettings.inflate(data);
            if (callback){
                callback();
            }
        }
    });

    return ajax;
};

SpirentViewModel.prototype.getAvailableCustomers = function () {
    var self = SpirentViewModel.typesafe(this);

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

SpirentViewModel.prototype.getAvailableLocations = function () {
    var self = SpirentViewModel.typesafe(this);

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

SpirentViewModel.prototype.getLanguage = function() {
    var self = SpirentViewModel.typesafe(this);

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

SpirentViewModel.prototype.getAvailableTags = function () {
    var self = SpirentViewModel.typesafe(this);

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

SpirentViewModel.prototype.getAvailableTagsAsAutoSuggestData = function () {
    var self = SpirentViewModel.typesafe(this);
    var tags = self.availableTags();

    var data = new Array();

    for (var i = 0; i < tags.length; i++) {
        data.push({"value": tags[i]});
    }

    return data;
};

SpirentViewModel.prototype.getTmplTests = function (callback) {
    var self = SpirentViewModel.typesafe(this);

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

SpirentViewModel.prototype.getFavoriteTests = function (params, callback) {
    var self = SpirentViewModel.typesafe(this);
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

SpirentViewModel.prototype.getAvailableTests = function (params, callback) {
    var self = SpirentViewModel.typesafe(this);
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

SpirentViewModel.prototype.fillAvailableTestsWithResults = function (data, isFactoryTest){
    var self = SpirentViewModel.typesafe(this);
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

SpirentViewModel.prototype.fillFavoriteTests = function (data, offset){
    var self = SpirentViewModel.typesafe(this);
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

SpirentViewModel.prototype.insertUserTest = function (userTest){
    var self = SpirentViewModel.typesafe(this),
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

SpirentViewModel.prototype.removeUserTest = function (userTest){
    var self = SpirentViewModel.typesafe(this),
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

SpirentViewModel.prototype.updateTestNameInRecentTests = function (userTest){
    var self = SpirentViewModel.typesafe(this),
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

SpirentViewModel.prototype.getResultHistory = function (params, callback) {
    var self = SpirentViewModel.typesafe(this);
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

SpirentViewModel.prototype.fillHistoryTestsResults = function (data, isRefreshDashboard){
    var self = SpirentViewModel.typesafe(this);
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

SpirentViewModel.prototype.getAvailableDatapoints = function () {
    var self = SpirentViewModel.typesafe(this);

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
SpirentViewModel.prototype.getAvailableTracks = function (callback) {
    var self = SpirentViewModel.typesafe(this);
    self.availableTracks.removeAll();
    var ajax = $.ajax({
        type: "GET",
        url: util.getConfigSetting("get_tracks"),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            var availableTracks = data;
            self.availableTracksMap = new Array();

            for (var i = 0; i < availableTracks.length; i++) {
                var availableTrack = new TestTrackViewModel(self);
                if (!availableTracks[i].js_bw_compute || availableTracks[i].js_bw_compute ==""){
                    availableTracks[i].js_bw_compute="var computeFunction=function(){var trafficSettings = self.trafficSettings();if (trafficSettings == null || trafficSettings == undefined) {return;}var trackProperties = self.trackProperties();if (trackProperties.length == 0) {return;}var totalPropertiesBandwidth = 0;for (var i = 0; i < trackProperties.length; i++) {totalPropertiesBandwidth += trackProperties[i].bandwidth();}return (trafficSettings.value() * totalPropertiesBandwidth);};";
                }
                availableTrack.inflate(availableTracks[i]);
                self.availableTracks.push(availableTrack);

                self.availableTracksMap[availableTracks[i].id] = availableTrack;
            }

            var availablePlaylists = self.availablePlaylists();
            if (availablePlaylists.length > 0) {
                for (i = 0; i < availablePlaylists.length; i++) {
                    var tracks = availablePlaylists[i].tracks();
                    for (var j = 0; j < tracks.length; j++) {
                        var track = tracks[j]();
                        var trackId = track.id();
                        track.name = self.availableTracksMap[trackId].name;
                        if(availablePlaylists[i].isReadOnly)
                            track.trackProperties = self.availableTracksMap[trackId].trackProperties;
                        track.layer = self.availableTracksMap[trackId].layer;
                    }
                }
            }
            self.availableTracks.sort(util.sortArrayByObjectKeyKoObservable("name", true));
            if (callback){
                callback();
            }
        }
    });

    return ajax;
};
SpirentViewModel.prototype.getAvailablePlaylists = function (callback) {
    var self = SpirentViewModel.typesafe(this);

    self.availablePlaylists.removeAll();

    var ajax = $.ajax({
        type: "GET",
        url: util.getConfigSetting("get_playlist_tracks"),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            var availablePlaylists = data;

            for (var i = 0; i < availablePlaylists.length; i++) {
                var playlist = new TestPlaylistViewModel(self);

                playlist.inflate(availablePlaylists[i]);

                self.availablePlaylists.push(playlist);
            }

            var availableTracks = self.availableTracks();
            if (availableTracks.length > 0) {
                for (i = 0; i < availablePlaylists.length; i++) {
                    var playlistTracks = self.availablePlaylists()[i].tracks();
                    for (var j = 0; j < playlistTracks.length; j++) {
                        var thisTrack = playlistTracks[j]();
                        var foundTrack = self.availableTracksMap[thisTrack.id()];
                        thisTrack.name = foundTrack.name;
                        if(availablePlaylists[i].isReadOnly)
                            thisTrack.trackProperties = foundTrack.trackProperties;
                        thisTrack.layer = foundTrack.layer;
                    }

                    self.availablePlaylists()[i].setMinTrackLayer();
                    self.availablePlaylists()[i].calculatePercentagesForApplicationLayerTracks();
                }
            }
            self.availablePlaylists.sort(util.sortArrayByObjectKeyKoObservable("name", true));
            if (callback){
                callback();
            }
        }
    });

    return ajax;
};
SpirentViewModel.prototype.getAvailableDevices = function (callback, responseData) {
    var self = SpirentViewModel.typesafe(this);

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

SpirentViewModel.prototype.updateDeviceTimeSyncCapabilities = function (data) {
    var self = SpirentViewModel.typesafe(this);

    self.availableDevices().forEach(function(device) {
        device.updateTimeSyncCapability(data); // Handles mapping of devices
    });
};

SpirentViewModel.prototype.getAvailableEndpoints = function (callback) {
    var self = SpirentViewModel.typesafe(this);

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
SpirentViewModel.prototype.getResultTypes = function () {
    var self = SpirentViewModel.typesafe(this);

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

SpirentViewModel.prototype.getAvailableDisplayMessages = function () {
    var self = SpirentViewModel.typesafe(this);

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
SpirentViewModel.prototype.addToCategoryView = function (newTest) {
    var self = SpirentViewModel.typesafe(this)
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
SpirentViewModel.prototype.deleteTest = function () {
    var self = SpirentViewModel.typesafe(this);
    logger.info("removeFromCategoryView unimplemented");
    //find test
    //remove from array
    //removeFromCategoryView();
};
SpirentViewModel.prototype.openTestCreationLightbox = function () {
    var self = SpirentViewModel.typesafe(this);
    self.vmTest.openTestCreationLightbox();
};
SpirentViewModel.prototype.openTestCreationLightboxUnlessLoaded = function () {
    var self = SpirentViewModel.typesafe(this);
    if(!self.vmTest.vmConfiguration.isLoaded())
        self.vmTest.openTestCreationLightbox();
    else
        self.showTest();
};

SpirentViewModel.prototype.getState = function(){
    var self = SpirentViewModel.typesafe(this);

    var stateViewModel = {};

    stateViewModel.mainTab = self.selectedTab();
    stateViewModel.testTab = self.vmTest.selectedTab();
    stateViewModel.adminTab = self.vmAdministration.selectedTab();
    stateViewModel.resultsTab = self.vmTest.vmResults.selectedTab();

    return stateViewModel;
};

SpirentViewModel.prototype.restoreState = function(stateViewModel){
    var self = SpirentViewModel.typesafe(this);

    self.selectedTab(stateViewModel.mainTab);
    self.vmTest.selectedTab(stateViewModel.testTab);
    self.vmAdministration.selectedTab(stateViewModel.adminTab);
    self.vmTest.vmResults.selectTab(stateViewModel.resultsTab);
};

module.exports = SpirentViewModel;