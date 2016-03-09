/*global ko:true, ValidationResultsViewModel:true, LightboxWorkingViewModel:true */

var model = require('model'),
    request = require('superagent'),
    no_cache = require('superagent-no-cache'),
    moment = require('moment-timezone'),
    tz = require('./tz.js'),
    repeater_types_map = {
        "DAILY": "day(s)",
        "WEEKLY": "week(s)",
        "MONTHLY": "month(s)"
    },
    AsyncPoller = require('async-poller');

var handled_failure_reasons = [
    'event_is_in_past',
    'conflicts_found',
    'conflicts_with_remote_events_found'
];

/**
 * Returns a user-friendly error message for a given error reason - add more!
 *
 * @param reason One of TestEvent.failure_handlers
 * @param details
 * @returns {string}
 */
function get_friendly_error(reason, details) {
    var map = {
        'event_is_in_past': function (details) {
            return window.translate('calendar.schedule_in_past', {
                datetime: moment(details.server_time).format('LLL')
            });
        },

        'conflicts_found': function (details) {
            return window.translate('calendar.schedule_conflicts', {
                name: details[0].name,
                datetime: moment.tz(details[0].datetime, 'UTC').tz(tz.name()).format('LLL')
            });
        },

        'conflicts_with_remote_events_found': function (details) {
            return window.translate('calendar.conflicts_with_remote_events', {
                chassis: details.device.name,
                test: details.conflicts[0].name,
                datetime: moment.tz(details.conflicts[0].datetime, 'UTC').tz(tz.name()).format('LLL')
            });
        }
    };

    if (map[reason] === undefined) {
        return reason;
    }

    return map[reason](details);
}

/**
 * Factory for creating callbacks to use during reservation, validation,
 * and persistence phases. Updates lightbox with user-friendly messages.
 *
 * @param lightbox_title
 * @param success
 * @param error
 * @returns {function} Callback
 */
function handler_factory(lightbox_title, success, error) {
    success = success || function () {};
    error = error || function () {};

    return function handle_response(err, res) {
        var failure_message,
            lightbox_vm;

        if (res.body.result === 'FAILURE' && handled_failure_reasons.indexOf(res.body.reason) !== -1) {
            // Failed, but we can handle it

            failure_message = get_friendly_error(res.body.reason, res.body.details);

            lightbox_vm = new ValidationResultsViewModel();
            lightbox_vm.addCheckResults(lightbox_title, false, failure_message);

            window.util.lightbox.open({
                url : 'html/lightbox_tmpl',
                selector : '#lightbox-run-test-validation-template',
                cancelSelector: '.cancel-button',
                isModal : false,
                onOpenComplete: function show_invalid() {
                    var $lb = document.querySelector('#lightbox-run-test-validation');
                    ko.applyBindings(lightbox_vm, $lb);
                    error(res);
                }
            });
            return;
        }

        if (res.body.result === 'FAILURE' || err) {
            // Unknown/exceptional error
            var e = res.body || err;
            window.logger.error(e);
            window.util.lightbox.error(lightbox_title);
            return error(e);
        }

        if (res.body.is_ready === false && res.body.is_valid && res.body.messages.length) {
            // Still validating, update the lightbox
            var message = res.body.messages[0];

            lightbox_vm = new LightboxWorkingViewModel(lightbox_title, message.header, null, message.content);
            window.util.lightbox.working(lightbox_vm);
            return success(res);
        }

        if (res.body.is_ready === false && res.body.is_valid === false) {
            // Failed validation, surface error to user

            var messages = res.body.messages || [];

            lightbox_vm = new ValidationResultsViewModel();

            // Add failure messages to validation lightbox
            messages.forEach(function (message) {
                // Make message human-friendly if possible
                var friendly_message = get_friendly_error(message.content);

                lightbox_vm.addCheckResults(message.header, false, friendly_message);
            });

            window.util.lightbox.open({
                url : 'html/lightbox_tmpl',
                selector : '#lightbox-run-test-validation-template',
                cancelSelector: '.cancel-button',
                isModal : false,
                onOpenComplete: function show_invalid() {
                    var $lb = document.querySelector('#lightbox-run-test-validation');
                    ko.applyBindings(lightbox_vm, $lb);
                    error(res);
                }
            });
            return;
        }

        return success(res);
    };
}

var TestEvent = model('TestEvent')
    .attr('id')
    .attr('type')
    .attr('name')
    .attr('duration')
    .attr('timezone')
    .attr('details');

TestEvent.createOrUpdateTestEvent = function (testConfig, eventConfig, callback) {
    var reserve_and_begin_validation,
        poll_for_validation,
        persist = eventConfig.id ? TestEvent.update : TestEvent.create;

    // Chain the phases
    persist = persist.bind(this, testConfig, eventConfig, callback);
    poll_for_validation = TestEvent.poll_for_validation.bind(this, persist);
    reserve_and_begin_validation = TestEvent.reserve_and_begin_validation.bind(this, testConfig, eventConfig, poll_for_validation);

    // Begin the process
    reserve_and_begin_validation();
};

TestEvent.cancelTestEvent = function (id, callback) {
    request
        .post('/ixia/schedule/test-events/' + id + '/cancel')
        .use(no_cache)
        .send('')
        .set('Accept', 'application/json')
        .end(function (err, res) {
            if (err || res.body.result === 'FAILURE') {
                window.logger.error(err || res.body);
                window.util.lightbox.error(window.translate("Canceling scheduled test"));
                return;
            }

            return callback(res);
        });
};

/**
 * Performs server-side validation
 */
TestEvent.reserve_and_begin_validation = function (test_config, event_config, success) {
    var status = window.translate('Validating schedule'),
        lb = new LightboxWorkingViewModel('working', status),
        url = '/sp/ixiahedule/pending-events',
        data = {
            'test_config': test_config,
            'event_config': event_config
        };

    window.util.lightbox.working(lb);

    if (event_config.id) {
        data.event_id = event_config.id;
    }

    request.post(url)
        .use(no_cache)
        .send(JSON.stringify(data))
        .set('Accept', 'application/json')
        .end(handler_factory(status, success));
};

TestEvent.poll_for_validation = function (success) {
    var status = window.translate('Validating Test Configuration...'),
        lb = new LightboxWorkingViewModel('working', status),
        again, // Set in poll()
        handle_success = function (response) {
            var is_running = !response.body.is_ready && response.body.is_valid;

            if (is_running) {
                // Continue polling
                return again();
            }

            // Validation completed
            poller.stop();

            if (response.body.is_ready) {
                success();
            }
        },
        handle_failure = function () {
            poller.stop();
        },
        handle_response = handler_factory(status, handle_success, handle_failure),
        poll = function (next) {
            again = next;

            request.get('/spire/ixiastestready')
                .use(no_cache)
                .set('Accept', 'application/json')
                .end(handle_response);
        },
        poller = new AsyncPoller(poll, 500);

    window.util.lightbox.working(lb);

    // Start polling
    poller.poll();
};

TestEvent.create = function (test_config, event_config, success) {
    var status = window.translate('Saving scheduled test'),
        lb = new LightboxWorkingViewModel('working', status),
        url = '/spirent//ixia/test-events',
        data = {
            'test_config': test_config,
            'event_config': event_config
        };

    window.util.lightbox.working(lb);

    request.post(url)
        .use(no_cache)
        .send(JSON.stringify(data))
        .set('Accept', 'application/json')
        .end(handler_factory(status, success));
};

TestEvent.update = function (test_config, event_config, success) {
    var status = window.translate('Updating scheduled test'),
        lb = new LightboxWorkingViewModel('working', status),
        url = '/spirent/schedule/test-events/' + event_config.id,
        data = {
            'test_config': test_config,
            'event_config': event_config
        };

    window.util.lightbox.working(lb);

    request.put(url)
        .use(no_cache)
        .send(JSON.stringify(data))
        .set('Accept', 'application/json')
        .end(handler_factory(status, success));
};

TestEvent.emptyEvent = function(){
    return {
        type: 'SINGLE',
        details: { fire_datetime: moment().utc().add(5, 'minutes').format("YYYY-MM-DD HH:mm") },
        timezone: tz.name()
    }
};

var WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

TestEvent.fromViewModel = function(vm) {
    var result = {
            "name": vm.testEventName(),
            "duration": vm.duration(),
            "timezone": tz.name()
        };

    if (vm.eventId) {
        result.id = vm.eventId;
    }

    if (vm.schedulerRepeat() == false) {
        result.type = "SINGLE";
        result.details = {
                "fire_datetime": vm.selectedScheduleDate() + ' ' + vm.selectedScheduleTime()
            };
    } else {
        result.type = "RECURRING";
        result.details = {
                "repetition_type": vm.repeatType(),
                "interval": parseInt(vm.repeatInterval()),
                "fire_time": vm.selectedScheduleTime(),
                "start_date": vm.selectedScheduleDate()
            };
        switch (vm.repeatEndsOnType()) {
            case "NEVER":
                break;
            case "COUNT":
                result.details.count = parseInt(vm.repeatCount());
                break;
            case "ON":
                result.details.end_date = vm.repeatUntil();
                break;
        }

        switch (vm.repeatType()) {
            case "WEEKLY":
                result.details.days_of_week = vm.selectedWeekdays();
                break;
            case "MONTHLY":
                var date = moment(vm.selectedScheduleDate()),
                    dayOfMonth = date.date(),
                    dayOfWeek = date.day();

                switch (vm.selectedMonthlyRepeatByType()) {
                    case "NTH_DAY":
                        result.details.special_day_of_month = "NTH_DAY";
                        result.details.position_in_month = dayOfMonth;
                        break;
                    case "NTH_WEEKDAY":
                        result.details.special_day_of_month = "NTH_" + vm.selectedScheduleWeekday();
                        result.details.position_in_month = Math.floor(dayOfMonth / 7) + 1; // n-th week in month
                        break;
                }
                break;
        }
    }

    return new this(result);
}

TestEvent.initTestEventFields = function(base) {
    base.eventId = undefined;
    base.atTimeTranslation = translate("at");
    base.forTimeTranslation = translate("for");
    base.scheduleAtestToRunOnTranslation = translate("Run on");
    base.neverTranslation = translate("Repeat forever");
    base.afterTranslation = translate("Stop after");
    base.occurencesTranslation = translate("test(s)");
    base.onTranslation = translate("Stop on");

    base.duration = ko.computed(function() { return base.vmConfiguration.duration() });
    base.durationTranslation = ko.computed(function() { return base.vmConfiguration.duration() + ' ' + translate('min(s)'); });

    base.testEventName = ko.observable(base.vmConfiguration.name());
    base.testEventName.subscribe(function(newVal) {
        if (newVal !== undefined && base.vmConfiguration.name() != newVal) {
            base.vmConfiguration.name(newVal);
        }
    });
    base.availableScheduleTimes = TestEvent.generateAvailableScheduleTimes();
    base.availableRepeaterDisplayTypes = ko.observable([
        {
            value: 'DAILY',
            label: translate(repeater_types_map.DAILY)
        },
        {
            value: 'WEEKLY',
            label: translate(repeater_types_map.WEEKLY)
        },
        {
            value: 'MONTHLY',
            label: translate(repeater_types_map.MONTHLY)
        }
    ]);
    base.availableRepeatIntervals = ko.observable(['1','2','3','4','5','6']);
    base.repeatWeekdays = ko.observable(WEEKDAYS);


    // real data, same fields as in refillTestEventFields
    base.selectedScheduleDate = ko.observable(moment().format("YYYY-MM-DD"));
    base.selectedScheduleWeekday = ko.computed(function() { // this one is not real data, calculation dependencies put it here
        var weekDay = moment(base.selectedScheduleDate()).day();
        if (weekDay == 0)
            weekDay = 7 ;// js sunday is 0
        return WEEKDAYS[weekDay - 1];
    })
    base.selectedScheduleMeridian = ko.observable(moment().add(1, 'hours').format("hh:00 a"));
    base.selectedScheduleTime = ko.computed(function() {
        return moment(base.selectedScheduleMeridian(), "hh:mm a").format("HH:mm");
    });
    base.selectedScheduleTimezone = ko.observable(tz.name());
    base.schedulerRepeat = ko.observable(false);
    base.repeatType = ko.observable(base.availableRepeaterDisplayTypes()[0].value);
    base.repeatTypeTranslation = ko.computed(function () {
        return repeater_types_map[base.repeatType()];
    });
    base.repeatInterval = ko.observable('1');
    base.selectedWeekdays = ko.observableArray([base.selectedScheduleWeekday()]);
    base.selectedMonthlyRepeatByType = ko.observable("");
    base.repeatEndsOnType = ko.observable("ON");
    base.repeatUntil = ko.observable(moment(base.selectedScheduleDate()).add('months', 3).format("YYYY-MM-DD")); // default value: 3 month from today
    base.repeatCount = ko.observable('1');
    // end real data, everything below immediately depends on above


    base.repeaterTitle = ko.computed(function() {
        var result = [translate('every'), base.repeatInterval(), base.repeatTypeTranslation()].join(' ');

        if (base.repeatEndsOnType() == "COUNT") {
            result += ', ' + base.repeatCount() + ' ' + translate("time(s)");
        }

        if (base.repeatEndsOnType() == "ON") {
            result += " " + translate("until") + " " + base.repeatUntil();
        }
        return result + ".";
    })

    base.timezone = ko.computed(function() {
        var tz = base.selectedScheduleTimezone();

        tz = tz.replace('_', ' ');

        return '(' + tz + ')';
    });

}

// XXX ugly, but looks like no way to reapply whole sub-view-model in KO? elaborate and refactor.
TestEvent.prototype.refillTestEventFields = function(base) {
    var local_timezone = tz.name(),
        fire_datetime = moment.tz(this.fire_Datetime(), 'UTC').tz(local_timezone);

    base.eventId = this.get('id') || undefined;
    base.testEventName(this.get('name'));
    base.selectedScheduleDate(fire_datetime.format('YYYY-MM-DD'));
    base.selectedScheduleMeridian(fire_datetime.format('hh:mm a'));
    base.selectedScheduleTimezone(local_timezone);
    base.schedulerRepeat(this.isRecurring());

    // XXX values duplicate with initTestEventFields, find a way to DRY
    base.repeatType(base.availableRepeaterDisplayTypes()[0].value);
    base.repeatInterval('1');
    base.selectedWeekdays([base.selectedScheduleWeekday()]);
    base.selectedMonthlyRepeatByType("");
    base.repeatEndsOnType("ON");
    base.repeatUntil(moment(base.selectedScheduleDate()).add('months', 3).format("YYYY-MM-DD")); // default value: 3 month from today
    base.repeatCount('1');

    // now rewrite fields with real values only
    if (this.isRecurring()) {
        base.repeatInterval(this.get('details').interval.toString());
        base.repeatType(this.get('details').repetition_type);
        switch (base.repeatType()) {
            case "WEEKLY":
                base.selectedWeekdays(this.get('details').days_of_week);
                break;
            case "MONTHLY":
                if (this.get('details').special_day_of_month == 'NTH_DAY') {
                    base.selectedMonthlyRepeatByType('NTH_DAY');
                } else {
                    base.selectedMonthlyRepeatByType('NTH_WEEKDAY');
                }
                break;
        }
        if (this.get('details').count) {
            base.repeatEndsOnType('COUNT');
            base.repeatCount(this.get('details').count);
        } else if (this.get('details').end_date) {
            // ... repeatEndsOnType is already set to ON
            base.repeatUntil(this.get('details').end_date);
        } else {
            base.repeatEndsOnType("NEVER");
        }
    }
}

TestEvent.prototype.fire_Datetime = function() {
    if (this.isRecurring()) {
        return this.get('details').start_date + ' ' + this.get('details').fire_time;
    } else {
        return this.get('details').fire_datetime;
    }
}

TestEvent.prototype.fireDate = function() {
    if (this.isRecurring()) {
        return this.get('details').start_date;
    } else {
        return this.get('details').fire_datetime.split(' ')[0];
    }
}

TestEvent.prototype.fireTime = function() {
    if (this.isRecurring()) {
        return this.get('details').fire_time;
    } else {
        return this.get('details').fire_datetime.split(' ')[1];
    }
}

TestEvent.prototype.isRecurring = function() {
    return this.get('type') == 'RECURRING';
}

TestEvent.generateAvailableScheduleTimes = function() {
    var times = [];

    for (var i = 0; i <= 23; ++i) {
        times.push("" + i + ":" + "00");
        times.push("" + i + ":" + "30");
    }

    return times;
}

module.exports = TestEvent;

