/**
 * Test library (lightbox)
 *
 * @param testVm TestViewModel
 * @constructor
 */
function LightboxViewModel(testVm){
    var self = this;

    self.testVm = testVm;
    self.rootVm = testVm.rootVm;
    self.showFavorites = ko.observable(false);
    self.availableTests = self.testVm.availableTests;
    self.categories = self.testVm.availableTestsByCategory;
    self.selectedCategoryName = ko.observable(self.categories.items()[0].key);
    self.selectedCategory = ko.observable(self.categories.items()[0].value); //nesting observables
    self.factorySelectedCategory = ko.computed(self.computeFactorySelectedCategory.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.userSelectedCategory = ko.computed(self.computeUserSelectedCategory.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.selectedTest = ko.observable(self.selectedCategory()().tests[0]);

    //self.factorySelectedTests = ko.computed(self.computeFactorySelectedTests.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    // self.userSelectedTests = ko.computed(self.computeUserSelectedTests.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.view = ko.observable("category");
    self.sidebarTab = ko.observable("standard");
    self.breadcrumb = ko.computed(self.getBreadcrumb.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });
    self.selectedCategory.subscribe(self.onSelectedCategoryChanged.bind(self));
    self.syncFlags = self.rootVm.syncFlags;
}

LightboxViewModel.typesafe = function (that) {
    if (!(that instanceof LightboxViewModel)) {
        throw 'This method must be executed on a LightboxViewModel';
    }

    return that;
};

LightboxViewModel.prototype.computeFactorySelectedCategory = function(){
    var self = LightboxViewModel.typesafe(this);
    var filter = function (item) {
        return (item.isFactoryTest && !item.isUserSave);
    };
    return ko.utils.arrayFilter(self.selectedCategory()().tests, filter);
};

LightboxViewModel.prototype.computeUserSelectedCategory = function(){
    var self = LightboxViewModel.typesafe(this);
    var filter = function (item) {
        return item.isUserSave && (item.favorite() || !self.showFavorites());
    };
    if (self.selectedCategory()().categoryName == "Questionnaire") {
        var tmpls = self.factorySelectedCategory();
        var module_filter = function (item) {
            return filter(item) && ko.utils.arrayFirst(tmpls, function (test) {
                return test.module == item.module;
            });
        }
        return ko.utils.arrayFilter(self.availableTests(), module_filter);
    } else {
        return ko.utils.arrayFilter(self.selectedCategory()().tests, filter);
    }
};

LightboxViewModel.prototype.getBreadcrumb = function(){
    var self = LightboxViewModel.typesafe(this);

    return {
        testTypes : translate("Test Types"),
        category : self.selectedCategoryName(),
        test : self.selectedTest().name(),
        lightboxVM : self
    };
};

LightboxViewModel.prototype.onSelectedCategoryChanged = function(newValue){
    var self = LightboxViewModel.typesafe(this);

    if (self.sidebarTab().indexOf("standard") != -1) {
        for (var i = 0; i < self.selectedCategory()().tests.length; i++) {
            if (self.selectedCategory()().tests[i].isTemplate()) {
                self.selectedTest(self.selectedCategory()().tests[i]);
                break;
            }
        }
    } else {
        for (var i = 0; i < self.selectedCategory()().tests.length; i++) {
            if (self.selectedCategory()().tests[i].isUserSave) {
                self.selectedTest(self.selectedCategory()().tests[i]);
                break;
            }
        }
    }
};

LightboxViewModel.prototype.showType = function(){
    var self = LightboxViewModel.typesafe(this);
    self.view("category");
};

LightboxViewModel.prototype.showCategory = function(item){
    var self = LightboxViewModel.typesafe(this);

    self.selectedCategory(item.value);
    self.selectedCategoryName(item.value().categoryName);

    self.view("test");
};

LightboxViewModel.prototype.closeTestSelection = function(){
    var self = LightboxViewModel.typesafe(this);

    util.lightbox.close();
};

LightboxViewModel.prototype.categoryBreadCrumbClick= function(obj, event){
    var self = LightboxViewModel.typesafe(this);
    var $this = $(event.target);
    var category = ko.utils.arrayFirst(self.categories.items(), function (item) { return $this.html() == item.key(); })
    if(category) self.showCategory(category);
    else event.stopPropagation();
};

LightboxViewModel.prototype.showTest = function(test){
    var self = LightboxViewModel.typesafe(this);
    self.selectedTest(test);
};

LightboxViewModel.prototype.sidebarTabClick = function(tab){
    var self = LightboxViewModel.typesafe(this);
    var testList = $(".test-list-container .test-list");
    
    testList.parent().parent().hide(); //back out to scroll panel root
    testList.filter("." + tab).parent().parent().show(); //show tab
    testList.scroller("update"); //manually update
    $(".category-sidebar .tabs .tab").removeClass("selected");
    $(".category-sidebar .tabs .tab." + tab).addClass("selected");
    //Update the selected tab
    self.sidebarTab(tab)
    //Sync more user tests
    self.syncMoreUserTests();
};

LightboxViewModel.prototype.syncMoreUserTests = function() {
    var self = LightboxViewModel.typesafe(this),
        category,
        filters = [];
    for (var i = 0; i < self.factorySelectedCategory().length; i++) {
        var tmpl = self.factorySelectedCategory()[i];
        category = tmpl.categories()[0].type;
        if (ko.utils.arrayFirst(self.syncFlags(), function (filter) {
            return (filter.category == category);
        }) != null) return;

        filters.push(tmpl.module);
    }
    self.syncFlags.push({category: category, filters: filters});
    $.when(self.rootVm.getAvailableTests({'filters': filters})
        .done(function () {
            var item = ko.utils.arrayFirst(self.categories.items(), function (item) {
                return (item.key() == category);
            });
            self.selectedCategory(item.value);
            self.selectedCategoryName(item.value().categoryName);
        })
        .fail(function () {
            self.rootVm.updateAppLoadMessage(self.ajaxModels[4], true);
        })
    );
};
/**
 * Load a test template into the traffic player
 *
 * @param test TestTemplateViewModel
 */
LightboxViewModel.prototype.loadTest = function(test){
    var self = LightboxViewModel.typesafe(this);
    self.closeTestSelection();
    self.testVm.loadTest(test);
};

LightboxViewModel.prototype.test =function(){

};

function LightboxWorkingViewModel(action, presentTense, progress, subText){
    var self = this;

    if(action == null) action = translate('Work');
    if(presentTense == null) presentTense = translate('Working...');

    self.action = action;
    self.presentTense = presentTense;
    self.status = ko.observable('working');
    self.progress = progress;
    self.actionText = ko.computed(self.computedActionTextRead.bind(self));
    self.subText = subText;
    self.showClose = ko.computed(self.computedShowCloseRead.bind(self));
    self.close = ko.observable(util.lightbox.close.bind(util.lightbox));
};

LightboxWorkingViewModel.typesafe = function (that) {
    if (!(that instanceof LightboxWorkingViewModel))
        throw 'This method must be executed on a LightboxWorkingViewModel';
    return that;
};

LightboxWorkingViewModel.prototype.computedActionTextRead = function(){
    var self = LightboxWorkingViewModel.typesafe(this);
    if(self.status() == 'success')
        return translate("{action} Successful!", {
            action: self.action
        });
    if(self.status() == 'error')
        return translate("{action} Failed", {
            action: self.action
        });
    else
        return self.presentTense;
};

LightboxWorkingViewModel.prototype.computedShowCloseRead = function(){
    var self = LightboxWorkingViewModel.typesafe(this);
    return self.status() == 'success' || self.status() == 'error';
};