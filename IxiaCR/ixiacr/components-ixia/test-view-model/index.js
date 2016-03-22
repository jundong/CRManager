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

    self.getAvailableDevices = self.rootVm.getAvailableDevices;
    self.getAvailableTests = self.rootVm.getAvailableTests;
    self.getAvailableDatapoints = self.rootVm.getAvailableDatapoints;
    self.availableDevices = self.rootVm.availableDevices;
    self.availableTests = self.rootVm.availableTests;
    self.availableTestsByCategory = self.rootVm.availableTestsByCategory;
    self.availableDatapointsMap = self.rootVm.availableDatapointsMap;
    self.getResultTypes = self.rootVm.getResultTypes;
    self.availableCustomers = self.rootVm.availableCustomers;
    self.availableLocations = self.rootVm.availableLocations;

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
    var deactiveDevices = testConfiguration.getDeactiveDevices();
    if (deactiveDevices.length > 0) {
        var lightbox_text = translate("Warning: Below Remote Device(s) have been deleted from this Axon: <br />{devices}<br />If you continue to load the test, we'll use the 'Local Chassis' to replace deleted ones",
                                        {devices: util.array_to_string(deactiveDevices, "", "<br />")});
        util.lightbox.confirmation_dialog(self,lightbox_text,function() {
            var resetConfiguration = testConfiguration.clone();
            resetConfiguration.resetDevices();
            self.executeLoadTest(self, historyItem, resetConfiguration);
        })
    } else {
        self.executeLoadTest(self, historyItem, testConfiguration);
    }
};

/**
 * Loading test from a selected history results or axon test
 * @param self TestViewModel
 * @param historyItem TestHistoryViewModel
 * @param matchedTest TestTemplateViewModel
 */
TestViewModel.prototype.executeLoadTest = function (self, historyItem, matchedTest) {
    //self.showResults();
    self.vmDocumentation.loadTest(matchedTest);
    self.vmConfiguration.loadTest(matchedTest, function(){
        self.vmResults.status(historyItem.endResult());
        //self.vmResults.displayMessage(historyItem.displayMessage());
        self.showResults();
        self.hasResults(true);
        self.loadChartsWithResults(historyItem);
        self.refreshActiveChartOnVisible();
        self.rootVm.selectTab('test');
    }.bind(self));
};

TestViewModel.prototype.loadChartsWithResults = function(historyItem){
    var self = TestViewModel.typesafe(this);
    if(!historyItem.chartData && !historyItem.result_sets){
        self.getTestResults(historyItem);
    }
    else if(historyItem.chartData && !historyItem.result_sets){
        self.fillResultSetFromChartData(historyItem);
    }

    if(historyItem.result_sets){
        var chartVms = [],
            trafficTotalLabel = self.vmConfiguration.getTotalTrafficLabel(),
            moduleName = self.vmConfiguration.module.split('.').pop(),
            resultsTemplateRoute = "test_module/test_results_tmpl/" + moduleName,
            resultsTemplateName = "results-chart-tmpl-" + moduleName;

        self.vmConfiguration.result_types = self.getDynamicResultTypes();

        for(var i = 0; i < 23; i++){
            var resultType = self.vmConfiguration.result_types[i];
            if (resultType == null || resultType == undefined) {
                continue;
            }

            var chart = new Chart(resultType);
            var table = new ResultsTable();
            chartVms[i] = new ChartViewModel(self.vmResults, { chart : chart, table : table });
            chartVms[i].label = trafficTotalLabel;
        }

        self.vmResults.hydrate(chartVms);
        self.vmResults.getSavedDetailsTable(historyItem.detail_table);
        self.vmResults.resultId(historyItem.result_id());

        if (self.testResultsTemplateName() !== resultsTemplateName) {
            util.lightbox.close();
            util.lightbox.working(new LightboxWorkingViewModel(translate("Loading"), translate("Loading")));
            util.getTemplate(resultsTemplateRoute, "#" + resultsTemplateName, function(template){
                template.tmpl().appendTo($(".results").empty());
                self.testResultsTemplateName(resultsTemplateName);
                self.showResults(true);
                util.lightbox.close();
            }, true);
        } else {
            self.showResults(true);
        }

        for(var resultSetIndex = 0; resultSetIndex < historyItem.result_sets.length; resultSetIndex++){
            for(var chartIndex = 0; chartIndex < 23; chartIndex++){
                if(chartVms[chartIndex] && chartIndex == historyItem.result_sets[resultSetIndex].tab_id){
                    chartVms[chartIndex].chart().update(historyItem.result_sets[resultSetIndex].series_list);
                    break;
                }
            }
        }
    }
};

TestViewModel.prototype.fillResultSetFromChartData = function(historyItem){
    var self = TestViewModel.typesafe(this);
    historyItem.result_sets = new Array();

    for(var i = 0; i < historyItem.chartData.length; i++){
        var data = {name: historyItem.chartData[i].name};
        for(var j = 0; j < historyItem.chartData[i].series.length; j++){
            var graphSeries = historyItem.chartData[i].series[j];
            data[graphSeries.label] = new Array();
            for(var d = 0; d < graphSeries.data.length; d++){
                data[graphSeries.label].push({ x: graphSeries.data[d][0], y: graphSeries.data[d][1] });
            }
        }
        historyItem.result_sets.push(data);
    }
};

TestViewModel.prototype.getTestResults = function(historyItem){
    var self = TestViewModel.typesafe(this);
    util.lightbox.close();
    util.lightbox.working(new LightboxWorkingViewModel(translate("Loading test results"), translate("Loading test results...")));
    $.ajax({
        type: "GET",
        url: util.getConfigSetting("get_results")+"/"+historyItem.result_id(),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            historyItem.result_sets = data.result_sets;
            historyItem.detail_table = data.detail_table;
            self.loadChartsWithResults(historyItem);
        },
        error: function (jqXhr, textStatus, errorThrown) {
            util.logData(textStatus);
        }
    });
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
     *  1. Test player is running - always allow test to stop (immediately)
     *  2. Test player is not running and chassis is reserved - prevent test from starting and show error
     *  3. Test player is not running and chassis is not reserved - start test
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
            self.showResults();
        });
        return; // Short-circuit
    }

    run_test = function(data,error){
        if(error){
            util.lightbox.openError(window.translate('Error'), window.translate('Unable to get reservation status.'));
            window.logger.error(error);
            return; // Short-circuit
        }

        var reserved_info = data.reserved_remotely;
        if (reserved_info.reserved) {
            self.lightboxText = translate('This Axon chassis is currently reserved.<br/><br/>' +
                'User: {user}<br/>From: {from}<br/>Since: {since}<br/><br/>' +
                'Please wait for the chassis to become available before loading a test.<br><br>', {
                user: reserved_info.reserved_by,
                from: reserved_info.reserved_addr,
                since: reserved_info.reserved_since
            });
            util.lightbox.open({
                url: 'html/lightbox_tmpl',
                selector: '#lightbox-reserved-template',
                cancelSelector: '.ok-button',
                onOpenComplete: function () {
                    ko.applyBindings(self, document.getElementById('lightbox-message'));
                }
            });
            return; // Short-circuit
        }

        // Start the test
        self.showConfiguration();
        util.lightbox.working(new LightboxWorkingViewModel(translate("Start"), translate("Validating Test...")));
        self.hasResults(false);
        self.testResultsTemplateName("placeholder-template");
        self.vmResults.reset();

        setTimeout(function () { self.vmConfiguration.validate(function() {
            self.vmConfiguration.runTest();
        }) }, 1000);
    };

    util.get_chassis_reservationa_status(run_test);
};

TestViewModel.prototype.beginTesting = function () {
    var self = this;
    util.lightbox.close();
    self.isTestRunning(true);
    self.vmResults.status('running');
    self.vmResults.testCompleted(false);
    self.loadCharts();
};

TestViewModel.prototype.abortTestWithError = function (data) {
    var self = TestViewModel.typesafe(this);

    self.vmResults.status('aborted');
    util.applyFunction(self.vmResults.charts(), "dispose");
    self.showResults();

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

TestViewModel.prototype.getPlayerLayers = function(){
    var self = TestViewModel.typesafe(this);

    return self.vmConfiguration.getPlayerLayers();
};

TestViewModel.prototype.getTrackResultTypes = function(){
    var self = TestViewModel.typesafe(this);

    return self.vmConfiguration.getTrackResultTypes();
};

TestViewModel.prototype.getDynamicResultTypes = function(){
    var self = TestViewModel.typesafe(this);

    var dynamicResultTypes = new Array();
    var durationInMilliseconds = (self.vmConfiguration.duration()*60)*1000;
    var resultTypes = [
        null, // place holder so that array is now 1 based.
        {
            id: 1,
            name: translate('Total Bandwidth'),
            description: translate('Total Bandwidth'),
            url: '/ixia/get_result_series/1/1',
            frequency: 1000,
            yAxisLabel: "Mbps",
            duration: durationInMilliseconds
        },
        {
            id: 2,
            name: translate('Bandwidth'),
            description: translate('Bandwidth for Transport Data'),
            url: '/ixia/ixiat_result_series/2/1',
            frequency: 1000,
            yAxisLabel: translate("Mbps"),
            duration: durationInMilliseconds
        },
        {
            id: 3,
            name: translate('Packet Loss'),
            description: translate('Packet Loss for Transport Data'),
            url: '/ixia/get_result_series/2/2',
            frequency: 1000,
            yAxisLabel: translate("Packets"),
            duration: durationInMilliseconds
        },
        {
            id: 4,
            name: translate('Latency'),
            description: translate('Latency for Transport Data'),
            url: '/ixia/get_result_series/2/3',
            frequency: 1000,
            yAxisLabel: translate("Latency"),
            duration: durationInMilliseconds
        },
        {
            id: 5,
            name: translate('Jitter'),
            description: translate('Jitter for Transport Data'),
            url: '/ixia/get_result_series/2/4',
            frequency: 1000,
            yAxisLabel: translate("Jitter"),
            duration: durationInMilliseconds
        },
        {
            id: 6,
            name: translate('Bandwidth'),
            description: translate('Bandwidth for Application Data'),
            url: '/spirent/get_result_series/3/1',
            frequency: 1000,
            yAxisLabel: translate("Mbps"),
            duration: durationInMilliseconds
        },
        {
            id: 7,
            name: translate('Connections'),
            description: translate('Connections for Application Data'),
            url: '/ixia/get_result_series/3/2',
            frequency: 1000,
            yAxisLabel: translate("Connections per second"),
            duration: durationInMilliseconds
        },
        {
            id: 8,
            name: translate('Transactions'),
            description: translate('Transactions for Application Data'),
            url: '/ixia/get_result_series/3/3',
            frequency: 1000,
            yAxisLabel: translate("Transactions per second"),
            duration: durationInMilliseconds
        },
        {
            id: 9,
            name: translate('Response Time'),
            description: translate('Response Time for Application Data'),
            url: '/spirent/get_result_series/3/4',
            frequency: 1000,
            yAxisLabel: translate("Milliseconds"),
            duration: durationInMilliseconds
        },
        {
            id: 10,
            name: translate('Bandwidth'),
            description: translate('Bandwidth for Voice/Video Quality Data'),
            url: '/spirent/get_result_series/4/1',
            frequency: 1000,
            yAxisLabel: translate("Bandwidth"),
            duration: durationInMilliseconds
        },
        {
            id: 11,
            name: translate('Calls'),
            description: translate('Calls for Voice/Video Quality Data'),
            url: '/spirent/get_result_series/4/2',
            frequency: 1000,
            yAxisLabel: translate("Calls"),
            duration: durationInMilliseconds
        },
        {
            id: 12,
            name: translate('Video Connections'),
            description: translate('Video Connections for Voice/Video Quality Data'),
            url: '/spirent/get_result_series/4/3',
            frequency: 1000,
            yAxisLabel: translate("Connections"),
            duration: durationInMilliseconds
        },
        {
            id: 13,
            name: translate('Quality MOS Scores'),
            description: translate('Quality MOS Scores for Voice/Video Quality Data'),
            url: '/spirent/get_result_series/4/4',
            frequency: 1000,
            yAxisLabel: translate("MOS Score"),
            duration: durationInMilliseconds
        },
        {
            id: 14,
            name: translate('RTP Packet Loss'),
            description: translate('RTP Packet Loss for Voice/Video Quality Data'),
            url: '/spirent/get_result_series/4/5',
            frequency: 1000,
            yAxisLabel: translate("Packets"),
            duration: durationInMilliseconds
        },
        {
            id: 15,
            name: translate('Calls per Second'),
            description: translate('Calls per Second for Voice Quality Data'),
            url: '/spirent/get_result_series/5/1',
            frequency: 1000,
            yAxisLabel: translate("Calls/sec"),
            duration: durationInMilliseconds
        },
        {
            id: 16,
            name: translate('Total Calls'),
            description: translate('Total Calls for Voice Quality Data'),
            url: '/spirent/get_result_series/5/2',
            frequency: 1000,
            yAxisLabel: translate("Calls"),
            duration: durationInMilliseconds
        },
        {
            id: 17,
            name: translate('Quality MOS Scores'),
            description: translate('Quality MOS Scores for Voice Quality Data'),
            url: '/spirent/get_result_series/5/3',
            frequency: 1000,
            yAxisLabel: translate("MOS Score"),
            duration: durationInMilliseconds
        },
        {
            id: 18,
            name: translate('RTP Packet Loss'),
            description: translate('RTP Packet Loss for Voice Quality Data'),
            url: '/spirent/get_result_series/5/4',
            frequency: 1000,
            yAxisLabel: translate("Packets"),
            duration: durationInMilliseconds
        },
        {
            id: 19,
            name: translate('Video Connections'),
            description: translate('Video Connections for Video Quality Data'),
            url: '/spirent/get_result_series/6/1',
            frequency: 1000,
            yAxisLabel: translate("Connections"),
            duration: durationInMilliseconds
        },
        {
            id: 20,
            name: translate('Transactions'),
            description: translate('Transactions for Video Quality Data'),
            url: '/spirent/get_result_series/6/2',
            frequency: 1000,
            yAxisLabel: translate("Transactions"),
            duration: durationInMilliseconds
        },
        {
            id: 21,
            name: translate('Quality MOS Scores'),
            description: translate('Quality MOS Scores for Video Quality Data'),
            url: '/spirent/get_result_series/6/3',
            frequency: 1000,
            yAxisLabel: translate("MOS Score"),
            duration: durationInMilliseconds
        },
        {
            id: 22,
            name: translate('RTP Packet Loss'),
            description: translate('RTP Packet Loss for Video Quality Data'),
            url: '/spirent/get_result_series/6/4',
            frequency: 1000,
            yAxisLabel: translate("Packets"),
            duration: durationInMilliseconds
        }
    ];

    dynamicResultTypes[1] = resultTypes[1];

    var trackTypes = self.vmConfiguration.getTrackResultTypes();

    if (trackTypes.indexOf('DataTestResult') !== -1) { // if we *only* show data when a data specific player exists
        dynamicResultTypes[2] = resultTypes[2];
        dynamicResultTypes[3] = resultTypes[3];
        dynamicResultTypes[4] = resultTypes[4];
        dynamicResultTypes[5] = resultTypes[5];
    }

//    if (trackTypes.indexOf('VoiceTestResult') !== -1
//        || trackTypes.indexOf('VideoTestResult') !== -1) { // if we *only* show voice/video when a voice/video layer specific player exists
//        dynamicResultTypes[10] = resultTypes[10];
//        dynamicResultTypes[11] = resultTypes[11];
//        dynamicResultTypes[12] = resultTypes[12];
//        dynamicResultTypes[13] = resultTypes[13];
//        dynamicResultTypes[14] = resultTypes[14];
//    }

    if (trackTypes.indexOf('VoiceTestResult') !== -1) { // if we *only* show voice/video when a voice/video layer specific player exists
        dynamicResultTypes[15] = resultTypes[15];
        dynamicResultTypes[16] = resultTypes[16];
        dynamicResultTypes[17] = resultTypes[17];
        dynamicResultTypes[18] = resultTypes[18];
    }

    if (trackTypes.indexOf('VideoTestResult') !== -1) { // if we *only* show voice/video when a voice/video layer specific player exists
        dynamicResultTypes[19] = resultTypes[19];
        dynamicResultTypes[20] = resultTypes[20];
        dynamicResultTypes[21] = resultTypes[21];
        dynamicResultTypes[22] = resultTypes[22];
    }

    if (trackTypes.indexOf('ALPTestResult') !== -1
        || trackTypes.indexOf('RawSocketTestResult') !== -1
        || trackTypes.indexOf('DPGTestResult') !== -1) { // if we *only* show application when an application specific player exists
        dynamicResultTypes[6] = resultTypes[6];
        dynamicResultTypes[7] = resultTypes[7];
        dynamicResultTypes[8] = resultTypes[8];

        if (self.vmConfiguration.hasHTTPTrack()) {
            dynamicResultTypes[9] = resultTypes[9]; // Show response time
        }
    }

    return dynamicResultTypes;
};

TestViewModel.prototype.loadCharts = function () {
    var self = TestViewModel.typesafe(this),
        moduleName = self.vmConfiguration.module.split('.').pop(),
        resultsTemplateName = "results-chart-tmpl-" + moduleName;

    //TODO: Check Test Status and that polling Url exists.
    var trafficTotalLabel = self.vmConfiguration.getTotalTrafficLabel();
    self.vmConfiguration.result_types = self.getDynamicResultTypes();
    self.selectTab("results", function(){
        //Here is where we will kick off the graphs
        if(!self.vmConfiguration.result_types || self.vmConfiguration.result_types.length == 0)
            util.logData("There were no result types configured for test: " + self.vmConfiguration.name());
        else{
            var chartVms = new Array();
            for(var i = 0; i < 23; i++){
                var resultType = self.vmConfiguration.result_types[i];
                if (resultType == null || resultType == undefined) {
                    continue;
                }

//                var resultType = ko.utils.arrayFirst(self.rootVm.availableResultTypes, function(item){
//                    return item.id == self.vmConfiguration.result_types[i];
//                });

                if(resultType){
                    var chart = new Chart(resultType);
                    var table = new ResultsTable();
                    var chartPoller = new ChartPoller(
                        chart,
                        table,
                        {
                            pollDuration : (self.vmConfiguration.duration() * 60 * 1000),
                            pollFrequency : resultType.frequency,
                            url: resultType.url,
                            onFinish : function () {
                                self.isTestRunning(false);
                                self.vmResults.logToHistory()
                            }
                        },
                        self.vmResults);
                    chartVms[i] = new ChartViewModel(self.vmResults, { chart : chart, chartPoller : chartPoller, table : table });
                    chartVms[i].label(trafficTotalLabel);
                }else{
                    util.logData("Result Type for: " + self.vmConfiguration.result_types[i] + " was not found");
                }
            }
            self.vmResults.kickOffDisplayMessageRotation();
            self.vmResults.hydrate(chartVms);
        }

        self.testResultsTemplateName(resultsTemplateName);
    });
};

TestViewModel.prototype.getJsonConfiguration = function () {
    var self = TestViewModel.typesafe(this);

    return JSON.stringify(self.vmConfiguration.toJSON());
};

module.exports = TestViewModel;