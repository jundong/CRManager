var is_ip_address = require('is-ip-address').validate,
    tlds = require('./tlds.js');

function is_hostname(str) {
    var labels = str.split('.').slice(0, -1),
        tld = str.split('.').slice(-1)[0],
        valid_label = new RegExp("^[a-z0-9]?[a-z0-9-]*[a-z0-9]$");

    if (tld === '') {
        // Don't allow trailing '.', because this format is mostly only used in zone files
        return false;
    }

    if (str.length > 253) {
        return false;
    }

    if (tld !== 'local' && tlds.indexOf(tld) === -1) {
        // Not a valid TLD
        return false;
    }

    for (var i = 0; i < labels.length; i++) {
        var label = labels[i];

        if (label.length < 1 || label.length > 63) {
            return false;
        }

        if (!valid_label.test(label)) {
            // Must be alphanumeric with hyphens only in the middle
            return false;
        }
    }

    return true;
}

module.exports = function (validator) {
    validator.validators.host = module.exports.validate;
};

module.exports.validate = function (string) {
    return is_ip_address(string) || is_hostname(string);
};

//var tests = [
//    ["a.com", true], // gTLD
//    ["a.cc", true], // ccTLD
//    ["a.local", true], // Special TLD
//    ["a", false], // No TLD
//    ["a.a.a.a", false], // Invalid TLD
//    ["192.168.1.1", true], // v4
//    ["ff::1", true], // v6
//    ["192.", false],
//    ["ff:", false]
//];
//
//tests.forEach(function (test) {
//    var str = test[0],
//        expected = test[1];
//
//    if (module.exports.validate(str) !== expected) {
//        console.error('Expected', str, 'to be', expected ? 'valid' : 'invalid');
//    }
//});