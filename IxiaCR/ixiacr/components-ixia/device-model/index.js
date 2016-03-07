var noop = function () {},
    DeviceModelError = require('./error.js'),
    request = require('superagent'),
    no_cache = require('superagent-no-cache'),
    status_url = require('utility-functions').getConfigSetting("devices_status"),
    model = require('model'),
    defaults = require('model-defaults'),
    devices = [],
    DeviceModel = model('DeviceModel')
        .use(defaults)
        .route(status_url)
        .attr('id');

DeviceModel.primaryKey = "id";

function factory(id) {
    if (devices[id]) {
        return devices[id]; // Short-circuit
    }

    var device = new DeviceModel();
    device.id(id);
    device.last_updated = null;
    devices[id] = device;

    return device;
}

DeviceModel.prototype.get = function (callback) {
    callback = callback || noop;

    var self = this;

    function handle(err, response) {
        var error,
            device;

        if (err || 'FAILURE' === response.body.result) {
            error = new DeviceModelError('Error getting status for device ' + self.id() + ': ' + (err || JSON.stringify(response)));
            callback(error);
            return; // Short-circuit
        }

        device = response.body[0];

        self.set(device);
        self.last_updated = new Date();

        callback(null, device);
    }

    request.get(self.url(self.id()))
        .use(no_cache)
        .end(handle);
};

DeviceModel.url = function (path) {
    var url = this._base;
    if (undefined === path) return url;

    if (!isNaN(path)) {
        return url + '?device_ids[]=' + path;
    }

    return url + '/' + path;
};


// Export a facade
module.exports = {
    factory: factory
};
