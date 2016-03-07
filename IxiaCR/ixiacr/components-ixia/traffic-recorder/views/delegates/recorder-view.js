var domify = require('domify'),
    template = domify(require('../../templates/recorder-view.js')),
    classes = require('classes'),
    event = require('event'),
    emitter = require('emitter'),
    CaptureView = require('../capture.js'),
    last_capture_template = domify(require('../../templates/last-capture.js')),
    CaptureProgress = require('../capture-progress.js'),
    strings = {
        "seconds": window.translate("seconds"),
        "bytes": window.translate("bytes"),
        "packets": window.translate("packets"),
        "Record": window.translate("Record"),
        "Stop": window.translate("Stop")
    };

function RecorderViewDelegate(recorder) {
    this.parent = recorder;
    this.model = this.parent.model;
    this.$el = undefined;
    this.progress = undefined;
}

emitter(RecorderViewDelegate.prototype);

RecorderViewDelegate.prototype.render = function () {
    var $el = template.cloneNode(true),
        parent = this.parent,
        model = this.model,
        $title = $el.querySelector('.title'),
        $selector = $el.querySelector('.selector'),
        interface_selector = parent.interface_selector,
        selected_interface = model.interfaces()[0],
        $filter = $el.querySelector('.filter'),
        $truncate_packets = $el.querySelector('.truncate-packets'),
        $stop_criteria = $el.querySelector('.stop-criteria'),
        stop_criteria = [],
        render_text = function ($el, value, string) {
            if (undefined === value || '' === value) {
                classes($el).add('hidden');
                $el.querySelector('span').innerHTML = '-';
            } else {
                classes($el).remove('hidden');
                $el.querySelector('span').innerHTML = string;
            }
        },
        $progress = $el.querySelector('.progress');

    this.$el = $el;

    $title.innerHTML = model.title();

    while ($selector.firstChild) {
        $selector.removeChild($selector.firstChild);
    }
    $selector.appendChild(interface_selector.render());
    interface_selector.select(selected_interface, true);
    interface_selector.unbind();

    render_text($truncate_packets, model.max_packet_length_in_bytes(), model.max_packet_length_in_bytes() + ' ' + strings.bytes);

    render_text($filter, model.filter(), model.filter());

    if (undefined !== model.time_in_secs()) {
        stop_criteria.push(model.time_in_secs() + ' ' + strings.seconds);
    }
    if (undefined !== model.stop_at_bytes()) {
        stop_criteria.push(model.stop_at_bytes() + ' ' + strings.bytes);
    }
    if (undefined !== model.packet_count()) {
        stop_criteria.push(model.packet_count() + ' ' + strings.packets);
    }
    stop_criteria = stop_criteria.length > 0 ? stop_criteria : undefined;
    render_text($stop_criteria, stop_criteria, stop_criteria.join(', '));

    this.progress = new CaptureProgress(CaptureProgress.get_limits_from_recorder(this.model));
    this.progress.render();
    while ($progress.firstChild) {
        $progress.removeChild($progress.firstChild);
    }
    $progress.appendChild(this.progress.$el);

    this.set_state(this.model.state());

    if (this.model.last_capture()) {
        this.render_last_capture();
    }

    this.bind();

    return $el;
};

RecorderViewDelegate.prototype.bind = function () {
    var model = this.model,
        $el = this.$el,
        $delete = $el.querySelector('.delete'),
        destroy = this.destroy.bind(this),
        $history = $el.querySelector('.history'),
        history = this.emit.bind(this, "history"),
        $toggle = $el.querySelector('.toggle'),
        transition = this.transition.bind(this),
        toggle = function (e) {
            e.preventDefault();
            model.toggle_state();
            transition();
        },
        poll_until_done = function (capture) {
            capture.on('change', this.render_last_capture.bind(this));
            capture.poll();
        },
        last_capture = model.last_capture();

    // Model -> DOM
    model.on('change state', this.set_state.bind(this));
    model.captures().on('added', poll_until_done.bind(this));
    if (last_capture && last_capture.status() !== 'COMPLETED') {
        poll_until_done.call(this, last_capture);
    }

    // DOM -> Model
    event.bind($delete, 'click', destroy);
    event.bind($history, 'click', history);
    event.bind($toggle, 'click', toggle);
};

RecorderViewDelegate.prototype.destroy = function (e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }

    if (this.model.isNew()) {
        this.parent.destroy();
    } else {
        this.model.destroy();
    }

    this.emit("destroy");
};

RecorderViewDelegate.prototype.set_state = function (state, prev) {
    if (prev === state) {
        // State didn't change
        return; // Short-circuit
    }

    if ('STARTED' === state) {
        this.start();
    } else if ('STOPPED' === state) {
        this.stop();
    } else {
        // Starting or stopping
        this.transition();
    }
};

RecorderViewDelegate.prototype.transition = function () {
    var $progress = this.$el.querySelector('.progress'),
        $toggle = this.$el.querySelector('.toggle');

    // Action buttons
    this.hide_actions();

    // Progress bar
    classes($progress).add('hidden');
    this.progress.unbind();

    // Start/stop button
    classes($toggle).add('loading');
    $toggle.disabled = true;
};

RecorderViewDelegate.prototype.start = function () {
    var last_capture = this.model.last_capture(),
        $progress = this.$el.querySelector('.progress'),
        $toggle = this.$el.querySelector('.toggle'),
        toggle_classed = classes($toggle);

    // Action buttons
    this.hide_actions();

    // Progress bar
    classes($progress).remove('hidden');
    this.progress.set_capture(last_capture);

    // Stop button
    toggle_classed.add('stop');
    toggle_classed.remove('start');
    toggle_classed.remove('loading');
    $toggle.disabled = false;
    $toggle.querySelector('span').innerHTML = strings.Stop;
};

RecorderViewDelegate.prototype.stop = function () {
    var $progress = this.$el.querySelector('.progress'),
        $toggle = this.$el.querySelector('.toggle'),
        toggle_classed = classes($toggle);

    // Action buttons
    this.show_actions();

    // Progress bar
    classes($progress).add('hidden');
    this.progress.unbind();

    // Start button
    toggle_classed.add('start');
    toggle_classed.remove('stop');
    toggle_classed.remove('loading');
    $toggle.disabled = false;
    $toggle.querySelector('span').innerHTML = strings.Record;
};

RecorderViewDelegate.prototype.render_last_capture = function () {
    var model = this.model.last_capture(),
        view = CaptureView.factory(model, last_capture_template),
        $capture = this.$el.querySelector('.last-capture');

    view.render();
    while ($capture.firstChild) {
        $capture.removeChild($capture.firstChild);
    }
    $capture.appendChild(view.$el);
};

RecorderViewDelegate.prototype.show_actions = function () {
    this.toggle_actions(true);
};

RecorderViewDelegate.prototype.hide_actions = function () {
    this.toggle_actions(false);
};

RecorderViewDelegate.prototype.toggle_actions = function (visible) {
    var $actions = this.$el.querySelectorAll('.action a'),
        method = visible ? 'remove' : 'add';

    [].forEach.call($actions, function ($action) {
        classes($action)[method]('hidden');
    });
};

module.exports = RecorderViewDelegate;