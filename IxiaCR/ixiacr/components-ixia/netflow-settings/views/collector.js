var domify = require('domify'),
    view_template = require('../templates/collector.js'),
    edit_template = require('../templates/collector-editor.js'),
    event = require('event'),
    emitter = require('emitter'),
    validate = require('validate-form'),
    is_host = require('is-host'),
    noop = function () {};

function Collector(model, editing) {
    this.model = model;
    this.editing = editing || false;
    this.$view = domify(view_template);
    this.$edit = domify(edit_template);
    this.strings = {
        "Please enter a valid host address (IPv4, IPv6, or name)": window.translate("Please enter a valid host address (IPv4, IPv6, or name)"),
        "Please enter a valid port number": window.translate("Please enter a valid port number"),
        "Port must be less than 65535": window.translate("Port must be less than 65535")
    };
}

emitter(Collector.prototype);

Collector.prototype.view = function () {
    var $el = this.$view,
        $address = $el.querySelector('.address'),
        $port = $el.querySelector('.port'),
        model = this.model;

    $address.innerHTML = model.address();
    $port.innerHTML = model.port();

    this.$el = $el;

    if (this.editing) {
        this.emit('mode_changed', 'view');
        this.editing = false;
    }

    return $el;
};

Collector.prototype.edit = function () {
    var model = this.model,
        $el = this.$edit,
        $address = $el.querySelector('[name=address]'),
        $port = $el.querySelector('[name=port]');

    $address.value = model.address();
    $port.value = model.port();

    this.$el = $el;

    if (!this.editing) {
        this.emit('mode_changed', 'edit');
        this.editing = true;
    }

    return $el;
};

Collector.prototype.save = function () {
    var model = this.model,
        $el = this.$edit,
        address = $el.querySelector('[name=address]').value,
        port = $el.querySelector('[name=port]').value;

    model.address(address);
    model.port(port);

    this.emit('saved', model);
    this.view();
};

Collector.prototype.remove = function () {
    var old = this.model;

    this.model.destroy();
    this.emit('removed', old);
};


Collector.prototype.render = function () {
    var $el;

    this.bind();

    if (this.editing) {
        $el = this.edit();
    } else {
        $el = this.view();
    }

    return $el;
};

Collector.prototype.bind = function () {
    // View-mode
    var $view = this.$view,
        $edit_trigger = $view.querySelector('.edit'),
        $delete = $view.querySelector('.delete'),

    // Edit-mode
        $edit = this.$edit,
        $cancel = $edit.querySelector('.cancel'),
        $save = $edit.querySelector('.save'),
        cancel = function () {
            if (this.model.isNew()) {
                this.remove();
            } else {
                this.view();
            }
        }.bind(this),
        save = this.save.bind(this);

    // View-mode
    event.bind($edit_trigger, 'click', this.edit.bind(this));
    event.bind($delete, 'click', this.remove.bind(this));

    // Edit-mode
    event.bind($cancel, 'click', cancel);
    event.bind($save, 'click', this.validate.bind(this, save, noop));

    this.bindValidator();
};

Collector.prototype.bindValidator = function () {
    var less_than_65535 = function (val) {
            return val < 65535;
        };

    this.validator = validate(this.$edit)
        .on('blur')
        .use(is_host)
        .field('address')
            .is('required', this.strings["Please enter a valid host address (IPv4, IPv6, or name)"])
            .is('host', this.strings["Please enter a valid host address (IPv4, IPv6, or name)"])
        .field('port')
            .is('required', this.strings["Please enter a valid port number"])
            .is(/^\d+$/, this.strings["Please enter a valid port number"])
            .is(less_than_65535, this.strings["Port must be less than 65535"]);
};

Collector.prototype.validate = function (success, fail, e) {
    if (e.preventDefault) {
        e.preventDefault();
    }

    success = success || noop;
    fail = fail || noop;

    this.validator.validate(function (err, is_valid, msg) {
        if (is_valid) {
            success();
        } else {
            fail(err);
        }
    });
};

module.exports = Collector;