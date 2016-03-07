var emitter = require('emitter'),
    domify = require('domify'),
    classes = require('classes'),
    event = require('event'),
    template = domify(require('./template.js'));

function BatchOperator() {
    this.$el = undefined;
    this._items = {};
    this.selected = {};
    this.$operations = {};
}

emitter(BatchOperator.prototype);

BatchOperator.prototype.isSelected = function (key) {
    return this.selected.hasOwnProperty(key);
};

function operation(key, callback, e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }

    this.emit(key);
    callback(this.selected);
}

/**
 * Adds an item to the list of batch operations that can be performed on
 * selected items.
 *
 * @param key value to emit when this operation is triggered
 * @param label What the user sees
 * @param callback function fired when operation is triggered; optional
 */
BatchOperator.prototype.addOperation = function (key, label, callback) {
    callback = callback || function () {};

    var $el = document.createElement('a');
    $el.href = '#';

    $el.innerHTML = label;
    event.bind($el, 'click', operation.bind(this, key, callback));

    this.$operations[key] = $el;
};

/**
 * Gets or sets the items to be emitted when select-all is triggered
 *
 * @param items collection to set
 */
BatchOperator.prototype.items = function (items) {
    if (arguments.length) {
        this._items = items || {};
    }

    return this._items;
};

BatchOperator.prototype.render = function () {
    var $el = template.cloneNode(true),
        $actions = $el.querySelector('.actions');

    this.$el = $el;

    Object.keys(this.$operations).forEach(function (key) {
        var $operation = document.createElement('li');
        classes($operation).add('operation');
        $operation.appendChild(this.$operations[key]);
        $actions.appendChild($operation);
    }, this);

    this.bind();

    return this.$el;
};

/**
 * Depending on what's selected, renders "select all" or "unselect" and
 * available operations
 */
BatchOperator.prototype.update = function () {
    var $actions = this.$el.querySelector('.actions'),
        $all = classes($actions.querySelector('.select-all')),
        $none = classes($actions.querySelector('.select-none')),
        $operations = $actions.querySelectorAll('.operation');

    if (Object.keys(this.selected).length) {
        $all.add('hidden');
        $none.remove('hidden');
        [].forEach.call($operations, function ($operation) {
            classes($operation).remove('hidden');
        });
    } else {
        $all.remove('hidden');
        $none.add('hidden');
        [].forEach.call($operations, function ($operation) {
            classes($operation).add('hidden');
        });
    }
};

/**
 * @param silent boolean false to emit a 'change' event; defaults to false
 */
BatchOperator.prototype.select_all = function (silent) {
    this.selected = this._items;
    if (!silent) {
        this.emit('change', this.selected);
    }
    this.update();
};

/**
 * @param silent boolean false to emit a 'change' event; defaults to false
 */
BatchOperator.prototype.select_none = function (silent) {
    this.selected = {};
    if (!silent) {
        this.emit('change', this.selected);
    }
    this.update();
};

function click_all(e) {
    e.preventDefault();
    this.select_all();
}

function click_none(e) {
    e.preventDefault();
    this.select_none();
}

BatchOperator.prototype.bind = function () {
    var $actions = this.$el.querySelector('.actions'),
        $all = $actions.querySelector('.select-all'),
        $none = $actions.querySelector('.select-none');

    event.bind($all, 'click', click_all.bind(this));
    event.bind($none, 'click', click_none.bind(this));
};

/**
 * Adds value to selection
 *
 * @param key scalar or collection of key-value pairs
 * @param value associated with key; unnecessary if key is a collection
 */
BatchOperator.prototype.select = function (key, value) {
    var i;

    if (key instanceof Array || key instanceof Object) {
        // Key is a collection (of key-value pairs)
        for (i in key) {
            if (key.hasOwnProperty(i)) {
                this.select(i, key[i]); // Recursion
            }
        }
        return; // Short-circuit
    }

    this.selected[key] = value;
    this.update();
};

/**
 * Removes value from selection. Fails silently
 *
 * @param key scalar or collection
 */
BatchOperator.prototype.unselect = function (key) {
    var index;

    if (key instanceof Array || key instanceof Object) {
        // Key is a collection (of keys)
        for (index in key) {
            if (key.hasOwnProperty(index)) {
                this.unselect(index); // Recursion
            }
        }
        return; // Short-circuit
    }

    if (this.selected.hasOwnProperty(key)) {
        delete this.selected[key];
    }

    this.update();
};

/**
 * If selected contains value, remove it; otherwise, add it. Fails silently
 *
 * @param key scalar or collection
 * @param value associated with key; unnecessary if key is a collection
 */
BatchOperator.prototype.toggle = function (key, value) {
    var index;

    if (key instanceof Array || key instanceof Object) {
        // Key is a collection (of key-value-pairs)
        for (index in key) {
            if (key.hasOwnProperty(index)) {
                this.toggle(index, key[index]); // Recursion
            }
        }
        return; // Short-circuit
    }

    if (this.selected.hasOwnProperty(key)) {
        this.unselect(key);
    } else {
        this.select(key, value);
    }
};

module.exports = BatchOperator;
