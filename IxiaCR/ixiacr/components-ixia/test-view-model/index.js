var DefaultHeaderDelegate = require('player').delegates["test-view-model"],
    indefinite_modules = [
    ],
    static_duration_modules = {
        "axon.testcases.spirent.multicast_join_leave_latency": 5 // Always runs for ~5 minutes
    },
    util = require('utility-functions');

/**
 * Test configuration page - manages ConfiguredTestViewModel internally
 *
 * @param rootVModel IxiaCRViewModel
 * @param delegate
 * @constructor
 */
function TestViewModel(rootVModel, delegate) {
    var self = this;

    self.rootVm = rootVModel;
    self.vmDashboard = rootVModel.vmDashboard
    self.getAvailableDevices = self.rootVm.getAvailableDevices;
    self.getAvailableTests = self.rootVm.getAvailableTests;
    self.availableDevices = self.rootVm.availableDevices;
    self.availableTests = self.rootVm.availableTests;
    self.availableTestsByCategory = self.rootVm.availableTestsByCategory;
    self.getResultTypes = self.rootVm.getResultTypes;
    self.availableCustomers = self.rootVm.availableCustomers;
    self.availableLocations = self.rootVm.availableLocations;

    self.leftPortlets = ko.observableArray(self.vmDashboard.leftPortlets());
    self.vmDashboard.leftPortlets.subscribe(function () {
        self.leftPortlets(self.vmDashboard.leftPortlets());
    });

    self.rightPortlets = ko.observableArray(self.vmDashboard.rightPortlets());
    self.vmDashboard.rightPortlets.subscribe(function () {
        self.rightPortlets(self.vmDashboard.rightPortlets());
    });

    self.strings = {
        "save": translate('Save'),
        "close": translate('CLOSE'),
        "Duration": translate('Duration'),
        "Duration is based on configuration": translate("Duration is based on configuration")
    };

    self.availableDurations = [];
    for (var i = 1; i <= 15; i++) {
        self.availableDurations.push({
            value: i,
            text: translate('{value} MIN', {
                value: i
            })
        });
    }
    for (var i = 20; i <= 120; i+=5) {
        self.availableDurations.push({
            value: i,
            text: translate('{value} MIN', {
                value: i
            })
        });
    }

    self.vmConfiguration = new ConfiguredTestViewModel(self);
    self.vmResults = new TestResultsViewModel(self);
    self.vmDocumentation = new TestDocumentationViewModel(self);
    self.vmSidebar = new TestSidebarViewModel(self);

    self.startingTab = self.vmSidebar.startingTab;
    self.name = self.vmConfiguration.name;
    self.description = self.vmConfiguration.description;
    self.initializeAvailableTestsDraggable = self.vmSidebar.initializeAvailableTestsDraggable;

    self.selectedTab = ko.observable();
    self.startingTab = 'configuration';

    self.selectedTab(self.startingTab);

    self.isTestRunning = ko.observable(false);
    self.hasResults = ko.observable(false);

    self.testConfigurationTemplateName = ko.observable('placeholder-template');
    self.testResultsTemplateName = ko.observable('placeholder-template');
    self.testDocumentationTemplateName = ko.observable('placeholder-template');

    self.save = self.vmConfiguration.save.bind(self.vmConfiguration);

    self.displayTags = ko.computed({
        read: self.vmConfiguration.displayTagsRead.bind(self.vmConfiguration),
        write: self.vmConfiguration.displayTagsWrite.bind(self.vmConfiguration)
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.configurationTabClass = ko.computed(self.getTabClassFor.bind(self, 'configuration')).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.resultsTabClass = ko.computed(self.getTabClassForResults.bind(self, 'results')).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.documentationTabClass = ko.computed(self.getTabClassFor.bind(self, 'documentation')).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.isShowConfiguration = ko.computed(self.computeIsShowConfiguration.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.isShowResults = ko.computed(self.computeIsShowResults.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.isShowDocumentation = ko.computed(self.computeIsShowDocumentation.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.indefinite = ko.observable(true);
    self.static_duration = ko.observable(true);

    // Note: vmConfiguration.module is not an observable
    self.vmConfiguration.on('changed:module', function (new_module) {
        var duration = static_duration_modules[new_module];
        self.indefinite(-1 !== indefinite_modules.indexOf(new_module));
        self.static_duration(duration !== undefined);

        if (self.static_duration()) {
            self.vmConfiguration.duration(duration);
        }
    });

    self.lightboxText = ko.observable();
    self.preValidationResult = self.vmConfiguration.preValidationResult;

    // Allow extension through delegation - i.e. loading, saving, etc.
    if (!delegate) {
        delegate = new DefaultHeaderDelegate();
    }
    delegate.setParent(self);
    self.delegate = delegate;
}

TestViewModel.prototype.durationText = function () {
    return window.translate("{duration} MIN", {
        duration: this.vmConfiguration.duration()
    });
};

TestViewModel.prototype.afterRender = function () {
    var self = this.data,
        selected_tab = self.rootVm.selectedTab(),
        $parent = document.querySelector('.' + selected_tab),
        $header;

    if (!self.delegate.canRenderTab(selected_tab)) {
        return;
    }

    return self.delegate.afterRender();
};

TestViewModel.typesafe = function (that) {
    if (!(that instanceof TestViewModel)) {
        throw 'This method must be executed on a TestViewModel';
    }

    return that;
};

TestViewModel.prototype.computeIsShowConfiguration = function () {
    var self = TestViewModel.typesafe(this);

    return self.selectedTab() == 'configuration';
};

TestViewModel.prototype.computeIsShowResults = function () {
    var self = TestViewModel.typesafe(this);

    return self.selectedTab() == 'results';
};

TestViewModel.prototype.computeIsShowDocumentation = function () {
    var self = TestViewModel.typesafe(this);

    return self.selectedTab() == 'documentation';
};

TestViewModel.prototype.openSaveModal = function () {
    this.delegate.openSaveModal();
};

TestViewModel.prototype.openHelpModal = function () {
    var self = TestViewModel.typesafe(this);

    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-test-header-help-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function(){
            ko.applyBindings(self, document.getElementById('lightbox-test-header-help'));
        }
    });
};

TestViewModel.prototype.getTabClassFor = function (tabName) {
    var self = TestViewModel.typesafe(this);

    if (self.selectedTab() == tabName) {
        return 'selected';
    }

    return '';
};
TestViewModel.prototype.getTabClassForResults = function (tabName) {
    var self = TestViewModel.typesafe(this);

    if (self.selectedTab() == tabName) {
        return 'selected';
    } else if(self.hasResults()) {
        return
    } else {
        return 'disabled'
    }

    return '';
};

TestViewModel.prototype.selectTab = function(tab, callback){
    var self = TestViewModel.typesafe(this);
    callback = callback || function(){};

    self.selectedTab(tab);

    var testModule = self.vmConfiguration.module.split('.').pop();
    var configurationTemplateRoute = "test_module/test_configuration_tmpl/"+testModule;
    var configurationTemplateName = "test-configuration-"+testModule;
    var documentationTemplateRoute = "test_module/test_documentation_tmpl/"+testModule;
    switch (tab) {
        case 'configuration':
            util.lightbox.close();
            util.lightbox.working(new LightboxWorkingViewModel(translate("Loading"), translate("Loading")));
            util.getTemplate(configurationTemplateRoute, '#' + configurationTemplateName, function(template){
                self.testConfigurationTemplateName(configurationTemplateName);
                util.lightbox.close();
                callback();
            }, self.selectedTab() != tab);
            break;
        case 'results':
            util.lightbox.close();
            util.lightbox.working(new LightboxWorkingViewModel(translate("Loading"), translate("Loading")));
            util.getTemplate(configurationTemplateRoute, '#' + configurationTemplateName, function(template){
                self.testConfigurationTemplateName(configurationTemplateName);
                util.lightbox.close();
                self.templateResultsTab(self.isTestRunning(), callback);
            }, self.selectedTab() != tab);

            break;
        case 'documentation':
            util.getTemplate(documentationTemplateRoute, '#test-documentation-tmpl', function(template){
                self.testDocumentationTemplateName('test-documentation-tmpl');
            }, self.selectedTab() != tab);

            callback();

            break;
    }

    appHistory.push(ixiaCRVm);
};

TestViewModel.prototype.templateResultsTab = function(isTestRunning, callback){
    var self = TestViewModel.typesafe(this),
        moduleName = self.vmConfiguration.module.split('.').pop(),
        resultsTemplateRoute = "test_module/test_results_tmpl/"+self.vmConfiguration.module.split('.').pop(),
        resultsNeedToRunSelector = "#results-need-to-run-tmpl-" + moduleName,
        resultsChartSelector = "#results-chart-tmpl-" + moduleName;

    callback = callback || $.noop;

    if(!self.hasResults() && !isTestRunning){
        util.lightbox.close();
        util.lightbox.working(new LightboxWorkingViewModel(translate("Loading"), translate("Loading")));
        util.getTemplate(resultsTemplateRoute, resultsNeedToRunSelector, function(template){
            template.tmpl().appendTo($(".results").empty());
            util.lightbox.close();
            callback();
        }, true);
    }else{
        if(self.hasResults()){
            callback();

            self.refreshActiveChartOnVisible();

            return;
        }

        util.lightbox.close();
        util.lightbox.working(new LightboxWorkingViewModel(translate("Loading"), translate("Loading")));
        util.getTemplate(resultsTemplateRoute, resultsChartSelector, function(template){
            template.tmpl().appendTo($(".results").empty());
            self.hasResults(true);
            util.lightbox.close();
            callback();
        }, true);
    }
};

TestViewModel.prototype.refreshTestDraggables = function () {
    var self = TestViewModel.typesafe(this);

    self.vmSidebar.refreshTestDraggables();
};

TestViewModel.prototype.refreshActiveChartOnVisible = function () {
    var self = TestViewModel.typesafe(this);

    if ($('.results #result-charts:visible').length == 0) {
        setTimeout(function () { self.refreshActiveChartOnVisible(); }, 1);
        return;
    }

    self.vmResults.activeChart().activate();
};

TestViewModel.prototype.onSelectedTabUpdated = function (value) {
    var self = TestViewModel.typesafe(this);

    if (value == 'results') {
        if (self.hasResults()) {
            self.vmResults.activeChart().activate();
        }
    }
};

TestViewModel.prototype.showConfiguration = function () {
    var self = TestViewModel.typesafe(this);

    self.selectTab('configuration');
};

TestViewModel.prototype.showResults = function (closeLightbox) {
    var self = TestViewModel.typesafe(this);

    if (self.hasResults()){
        self.selectTab('results');
        if (closeLightbox === true){
            setTimeout(function(){util.lightbox.close();},2000);
        }
    }
};

TestViewModel.prototype.showDocumentation = function () {
    var self = TestViewModel.typesafe(this);
    self.selectTab('documentation');
};

TestViewModel.prototype.ensureUnreservedOrFail = function(callback) {
    var self = TestViewModel.typesafe(this),
        handle_response = function(data,error){
            if(error){
                util.lightbox.openError(window.translate('Error'), window.translate('Unable to get reservation status.'));
                window.logger.error(error);
                return;
            }


            var reserved_info = data.reserved_remotely;
            if(reserved_info.reserved === false){
                callback();
            }
            else if(reserved_info.is_reserved_by_me === true){
                self.lightboxText = translate('A test is already running.  Please wait for the current test to complete before loading a new test.');
                util.lightbox.open({
                    url : 'html/lightbox_tmpl',
                    selector : '#lightbox-message-template',
                    cancelSelector: '.ok-button',
                    onOpenComplete: function(){
                        ko.applyBindings(self, document.getElementById('lightbox-message'));
                    }
                });
            } else {
                self.lightboxText = translate('This Axon chassis is currently reserved.<br/><br/>' +
                    'User: {user}<br/>From: {from}<br/>Since: {since}<br/><br/>' +
                    'Please wait for the chassis to become available before loading a test.<br><br>', {
                    user: reserved_info.reserved_by,
                    from: reserved_info.reserved_addr,
                    since: reserved_info.reserved_since
                });
                util.lightbox.open({
                    url : 'html/lightbox_tmpl',
                    selector : '#lightbox-reserved-template',
                    cancelSelector: '.ok-button',
                    onOpenComplete: function(){
                        ko.applyBindings(self, document.getElementById('lightbox-message'));
                    }
                });
            }
        };


    util.get_chassis_reservationa_status(handle_response);

}

/**
 * Loads configuration from a selected test
 *
 * @param testConfiguration TestTemplateViewModel
 * @param eventConfiguration TestTemplateViewModel
 */
TestViewModel.prototype.loadTest = function (testConfiguration, eventConfiguration) {
    this.delegate.loadTest.apply(this.delegate, arguments);
};

TestViewModel.prototype.loadRecentTest = function (historyItem) {
    var self = TestViewModel.typesafe(this);
    self.ensureUnreservedOrFail(function() {
        var matchedTest = ko.utils.arrayFirst(self.rootVm.availableTests, function (item) {
            return (item.id() === historyItem.test_id && !item.isFactoryTest() && (item.result_id && item.result_id === historyItem.result_id()));
        });

        if (matchedTest === null) {
            self.rootVm.getAvailableTests({"test_id" : historyItem.test_id, "result_id" : historyItem.result_id()}, function() {
                matchedTest = ko.utils.arrayFirst(self.rootVm.availableTests, function (item) {
                            return (item.id() === historyItem.test_id && !item.isFactoryTest() && (item.result_id && item.result_id === historyItem.result_id()));
                        });
                if (matchedTest !== null) {
                    self.loadingTest(self, historyItem, matchedTest);
                }
            });
        } else {
            self.loadingTest(self, historyItem, matchedTest);
        }
    })
};

TestViewModel.prototype.loadingTest = function(self, historyItem, testConfiguration) {
    self.executeLoadTest(self, historyItem, testConfiguration);
};

/**
 * Loading test from a selected history results or axon test
 * @param self TestViewModel
 * @param historyItem TestHistoryViewModel
 * @param matchedTest TestTemplateViewModel
 */
TestViewModel.prototype.executeLoadTest = function (self, historyItem, matchedTest) {
    self.vmDocumentation.loadTest(matchedTest);
    self.vmConfiguration.loadTest(matchedTest, function(){
        self.rootVm.selectTab('testLibrary');
    }.bind(self));
};

TestViewModel.prototype.openTestCreationLightbox = function(){
    this.delegate.openTestCreationLightbox();
};

TestViewModel.prototype.closeTestEditor = function () {
    this.delegate.closeTestEditor();
}

TestViewModel.prototype.runTest = function () {

    /**
     * Scenarios:
     *  1. Test is running - always allow test to stop (immediately)
     *  2. Test is not running and chassis is reserved - prevent test from starting and show error
     *  3. Test is not running and chassis is not reserved - start test
     */

    var self = TestViewModel.typesafe(this),
        run_test;

    if (self.vmResults.status() === 'running') {
        // The chassis will be reserved, so no need to check - just abort immediately
        self.vmResults.status('aborted');
        util.lightbox.working(new LightboxWorkingViewModel(translate("Stop"), translate("Stopping Test...")));
        util.applyFunction(self.vmResults.charts(), "dispose");
        self.vmConfiguration.cancelTest(function() {
            self.isTestRunning(false);
            self.rootVm.getResultHistory();
        });
        return; // Short-circuit
    }

    run_test = function(data,error){
        if(error){
            util.lightbox.openError(window.translate('Error'), window.translate('Unable to get reservation status.'));
            window.logger.error(error);
            return; // Short-circuit
        }

        // Start the test
        util.lightbox.working(new LightboxWorkingViewModel(translate("Start"), translate("Validating Test...")));
        self.hasResults(false);
        self.testResultsTemplateName("placeholder-template");
        self.vmResults.reset();

        setTimeout(function () { self.vmConfiguration.validate(function() {
            self.vmConfiguration.runTest();
        }) }, 1000);
    };
};

TestViewModel.prototype.abortTestWithError = function (data) {
    var self = TestViewModel.typesafe(this);

    self.vmResults.status('aborted');
    util.applyFunction(self.vmResults.charts(), "dispose");
    util.lightbox.openError(data.messages[0].header, data.messages[0].content);
};

TestViewModel.prototype.validate = function(success, error){
    var self = TestViewModel.typesafe(this),
        result = new ValidationResultsViewModel(self.vmConfiguration);

    success = success || $.noop;
    error = error || $.noop;

    //result = self.delegate.validate(result);
    result = self.vmConfiguration.validate(undefined, result);

    if(result.is_valid){
        success();
    }else{
        error(result);
    }
};

TestViewModel.prototype.getJsonConfiguration = function () {
    var self = TestViewModel.typesafe(this);

    return JSON.stringify(self.vmConfiguration.toJSON());
};

module.exports = TestViewModel;