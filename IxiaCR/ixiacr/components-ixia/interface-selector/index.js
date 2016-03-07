var domify = require('domify'),
    template = require('./templates/template.js'),
    interface_template = require('./templates/interface.js'),
    Interface = require('interface-model'),
    emitter = require('emitter'),
    classes = require('classes'),
    event = require('event');

/**
 * @param interfaces ObservableArray or Array of Interfaces
 * @param render_interface delegate function called when an interface needs rendering
 * @constructor
 */
function InterfaceSelector(interfaces, render_interface) {
    if (interfaces.subscribe) {
        // interfaces is observable
        // interfaces.subscribe(this.update_interfaces.bind(this)); // Causes ENT-3611
        interfaces = interfaces();
    }
    this.set_models(interfaces);
    this.render_interface = typeof render_interface === 'function' ? render_interface : function () {};
    this.$el = domify(template);
    this.$interfaces = [];
    this.click_handlers = [];
    this.change_handlers = [];
    this.strings = {
        "No interfaces": window.translate("No interfaces")
    };
}

emitter(InterfaceSelector.prototype);

InterfaceSelector.sort = function (interfaces) {
    var ret = [],
        offset;

    interfaces.map(function (iface) {
        offset = iface.physical_port() - 1;
        ret[offset] = iface;
    });

    return ret;
};

InterfaceSelector.prototype.set_models = function (models) {
    // Convert "view-models" to Models
    models = models.map(function (iface) {
        if (iface.toFlatObject) {
            iface = Interface.from_device_view_model(iface);
        }
        return iface;
    });

    this.models = InterfaceSelector.sort(models) || [];

};

InterfaceSelector.prototype.render = function () {
    var $interface;

    this.$el.innerHTML = '';

    if (!this.models.length) {
        this.$el.innerHTML = this.strings["No interfaces"];
    }

    this.models.map(function (model, i) {
        $interface = domify(interface_template);
        this.render_interface(model, $interface, i);
        this.$el.appendChild($interface);
        this.$interfaces[i] = $interface;
    }, this);

    this.bind();

    return this.$el;
};

InterfaceSelector.prototype.bind = function () {
    var $interfaces = this.$interfaces,
        $interface,
        models = this.models,
        model,
        handler,
        redraw = this.render_interface;

    // DOM -> Model
    $interfaces.forEach(function ($interface, index) {
        model = models[index];

        handler = this.select.bind(this, model, false);
        this.click_handlers[index] = handler;

        if (model.available()) {
            event.bind($interface, 'click', handler);
        }
    }, this);

    // Model -> DOM
    this.models.forEach(function (model, index) {
        $interface = $interfaces[index];

        handler = redraw.bind(this, model, $interface, index);
        this.change_handlers[index] = handler;

        model.on('change', handler);
    }, this);
};

InterfaceSelector.prototype.unbind = function () {
    var $interfaces = this.$interfaces,
        $interface,
        models = this.models,
        model,
        handler,
        redraw = this.render_interface;

    // DOM -> Model
    $interfaces.forEach(function ($interface, index) {
        model = models[index];

        handler = this.click_handlers[index];
        event.unbind($interface, 'click', handler);

        delete this.click_handlers[index];
    }, this);

    // Model -> DOM
    this.models.forEach(function (model, index) {
        $interface = $interfaces[index];

        handler = this.change_handlers[index];
        model.off('change', handler);

        delete this.change_handlers[index];
    }, this);
};

InterfaceSelector.prototype.select = function (selected, silent) {
    var $interfaces = this.$interfaces,
        classed,
        index = -1;

    if (!selected || undefined === selected.physical_port()) {
        return;
    }

    this.models.forEach(function (model, i) {
        if (selected.physical_port() === model.physical_port()) {
            index = i;
        }
    });

    $interfaces.forEach(function ($interface, i) {
        classed = classes($interface);

        if (i === index) {
            classed.add('selected');
        } else {
            classed.remove('selected');
        }
    });

    if (!silent) {
        this.emit('select', selected, $interfaces[index], index);
    }
};

InterfaceSelector.prototype.update_interfaces = function (interfaces) {
    this.set_models(interfaces);
    this.render();
};

module.exports = InterfaceSelector;
