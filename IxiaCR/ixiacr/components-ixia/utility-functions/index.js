/*global logger:true */

var Lightbox = require('lightbox'),
    classes = require('classes'),
    next = require('next-sibling'),
    request = require('superagent'),
    no_cache = require('superagent-no-cache');

/**
 *
 * @param url
 * @param template_selector
 * @param callback - Receives template (a <script> element - see below)
 * @param reload
 * @param log
 */
function getTemplate(url, template_selector, callback, reload, log) {
    callback = callback || $.noop;
    log = (log === null || log === undefined) ? true : log;
    if ($(template_selector).length > 0 && reload) {
        $(template_selector).remove();
    }
    if ($(template_selector).length < 1) {
        $.ajax({
            url: url,
            dataType: "html",
            success: function (templateData) {
                $("body").append(templateData);
                var $template = $(template_selector);
                if ($template.length < 1 && log) {
                    logger.warning("Tried to get element: " + template_selector + " in " + url + " but was not found.");
                }
                // Warning: $template is a <script> element with string
                // content - we need to call $.tmpl() on this to convert its
                // contents to DOM elements. See
                // for an example of how to do this.
                callback($template);
            }
        });
    } else {
        callback($(template_selector));
    }
}

function greaterOf(control, test) {
    return control > test ? control : test;
}

function arrayToJSON(array) {
    var jsonArray = [];
    for (var i = 0; i < array.length; i++) {
        jsonArray.push(array[i].toJSON());
    }
    return jsonArray;
}

function setTags(taggedObject, tagJson) {
    taggedObject.tags.removeAll();
    var tags = new Array();
    if (tagJson) {
        if (tagJson["user_defined"])
            taggedObject.tags(tagJson["user_defined"]);
        if (tagJson["company"])
            taggedObject.customer(tagJson["company"]);
        if (tagJson["location"])
            taggedObject.location(tagJson["location"]);

        if (tagJson["favorite"])
            taggedObject.favorite(tagJson["favorite"]);
        else
            taggedObject.favorite(false);
    }
    return taggedObject;
}

function getTags(taggedObject) {
    var tags = { user_defined: new Array() };
    var tagArray = taggedObject.tags();
    for (var i = 0; i < tagArray.length; i++)
        tags.user_defined.push(tagArray[i]);

    if (taggedObject.customer() && taggedObject.customer() != "select one") {
        tags.company = taggedObject.customer();
    }
    if (taggedObject.location() && taggedObject.location() != "select one") {
        tags.location = taggedObject.location();
    }
    if (taggedObject.favorite()) {
        tags.favorite = taggedObject.favorite();
    }
    return tags;
}

function trimTag(tag) {
    // trim outter whitespace and non-alphanumeric characters
    return tag.replace(/^\s+|\s+$|[^a-zA-Z0-9\s]+/g, '');
}

function sanitizeUnqualifiedTagGroup(tags) {
    // trim everything other than alphanumeric, spaces and commas
    return tags.replace(/[^,a-zA-Z0-9\s]+/g, '').replace(/,,/g, ',');
}

function formatRequestData(key, data) {
    if (key.indexOf("get") == -1) {
        return ko.toJSON(data);//{ "data": data };
    }
    else {
        var jsonData = ko.toJSON(data);
        util.logData(jsonData);
        return 'data=' + jsonData;
    }
}

function getConfigSetting(key) {
    var rootPath = "/ixia/";
    var stubsPath = "stubs/";

    var config = {
        "get_ixiacr_tests": rootPath + "get_ixiacr_tests.json",
        "get_recent_news": rootPath + "get_recent_news.json",
        "devices_status": rootPath + "devices/status",
        "time_sync_status": rootPath + "status/time_sync",
        "get_results": rootPath + "get_results.json",
        "get_endpoints": rootPath + "get_endpoints.json",
        "get_devices": rootPath + "get_devices.json",
        "get_ports": rootPath + "get_ports.json",
        "get_customers": rootPath + "get_customer_tags.json",
        "get_locations": rootPath + "get_location_tags.json",
        "get_language": rootPath + "get_language",
        "set_language": rootPath + "set_language",
        "get_result_history": rootPath + "get_result_history.json",
        "get_portlets": rootPath + "get_portlets.json",
        "get_tags": rootPath + "get_user_defined_tags.json",
        "save_axon_test": rootPath + "save_axon_test",
        "save_test_template": rootPath + "save_test_template",
        "save_endpoint": rootPath + "save_endpoint",
        "save_device": rootPath + "save_device",
        "save_result": rootPath + "save_result",
        "config_test": rootPath + "config_test",
        "run_test": rootPath + "run_test",
        "create_test_event": rootPath + "schedule/test-events",
        "get_istestready": rootPath + "get_istestready",
        "get_result_types": rootPath + "get_result_types.json",
        "cancel_test": rootPath + "cancel_test",
        "request_final_table": rootPath + "request_final_table",
        "upgrade_device": rootPath + "upgrade_device",
        "get_display_messages": rootPath + "get_display_messages.json",
        "get_global_settings": rootPath + "get_global_settings.json",
        "save_customers": rootPath + "save_customers",
        "save_locations": rootPath + "save_locations",
        "save_global_settings": rootPath + "save_global_settings",
        "add_user": rootPath + "add_user.json",
        "verify_user": rootPath + "verify_user.json",
        "verify_password": rootPath + "verify_password.json",
        "set_admin_password": rootPath + "set_admin_password",
        "backup": rootPath + "backup",
        "restore_backup": rootPath + "restore_backup",
        "reboot_axon": rootPath + "reboot_axon",
        "shutdown_axon": rootPath + "shutdown_axon",
        "get_task_status": rootPath + "get_task_status",
        "get_cr_logs": rootPath + "get_axon_logs",
        "delete_device": rootPath + "delete_device",
        "get_device_time_sync": rootPath + "get_device_time_sync",
        "get_timing_accuracies": rootPath + "get_timing_accuracies.json",
        "delete_backup": rootPath + "delete_backup",
        "archive_backup": rootPath + "archive_backup",
        "import_backup": rootPath + "import_backup",
        "get_backup_status": rootPath + "get_backup_status",
        "check_updates": rootPath + "check_updates"
    };


    if (config[key])
        return config[key];
    else
        logger.warn('unknown config key: "' + key + '"');
}

function logData(data) {
    logger.info(data);
}

function isNullOrEmpty(val) {
    return val == null || val.length == 0 || /\S/.test(val) == false;
}

function objectsEqual(control, test) {
    return JSON.stringify(control) == JSON.stringify(test);
}

function trueOrOptional(value) {
    return value === undefined || value === null || value === true;
}

function toType(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

function setObservableArray(observableArray, array) {
    observableArray.removeAll();
    for (var i = 0; i < array.length; i++) {
        observableArray.push(array[i]);
    }
}
function parseUnixTimestampStringToDate(string, desiredFormat) {
    var newdate = parseInt(string),
        outputFormat;
    if (!desiredFormat) {
        outputFormat = "MM-dd-yy HH:mm";
    } else {
        outputFormat = desiredFormat;
    }
    return new Date(newdate * 1000).format(outputFormat);
}
function commafyNumber(number) {
    var parts = number.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function getMagnitude(number) {
    var isNegative = number < 0;
    number = Math.abs(number);

    if (number == 0) {
        return 0;
    } else if (number >= 1) {
        var i = 0;
        while (number >= 10) {
            number /= 10;
            i++;
        }
        var mag = Math.pow(10, i);
        return isNegative ? mag * -1 : mag;
    } else {
        var i = 0;
        while (number < 1) {
            number *= 10;
            i--;
        }
        var mag = Math.pow(10, i);
        return isNegative ? mag * -1 : mag;
    }
}

function minOrDefault(control, test) {
    control = parseFloat(control);
    test = parseFloat(test);
    if (isNaN(control) && isNaN(test)) {
        return;
    }
    if (!isNaN(control) && isNaN(test)) {
        return control;
    }
    if (isNaN(control) && !isNaN(test)) {
        return test;
    }
    return control > test ? test : control;
}

function maxOrDefault(control, test) {
    control = parseFloat(control);
    test = parseFloat(test);
    if (isNaN(control) && isNaN(test)) {
        return;
    }
    if (!isNaN(control) && isNaN(test)) {
        return control;
    }
    if (isNaN(control) && !isNaN(test)) {
        return test;
    }
    return control < test ? test : control;
}

function floatFix(number) {
    return (parseFloat(number.toPrecision(3)));
}

function padNumber(number, length) {
    number = number.toString();
    if (number.length < length) {
        while (number.length < length) {
            number = "0" + number;
        }
    }
    return number;
}

function recursiveUnwrapObservable(value, returnCounter) {
    var result = value;
    var counter = 0;

    while (ko.isObservable(result)) {
        result = result();
        counter++;
    }

    if (returnCounter) {
        return {
            value: result,
            counter: counter
        }
    }

    return result;
}

function stringAdd() {
    var total = 0;
    for (var i = 0; i < arguments.length; i++) {
        var number = parseInt(arguments[i]);

        if (isNaN(number)) {
            throw "Argument " + i + " is not a number.";
        }
        total += number;
    }

    return total.toString();
}

function applyFunction(array, func, args) {
    if ($.isFunction(func)) {
        for (var i = 0; i < array.length; i++) {
            if (array[i])
                func.apply(array[i], args);
        }
    }

    if (typeof func == 'string') {
        for (var i = 0; i < array.length; i++) {
            if (array[i])
                array[i][func].apply(array[i], args);
        }
    }
}

function sortArrayByObjectKeyKoObservable(field, reverse, primer) {
    var key = function (x) {
        return primer ? primer(x[field]) : x[field]
    };
    return function (a, b) {
        var A = a[field](), B = b[field]();
        return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [-1, 1][+!!reverse];
    }
}
function sortArrayByObjectKey(field, reverse, primer) {
    var key = function (x) {
        return primer ? primer(x[field]) : x[field]
    };

    return function (a, b) {
        var A = key(a), B = key(b);
        return ( (A < B) ? -1 : ((A > B) ? 1 : 0) ) * [-1, 1][+!!reverse];
    }
}

function sort_devices (devices) {
    var localChassisRecord = devices.shift();
    devices.sort(function(a,b) {
        var a_name = typeof a.name === 'function' ? a.name() : a.name,
            b_name = typeof b.name === 'function' ? b.name() : b.name;

        return (a_name > b_name) ? 1 : ((b_name > a_name) ? -1 : 0);
    } );
    devices.unshift(localChassisRecord);
    return devices;
}

function arraysShareValue(array1, array2, caseInsensitive) {
    if (!caseInsensitive) {
        for (var i = 0; i < array1.length; i++) {
            if (array2.indexOf(array1[i]) != -1) {
                return true;
            }
        }

        return false;
    }


    array1 = $.map(array1, function (n) {
        return(n.toUpperCase());
    });
    array2 = $.map(array2, function (n) {
        return(n.toUpperCase());
    });

    for (var i = 0; i < array1.length; i++) {
        if (array2.indexOf(array1[i]) != -1) {
            return true;
        }
    }
}

function warningLightbox(text, okCallback, closeOnOk) {
    var viewModel = {
        lightboxText: text,
        okFunction: function () {
            okCallback.apply(this, arguments);
            if (trueOrOptional(closeOnOk)) {
                lightbox.close();
            }
        }
    };

    util.lightbox.open({
        url: 'html/lightbox_tmpl',
        selector: '#lightbox-warning-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function () {
            ko.applyBindings(viewModel, document.getElementById('lightbox-warning'));
        }
    });
}

function debounce(func, threshold, execAsap){
    var timeout;
    if (false !== execAsap) execAsap = true;

    return function debounced(){
        var obj = this, args = arguments;

        function delayed () {
            if (!execAsap) {
                func.apply(obj, args);
            }
            timeout = null;
        }

        if (timeout) {
            clearTimeout(timeout);
        } else if (execAsap) {
            func.apply(obj, args);
        }

        timeout = setTimeout(delayed, threshold || 100);
    };
}

function clear_validation_messages (el) {
    var message;

    classes(el).remove('valid').remove('invalid');

    while (message = next(el, '.validator-message')) {
        if (el.parentNode) el.parentNode.removeChild(message);
    }
}

function clear_all_validation_messages (el) {
    var $temps;

    $temps = el.querySelectorAll('.invalid, .valid');

    [].forEach.call($temps, function($temp){
        classes($temp).remove('valid').remove('invalid');
    });

    $temps = el.querySelectorAll('.validator-message');

    [].forEach.call($temps, function($temp){
        if ($temp.parentNode) $temp.parentNode.removeChild($temp);
    });
}

function get_chassis_reservationa_status (callback) {
    return

    request
        .get('/spirent/get_reservation_status')
        .use(no_cache)
        .end(function(error, response){
            var data;

            if(error){
                return callback(null,error);
            };

            if( response.body && response.body.result === 'FAILURE' ){
                return callback(null,response.body.message);
            };

            data =  response.body;

            return callback(data);


        });
}

function decimal_format (value, digit) {
    var weight = Math.pow(10, digit);
    return isNaN(value)?value:Math.round(value * weight)/weight;
}

/**
 * Covert array to custom string
 *
 * @param array - Input array which need to covert to string
 * @param join - Join last value in array
 * @param separator - Suffix separator for every value in array
 */
function array_to_string (array, join, separator) {
    if (!separator) {
        separator = "";
    }

    if (array.length == 1) {
        return array[0] + separator;
    }

    var pretty_string = "";
    for (var i = 0; i < array.length; i++) {
        if (i == (array.length - 1)) {
            pretty_string += " " + join + " " + array[i] + separator;
        } else {
            pretty_string += ", " + array[i] + separator;
        }
    }

    return pretty_string
}

var util = module.exports = {
    getTemplate: getTemplate,
    arrayToJSON: arrayToJSON,
    getRequestMethod: function() { return 'POST'; },
    setObservableArray: setObservableArray,
    commafyNumber: commafyNumber,
    getMagnitude: getMagnitude,
    maxOrDefault: maxOrDefault,
    minOrDefault: minOrDefault,
    trueOrOptional: trueOrOptional,
    floatFix: floatFix,
    padNumber: padNumber,
    greaterOf: greaterOf,
    lightbox: new Lightbox(getTemplate),
    warningLightbox: warningLightbox,
    setTags: setTags,
    getTags: getTags,
    getConfigSetting: getConfigSetting,
    formatRequestData: formatRequestData,
    logData: logData,
    toType: toType,
    objectsEqual: objectsEqual,
    isNullOrEmpty: isNullOrEmpty,
    recursiveUnwrapObservable: recursiveUnwrapObservable,
    stringAdd: stringAdd,
    applyFunction: applyFunction,
    arraysShareValue: arraysShareValue,
    sortArrayByObjectKey: sortArrayByObjectKey,
    sortArrayByObjectKeyKoObservable: sortArrayByObjectKeyKoObservable,
    sort_devices: sort_devices,
    parseUnixTimestampStringToDate: parseUnixTimestampStringToDate,
    trimTag: trimTag,
    sanitizeUnqualifiedTagGroup: sanitizeUnqualifiedTagGroup,
    debounce: debounce,
    clear_validation_messages: clear_validation_messages,
    clear_all_validation_messages: clear_all_validation_messages,
    get_chassis_reservationa_status: get_chassis_reservationa_status,
    decimal_format:decimal_format,
    array_to_string: array_to_string
};