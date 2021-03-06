/**
 * Implements the delegated behavior of the traffic player.
 * See parent, TestViewModel.
 */

var domify = require('domify'),
    template = domify(require('../templates/header.js')),
    ko = window.ko,
    util = require('utility-functions');

function PlayerTestViewModelDelegate() {
    this.parent = undefined;
    this.$el = undefined;
}

PlayerTestViewModelDelegate.prototype.setParent = function (parent) {
    this.parent = parent;
};

PlayerTestViewModelDelegate.prototype.canRenderTab = function (tab_name) {
    return 'test' === tab_name;
};

PlayerTestViewModelDelegate.prototype.render = function () {
    this.$el = template.cloneNode(true);

    ko.applyBindings(this.parent, this.$el);

    return this.$el;
};

PlayerTestViewModelDelegate.prototype.validate = function (result) {
    return result;
};

PlayerTestViewModelDelegate.prototype.loadTest = function(testConfiguration, testEvent) {
    var self = this;
    self.executeLoadTest(testConfiguration);
};

PlayerTestViewModelDelegate.prototype.executeLoadTest = function(testConfiguration) {
    var self = this;
    var callback = function () {
        self.parent.selectTab('testLibrary');
    }.bind(self);

    self.parent.ensureUnreservedOrFail(callback);
};

PlayerTestViewModelDelegate.prototype.openTestCreationLightbox = function() {
    var complete = function(){
            var lightboxViewModel = new LightboxViewModel(this.parent);
            ko.applyBindings(lightboxViewModel, document.getElementById("lightbox"));
        }.bind(this);

    this.parent.ensureUnreservedOrFail(function() {
        util.lightbox.open({
            url : "html/lightbox_tmpl",
            selector : "#lightbox-create-test-tmpl",
            cancelSelector: ".cancel-button",
            onOpenComplete: complete
        });
    })
};

PlayerTestViewModelDelegate.prototype.closeTestEditor = function () {
    // Not used
};

PlayerTestViewModelDelegate.prototype.openSaveModal = function() {
    var complete = function(){
            this.parent.startState = {
                name: this.parent.name()
            };
            ko.applyBindings(this.parent, document.getElementById('lightbox-save-test'));
        }.bind(this),
        close = function(){
            if (this.parent.name() === '' || this.parent.name() != this.parent.startState.name) {
                this.parent.name(this.parent.startState.name);
            }
            this.parent.preValidationResult(null);
        }.bind(this);

    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-save-test-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: complete,
        onClose: close
    });
};

PlayerTestViewModelDelegate.prototype.afterRender = function () {
    var self = this,
        selected_tab = self.parent.rootVm.selectedTab(),
        $parent = document.querySelector('.' + selected_tab),
        $header;


    self.render();

    // Remove existing HTML from .test-controller
    $header = $parent.querySelector('.test-controller');
    while ($header.firstChild) {
        $header.removeChild($header.firstChild);
    }

    // Append new header delegate view
    $header.appendChild(self.$el);
}

module.exports = PlayerTestViewModelDelegate;