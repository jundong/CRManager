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

TestTemplateViewModel.prototype.save = function (options) {
    var self = TestTemplateViewModel.typesafe(this);
};

TestTemplateViewModel.prototype.toFlatObject = function(){
    var self = TestTemplateViewModel.typesafe(this);
    var flatTemplate = {
        id: self.id(),
        name: self.name,
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