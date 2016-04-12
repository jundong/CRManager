var Paginator = require('paginator');

function DashboardViewModel(rootVm) {
    var self = this;
    self.rootVm = rootVm;

    self.portlets = ko.observableArray();
    self.leftPortlets = ko.observableArray();
    self.rightPortlets = ko.observableArray();

    self.enterpriseTests = ko.observableArray();
    self.rootVm.enterpriseTests.subscribe(function () {
        self.enterpriseTests(self.rootVm.enterpriseTests());
    });
    self.hostTests = ko.observableArray();
    self.rootVm.hostTests.subscribe(function () {
        self.hostTests(self.rootVm.hostTests());
    });
    self.testResultsHistory = ko.observableArray();
    self.totalHistoryResults = ko.observable(0);

    self.getPortlets = function () {
        self.portlets.removeAll();

        $.ajax({
            type: "GET",
            url: util.getConfigSetting("get_portlets"),
            dataType: 'json',
            success: function (data, textStatus, jqXhr) {
                var portlets = data;

                for (var i = 0; i < portlets.length; i++) {
                    var portlet = new PortletViewModel(self);
                    portlet.inflate(portlets[i]);
                    self.portlets.push(portlet);

                    if (portlets[i].default_column == '.l-portlet-column') {
                        self.leftPortlets.push(portlet);
                    } else if (portlets[i].default_column == '.r-portlet-column') {
                        self.rightPortlets.push(portlet);
                    }
                }
            }
        });

    };

    self.initializeTwitterPortlets = function () {
        $(".tweet").each(function () {
            $(this).tweet({
                username: $(this).attr('data-twitter-username'),
                join_text: "auto",
                avatar_size: 32,
                count: 5,
                template: "{avatar}{time}<br>{text}",   // [string or function] template used to construct each tweet <li> - see code for available vars
                auto_join_text_default: null,
                auto_join_text_ed: null,
                auto_join_text_ing: null,
                auto_join_text_reply: null,
                auto_join_text_url: null,
                loading_text: translate("Loading tweets...")
            });
        });
    };

    self.initializeHotPotter = function () {
        $('.get-started-image').hotspotter({ imgTopMargin: 50 });
        for (var i = 0; i < self.rootVm.availableDevices().length; i++) {
            $('#' + self.rootVm.availableDevices()[i].name()).on('click',function(e){
                var currDevice = self.rootVm.availableDevices().filter(function (device) {
                        return device.name() === e.srcElement.id;
                    })[0];

                window.open(currDevice.link());
            });
        }
    };

    self.getPortlets();
}

function PortletViewModel(dashboardVm) {
    var self = this;
    self.dashboardVm = dashboardVm;
    self.rootVm = dashboardVm.rootVm;

    self.id = ko.observable();
    self.name = ko.observable();
    self.contentType = ko.observable();
    self.portletContent = ko.observable();
    self.defaultColumn = ko.observable();
    self.templateId = ko.observable();
    self.selectedFilter = ko.observable();
    self.availableFilters = ko.observableArray();
    self.testResultsHistory = self.dashboardVm.testResultsHistory;

    self.enterpriseTests = ko.observableArray(self.dashboardVm.enterpriseTests());
    self.dashboardVm.enterpriseTests.subscribe(function () {
        self.enterpriseTests(self.dashboardVm.enterpriseTests());
    });
    self.hostTests = ko.observableArray(self.dashboardVm.hostTests());
    self.dashboardVm.hostTests.subscribe(function () {
        self.hostTests(self.dashboardVm.hostTests());
    });

    self.inflate = function (portlet) {
        self.id(portlet.id);
        self.name(portlet.name);
        self.contentType(portlet.content_type);
        self.portletContent(portlet.portlet_content);
        self.defaultColumn(portlet.default_column);
        self.templateId(portlet.div_id_name);

        self.handleSpecialCases();
    };

    self.handleSpecialCases = function () {
        switch (self.name()) {
            case 'Recent Results':
                self.selectedFilter('All Statuses');
                break;
        }
    };

    self.filteredRecentTests = ko.computed(function () {
        var selectedFilter = self.selectedFilter(); //86400000 = 1 day in milliseconds
        var filteredResults = self.testResultsHistory();
        var oldestDate = new Date();

        oldestDate.setTime(oldestDate.getTime() - (86400000 * 30)); // 30 days ago


        filteredResults = self.rootVm.vmHistory.applyDateGreaterThanFilter(oldestDate, filteredResults);
        if (selectedFilter == translate('All Statuses') || selectedFilter == undefined) {
            return filteredResults;
        }

        return self.rootVm.vmHistory.applyStatusFilter(selectedFilter, filteredResults);
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

}

module.exports = DashboardViewModel;