var domify = require('domify'),
    $template = domify(require('./template.js')),
    events = require('event'),
    classes = require('classes'),
    validate_form = require('validate-form'),
    is_ip = require('is-ip-address');

function NetworkSettings(model) {
    this.model = model;
    this.$el = $template.cloneNode(true);
    this.event_handlers = [];
    this.strings = {
        "Field is required": window.translate('Field is required'),
        "Field must be a number 1 to 4095": window.translate('Field must be a number 1 to 4095'),
        "Field must be an IPv4 address": window.translate("Field must be an IPv4 address"),
        "Field must be a number 0 to 32": window.translate("Field must be a number 0 to 32")
    };
}

NetworkSettings.prototype.set_model = function (model) {
    this.model = model;
};

NetworkSettings.prototype.render = function () {};

NetworkSettings.prototype.show = function () {
    classes(this.$el).remove('hidden');
};
NetworkSettings.prototype.hide = function () {
    classes(this.$el).add('hidden');
};

NetworkSettings.prototype.bind = function () {
    var $el = this.$el,
        model = this.model,
        $vlan = $el.querySelector('.vlan input'),
        $no_dhcp = $el.querySelector('.dhcp [value=false]'),
        $dhcp = $el.querySelector('.dhcp [value=true]'),
        $ip = $el.querySelector('.ip input'),
        $netmask = $el.querySelector('.netmask input'),
        $gateway = $el.querySelector('.gateway input');

    if (model) {
        this.event_handlers = [
            [$vlan, 'change', function (e) { model.vlan(e.target.value); }],
            [$no_dhcp, 'change', function (e) { var dhcp = !e.target.checked; model.dhcp(dhcp); }],
            [$dhcp, 'change', function (e) { var dhcp = e.target.checked; model.dhcp(dhcp); }],
            [$ip, 'change', function (e) { model.ip(e.target.value); }],
            [$netmask, 'change', function (e) { model.netmask(e.target.value); }],
            [$gateway, 'change', function (e) { model.gateway(e.target.value); }]
        ];

        // DOM -> Model
        this.event_handlers.forEach(function (handler) {
            events.bind(handler[0], handler[1], handler[2]);
        });

        // Model -> DOM
        $vlan.value = model.vlan();
        $no_dhcp.checked = !model.dhcp();
        $dhcp.checked = model.dhcp();
        $ip.value = model.ip();
        $netmask.value = model.netmask();
        $gateway.value = model.gateway();

        // Validation
        if (model.dhcp()) {
            this.bind_dhcp_validator();
        } else {
            this.bind_no_dhcp_validator();
        }
    }

    // DOM -> DOM
    this.toggle_static_fields($no_dhcp.checked);
    events.bind($no_dhcp, 'click', this.show_static_fields.bind(this));
    events.bind($dhcp, 'click', this.hide_static_fields.bind(this));

    // Change validator when change from no-DHCP to DHCP
    events.bind($no_dhcp, 'click', this.bind_no_dhcp_validator.bind(this));
    events.bind($dhcp, 'click', this.bind_dhcp_validator.bind(this));
};

function is_not_ipv6(val) {
    return -1 === val.indexOf(':');
}

function is_0_to_32(val) {
    return val >= 0 && val <= 32 && val.match(/\d+/);
}

function is_1_to_4095(val) {
    return val >= 1 && val <= 4095 && val.match(/\d+/);
}

NetworkSettings.prototype.bind_no_dhcp_validator = function () {
    this.validator = validate_form(this.$el)
        .use(is_ip)
        //.on('blur') - cannot bind onblur events, because switching from
        //              static to DHCP will still fire the validation on the
        //              static IP fields
        .field('vlan')
            .is(is_1_to_4095, this.strings["Field must be a number 1 to 4095"])

        .field('ip')
            .is('required', this.strings["Field is required"])
            .is('ip', this.strings["Field must be an IPv4 address"])
            .is(is_not_ipv6, this.strings["Field must be an IPv4 address"])

        .field('netmask')
            .is('required', this.strings["Field is required"])
            .is('ip', this.strings["Field must be an IPv4 address"])
            .is(is_not_ipv6, this.strings["Field must be an IPv4 address"])

        .field('gateway')
            .is('required', this.strings["Field is required"])
            .is('ip', this.strings["Field must be an IPv4 address"])
            .is(is_not_ipv6, this.strings["Field must be an IPv4 address"]);
};

NetworkSettings.prototype.bind_dhcp_validator = function () {
    this.validator = validate_form(this.$el)
        .field('vlan')
        .is(is_1_to_4095, this.strings["Field must be a number 1 to 4095"]);
};

NetworkSettings.prototype.unbind = function () {
    this.event_handlers.forEach(function (handler) {
        events.unbind(handler[0], handler[1], handler[2]);
    });
};

NetworkSettings.prototype.show_static_fields = function (e) {
    this.toggle_static_fields(true);
};

NetworkSettings.prototype.hide_static_fields = function (e) {
    this.toggle_static_fields(false);
};

NetworkSettings.prototype.toggle_static_fields = function (enabled) {
    var $static = this.$el.querySelectorAll('.static input');

    [].forEach.call($static, function ($el) {
        // Clear validation messages (for non-DHCP fields)
        if (!enabled) {
            window.util.clear_validation_messages($el);
        }

        $el.disabled = !enabled;
    });
};

NetworkSettings.prototype.validate = function (done) {
    done = done || function () {};

    this.validator.validate(function (err, valid) {
        if (err) {
            window.logger.error('Could not load Pulse', err);
            window.util.lightbox.openError(window.translate('Error'), window.translate('Unable to load Pulse'));
        }

        if (valid) {
            return done();
        }
    });
};

module.exports = NetworkSettings;