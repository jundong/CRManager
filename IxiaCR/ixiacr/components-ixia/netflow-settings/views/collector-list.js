var domify = require('domify'),
    template = require('../templates/collector-list.js'),
    Model = require('../models/collector.js'),
    Subview = require('./collector.js'),
    event = require('event'),
    emitter = require('emitter'),
    classes = require('classes');

function CollectorList(collectors) {
    this.models = collectors || [];
    this.$collectors = [];
    this.views = [];
    this.$el = domify(template);
    this.strings = {
        'No collectors': window.translate('No collectors')
    };
}

emitter(CollectorList.prototype);

CollectorList.prototype.render = function () {
    var add = this.add.bind(this),
        $li;

    if (this.models.length) {
        this.models.forEach(add);
    } else {
        this.addEmptyMessage();
    }

    return this.$el;
};

CollectorList.prototype.add = function (model, index) {
    var $parent = this.$el,
        $li = document.createElement('li'),
        view,
        $view,
        bind_item = this.bindItem.bind(this),
        $empty_message = this.$el.querySelector('.empty-message');

    if ($empty_message) {
        this.$el.removeChild($empty_message);
    }

    if (isNaN(index)) {
        index = this.models.length;
    }

    if (model instanceof Model) {
        model.id(index); // "save" this model, so it's not discarded when editor is canceled
    } else {
        // Model was probably an Event, so create a new model
        model = new Model({});
    }

    view = new Subview(model, model.isNew());
    this.models[index] = model;
    this.$collectors[index] = $li;
    this.views[index] = view;

    $view = view.render();
    $li.appendChild($view);
    $parent.appendChild($li);

    bind_item(index, $li, view);
};

CollectorList.prototype.bindItem = function (index, $el, view, rebind) {
    var emit = this.emit.bind(this),
        remove = this.remove.bind(this),
        models = this.models;

    if (rebind) {
        view.off('mode_changed');
        view.off('saved');
        view.off('removed');
    }

    view.on('mode_changed', function () {
        // Redraw <li></li>
        $el.innerHTML = '';
        $el.appendChild(view.$el);
    });

    view.on('saved', function (model) {
        model.id(index); // "save" this model, so it's not discared when editor is canceled
        emit('changed', models);
    });

    view.on('removed', function () {
        remove(index);
        emit('changed', models);
    });
};


CollectorList.prototype.remove = function (index) {
    var $el = this.$collectors[index],
        view;

    this.$el.removeChild($el);
    this.models.splice(index, 1);
    this.$collectors.splice(index, 1);
    this.views.splice(index, 1);

    // Re-bind proceeding elements
    for (index; index < this.views.length; index += 1) {
        view = this.views[index];
        $el = this.$collectors[index];
        this.bindItem(index, $el, view, true);
    }

    if (!this.models.length) {
        this.addEmptyMessage();
    }
};

CollectorList.prototype.addEmptyMessage = function () {
    var $li = document.createElement('li');

    $li.innerHTML = this.strings['No collectors'];
    classes($li).add('italic');
    classes($li).add('empty-message');
    this.$el.appendChild($li);
};

module.exports = CollectorList;