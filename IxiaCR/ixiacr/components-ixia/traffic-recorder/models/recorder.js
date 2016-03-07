var model = require('model'),
    defaults = require('model-defaults'),
    Interface = require('interface-model'),
    Capture = require('./capture.js'),
    CaptureCollection = require('./capture-collection.js'),
    request = require('superagent'),
    no_cache = require('superagent-no-cache'),
    strings = {
        'New recorder': window.translate('New recorder')
    },
    capture_status_map = {
        "COMPLETED": "STOPPED",
        "STOPPED": "STOPPED",
        "RUNNING": "STARTED",
        "STARTED": "STARTED",
        "INITIALIZING": "INITIALIZING"
    };

var Recorder = model('Recorder')
    .use(defaults)
    .route('/spirent/traffic-recorder/recorders')
    .attr('id')
    .attr('title', {default: strings['New recorder']})
    .attr('state', {default: 'STOPPED'})
    .attr('captures', {default: function () { return new CaptureCollection([]); }})
    .attr('filter', {default: ''})
    .attr('stop_at_bytes', {default: 10737418240})
    .attr('packet_count')
    .attr('time_in_secs')
    .attr('interfaces', {default: []})
    .attr('max_packet_length_in_bytes');

Recorder.headers({
    'X-Requested-With': 'XMLHttpRequest',
    'Cache-Control': 'no-cache',
    'Accept': 'application/json'
});

/**
 * Returns a new Recorder instance from an Object (e.g. from an AJAX response body)
 * @param obj
 * @returns {Recorder}
 */
Recorder.factory = function (obj) {
    var instance = undefined,
        last_capture = undefined;

    obj.max_packet_length_in_bytes = obj.config.max_packet_length_in_bytes;
    obj.filter = obj.config.filter;
    var stop_criteria = obj.config.stop_criteria || [],
        interfaces = obj.config.interfaces || [];

    obj.captures = new CaptureCollection(obj.captures || []);
    obj.interfaces = interfaces.map(function (iface) {
        return new Interface(iface);
    });

    stop_criteria.forEach(function (criterium) {
        var attr = criterium.type,
            val = criterium.limit;
        if("size_in_bytes" === attr){
            obj['stop_at_bytes'] = val;
        }else{
            obj[attr] = val;
        }
    });

    instance = new Recorder(obj);

    last_capture = instance.last_capture();
    if (last_capture) {
        instance.bind_capture_status(last_capture);
    }

    return instance;
};

Recorder.prototype.interface = function (iface) {
    this.interfaces([iface]);
};

Recorder.prototype.toggle_state = function (fn) {
    var update = 'STOPPED' === this.state() ? this.start : this.stop;
    update.call(this, fn);
};

Recorder.prototype.start = function (fn) {
    return this.set_state('START', fn);
};

Recorder.prototype.stop = function (fn) {
    return this.set_state('STOP', fn);
};

Recorder.prototype.set_state = function (state, fn) {
    fn = fn || function () {};

    var url = this.url('state'),
        capture,
        recorder = this,
        captures;

    request.post(url)
        .use(no_cache)
        .set('Accept', 'application/json')
        .send({action: state})
        .end(function (err, res) {
            if (err) {
                return fn(new Error(err));
            }

            if (!res.ok) {
                return fn(new Error(res.status));
            }

            if (res.body) {
                // Started a new capture
                capture = new Capture(res.body);
                recorder.bind_capture_status(capture);
                captures = recorder.captures();
                captures.push(capture);
                recorder.captures(captures);
                recorder.state('INITIALIZING');
            }

            return fn(recorder);
        });
};

Recorder.prototype.stop_criteria = function () {
    var criteria = [];

    if (undefined !== this.stop_at_bytes()) {
        criteria.push({
            type: 'size_in_bytes',
            limit: this.stop_at_bytes()
        });
    }
    if (undefined !== this.packet_count()) {
        criteria.push({
            type: 'packet_count',
            limit: this.packet_count()
        });
    }
    if (undefined !== this.time_in_secs()) {
        criteria.push({
            type: 'time_in_secs',
            limit: this.time_in_secs()
        });
    }

    return criteria;
};

Recorder.prototype.last_capture = function () {
    return this.captures().last_capture();
};

Recorder.prototype.toJSON = function () {
    // Used by .save()

    return {
        title: this.title(),
        interfaces: this.interfaces(),
        filter: this.filter(),
        stop_criteria: this.stop_criteria(),
        max_packet_length_in_bytes: this.max_packet_length_in_bytes()
    };
};

/**
 * Updates recorder state when last capture changes
 *
 * @param capture Capture
 */
Recorder.prototype.bind_capture_status = function (capture) {
    var self = this;

    capture.on('change status', function handle_change(status) {
        status = capture_status_map[status];
        self.state(status);
    });
};

Recorder.primaryKey = 'id';

module.exports = Recorder;