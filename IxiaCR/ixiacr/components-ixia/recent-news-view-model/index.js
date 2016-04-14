var moment = require('moment');

function RecentNewsViewModel(rootVm) {
    var self = this;
    self.dashboardVm = rootVm.vmDashboard;
    self.rootVm = rootVm;

    self.id = ko.observable();
    self.title = ko.observable();
    self.date = ko.observable();
    self.dateFormatted = ko.computed(function () {
        var d = self.date();
        if (!d) {
            return '';
        }

        return moment(d).format('lll');
    });
    self.link = ko.observable();
    self.description = ko.observable();
    self.priority = ko.observable();

    self.loadRecentTest = function () {
        self.rootVm.loadRecentTest(self);
    };
};

RecentNewsViewModel.typesafe = function (that) {
    if (!(that instanceof RecentNewsViewModel)) {
        throw 'This method must be executed on a RecentNewsViewModel';
    }

    return that;
};

RecentNewsViewModel.prototype.toFlatObject = function () {
    var self = RecentNewsViewModel.typesafe(this);

    var news = {
        id: self.id(),
        title: self.title(),
        description: self.description(),
        date: self.date(),
        link: self.link(),
        priority: self.priority()
    };

    return news;
};

RecentNewsViewModel.prototype.inflate = function (news) {
    var self = RecentNewsViewModel.typesafe(this);

    var thisDate = news.date+" UTC";
    thisDate = thisDate.replace(/-/g,"/");
    thisDate = new Date(thisDate).format('yyyy-MM-dd HH:mm:ss');
    thisDate = String(thisDate);

    self.id(news.id);
    self.title(news.title);
    self.date(thisDate);
    self.description(news.description);
    self.link(news.link);
    self.priority(news.priority);
};

RecentNewsViewModel.prototype.openSaveModal = function () {
    var self = RecentNewsViewModel.typesafe(this);
};

RecentNewsViewModel.prototype.save = function () {
    var self = RecentNewsViewModel.typesafe(this);

    var title = self.title();
    var workingVm = new LightboxWorkingViewModel(translate('Save'), translate('Saving...'));
    util.lightbox.close();
    util.lightbox.working(workingVm);
    var data = self.toFlatObject();
    $.ajax({
        type: util.getRequestMethod('save_news'),
        url: util.getConfigSetting('save_news'),
        data: util.formatRequestData('save_news', data),
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

RecentNewsViewModel.prototype.matchesSearch = function (searchString) {
    var self = RecentNewsViewModel.typesafe(this);

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

RecentNewsViewModel.prototype.delete = function () {
    var self = RecentNewsViewModel.typesafe(this);

    var workingVm = new LightboxWorkingViewModel(translate('Delete'), translate('Deleting...'));
    util.lightbox.close();
    util.lightbox.working(workingVm);
    $.ajax({
        type: util.getRequestMethod('delete_news'),
        url: util.getConfigSetting('delete_news'),
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

module.exports = RecentNewsViewModel;