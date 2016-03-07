var domify = require('domify'),
    template = require('../templates/interface/settings.js'),
    CollectorModel = require('../models/collector.js'),
    List = require('./collector-list.js'),
    classes = require('classes'),
    event = require('event'),
    emitter = require('emitter');

function InterfaceSettings(model) {
    var collectors = model.collectors() || [];

    this.model = model;
    this.$el = domify(template);

    // Convert objects to Models
    collectors.forEach(function (collector, i) {
        collectors[i] = new CollectorModel(collector);
    });
    this.collectors = new List(collectors);

    this.strings = {
        "Export this interface's traffic": window.translate("Export this interface's traffic")
    };
}

emitter(InterfaceSettings.prototype);

InterfaceSettings.prototype.render = function () {
    var $checkbox = this.$el.querySelector('.export input'),
        $collectors = this.$el.querySelector('.collectors'),
        collectors = this.collectors,
        enabled = this.model.enabled();

    collectors.render();
    $collectors.appendChild(collectors.$el);
    $checkbox.checked = enabled;

    this.enable(enabled);

    this.bind();

    return this.$el;
};

InterfaceSettings.prototype.show = function () {
    classes(this.$el).remove('hidden');
};

InterfaceSettings.prototype.hide = function () {
    classes(this.$el).add('hidden');
};

InterfaceSettings.prototype.is_visible = function () {
    return !classes(this.$el).has('hidden');
};

InterfaceSettings.prototype.bind = function () {
    var $checkbox = this.$el.querySelector('.export input'),
        $add = this.$el.querySelector('.add-collector'),
        enable = this.enable.bind(this),
        changed = function (e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }

            var state = $checkbox.checked;
            enable(state);
        },
        collectors = this.collectors,
        add = function (e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }

            collectors.add();
        };

    event.bind($checkbox, 'change', changed.bind(this));
    event.bind($add, 'click', add);
};

InterfaceSettings.prototype.setInterface = function (iface) {
    this.model = iface;
};

InterfaceSettings.prototype.enable = function (enabled) {
    var $collectors = this.$el.querySelector('.collectors'),
        $add = this.$el.querySelector('.add-collector');

    this.model.enabled(enabled);

    if (enabled) {
        classes($collectors).remove('hidden');
        classes($add).remove('hidden');
    } else {
        classes($collectors).add('hidden');
        classes($add).add('hidden');
    }
};

module.exports = InterfaceSettings;