/**
 * Implements the delegated behavior of the traffic player
 * when loaded from the Calendar or a scheduled test.
 * See parent, TestViewModel.
 */

var domify = require('domify'),
    template = domify(require('../templates/traffic-player-header.js')),
    ko = window.ko,
    TestEvent = require('../test-event.js'),
    tz = require('../tz.js'),
    util = require('utility-functions'),
    validate = require('validate-form'),
    classes = require('classes'),
    moment = require('moment'),
    event = require('event');

require('bootstrap-timepicker'); //bootstrap-timepicker

function SchedulerHeaderDelegate(calendar) {
    this.calendar = calendar;
    this.parent = undefined;
    this.$el = undefined;
    this.validator = undefined;
    this.update_validator = undefined;
    this.strings = {
        'Field is required': window.translate('Field is required'),
        "Must be a date in format YYYY-MM-DD": window.translate("Must be a date in format YYYY-MM-DD"),
        "Select at least one day of the week": window.translate("Select at least one day of the week"),
        "Choose one": window.translate("Choose one"),
        "Please enter a number of 1 or more": window.translate("Please enter a number of 1 or more"),
        "Invalid schedule for test": window.translate("Invalid schedule for test"),
        "Test Configuration Error": window.translate("Test Configuration Error"),
        "Maximum 128 characters.": window.translate("Maximum 128 characters")
    };
}

SchedulerHeaderDelegate.prototype.setParent = function (parent) {

    TestEvent.initTestEventFields(parent);
    parent.testTemplateName = ko.observable('placeholder-template');
    this.parent = parent;
};

SchedulerHeaderDelegate.prototype.canRenderTab = function (tab_name) {
    return 'calendar' === tab_name;
};

SchedulerHeaderDelegate.prototype.render = function () {
    this.$el = template.cloneNode(true);

    ko.applyBindings(this.parent, this.$el);

    this.bind();

    $(this.$el).find("#timepicker1").timepicker({minuteStep: 1,
                template: false,
                showMeridian: true,
                defaultTime: false});

    return this.$el;
};

SchedulerHeaderDelegate.prototype.bind = function () {
    var self = this,
        $repeat = this.$el.querySelector('#repeat-toggle'),
        $repeat_type = this.$el.querySelector('.repeat-type select'),
        $repeatEndsOnTypes = this.$el.querySelectorAll('.ends [type="radio"]');

    self.bindValidator();
    event.bind($repeat, 'click', self.bindValidator.bind(self));
    event.bind($repeat_type, 'change', self.bindValidator.bind(self));
    [].forEach.call($repeatEndsOnTypes, function($el){
        event.bind($el, 'click', self.bindValidator.bind(self));
    });


};

SchedulerHeaderDelegate.prototype.openTestCreationLightbox = function() {
    var tmp = new TestEvent(TestEvent.emptyEvent()),
        complete = function(){
            var lightboxViewModel = new LightboxViewModel(this.parent);
            ko.applyBindings(lightboxViewModel, document.getElementById("lightbox"));
        }.bind(this);

    tmp.refillTestEventFields(this.parent);

    this.parent.ensureUnreservedOrFail(function() {
        util.lightbox.open({
            url: "html/lightbox_tmpl",
            selector: "#lightbox-create-test-tmpl",
            cancelSelector: ".cancel-button",
            onOpenComplete: complete
        });
    });
}

SchedulerHeaderDelegate.prototype.loadTest = function(testConfiguration, testEvent) {
    var calendar = this.calendar,
        parent = this.parent;

    if (testEvent) {
        testEvent.refillTestEventFields(parent);
    } else {
        if (parent.testEventName() === undefined) {
            parent.testEventName(testConfiguration.name());
        }
    }

    // XXX code mostly COPIED from test-view-model and ixia-view-model, DRY!
    parent.ensureUnreservedOrFail(function() {
        parent.hasResults(false);
        parent.vmResults.percentComplete(null);
        parent.vmDocumentation.loadTest(testConfiguration);
        parent.vmConfiguration.loadTest(testConfiguration, function() {
            parent.selectTab('configuration');
            if ($('#test-template').length == 0) {
                util.getTemplate('html/test_tmpl', '#test-template', function(template) {
                    parent.testTemplateName('test-template');
                    calendar.schedulingCalendarVisible(false);
                })
            } else {
                parent.testTemplateName('test-template');
                calendar.schedulingCalendarVisible(false);
            }
        });
    });
}

SchedulerHeaderDelegate.prototype.openSaveModal = SchedulerHeaderDelegate.prototype.save = function() {
    var base = this.parent,
        result = new ValidationResultsViewModel(base.vmConfiguration),
        result = base.delegate.validate(result);
    if(!result.is_valid){
        return;
    }

    var saveHandler = this.saveHandler.bind(this),
        valid = function () {
            var event_config = TestEvent.fromViewModel(base).toJSON();

            TestEvent.createOrUpdateTestEvent(
                base.vmConfiguration.toFlatObject(),
                event_config,
                saveHandler
            );
        },
        invalid = function (result) {
            window.logger.error('Scheduler validation failed', result);
        },
        reserve_handler = function(data,error){
            if(error){
                util.lightbox.openError(window.translate('Error'), window.translate('Unable to get reservation status.'));
                window.logger.error(error);
                return;
            }


            var reserved_info = data.reserved_remotely;
            if(reserved_info.reserved === false){
                util.lightbox.working(new LightboxWorkingViewModel(translate("Start"), translate("Validating Test...")));

                try {
                    base.validate(valid, invalid);
                } catch(e) {
                    window.logger.error(e + e.stack);
                }
            }
            else if(reserved_info.is_reserved_by_me === true){
                self.lightboxText = translate('A test is already running.  Please wait for the current test to complete before loading a new test.');
                util.lightbox.open({
                    url : 'html/lightbox_tmpl',
                    selector : '#lightbox-message-template',
                    cancelSelector: '.ok-button',
                    onOpenComplete: function(){
                        ko.applyBindings(self, document.getElementById('lightbox-message'));
                    }
                });
            } else {
                self.lightboxText = translate('This Axon chassis is currently reserved.<br/><br/>' +
                    'User: {user}<br/>From: {from}<br/>Since: {since}<br/><br/>' +
                    'Please wait for the chassis to become available before loading a test.<br><br>', {
                    user: reserved_info.reserved_by,
                    from: reserved_info.reserved_addr,
                    since: reserved_info.reserved_since
                });
                util.lightbox.open({
                    url : 'html/lightbox_tmpl',
                    selector : '#lightbox-reserved-template',
                    cancelSelector: '.ok-button',
                    onOpenComplete: function(){
                        ko.applyBindings(self, document.getElementById('lightbox-message'));
                    }
                });
            }
        };

    util.get_chassis_reservationa_status(reserve_handler);
};

SchedulerHeaderDelegate.prototype.closeTestEditor = function() {
    this.calendar.schedulingCalendarVisible(true);
    this.reset_Template();
};

function get_form_value(default_getter, $el) {
    var $group;

    if (classes($el).has('days-of-week')) {
        $group = $el.querySelectorAll('[type=checkbox]');
        return [].filter.call($group, function ($item) {
            return $item.checked;
        }).map(function ($item) {
            return $item.value;
        }).join(',');
    }

    if (classes($el).has('repeat-by')) {
        $group = $el.querySelectorAll('[type=radio]');
        return [].filter.call($group, function ($item) {
            return $item.checked;
        }).map(function ($item) {
            return $item.value;
        }).join('');
    }

    return default_getter($el);
}

function mark_invalid ($el, message) {
    var $old = $el.parentNode.querySelectorAll('label.validator-message'),
        $message = document.createElement('label');

    // Remove old validation messages
    [].forEach.call($old, function ($el) {
        $el.parentNode.removeChild($el);
    });
    classes($el).remove('invalid');

    // Add new message
    classes($message).add('validator-message');
    $message.innerHTML = message;
    $el.parentNode.appendChild($message);
    classes($el).add('invalid');
}

SchedulerHeaderDelegate.prototype.bindValidator = function () {
    if(!this.$el){
       return;
    }
    window.util.clear_all_validation_messages(this.$el);

    var self = this,
        default_getter,
        $name = this.$el.querySelector('.test-name input'),
        $date = this.$el.querySelector('input.date'),
        $time = this.$el.querySelector('.time'),
        $days,
        $end_count,
        $end_on,
        $repeat_by;

    this.validator = validate(this.$el);

    default_getter = this.validator.adapter.value.bind(this.validator.adapter);

    this.validator
        .on('blur')
        .value(get_form_value.bind(this, default_getter))
        .invalid(mark_invalid);

    this.validator.field($name)
        .is('required', this.strings['Field is required'])
        .is('maximum', 128, this.strings['Maximum 128 characters.']);

    this.validator.field($date)
        .is('required', this.strings['Field is required'])
        .is(function (value) {
            return moment(value, 'YYYY-MM-DD').isValid();
        }, this.strings['Must be a date in format YYYY-MM-DD']);

    this.validator.field($time)
        .is('required', this.strings['Field is required']);

    if(this.parent.schedulerRepeat()) {
        switch (this.parent.repeatType()) {
            case 'DAILY':
                break;
            case 'WEEKLY':
                // Ensure at least one day is selected
                $days = this.$el.querySelector('.days-of-week');
                this.validator.field($days)
                    .is('required', this.strings["Select at least one day of the week"]);
                break;
            case 'MONTHLY':
                // Ensure user has chosen "day of month" or "day of week"
                $repeat_by = this.$el.querySelector('.repeat-by');
                this.validator.field($repeat_by)
                    .is('required', this.strings["Choose one"]);
                break;
        }

        switch (this.parent.repeatEndsOnType()) {
            case 'COUNT':
                // Ensure user has entered # of tests to end at
                $end_count = this.$el.querySelector('.repeat-count');
                this.validator.field($end_count)
                    .is('required', this.strings["Field is required"])
                    .is(/^[1-9]+[0-9]*$/, this.strings["Please enter a number of 1 or more"]);
                break;
            case 'ON':
                // Ensure user has selected a date to end on
                $end_on = this.$el.querySelector('.ends .date');
                this.validator.field($end_on)
                    .is('required', this.strings['Field is required'])
                    .is(function (value) {
                        return moment(value, 'YYYY-MM-DD').isValid();
                    }, this.strings['Must be a date in format YYYY-MM-DD']);
                break;
        }
    }
};

SchedulerHeaderDelegate.prototype.validate = function (result) {
    var strError = this.strings["Test Configuration Error"],
        invalid_message = this.strings["Invalid schedule for test"];

    this.validator.validate(function (err, valid, message) {
        if (!valid) {
            result.addCheckResults(strError, false, invalid_message);
            result.is_valid = false;
        }
    });
    return result;
};

SchedulerHeaderDelegate.prototype.saveHandler = function (response) {
    var base = this.parent;

    if ('SUCCESS' !== response.body.result) {
        this.parseValidationFailureResults(response.body);
        return; // Short-circuit
    }

    util.lightbox.close();
    base.vmConfiguration.id(response.body.test_id);
    base.vmConfiguration.isDirty = false;
    this.calendar.reloadCalendar();
    this.calendar.schedulingCalendarVisible(true);
    this.reset_Template();
};

SchedulerHeaderDelegate.prototype.afterRender = function () {
    if(this.$el){
        return;
    }

    var self = this,
        selected_tab = self.parent.rootVm.selectedTab(),
        $parent = document.querySelector('#main > .' + selected_tab),
        $header,
        $cont;


    self.render();

    // Remove existing HTML from .test-controller
    $header = $parent.querySelector('.test-controller');
    while ($header.firstChild) {
        $header.removeChild($header.firstChild);
    }

    $cont = $parent.querySelector('.scheduler-configure .container');

    // Append new header delegate view
    $cont.appendChild(self.$el);
}

SchedulerHeaderDelegate.prototype.reset_Template = function () {
    if(this.$el && this.$el.parentNode){
        this.$el.parentNode.removeChild(this.$el)
    }
    this.$el = undefined;
}

SchedulerHeaderDelegate.prototype.parseValidationFailureResults = function (results) {
    var base = this.parent,
        message,
        conflict,
        begin,
        end;

    if (results.reason && 'conflicts_found' === results.reason) {
        results.is_valid = false;
        results.is_ready = false;
        conflict = results.conflicts[0].event_info;
        begin = moment(conflict.datetime);
        end = begin.clone().add({minutes: conflict.duration});
        message = translate('Schedule conflicts with "{name}" at {begin} to {end}.', {
            name: conflict.name,
            begin: begin.format('LLL'),
            end: end.format('LLL')
        });
        results.messages = results.messages || [];
        results.messages.push({
            header: 'Failed',
            content: [message],
            is_error: true
        });
    }

    base.vmConfiguration.parseValidationResults(results);
};

module.exports = SchedulerHeaderDelegate;