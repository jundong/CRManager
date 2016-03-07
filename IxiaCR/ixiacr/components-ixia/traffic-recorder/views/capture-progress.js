var domify = require('domify'),
    template = domify(require('../templates/capture-progress.js')),
    recorder_to_capture_progress_map = {
        'stop_at_bytes': 'size_in_bytes',
        'packet_count': 'packet_count',
        'time_in_secs': 'time_in_secs'
    },
    progress_attrs = Object.keys(recorder_to_capture_progress_map);

function get_progress(current, limits) {
    var progress = {},
        val;

    // Calculate progress for each limit/attribute
    Object.keys(limits).forEach(function (attr) {
        val = current[attr];

        if (!limits[attr] || undefined === val || isNaN(current[attr]) || isNaN(limits[attr])) {
            // Prevent divide-by-zero and non-numeric results
            progress[attr] = 1;
            return;
        }

        val = Number(val / limits[attr]);

        // Ensure progress is never more than 1 (100%)
        val = Math.min(val, 1);

        progress[attr] = val;
    });

    return progress;
}

function CaptureProgress(limits, capture) {
    this.limits = limits;
    this.model = capture;
    this.$el = template.cloneNode(true);
}

CaptureProgress.get_limits_from_recorder = function (recorder) {
    var limits = {},
        val;

    progress_attrs.forEach(function (attr) {
        val = recorder[attr]();

        if (val !== undefined) {
            limits[attr] = val;
        }
    });

    return limits;
};

CaptureProgress.get_current_from_capture = function (capture) {
    var progress = {},
        capture_attr;

    progress_attrs.forEach(function (attr) {
        capture_attr = recorder_to_capture_progress_map[attr];
        progress[attr] = capture[capture_attr]();
    });

    return progress;
};

CaptureProgress.prototype.set_capture = function (capture) {
    if (this.capture && this.capture.id() === capture.id()) {
        return; // Short-circuit
    }

    if (this.model) {
        this.unbind();
    }

    this.model = capture;

    if (capture) {
        this.bind();
    }
};

CaptureProgress.prototype.render = function () {
    if (!this.model) {
        return; // short-circuit
    }

    var current = CaptureProgress.get_current_from_capture(this.model),
        progress = get_progress(current, this.limits);

    // Convert progress obj to an array of values
    progress = Object.keys(progress).map(function (key) {
        return progress[key];
    });

    // Get the value for the attribute with the most progress, because the first
    // attribute to reach the stop criteria will cause the capture to stop
    progress = Math.max.apply(null, progress);

    this.$el.querySelector('.bar').style.width = (progress * 100) + '%';
};

CaptureProgress.prototype.bind = function () {
    this.model.on('change', this.render.bind(this));
};

CaptureProgress.prototype.unbind = function () {
    if (this.model) {
        this.model.off('change', this.render.bind(this));
    }
    this.$el.querySelector('.bar').style.width = 0;
};

module.exports = CaptureProgress;
