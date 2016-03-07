var emitter = require('emitter'),
    event = require('event'),
    classes = require('classes'),
    InterfaceSelector = require('interface-selector'),
    FilterChooser = require('capture-filter-chooser'),
    ViewDelegate = require('./delegates/recorder-view.js'),
    EditDelegate = require('./delegates/recorder-edit.js'),
    HistoryDelegate = require('./delegates/recorder-history.js');

function render_interface(selected_models, model, $interface) {
    var classed = classes($interface);

    classed.add('available');

    classed.remove('selected');
    selected_models.forEach(function (selected) {
        if (model.physical_port() === selected.physical_port()) {
            classed.add('selected');
        }
    });
}

function Recorder(model, ports_observable) {
    this.model = model;
    this.interface_selector = new InterfaceSelector(ports_observable, render_interface.bind(this, model.interfaces())); // Maybe we should pass InterfaceSelector into the constructor to avoid cross-cutting?
    this.filter_chooser = new FilterChooser(model.filter());
    this.edit_delegate = new EditDelegate(this);
    this.view_delegate = new ViewDelegate(this);
    this.history_delegate = new HistoryDelegate(this);
}

emitter(Recorder.prototype);

Recorder.prototype.render = function () {
    var model = this.model;

    if (model.isNew()) {
        this.edit();
    } else {
        this.view();
    }

    this.bind();

    return this.$el;
};

Recorder.prototype.bind = function () {
    var view = this.view.bind(this),
        destroy = this.destroy.bind(this);

    // Model -> DOM
    this.model.on('change filter', this.filter_chooser.set.bind(this.filter_chooser));
    this.model.on('save', view);
    this.model.on('destroy', destroy);

    // View -> model
    this.filter_chooser.on('select', this.model.filter.bind(this.model));
    this.interface_selector.on('select', this.model.interface.bind(this.model));
    this.view_delegate.on('destroy', this.model.destroy.bind(this.model));

    // View -> view
    this.filter_chooser.on('select', this.filter_chooser.hide.bind(this.filter_chooser));
    this.edit_delegate.on('done', this.save.bind(this));
    this.edit_delegate.on('destroy', destroy); // Only unsaved captures can be edited, so don't need to worry about destroying the model
    this.view_delegate.on('history', this.history.bind(this));
    this.history_delegate.on('done', view);

    // Debugging
//    this.model.on('change', console.log.bind(console, 'changed: '));
};

Recorder.prototype.edit = function (e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }

    var $el = this.edit_delegate.render();
    this.replace_in_parent($el);
    this.$el = $el;
    return this.$el;
};

Recorder.prototype.view = function (e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }

    var $el = this.view_delegate.render();
    this.replace_in_parent($el);
    this.$el = $el;
    return this.$el;
};

Recorder.prototype.history = function (e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }

    var $el = this.history_delegate.render();
    this.replace_in_parent($el);
    this.$el = $el;
    return this.$el;
};

Recorder.prototype.save = function (e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }

    this.model.save();
};

Recorder.prototype.destroy = function (e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }

    if (this.$el.parentNode) {
        this.$el.parentNode.removeChild(this.$el);
    }
};

Recorder.prototype.replace_in_parent = function ($new) {
    // If this.$el has been inserted into the DOM, simply assigning a new
    // value to this.$el will not update the DOM.

    if (this.$el && this.$el.parentNode) {
        this.$el.parentNode.replaceChild($new, this.$el);
    }
};

module.exports = Recorder;