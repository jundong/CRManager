var model = require('model'),
    defaults = require('model-defaults');

var NetflowSettings = model('NetflowSettings')
//    .route('http://johntron.apiary.io/flowmon')
    .route('/ixia/flowmon')
    .use(defaults)
    .attr('status')
    .attr('license_status')
    .attr('protocol', {"default": []})
    .attr('active_timeout', {"default": 1800})
    .attr('inactive_timeout', {"default": 15})
    .attr('interfaces', {"default": []});

NetflowSettings.prototype.toggle = function (state) {
    state = state ? 'enabled' : 'disabled';
    this.status(state);
};

NetflowSettings.prototype.is_enabled = function () {
    return 'enabled' === this.status();
};

NetflowSettings.prototype.is_exporting = function () {
    var interfaces_enabled = false;

    this.interfaces().map(function (iface) {
        if ('flowmon' === iface.allocated_to && iface.enabled) {
            interfaces_enabled = true;
        }
    });
    return this.is_enabled() && interfaces_enabled;
};

module.exports = NetflowSettings;