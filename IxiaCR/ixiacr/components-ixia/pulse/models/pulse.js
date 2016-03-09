var model = require('model'),
    request = require('superagent'),
    no_cache = require('superagent-no-cache'),
    PulseInterfaceModel = require('./interface.js');

var PulseModel = model('PulseModel')
    .route('/ixia/pulse')
    .attr("status")
    .attr("license_status")
    .attr("interfaces");

PulseModel.get = function (done) {
    var model = new PulseModel();

    request.get(this.url())
        .use(no_cache)
        .end(function (error, response) {
            var data;

            if (error || !response.ok || response.body.result === 'FAILURE') {
                return done(error || response.error.message || response.response.body.messages);
            }

            data = response.body;

            // Inflate interface models
            data.interfaces.forEach(function (iface, i) {
                data.interfaces[i] = new PulseInterfaceModel(iface);
            });

            // Safely update the model with properties from REST API
            for (var key in data) {
                if (typeof model[key] === 'function') {
                    model[key](data[key]);
                }
            }

            return done(null, model);
        });

    return model;
};

PulseModel.prototype.enabled = function() {
    return 'enabled' === this.status();
};

PulseModel.prototype.disabled = function() {
    return 'disabled' === this.status();
};

module.exports = PulseModel;