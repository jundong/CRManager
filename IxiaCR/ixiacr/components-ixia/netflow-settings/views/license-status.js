var domify = require('domify'),
    template = require('../templates/license-status.js');

function LicenseStatus() {
    this.$el = domify(template);
}

LicenseStatus.prototype.render = function () {
    return this.$el;
};

module.exports = LicenseStatus;