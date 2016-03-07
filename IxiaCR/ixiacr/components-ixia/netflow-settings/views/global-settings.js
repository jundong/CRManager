var domify = require('domify'),
    template = require('../templates/global-settings.js'),
    emitter = require('emitter'),
    event = require('event'),
    classes = require('classes'),
    validate = require('validate-form'),
    noop = function () {};

function GlobalSettings(model) {
    this.model = model;
    this.$el = domify(template);
    this.strings = {
        "netflow-v5": window.translate("Netflow v5"),
        "netflow-v9": window.translate("Netflow v9"),
        "ipfix": window.translate("IPFIX"),
        "Please enter a timeout in seconds": window.translate("Please enter a timeout in seconds")
    };
}

emitter(GlobalSettings.prototype);

GlobalSettings.prototype.setModel = function (model) {
    this.model = model;
};

GlobalSettings.prototype.render = function () {
    var protocols = this.model.protocol() || [],
        $active_timeout = this.$el.querySelector('#active_timeout'),
        $inactive_timeout = this.$el.querySelector('#inactive_timeout');

    this.insertProtocols(protocols);

    $active_timeout.value = this.model.active_timeout();
    $inactive_timeout.value = this.model.inactive_timeout();

    this.bind();

    this.toggle(this.model.is_enabled());

    return this.$el;
};

GlobalSettings.prototype.insertProtocols = function (protocols) {
    var $protocol = this.$el.querySelector('.protocol'),
        $option,
        strings = this.strings;

    protocols.forEach(function (protocol) {
        $option = document.createElement('option');
        $option.value = protocol.name;
        $option.innerHTML = strings[protocol.name];
        $option.selected = protocol.selected;
        if (protocol.selected) {
            // Hack to make the fancy dropdown work
            $protocol.parentNode.setAttribute('data-value', strings[protocol.name]);
        }
        $protocol.appendChild($option);

    });
};

GlobalSettings.prototype.bind = function () {
    var $protocol = this.$el.querySelector('.protocol'),
        $active_timeout = this.$el.querySelector('#active_timeout'),
        $inactive_timeout = this.$el.querySelector('#inactive_timeout');

    event.bind($protocol, 'change', this.protocolChanged.bind(this));
    event.bind($active_timeout, 'change', this.activeTimeoutChanged.bind(this));
    event.bind($inactive_timeout, 'change', this.inactiveTimeoutChanged.bind(this));
    this.bindValidator();
};

GlobalSettings.prototype.bindValidator = function () {
    this.validator = validate(this.$el)
        .on('blur')
        .field('active_timeout')
            .is('required', this.strings["Please enter a timeout in seconds"])
            .is(/^\d+$/, this.strings["Please enter a timeout in seconds"])
        .field('inactive_timeout')
            .is('required', this.strings["Please enter a timeout in seconds"])
            .is(/^\d+$/, this.strings["Please enter a timeout in seconds"]);
};

GlobalSettings.prototype.validate = function (success, fail) {
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

GlobalSettings.prototype.toggle = function (show) {
    show = show === undefined ? classes(this.$el).has('hidden') : show;

    if (show) {
        classes(this.$el).remove('hidden');
    } else {
        classes(this.$el).add('hidden');
    }
};

GlobalSettings.prototype.protocolChanged = function () {
    var $protocol = this.$el.querySelector('.protocol'),
        selected_index = $protocol.selectedIndex,
        protocols = this.model.protocol(),
        protocol = protocols[selected_index],
        strings = this.strings;

    $protocol.parentNode.setAttribute('data-value', strings[protocol.name]);

    protocols.forEach(function (protocol) {
        protocol.selected = false;
    });

    protocol.selected = true;

    this.model.protocol(protocols);
};

GlobalSettings.prototype.activeTimeoutChanged = function () {
    var timeout = +this.$el.querySelector('#active_timeout').value;

    this.model.active_timeout(timeout);
};

GlobalSettings.prototype.inactiveTimeoutChanged = function () {
    var timeout = +this.$el.querySelector('#inactive_timeout').value;

    this.model.inactive_timeout(timeout);
};

module.exports = GlobalSettings;