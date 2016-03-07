var classes = require('classes'),
    event = require('event'),
    domify = require('domify'),
    template = domify(require('../../templates/recorder-edit.js')),
    emitter = require('emitter'),
    validate = require('validate-form'),
    strings = {
        'Field is required': window.translate('Field is required'),
        'Must be a positive integer': window.translate('Must be a positive integer'),
        'Must select an interface': window.translate('Must select an interface'),
        'Cannot capture more than 10GB (10,737,418,240 bytes)': window.translate('Cannot capture more than 10GB (10,737,418,240 bytes)')
    };

function render_invalid($el, err) {
    var $error = document.createElement('label'),
        $messages = $el.parentNode.querySelectorAll('.validator-message');

    // Remove old messages
    [].forEach.call($messages, function ($el) {
        $el.parentNode.removeChild($el);
    });

    // Insert new error
    $error.innerHTML = err;
    classes($error).add('validator-message');
    $el.parentNode.appendChild($error);

    classes($el).add('invalid');
}

function add_optional_integer_validation(validator, $parent) {
    var field = validator.field($parent.querySelector('[type=text]'))
        .is(/^[1-9]\d*$/, strings['Must be a positive integer']);

    if ($parent.querySelector('[type=checkbox]').checked) {
        field.is('required');
    }
}


function RecorderEditDelegate(recorder) {
    this.parent = recorder;
    this.$el = template.cloneNode(true);
    this.handlers = {
        'click .save': this.onsave.bind(this)
    };
}

emitter(RecorderEditDelegate.prototype);

RecorderEditDelegate.prototype.render = function () {
    var $el = this.$el,
        parent = this.parent,
        model = parent.model,
        $title = $el.querySelector('.title'),
        $selector = $el.querySelector('.selector'),
        interface_selector = parent.interface_selector,
        filter_chooser = parent.filter_chooser,
        $truncate_packets = $el.querySelector('.truncate-packets'),
        $filter = $el.querySelector('.filter'),
        $filter_input = $filter.querySelector('input'),
        $time_in_secs = $el.querySelector('.time-in-secs'),
        $stop_at_bytes = $el.querySelector('.stop-at-bytes'),
        $packet_count = $el.querySelector('.packet-count'),
        set_combo = function ($wrapper, val) {
            var $checkbox = $wrapper.querySelector('input[type=checkbox]'),
                $input = $wrapper.querySelector('input[type=text]');

            val = val === undefined ? '' : String(val).trim();
            $checkbox.checked = val.length;
            $input.disabled = !$checkbox.checked;
            $input.value = val || '';
        };

    this.$el = $el;

    // Title
    $title.value = model.title();

    // Interfaces
    $selector.appendChild(interface_selector.$el);
    interface_selector.render();

    // Stop criteria
    set_combo($time_in_secs, model.time_in_secs());
    set_combo($stop_at_bytes, model.stop_at_bytes());
    set_combo($packet_count, model.packet_count());

    // Filter
    $filter_input.value = model.filter();
    $el.appendChild(filter_chooser.render());
    filter_chooser.hide();

    // Truncate packets
    set_combo($truncate_packets, model.max_packet_length_in_bytes());

    this.bind();

    return $el;
};

RecorderEditDelegate.prototype.bind = function () {
    var $el = this.$el,
        parent = this.parent,
        model = parent.model,
        $title = $el.querySelector('.title'),
        interface_selector = parent.interface_selector,
        filter_chooser = parent.filter_chooser,
        $truncate_packets = $el.querySelector('.truncate-packets'),
        $filter = $el.querySelector('.filter'),
        $filter_input = $filter.querySelector('input'),
        $show_chooser = $filter.querySelector('.show'),
        $time_in_secs = $el.querySelector('.time-in-secs'),
        $stop_at_bytes = $el.querySelector('.stop-at-bytes'),
        $packet_count = $el.querySelector('.packet-count'),
        bind_text = function ($text, setter) {
            event.bind($text, 'change', function () {
                setter($text.value);
            });
        },
        bind_combo = function ($wrapper, setter) {
            var $checkbox = $wrapper.querySelector('[type=checkbox]'),
                $input = $wrapper.querySelector('input[type=text]'),
                val;

            event.bind($checkbox, 'change', function check() {
                $input.disabled = !$checkbox.checked;
                val = $checkbox.checked ? (+$input.value.trim() || undefined) : undefined;
                setter(val);
            });

            event.bind($input, 'change', function update() {
                val = $checkbox.checked ? (+$input.value.trim() || undefined) : undefined;
                setter(val);
            });
        },
        $delete = this.$el.querySelector('.delete'),
        destroy = function (e) {
            if (e && e.preventDefault) {
                e.preventDefault();
            }

            if (model.isNew()) {
                parent.destroy();
            } else {
                model.destroy();
            }
        },
        bind_validator = this.bind_validator.bind(this);

    interface_selector.bind();

    // Model -> DOM
    model.on('change filter', function (filter) { $filter_input.value = filter; });

    // DOM -> model
    bind_text($title, model.title.bind(model));
    event.bind($show_chooser, 'click', filter_chooser.show.bind(filter_chooser));
    bind_combo($time_in_secs, model.time_in_secs.bind(model));
    bind_combo($stop_at_bytes, model.stop_at_bytes.bind(model));
    bind_combo($packet_count, model.packet_count.bind(model));
    bind_text($filter_input, model.filter.bind(model));
    bind_combo($truncate_packets, model.max_packet_length_in_bytes.bind(model));
    event.bind($delete, 'click', this.emit.bind(this, "destroy"));

    // Validator should rebind when checkboxes change (because fields become required)
    event.bind($time_in_secs.querySelector('[type=checkbox]'), 'change', bind_validator);
    //event.bind($stop_at_bytes.querySelector('[type=checkbox]'), 'change', bind_validator); // Field is required to prevent filling storage
    event.bind($packet_count.querySelector('[type=checkbox]'), 'change', bind_validator);
    event.bind($truncate_packets.querySelector('[type=checkbox]'), 'change', bind_validator);

    // Bind validator to blur events and save button
    bind_validator();
};

RecorderEditDelegate.prototype.bind_validator = function () {
    var get_form_value = this.get_form_value.bind(this),
        interface_selector = this.parent.interface_selector,
        $title = this.$el.querySelector('.title'),
        $truncate_packets = this.$el.querySelector('.truncate-packets'),
        $time_in_secs = this.$el.querySelector('.time-in-secs'),
        $stop_at_bytes = this.$el.querySelector('.stop-at-bytes'),
        $packet_count = this.$el.querySelector('.packet-count'),
        $save = this.$el.querySelector('.save'),
        default_getter;

    this.validator = validate(this.$el);

    default_getter = this.validator.adapter.value.bind(this.validator.adapter);

    this.validator
        .value(get_form_value.bind(this, default_getter))
        .invalid(render_invalid)
        .on('blur')

        //title
        .field($title)
        .is('required', strings['Field is required'])

        // Port selector
        .field(interface_selector.$el)
        .is(function (val) {
            return val.length;
        }, strings['Must select an interface'])

        // Stop after X bytes
        .field($stop_at_bytes.querySelector('[type=text]'))
        .is('required', strings['Field is required'])
        .is(/^[1-9]\d*$/, strings['Must be a positive integer'])
        .is(function less_than_10gb(val) {
            return val <= 10737418240;
        }, strings['Cannot capture more than 10GB (10,737,418,240 bytes)']);

    // Stop after X seconds
    add_optional_integer_validation(this.validator, $time_in_secs);

    // Stop after X packets
    add_optional_integer_validation(this.validator, $packet_count);

    // Truncate at X packets
    add_optional_integer_validation(this.validator, $truncate_packets);

    event.bind($save, 'click', this.handlers['click .save']);
};

RecorderEditDelegate.prototype.onsave = function (e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }

    var save = this.parent.save.bind(this.parent);

    this.validator.validate(function (unused, is_valid) {
        if (is_valid) {
            save();
        }
    });
};

RecorderEditDelegate.prototype.get_form_value = function (default_getter, $el) {
    if (this.parent.interface_selector.$el === $el) {
        return this.parent.model.interfaces();
    }

    if ($el.disabled) {
        return '';
    }

    return default_getter($el);
};

module.exports = RecorderEditDelegate;