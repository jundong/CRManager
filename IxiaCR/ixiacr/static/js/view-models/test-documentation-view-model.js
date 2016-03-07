function TestDocumentationViewModel(testVm) {
    var self = this;
    self.testVm = testVm;
    self.rootVm = testVm.rootVm;

    self.name = ko.observable();
    self.categories = ko.observable();
    self.description = ko.observable();
    self.id = ko.observable();
    self.isFactoryTest = ko.observable();
    self.diagram = null;
}

TestDocumentationViewModel.typesafe = function (that) {
    if (!(that instanceof TestDocumentationViewModel)) {
        throw 'This method must be executed on a TestDocumentationViewModel';
    }

    return that;
};

TestDocumentationViewModel.prototype.loadTest = function (testVm) {
    var self = TestDocumentationViewModel.typesafe(this);

    self.name(testVm.name());

    var category_names = [];
    var categories = testVm.categories();
    for (var i = 0; i < categories.length; i++) {
        category_names[i] = categories[i].name;
    }
    self.categories(category_names.join(', '));
    self.description(testVm.description());
    self.id(testVm.id());
    self.isFactoryTest(testVm.isFactoryTest);
    self.diagram = testVm.diagram;
};
