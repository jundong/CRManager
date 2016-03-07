var validate = require('validate-form'),
    is_ip = require('is-ip-address');

// Validation functions
function greater_than(limit) {
    return function (subject) { return subject > limit; };
}

function less_than(limit) {
    return function (subject) { return subject < limit; };
}

function less_than_or_equal(limit) {
    return function (subject) { return subject <= limit; };
}

/**
 * Binds a validator to an endpoint DOM node - multicast or unicast
 * @constructor
 */
function EndpointValidator() {
    this.$view = undefined;
    this.validator = undefined;
    this.strings = {
        "Field is required": window.translate("Field is required"),
        "Must be less than 4,096": window.translate("Must be less than 4,096"),
        "Must be an IP address": window.translate("Must be an IP address"),
        "Must be greater than 0": window.translate("Must be greater than 0"),
        "Must be less than 128": window.translate("Must be less than 128"),
        "Must be less than or equal to 512": window.translate("Must be less than or equal to 512"),
        "Must be an integer": window.translate("Must be an integer")
    };
}

/**
 * @param $view DOM element containing endpoint form
 * @param dhcp Using DHCP?
 */
EndpointValidator.prototype.bind = function ($view, dhcp) {
    this.$view = $view;

    this.unbind();

    if (dhcp) {
        this.bindDHCPValidator();
    } else {
        this.bindStaticIPValidator();
    }
};

EndpointValidator.prototype.unbind = function () {
    delete this.validator;
};

EndpointValidator.prototype.bindStaticIPValidator = function () {
    this.validator = validate(this.$view)
        .use(is_ip)
        .on('blur')
        .field('vlan_id')
            .is(/^\d+$/, this.strings["Must be an integer"])
            .is(greater_than(0), this.strings["Must be greater than 0"])
            .is(less_than(Math.pow(2, 12)), this.strings["Must be less than 4,096"])
        .field('starting_ip')
            .is('required', this.strings["Field is required"])
            .is('ip', this.strings["Must be an IP address"])
        .field('ending_ip')
            .is('ip', this.strings["Must be an IP address"])
        .field('prefix')
            .is('required', this.strings["Field is required"])
            .is(greater_than(0), this.strings["Must be greater than 0"])
            .is(less_than(128), this.strings["Must be less than 128"])
        .field('gateway')
            .is('required', this.strings["Field is required"])
            .is('ip', this.strings["Must be an IP address"]);
};

EndpointValidator.prototype.bindDHCPValidator = function () {
    this.validator = validate(this.$view)
        .use(is_ip)
        .on('blur')
        .field('vlan_id')
            .is(/^\d+$/, this.strings["Must be an integer"])
            .is(greater_than(0), this.strings["Must be greater than 0"])
            .is(less_than(Math.pow(2, 12)), this.strings["Must be less than 4,096"])
        .field('dhcp_hosts')
            .is('required', this.strings["Field is required"])
            .is(/^\d+$/, this.strings["Must be an integer"])
            .is(greater_than(0), this.strings["Must be greater than 0"])
            .is(less_than_or_equal(512), this.strings["Must be less than or equal to 512"]);
};

/**
 *
 * @param result {ValidationResultsViewModel|callback}
 * @param targetName optional if using callback for first parameter
 */
EndpointValidator.prototype.validate = function (result, targetName) {
    this.validator.validate(function (err, valid) {
        if (!valid) {
            if( result instanceof ValidationResultsViewModel ){
                var message = window.translate('{name} endpoint is invalid', {name: targetName});
                result.addCheckResults(message, false, message);
            }
        }
        else if (!(result instanceof ValidationResultsViewModel) && typeof result === 'function') {
            result(err, valid);
        }
    });
};


module.exports = EndpointValidator;