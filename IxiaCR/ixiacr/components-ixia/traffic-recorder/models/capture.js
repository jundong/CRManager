var model = require('model'),
    request = require('superagent'),
    no_cache = require('superagent-no-cache'),
    emitter = require('emitter'),
    noop = function () {},
    logger = window.logger,
    Poller = require('async-poller');

// Read-only
var Capture = model('Capture')
    .route('/spirent/traffic-recorder/captures')
    .attr('id')
    .attr('uri')
    .attr('title')
    .attr('recorder_id')
    .attr('recorder_uri')
    .attr('status')
    .attr('started')
    .attr('ended')
    .attr('interfaces')
    .attr('time_in_secs')
    .attr('size_in_bytes')
    .attr('file_size_in_bytes')
    .attr('packet_count')
    .attr('download_uri')
    .attr('delete_uri');

emitter(Capture.prototype);

Capture.primaryKey = 'id';

Capture.get_for_recorder = function (recorder_id, next) {
    Capture.get('?recorder_id=' + recorder_id, next);
};

Capture.prototype.download = function (next) {
    next = next || function () {};
    Capture.get(this.id() + '/data', next);
};

Capture.prototype.poll = function (success, error) {
    success = success || noop;
    error = error || noop;

    var self = this,
        error_count = 0,
        poller,
        fn = function (next) {
            request.get(self.url())
                .use(no_cache)
                .end(function update(res) {
                    if (res.error) {
                        logger.error(res.error);
                        error_count += 1;

                        if (error_count > 3) {
                            // Give up
                            return error(res.error);
                        }
                    } else {
                        self.set(res.body);
                    }

                    if ('COMPLETED' === self.status()) {
                        poller.stop();
                        return success(res, self);
                    }

                    return next();
                });
        };

    poller = new Poller(fn, 1000);
    poller.poll();
    return poller;
};

module.exports = Capture;