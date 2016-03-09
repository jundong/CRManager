var model = require('model'),
    request = require('superagent'),
    no_cache = require('superagent-no-cache'),
    moment = require('moment'),
    _ = require('underscore');

var showEventBalloon = require('./balloon.js'),
    TestEvent = require('./test-event.js'),
    tz = require('./tz.js');

var translate = window.translate,
    ko = window.ko;

var CalendarItem = model('CalendarItem')
                    .attr('name')
                    .attr('type')
                    .attr('duration')
                    .attr('event_info')
                    .attr('test_result_id')
                    .attr('status')
                    .attr('error_reason')
                    .attr('remote_devices')
                    .attr('test_config');


CalendarItem.loadByRange = function(startDate, endDate, callback) {
    var self = this;

    request
        .get('/ixia/schedule/calendar-items')
        .use(no_cache)
        .query('start_date=' + moment(startDate).format("YYYY-MM-DD"))
        .query('end_date=' + moment(endDate).format("YYYY-MM-DD"))
        .query('timezone=' + tz.name())
        .set('Accept', 'application/json')
        .end(function(err, res) {
            var wrappedItems = _.map(res.body.result, function(item) {
                return new self(item);
            });
            callback(wrappedItems);
        })
}

CalendarItem.loadByResultId = function(result_id, callback) {
    var self = this;

    request
        .get('/ixia/schedule/calendar-items')
        .use(no_cache)
        .query('result_id=' + result_id)
        .query('timezone=' + tz.name())
        .set('Accept', 'application/json')
        .end(function(err, res) {
            var wrappedItems = _.map(res.body.result, function(item) {
                return new self(item);
            });
            callback(wrappedItems);
        });
}

CalendarItem.prototype.viewModel = function(checkedDevices, scheduler) {
    var self = this;
    return self.extendWithCalendarFields({
        date: moment(self.get('datetime')).format("YYYY-MM-DD"),
        time: moment(self.get('datetime')).format("HH:mm"),
        duration: self.get('duration') + translate("scheduler.eventlist.message.min"),
        devices: self.prepareDevices(checkedDevices),
        event_info: self.get('event_info'),
        test_config: self.get('test_config'),
        name: self.get('name'),
        status: self.get('status') || 'scheduled',
        error_reason: self.get('error_reason'),
        onClick: function(clickedItem, domEvent) {
            CalendarItem.itemOnClickHandler(domEvent, clickedItem, scheduler);
        },
        hasAnyDevice: function(deviceIds) {
            // NOTE: THIS here, not SELF
            // XXX refactor to underscore
            for (var i=0, len=this.devices.length; i < len; ++i) {
                for (var j=0, len2=deviceIds.length; j < len2; ++j) {
                    if (this.devices[i].id == deviceIds[j]) {
                        return true;
                    }
                }
            }
            return false;
        }

    });
}

/**
 * @param domEvent
 * @param calendarEvent CalendarItem
 * @param scheduler Scheduler
 */
CalendarItem.itemOnClickHandler = function(domEvent, calendarEvent, scheduler) {
    switch (calendarEvent.type) {
        // XXX DRY this two calls
        case "scheduled_test":
            showEventBalloon(
                domEvent.target || domEvent.srcElement,
                calendarEvent.text,
                moment(calendarEvent.start_date).format("LT"),
                calendarEvent.status,
                undefined,
                calendarEvent.devices,

                translate("Delete"),
                function () {
                    TestEvent.cancelTestEvent(calendarEvent.event_id, function() {
                        scheduler.reloadCalendarItems();
                    })
                },

                translate("Edit"),
                function () {
                    var test = new TestTemplateViewModel(scheduler.rootVm);
                    test.inflate(calendarEvent.test_config);
                    scheduler.schedulerTest.loadTest(test, new TestEvent(calendarEvent.event_info));
                }
            );
            break;
        case "executed_test":
            showEventBalloon(
                domEvent.target || domEvent.srcElement,
                calendarEvent.text,
                moment(calendarEvent.start_date).format("LT"),
                calendarEvent.status,
                calendarEvent.error_reason,
                calendarEvent.devices,

                undefined,
                undefined,

                translate("View results"),
                function () {
                    scheduler.openTestResultsPage(calendarEvent.test_result_id);
                }
            );
            break;
    }
}

CalendarItem.prototype.extendWithCalendarFields = function(result) {
    result.type = this.get('type');
    result.text = this.get('name');
    result.start_date = this.get('datetime');
    result.end_date = moment(this.get('datetime')).add("m", this.get('duration')).format("YYYY-MM-DD HH:mm");

    if (this.get('event_info')) {
        result.event_id = this.get('event_info').id;
    }

    if (this.get('test_result_id')) {
        result.test_result_id = this.get('test_result_id');
    }

    return result;
}

//function localDevice() {
//    return {
//        id: -1,
//        name: translate("Local chassis"),
//        host: null
//    };
//}

CalendarItem.prototype.prepareDevices = function(checkedDevices) {
    var devices = [],
        self = this;

    if(self.remote_devices()){
        devices = self.remote_devices();
    }

//    if (this.get('event_info') && this.get('event_info').remote_devices) {
//        devices.concat(this.get('event_info').remote_devices);
//    }
//
//    devices.unshift(localDevice());

    return _.map(devices, function(device) {
        var deviceViewModel = self.createDeviceViewModel(device);
        deviceViewModel.boxCheckerColor = ko.computed(function() {
            if (checkedDevices().indexOf(device.id) == -1) {
                return "transparent";
            } else {
                return CalendarItem.getDeviceColor(device.id);
            }
        });
        return deviceViewModel;
    })
}

// XXX think of a better way to map ids to color
// XXX look here: http://stackoverflow.com/questions/470690/how-to-automatically-generate-n-distinct-colors
var deviceIdToColorMapping = ["#009900", "#96cfde", "#cb96de", "#990000", "#000099", "#999900", "#990099", "#009999"];

CalendarItem.getDeviceColor = function(deviceId) {
    return deviceIdToColorMapping[deviceId-1] || "#ffffff";
}

CalendarItem.prototype.createDeviceViewModel = function(device) {
    var self = this;
    return {
        id: device.id,
        name: device.name,
        color: CalendarItem.getDeviceColor(device.id)
    };
}

module.exports = CalendarItem;
