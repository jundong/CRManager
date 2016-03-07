var domify = require('domify'),
    Selector = require('interface-selector'),
    Settings = require('./interface-settings.js'),
    template = domify(require('../templates/interfaces.js')),
    classes = require('classes'),
    event = require('event'),
    emitter = require('emitter'),
    lightbox = window.util.lightbox;

function render_interface(model, $el) {
    var classed = classes($el);

    if (model.enabled()) {
        classed.remove('streetwise');
        classed.remove('player');
        classed.add('flowmon');
    } else if (model.changed().allocated_to === 'flowmon') {
        // User stopped exporting on this port
        classed.remove('flowmon');
        classed.add('player');
    } else {
        classed.remove('flowmon');
        classed.add(model.changed().allocated_to);
    }


    if (model.available()) {
        classed.add('available');
    } else {
        classed.remove('available');
    }

    return $el;
}

function Interfaces(interfaces, visible) {
    this.models = Selector.sort(interfaces || []);
    this.visible = visible;
    this.selector = new Selector(this.models, render_interface);
    this.$el = template.cloneNode(true);
    this.views = [];
    this.strings = {
        "Select a port": window.translate("Choose the ports from which you want to generate NetFlow records. Connect each selected port to a SPAN or TAP port to enable capture of network data to generate NetFlow records."),
        "flowmon port overwrite confirmation": window.translate("Reallocating this port to Netflow will stop AxonPoint Server on this port.")
    };
}

emitter(Interfaces.prototype);

Interfaces.prototype.render = function () {
    var selector = this.selector,
        $selector = this.$el.querySelector('.selector'),
        $settings = this.$el.querySelector('.settings'),
        add = this.add.bind(this);

    selector.render();
    if (!$selector.contains(selector.$el)) {
        $selector.appendChild(selector.$el);
    }

    if (this.models.length) {
        $settings.innerHTML = '<p>' + this.strings["Select a port"] + '</p>';
    }

    this.models.forEach(function (iface, i) {
        add(iface, i);
    });

    this.bind();

    this.toggle(this.visible);

    return this.$el;
};

Interfaces.prototype.bind = function () {
    var views = this.views,
        selector = this.selector,
        select = this.select.bind(this),
        emit = this.emit.bind(this, 'changed');

    views.forEach(function (view) {
        view.on('changed', emit);
    }, this);

    selector.on('select', select);
};

Interfaces.prototype.toggle = function (visible) {
    if (visible) {
        classes(this.$el).remove('hidden');
    } else {
        classes(this.$el).add('hidden');
    }

    this.visible = visible;
};

Interfaces.prototype.add = function (iface, index) {
    var $settings = this.$el.querySelector('.settings'),
        view = new Settings(iface);

    if (isNaN(index)) {
        index = this.models.length;
    }

    view.render();
    view.hide();
    $settings.appendChild(view.$el);

    this.models[index] = iface;
    this.views[index] = view;
};

Interfaces.prototype.select = function (model) {
    var self = this,
        $message = self.$el.querySelector('.settings > p'),
        models = self.models,
        views = self.views,
        select_action = function () {
            // Hide "select a port" message
            if ($message) {
                $message.parentNode.removeChild($message);
            }

            views.forEach(function (view, i) {
                if (models[i].physical_port() === model.physical_port()) {
                    view.show();
                } else {
                    // Hide other views
                    view.hide();
                }
            }, this);
        };

    if(model.allocated_to() !== 'stc' && model.allocated_to() !== 'flowmon'){
        lightbox.confirmation_dialog(self,self.strings["flowmon port overwrite confirmation"],select_action);
        return;
    }

    select_action.call(self);
};

Interfaces.prototype.reset_interfaces = function (interfaces) {
    this.selector.unbind();
    this.selector.set_models(interfaces);
}

module.exports = Interfaces;