/*global ko:true */

var domify = require('domify'),
    template = domify(require('./template.js')),
    validate = require('validate-form'),
    is_ip = require('is-ip-address'),
    classes = require('classes'),
    IP = require('ip');

/**
 * View model for multicast settings
 *
 * @constructor
 */
function MulticastSettingsViewModel() {
    var self = this;

    self.strings = {
        "Select one": window.translate("Select one"),
        "IGMP v2": window.translate("IGMP v2"),
        "IGMP v3": window.translate("IGMP v3"),
        "MLD v1": window.translate("MLD v1"),
        "MLD v2": window.translate("MLD v2"),
        "Field is required": window.translate("Field is required"),
        "Must be an IP address": window.translate("Must be an IP address"),
        "axon.multicast.settings.invalid": window.translate("Must be in ranges 225.0.0.0 to 239.255.255.255 or ff00:: to ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff"),
        "axon.multicast.settings.reserved": window.translate("IP cannot be in a reserved range: ff01:: to ff01::2:fff, ff02:: to ff02::2:fff, and ff05:: to ff05::2:fff"),
        "IPv4 or v6": window.translate("IPv4 or v6")
    };

    self.available_protocols = {
        "IGMP_V2": self.strings["IGMP v2"],
        "IGMP_V3": self.strings["IGMP v3"],
        "MLD_V1": self.strings["MLD v1"],
        "MLD_V2": self.strings["MLD v2"]
    };

    self.protocolOptions = Object.keys(self.available_protocols).map(function (value) {
        return {value: value, text: self.available_protocols[value]};
    });

    self.ip = ko.observable();
    self.end_ip = ko.observable();
    self.protocol = ko.observable();

    self.$el = undefined; // See render()
    self.validator = undefined; // See bind()
}

MulticastSettingsViewModel.prototype.inflate = function (data) {
    data = data || {};

    this.ip(data.ip);
    this.end_ip(data.end_ip);
    this.protocol(data.protocol);
};

/**
 * Called by knockout "render" binding - see custom-binding-handlers.js
 */
MulticastSettingsViewModel.prototype.render = function () {
    this.$el = template.cloneNode(true);

    ko.applyBindings(this, this.$el);

    this.bind();

    return this.$el;
};

function mark_invalid($el, message) {
    if (classes($el.parentNode).has('light-select')) {
        // $el is a fancy select box nested inside of a div, so use the parent div
        $el = $el.parentNode;
    }

    var $old = $el.parentNode.querySelectorAll('label.validator-message'),
        $message = document.createElement('label');

    // Remove old validation messages
    [].forEach.call($old, function ($el) {
        $el.parentNode.removeChild($el);
    });

    // Add new message
    classes($message).add('validator-message');
    $message.textContent = message;
    $el.parentNode.appendChild($message);

    classes($el).add('invalid');
}

function within_valid_range(val) {
    var min,
        max;

    val = new IP(val);

    if (val.version() === 4) {
        min = new IP('225.0.0.0');
        max = new IP('239.255.255.255');
        return val.greaterOrEqual(min) && val.lessOrEqual(max);
    }

    // IPv6
    min = new IP('ff00::0');
    max = new IP('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
    return val.greaterOrEqual(min) && val.lessOrEqual(max);
}

function not_reserved(val) {
    var is_reserved,
        min,
        max;

    val = new IP(val);

    if (val.version() !== 6) {
        // Only IPv6 have reserved ranges
        return true; // Short-circuit
    }

    // Ensure it's not in a reserved range
    is_reserved = ['ff01', 'ff02', 'ff05'].some(function (prefix) {
        min = new IP(prefix + '::0');
        max = new IP(prefix + '::2:ffff');

        return val.greaterOrEqual(min) && val.lessOrEqual(max);
    });

    return !is_reserved;
}

MulticastSettingsViewModel.prototype.bind = function () {
    this.validator = validate(this.$el)
        .invalid(mark_invalid)
        .use(is_ip)
        .on('blur')
        .field('ip')
            .is('required', this.strings["Field is required"])
            .is('ip', this.strings["Must be an IP address"])
            .is(within_valid_range, this.strings["axon.multicast.settings.invalid"])
            .is(not_reserved, this.strings["axon.multicast.settings.reserved"])
        .field('end_ip')
            .is('ip', this.strings["Must be an IP address"])
            .is(within_valid_range, this.strings["axon.multicast.settings.invalid"])
            .is(not_reserved, this.strings["axon.multicast.settings.reserved"])
        .field('protocol')
            .is('required', this.strings["Field is required"]);
};

MulticastSettingsViewModel.prototype.clone = function () {
    return new MulticastSettingsViewModel(this.rootVm, this.data);
};

/**
 * @param result ValidationResultsViewModel
 * @param targetName context used in validation lightbox. e.g. "Tx ..."
 * @returns ValidationResultsViewModel
 */
MulticastSettingsViewModel.prototype.validate = function (result, targetName) {
    this.validator.validate(function (err, valid) {
        if (!valid) {
            var message = window.translate("{name} are invalid", {
                name: targetName
            });
            result.addCheckResults(message, false, message);
        }
    });
};

MulticastSettingsViewModel.prototype.toFlatObject = function () {
    return {
        ip: this.ip() || '',
        end_ip: this.end_ip() || '',
        protocol: this.protocol() || ''
    };
};

module.exports = MulticastSettingsViewModel;