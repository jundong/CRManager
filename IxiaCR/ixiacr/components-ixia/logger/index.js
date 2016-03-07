/*global $:true, navigator:true */

var window = window || {},
    navigator = window.navigator || {},
    noop = function () {},
    logger,
    request = require('superagent'),
    no_cache = require('superagent-no-cache');

/**
 * Creates an object that can log messages to a server via AJAX
 *
 * @param level
 * @param environment Object containing additional info to send in all messages
 * @param target_url URL to send log messages to
 * @constructor
 */
function Logger(level, environment, target_url) {
    this.set_level(level);
    this.environment = this.get_environment(environment);
    this.target_url = target_url;

    // Expose dependencies for test stubbing
    this.request = request;
}

Logger.levels = {
    critical: 1,
    error: 2,
    warning: 4,
    info: 8,
    debug: 16
};

Logger.strings = {
    critical: 'CRITICAL',
    error: 'ERROR',
    warning: 'WARNING',
    info: 'INFO',
    debug: 'DEBUG'
};

Logger.console_map = {
    critical: noop,
    error: noop,
    warning: noop,
    info: noop,
    debug: noop
};

if (window.console) {
    Logger.console_map = {
        critical: window.console.error,
        error: window.console.error,
        warning: window.console.warn || window.console.error,
        info: window.console.info,
        debug: window.console.debug || window.console.info
    };
}

Logger.prototype.use = function (fn) {
    fn(this);
};

Logger.prototype.log = function (level, e) {
    var console_handler;

    e = this.get_error_object(level, e);

    if (this.level >= Logger.levels.debug && window.console) {
        console_handler = Logger.console_map[level].bind(window.console);
        // Allow arbitrary parameters to be logged with console.log()
        var args = [e.message].concat([].slice.call(arguments, 2));
        console_handler.apply(window, args);
    }

    if (this.target_url) {
        try {
            this.request.post(this.target_url)
                .use(no_cache)
                .send(e)
                .set('Content-type', 'application/json')
                .end(noop, Logger.console_map.error);
        } catch (ex) {
            // Avoid endless loops when errors occur during transmission
            return;
        }
    }
};

/**
 * Change logging level
 *
 * @param level
 * @param and_below Boolean include logging levels below `level` (default: true)
 * @returns {Logger.level|int}
 */
Logger.prototype.set_level = function (level, and_below) {
    var l;

    if (typeof level === 'string') {
        level = Logger.levels[level.toLowerCase()] || Logger.levels.error;

    }

    and_below = and_below === undefined ? true : and_below; // Default to true
    if (and_below) {
        // Include all levels below specified level
        level += level - 1;
    }

    this.level = level;

    // Create Logger.* methods for each *active* log level
    for (l in Logger.levels) {
        if (Logger.levels.hasOwnProperty(l)) {
            /*jslint bitwise:true */
            if (Logger.levels[l] & this.level) {
                // Log level is enabled
                this[l] = this.log.bind(this, l);
            } else {
                // Disabled
                this[l] = noop;
            }
            /*jslint bitwise:false */
        }
    }

    return this.level;
};

/**
 * Used internally to create a JSON-friendly object from most kinds of
 * variable
 *
 * @param level One of levels.*
 * @param e
 * @returns Object
 */
Logger.prototype.get_error_object = function (level, e) {
    var new_e = {};

    // Convert all errors to objects
    if (typeof e === 'object') {
        // Include non-enumerable properties (i.e. Error.message)
        Object.getOwnPropertyNames(e).forEach(function (prop) {
            new_e[prop] = e[prop];
        });

        e = new_e;
    } else {
        e = {message: e};
    }

    e.type = Logger.strings[level];

    // Merge additional info
    e.environment = this.environment;

    // Include a timestamp
    e.timestamp = new Date();

    return e;
};

Logger.prototype.get_environment = function (environment) {
    var property;

    // Add browser attributes
    for (property in navigator) {
        if (navigator.hasOwnProperty(property)) {
            environment[property] = navigator[property];
        }
    }

    return environment;
};

function handleWindowError(message, url, linenumber, colnumber, errorObj) {
    var e = {
        message: message,
        url: url,
        linenumber: url,
        colnumber: colnumber,
        errorObj: errorObj
    };

    this.error(e);

    return true;
}

Logger.prototype.attachWindowErrorHandler = function () {
    window.onerror = handleWindowError.bind(this);
};

module.exports = Logger;
