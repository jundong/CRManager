var moment = require('moment');

function TestHistoryViewModel(dashboardVm) {
    var self = this;
    self.dashboardVm = dashboardVm;
    self.rootVm = dashboardVm.rootVm;

    self.result_id = ko.observable();
    self.test_id = 0;
    self.name = ko.observable();
    self.date = ko.observable();
    self.dateFormatted = ko.computed(function () {
        var d = self.date();

        if (!d) {
            return '';
        }

        return moment(d).format('lll');
    });
    self.description = ko.observable();
    self.endResult = ko.observable();
    self.displayMessage = ko.observable();
    self.categories = ko.observableArray();
    self.template_name = ko.observable();
    self.customer = ko.observable();
    self.location = ko.observable();
    self.favorite = ko.observable(false);
    self.tags = ko.observableArray();
    self.unqualifiedTags = ko.observable();
    self.validationResult = ko.observable();

    self.displayTags = ko.computed({
        read: self.displayTagsRead.bind(self),
        write: self.displayTagsWrite.bind(self)
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.loadRecentTest = function () {
        self.rootVm.loadRecentTest(self);
    };
};

TestHistoryViewModel.typesafe = function (that) {
    if (!(that instanceof TestHistoryViewModel)) {
        throw 'This method must be executed on a TestHistoryViewModel';
    }

    return that;
};

TestHistoryViewModel.prototype.setState = function(testVm){
    var self = TestHistoryViewModel.typesafe(this);

    self.endResult(testVm.vmResults.status());
    self.displayMessage(testVm.vmResults.displayMessage());
    self.test_id = testVm.vmConfiguration.id();
    self.name(testVm.name());
    self.template_name(testVm.vmConfiguration.template_name());
    var date = new Date();
    self.date((date.getMonth()+1) + '/' + date.getDate() + '/' + date.getFullYear());
    self.description(testVm.description());

    var categories = testVm.vmConfiguration.categories();
    for (var i = 0; i < categories.length; i++) {
        self.categories.push(categories[i]);
    }
    self.chartData = new Array();
    self.tableData = new Array();
    var charts = testVm.vmResults.charts();
    for(var chartIndex = 0; chartIndex < charts.length; chartIndex++){
        if(charts[chartIndex]){
            self.chartData.push({ name: charts[chartIndex].chart().name, series: charts[chartIndex].chart().series() });
            self.tableData.push(charts[chartIndex].table().data());
        }
    }
};

TestHistoryViewModel.prototype.toFlatObject = function () {
    var self = TestHistoryViewModel.typesafe(this);

    var history = {
        result_id: self.result_id(),
        test_id: self.test_id,
        name: self.name(),
        description: self.description(),
        date: self.date,
        end_result: self.endResult(),
        display_message: self.displayMessage(),
        tags: util.getTags(self),
        categories: new Array(),
        template_name: self.template_name()
    };

    var categories = self.categories();
    for (var i = 0; i < categories.length; i++) {
        history.categories.push(categories[i]);
    }

    return history;
};

TestHistoryViewModel.prototype.inflate = function (recentTest) {
    var self = TestHistoryViewModel.typesafe(this);

    var thisDate = recentTest.date+" UTC";
    thisDate = thisDate.replace(/-/g,"/");
    thisDate = new Date(thisDate).format('yyyy-MM-dd HH:mm:ss');
    thisDate = String(thisDate);

    self.result_id(recentTest.result_id);
    self.test_id = recentTest.test_id;
    self.name(recentTest.name);
    self.date(thisDate);
    self.description(recentTest.description);
    self.endResult(recentTest.end_result);
    self.displayMessage(recentTest.display_message);
    self.categories(recentTest.categories);
    self.template_name(recentTest.template_name);
    util.setTags(self, recentTest.tags);
};

TestHistoryViewModel.prototype.openSaveModal = function () {
    var self = TestHistoryViewModel.typesafe(this);

    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-save-results-template',
        cancelSelector: '.cancel-button',
        isModal: true,
        onOpenComplete: function(){
            ko.applyBindings(self, document.getElementById('lightbox-save-results'));
        }
    });
};

TestHistoryViewModel.prototype.validate = function (result, targetName) {
    var self = TestHistoryViewModel.typesafe(this);

    if(util.isNullOrEmpty(targetName))
        result.addCheckResults(translate("Test Results Validation"), false, translate("The name field is required in order to save your test results"));
    else{
        var foundExisting = ko.utils.arrayFirst(self.rootVm.testResultsHistory, function (item) {
            return targetName == item.name();
        });

        if(foundExisting)
            result.addCheckResults(translate("Test Results Validation"), false, translate('The name: {name} is already in use, please set a unique name for this test result', {
                target: targetName
            }));
    }
};

TestHistoryViewModel.prototype.save = function () {
    var self = TestHistoryViewModel.typesafe(this);

    var name = self.name();
    self.unqualifiedTags(self.tags().join(', '));
    var validationResult = new ValidationResultsViewModel(self);
    self.validate(validationResult, name);
    self.validationResult(validationResult);
    if(!validationResult.is_valid){
        return;
    }

    self.rootVm.testResultsHistory.push(self);

    var workingVm = new LightboxWorkingViewModel(translate('Save'), translate('Saving...'));
    util.lightbox.close();
    util.lightbox.working(workingVm);
    var data = self.toFlatObject();
    $.ajax({
        type: util.getRequestMethod('save_result'),
        url: util.getConfigSetting('save_result'),
        data: util.formatRequestData('save_result', data),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            workingVm.status('success');
        },
        error: function (jqXhr, textStatus, errorThrown) {
            workingVm.status('error');
        }
    });

    util.lightbox.close();
};

TestHistoryViewModel.prototype.matchesSearch = function (searchString) {
    var self = TestHistoryViewModel.typesafe(this);

    var searchTerms = searchString.split(' ');

    if (searchTerms.length == 0) {
        return true;
    }

    var name = self.name().toUpperCase();

    for (var i = 0; i < searchTerms.length; i++) {
        if (searchTerms[i] == '' || searchTerms[i] == null) {
            continue;
        }

        if (name.indexOf(searchTerms[i].toUpperCase()) == -1) {
            return false;
        }
    }

    return true;
};

TestHistoryViewModel.prototype.delete = function () {
    var self = TestHistoryViewModel.typesafe(this);

    var workingVm = new LightboxWorkingViewModel(translate('Delete'), translate('Deleting...'));
    util.lightbox.close();
    util.lightbox.working(workingVm);
    $.ajax({
        type: util.getRequestMethod('delete_result'),
        url: util.getConfigSetting('delete_result'),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            workingVm.status('success');
        },
        error: function (jqXhr, textStatus, errorThrown) {
            workingVm.status('error');
        }
    });

    util.lightbox.close();
};

TestHistoryViewModel.prototype.displayTagsRead = function () {
    var self = TestHistoryViewModel.typesafe(this);

    if (!self.unqualifiedTags()) {
        self.unqualifiedTags(self.tags().join(', '));
    }
    return util.sanitizeUnqualifiedTagGroup(self.unqualifiedTags());
};

TestHistoryViewModel.prototype.displayTagsWrite = function (value) {
    var self = TestHistoryViewModel.typesafe(this);

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
    }
    self.unqualifiedTags(util.sanitizeUnqualifiedTagGroup(value));
    self.unqualifiedTags.valueHasMutated();
};

module.exports = TestHistoryViewModel;