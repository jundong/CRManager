var BatchOperator = require('batch-operator'),
    Paginator = require('paginator'),
    domify = require('domify'),
    template = domify(require('../../templates/recorder-history.js')),
    classes = require('classes'),
    event = require('event'),
    emitter = require('emitter'),
    moment = require('moment'),
    CaptureCollection = require('../../models/capture-collection.js'),
    CaptureView = require('../capture.js'),
    historical_capture_template = domify(require('../../templates/historical-capture.js')),
    strings = {
        "seconds": window.translate("seconds"),
        "bytes": window.translate("bytes"),
        "packets": window.translate("packets"),
        "Record": window.translate("Record"),
        "Stop": window.translate("Stop")
    };

function RecorderHistoryDelegate(recorder) {
    this.parent = recorder;
    this.model = this.parent.model;
    this.$el = template.cloneNode(true);
    this.batch_operator = new BatchOperator();
    this.paginator = new Paginator();
    this.captures_per_page = 5;
    this.handlers = {
        'selection changed': []
    };

    this.batch_operator.addOperation('delete', 'Delete', this.delete.bind(this));
}

emitter(RecorderHistoryDelegate.prototype);

RecorderHistoryDelegate.prototype.render = function () {
    var $el = this.$el,
        $title = $el.querySelector('.title'),
        $loading = $el.querySelector('.loading'),
        $error = $el.querySelector('.error'),
        $batch_operator = $el.querySelector('.capture-batch-operator');

    this.$el = $el;

    $title.innerHTML = this.model.title();

    classes($loading).remove('hidden');
    classes($error).add('hidden');

    this.batch_operator.render();

    // Paginator rendered in .reset()

    this.bind();

    return $el;
};

function done_loading_captures(res) {
    var $loading = this.$el.querySelector('.loading'),
        $error = this.$el.querySelector('.error');

    classes($loading).add('hidden');

    if (res instanceof Error) {
        classes($error).remove('hidden');
    } else {
        classes($error).add('hidden');
    }
}

function get_captures(recorder_id) {
    this.captures = CaptureCollection.all(done_loading_captures.bind(this), recorder_id);
    this.model.captures(this.captures);
}

function page_changed(page) {
    this.batch_operator.select_none(true);
    this.render_page(page);
}

RecorderHistoryDelegate.prototype.bind = function () {
    var recorder_id = this.model.id(),
        $error = this.$el.querySelector('.error'),
        $done = this.$el.querySelector('.done');

    // Model -> view
    get_captures.call(this, recorder_id);
    this.captures.on('added', this.reset.bind(this));
    this.captures.on('removed', this.reset.bind(this));
    this.captures.on('reset', this.reset.bind(this));

    // View -> view
    this.paginator.on('change', page_changed.bind(this));
    this.batch_operator.on('change', this.render_page.bind(this, null));

    // DOM -> Model
    event.bind($error.querySelector('a'), 'click', get_captures.bind(this, recorder_id));
    event.bind($done, 'click', this.emit.bind(this, "done"));
};

RecorderHistoryDelegate.prototype.reset = function (collection, items) {
    var pages = Math.ceil(this.captures.count() / this.captures_per_page);

    if (pages !== this.paginator.pages()) {
        this.paginator.pages(pages);
    }

    this.batch_operator.update();
    this.paginator.render();
    this.render_page(this.paginator.page);
};

function selection_changed(id, capture, $operator) {
    this.batch_operator.toggle(id, capture);
    while ($operator.firstChild) {
        $operator.removeChild($operator.firstChild);
    }
    $operator.appendChild(this.batch_operator.$el);
}

/**
 * Re-renders list of captures
 *
 * @param page 1-indexed (typically from a paginator)
 */
RecorderHistoryDelegate.prototype.render_page = function (page) {
    page = page || this.paginator.page;
    page = Math.min(page, this.paginator.pages());

    var index = page - 1,
        begin = index * this.captures_per_page,
        end = begin + this.captures_per_page,
        captures = this.captures.slice(begin, end),
        items = {}, // key-value pairs for batch operator
        $loading = this.$el.querySelector('.loading'),
        $captures = this.$el.querySelector('.captures'),
        $batch_operator = this.$el.querySelector('.capture-batch-operator'),
        $paginator = this.$el.querySelector('.capture-paginator');

    classes($loading).add('hidden');

    // Clear any existing captures from the list
    while ($captures.firstChild) {
        $captures.removeChild($captures.firstChild);
    }

    // Insert captures for this page and build key-value pairs for batch operator
    this.handlers['selection changed'] = [];
    captures.map(function (capture) {
        var view = CaptureView.factory(capture, historical_capture_template),
            id = capture.id(),
            $checkbox;

        this.handlers['selection changed'][id] = selection_changed.bind(this, id, capture, $batch_operator);

        view.render();
        $checkbox = view.$el.querySelector('[type=checkbox]');
        $checkbox.checked = this.batch_operator.isSelected(id);
        event.bind($checkbox, 'change', this.handlers['selection changed'][id]);
        $captures.appendChild(view.$el);

        // Create key-value pair for batch operator
        items[id] = capture;
    }, this);

    this.batch_operator.items(items);

    while ($batch_operator.firstChild) {
        $batch_operator.removeChild($batch_operator.firstChild);
    }
    if(captures.length > 0){
        $batch_operator.appendChild(this.batch_operator.$el);
    }

    while ($paginator.firstChild) {
        $paginator.removeChild($paginator.firstChild);
    }
    $paginator.appendChild(this.paginator.$el);

    if (1 === this.paginator.pages()) {
        classes($paginator).add('hidden');
    } else {
        classes($paginator).remove('hidden');
    }
};

function handle_response(capture, error, response) {
    if (error || response.status !== 200) {
        window.logger.error('Could not delete capture ' + capture.id());
        return;
    }

    // Remove capture from collection
    this.captures.remove(capture);

    this.render_page(this.paginator.page);
}

RecorderHistoryDelegate.prototype.delete = function (captures) {
    Object.keys(captures).forEach(function (key) {
        var capture = captures[key];
        capture.destroy(handle_response.bind(this, capture));
    }, this);

    this.batch_operator.select_none(true);
};

module.exports = RecorderHistoryDelegate;