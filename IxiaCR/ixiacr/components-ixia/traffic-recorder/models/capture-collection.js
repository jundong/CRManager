var emitter = require('emitter'),
    Capture = require('./capture.js'),
    request = require('superagent'),
    no_cache = require('superagent-no-cache');

function sort_by_started(captures, oldest_first) {
    captures = captures.sort(function (a, b) {
        var a_started = typeof a.started === 'function' ? a.started() : a.started,
            b_started = typeof b.started === 'function' ? b.started() : b.started,
            ret;

        if (a_started === b_started) {
            return 0;
        }

        a = Date.parse(a_started);
        b = Date.parse(b_started);

        ret = a - b;
        if (!oldest_first) {
            // Reverse
            ret = -ret;
        }
        return ret;
    });

    return captures;
}

function Collection(collection) {
    if (collection instanceof Collection) {
        return collection;
    }

    collection = collection || [];

    this.items = [];

    collection = sort_by_started(collection);

    collection.forEach(function (item, i) {
        this.items[i] = new Capture(item);
    }, this);

    return this;
}

emitter(Collection.prototype);

Collection.all = function (fn, recorder_id) {
    var collection = new Collection(),
        emit = collection.emit.bind(collection);

    fn = fn || function () {};

    request.get(Capture.url() + '?recorder_id=' + recorder_id)
        .use(no_cache)
        .set('Accept', 'application/json')
        .end(function (err, res) {
            var tmp;

            if (err) {
                fn(new Error(err));
            }

            if (!res.ok) {
                fn(new Error(res.status));
            }

            tmp = new Collection(res.body);

            collection.items = tmp.items;

            emit("reset", collection, res.body);

            fn(collection);
        });

    return collection;
};

/**
 * Returns last capture or undefined
 *
 * @returns {Capture|undefined}
 */
Collection.prototype.last_capture = function () {
    // Captures are sorted (most-recent first) during instantiation (see constructor)
    return this.items[0];
};

Collection.prototype.push = function (item, silent) {
    silent = silent || false;

    var items = this.items;

    items.splice(0, 0, item);
    this.items = sort_by_started(items);

    if (!silent) {
        this.emit('added', item);
    }
};

Collection.prototype.remove = function (item, silent) {
    this.items.forEach(function (current, i) {
        if (current.id() === item.id()) {
            this.items.splice(i, 1);
        }
    }, this);

    if (!silent) {
        this.emit('removed', item);
    }
};

Collection.prototype.indexOf = function (item) {
    var id = item.id(),
        index = -1;

    this.items.map(function (current, i) {
        if (-1 === index && id === current.id()) {
            index = i;
        }
    });

    return index;
};

Collection.prototype.count = function () {
    return this.items.length;
};

/**
 * Just like Array.slice
 *
 * @param begin (zero-indexed; inclusive)
 * @param end  (zero-indexed; non-inclusive)
 * @returns Array
 */
Collection.prototype.slice = function (begin, end) {
    return this.items.slice(begin, end);
};

module.exports = Collection;