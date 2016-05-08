/**
 * Saved configuration for a single test
 *
 * @param rootVm IxiaCRViewModel
 * @constructor
 */
function TestTemplateViewModel(rootVm) {
    var self = this;
    self.rootVm = rootVm;
    self.vmDashboard = rootVm.vmDashboard;

    self.id = ko.observable();
    self.name = ko.observable();
    self.bpt_name = ko.observable();
    self.type = ko.observable();
    self.description = ko.observable();
    self.duration = ko.observable();
    self.topology_image = ko.observable();
    self.topology_description = ko.observable();
    self.attack_task = ko.observable();
    self.attack_steps = ko.observable();
    self.attack_criteria = ko.observable();
    self.defense_task = ko.observable();
    self.defense_steps = ko.observable();
    self.defense_criteria = ko.observable();
    self.traffic_direction = ko.observable();
    self.test_result_id = ko.observable(null);

    //IDLE, RUNNING, STOPPED, ABORTED, FINISHED
    self.status = ko.observable("IDLE");
    self.hasResults = ko.observable(false);
    self.result_id = undefined; //this is used to tell if the template is correct for a test result which the test is created using user saved test
}

TestTemplateViewModel.typesafe = function (that) {
    if (!(that instanceof TestTemplateViewModel)) {
        throw 'This method must be executed on a TestTemplateViewModel';
    }

    return that;
};

TestTemplateViewModel.prototype.matchesSearch = function (searchString) {
    var self = TestTemplateViewModel.typesafe(this);

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

TestTemplateViewModel.prototype.openSaveModal = function () {
    var self = TestTemplateViewModel.typesafe(this),
        refreshDraggables = false;

    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-save-test-alternate-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function(){
            ko.applyBindings(self, document.getElementById('lightbox-save-test-alternate'));
        },
        onClose: function(){
            if (self.name() === '') {
                refreshDraggables = true;
            }
        }
    });
};

TestTemplateViewModel.prototype.inflate = function (flatTest) {
    var self = TestTemplateViewModel.typesafe(this);

    self.id(flatTest.id);
    self.name(flatTest.name);
    self.type(flatTest.type);
    self.description(flatTest.description);
    //self.duration(flatTest.duration);
    self.topology_image(flatTest.topology_image);
    self.bpt_name(flatTest.bpt_name);
    self.topology_description(flatTest.topology_description);
    self.attack_task(flatTest.attack_task);
    self.attack_steps(flatTest.attack_steps);
    self.attack_criteria(flatTest.attack_criteria);
    self.defense_task(flatTest.defense_task);
    self.defense_steps(flatTest.defense_steps);
    self.defense_criteria(flatTest.defense_criteria);
    self.traffic_direction(flatTest.traffic_direction);

    //util.setObservableArray(self.name, flatTest.name);
    //util.setObservableArray(self.name, flatTest.name);
    //util.setObservableArray(self.namename, []);
};

TestTemplateViewModel.prototype.getNormalizedFlatObject = function (flatObject) {
    var self = ConfiguredTestViewModel.typesafe(this);

    flatObject.name = null;
    flatObject.description = null;
    flatObject.customer = null;
    flatObject.company = null;
    flatObject.location = null;
    flatObject.favorite = null;
    flatObject.tags = null;

    return flatObject;
};

TestTemplateViewModel.prototype.save = function (options) {
    var self = TestTemplateViewModel.typesafe(this);
};

TestTemplateViewModel.prototype.getRunTestData = function () {
    var self = TestTemplateViewModel.typesafe(this);
    var bpsDevice = ko.utils.arrayFirst(self.rootVm.availableDevices(), function (item) {
            return (item.name() === "BPS");
        });
    var data = {
        id: self.id(),
        name: self.name,
        bpt_name: self.bpt_name,
        host: bpsDevice.host,
        username: bpsDevice.username,
        test_result_id: self.test_result_id,
        password: bpsDevice.password
    };

    return data;
};

TestTemplateViewModel.prototype.runTest = function (options) {
    if (this instanceof TestTemplateViewModel) {
        var self = TestTemplateViewModel.typesafe(this);
    } else {
        var self = TestTemplateViewModel.typesafe(this.selectedTest());
    }

    if (self.status() == "RUNNING") {
        return; // Short-circuit
    }
    self.status("RUNNING");
    var currentConfig = self.getRunTestData();
    var formatRequestData = util.formatRequestData('run_test', currentConfig);
    self.startingTest = true;
    util.lightbox.working(new LightboxWorkingViewModel(translate("Start"), translate("Validating Test...")));
    $.ajax({
        type: util.getRequestMethod('run_test'),
        url: util.getConfigSetting('run_test'),
        data: formatRequestData,
        dataType: 'json',
        success: function(data, textStatus, jqXhr){
            self.status("FINISHED");
            if(util.lightbox.isOpen) {
                util.lightbox.close();
            }
            self.test_result_id = data['test_result_id'];
            self.startingTest = false;

            //If we have results, we should show the results table
            self.rootVm.getResultHistory({"result_id" : self.test_result_id},function(){});
        }
    }).fail(function () {
        self.status("ERROR");
        logger.error('Validation failed due to HTTP error');
        util.lightbox.error(translate("Validating test"));
        self.startingTest = false;
    });
    //self.status("RUNNING");
    if(util.lightbox.isOpen) {
        util.lightbox.close();
    }
    //util.lightbox.working(new LightboxWorkingViewModel(translate("Start"), translate("Validating Test...")));
};

TestTemplateViewModel.prototype.cancelTest = function (options) {
    if (this instanceof TestTemplateViewModel) {
        var self = TestTemplateViewModel.typesafe(this);
    } else {
        var self = TestTemplateViewModel.typesafe(this.selectedTest());
    }

    if (self.status() != "RUNNING") {
        return; // Short-circuit
    }
    if (self.test_result_id == null) {
        self.status("STOPPED");
        return;
    }
    self.status("STOPPED");
    var currentConfig = self.getRunTestData();
    var formatRequestData = util.formatRequestData('cancel_test', currentConfig);

    $.ajax({
        type: util.getRequestMethod('cancel_test'),
        url: util.getConfigSetting('cancel_test'),
        data: formatRequestData,
        dataType: 'json',
        success: function(data, textStatus, jqXhr){
            self.status("STOPPED");
            self.startingTest = false;
        }
    }).fail(function () {
        self.status("ERROR");
        logger.error('Validation failed due to HTTP error');
        util.lightbox.error(translate("Validating test"));
        self.startingTest = false;
    });
};

TestTemplateViewModel.prototype.downloadReports = function (options) {
    if (this instanceof TestTemplateViewModel) {
        var self = TestTemplateViewModel.typesafe(this);
    } else {
        var self = TestTemplateViewModel.typesafe(this.selectedTest());
    }

    var max_result_id = 0;
    var result_path = null;
    for (var i = 0; i < self.rootVm.testResultsHistory().length; i++) {
        if (self.rootVm.testResultsHistory()[i].result_id() > max_result_id) {
            if (self.rootVm.testResultsHistory()[i].end_result != 'RUNNING' && self.rootVm.testResultsHistory()[i].result_path() != '') {
                max_result_id = self.rootVm.testResultsHistory()[i].result_id();
                result_path  = self.rootVm.testResultsHistory()[i].result_path();
            }
        }
    }

//    if (result_path != null) {
//        $.ajax({
//            type: util.getRequestMethod('cancel_test'),
//            url: util.getConfigSetting('cancel_test'),
//            data: ko.toJSON({'result_path': result_path}),
//            dataType: 'json',
//            success: function(data, textStatus, jqXhr){
//            }
//        }).fail(function () {
//        });
//    }
};

TestTemplateViewModel.prototype.toFlatObject = function(){
    var self = TestTemplateViewModel.typesafe(this);
    var flatTemplate = {
        id: self.id(),
        name: self.name,
        bpt_name: self.bpt_name,
        type: self.type(),
        description: self.description(),
        topology_image: self.topology_image(),
        topology_description: self.topology_description(),
        attack_task: self.attack_task(),
        attack_steps: self.attack_steps(),
        attack_criteria: self.attack_criteria(),
        defense_task: self.defense_task(),
        defense_steps: self.defense_steps(),
        defense_criteria: self.defense_criteria(),
        traffic_direction: self.traffic_direction()
    };

    return flatTemplate;
};

TestTemplateViewModel.prototype.clone = function(){
    var self = TestTemplateViewModel.typesafe(this);

    var newTest = new TestTemplateViewModel(self.rootVm);

    newTest.id(self.id);
    newTest.name(self.id);
    newTest.bpt_name(self.bpt_name);
    newTest.type(self.id);
    newTest.description(self.id);
    //newTest.duration(self.id);
    newTest.topology_image(self.topology_image);
    newTest.topology_description(self.topology_description);
    newTest.attack_task(self.attack_task);
    newTest.attack_steps(self.attack_steps);
    newTest.attack_criteria(self.attack_criteria);
    newTest.defense_task(self.defense_task);
    newTest.defense_steps(self.defense_steps);
    newTest.defense_criteria(self.defense_criteria);
    newTest.traffic_direction(self.traffic_direction);

    return newTest;
};

module.exports = TestTemplateViewModel;