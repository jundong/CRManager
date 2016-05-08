var moment = require('moment');

function TestHistoryViewModel(dashboardVm) {
    var self = this;
    self.dashboardVm = dashboardVm;
    self.rootVm = dashboardVm.rootVm;

    self.id = ko.observable();
    self.name = ko.observable();
    self.result_id = ko.observable();
    self.test_id = ko.observable();
    self.created_by = ko.observable();
    self.progress = ko.observable();
    self.result_path = ko.observable();
    self.end_result = ko.observable();
    self.error_reason = ko.observable();
    self.date = ko.observable();

    self.dateFormatted = ko.computed(function () {
        var d = self.date();

        if (!d) {
            return '';
        }

        return moment(d).format('lll');
    });

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

TestHistoryViewModel.prototype.toFlatObject = function () {
    var self = TestHistoryViewModel.typesafe(this);

    var history = {
        id: self.id(),
        name: self.name(),
        result_id: self.result_id(),
        test_id: self.test_id(),
        created_by: self.created_by(),
        date: self.date(),
        progress: self.progress(),
        end_result: self.end_result(),
        result_path: self.result_path(),
        error_reason: self.error_reason()
    };

    return history;
};

TestHistoryViewModel.prototype.inflate = function (recentTest) {
    var self = TestHistoryViewModel.typesafe(this);

    self.id(recentTest.id);
    self.name(recentTest.name);
    self.result_id(recentTest.result_id);
    self.test_id(recentTest.test_id);
    self.created_by(recentTest.created_by);
    self.date(recentTest.date);
    self.progress(recentTest.progress);
    self.end_result(recentTest.end_result);
    self.result_path(recentTest.result_path);
    self.error_reason(recentTest.error_reason);
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
};

TestHistoryViewModel.prototype.save = function () {
    var self = TestHistoryViewModel.typesafe(this);
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

module.exports = TestHistoryViewModel;