var template = require('./templates/index.js'),
    moment = require('moment'),
    domify = require('domify'),
    _      = require('underscore'),
    dhtmlxScheduler = require('./dhtmlxscheduler.js'),
    autoresize = require('./dhtmlxscheduler_container_autoresize.js'),
    event = require('event'),
    TestEvent = require('./test-event.js'),
    CalendarItem = require('./calendar-item.js'),
    EventList = require('./event-list.js'),
    TestViewModel = require('test-view-model'),
    TestViewModelDelegate = require('./delegates/test-view-model.js'),
    instance,
    AgendaViewModel = require('agenda'),
    classes = require('classes'),
    showEventBalloon = require('./balloon.js');

var $ = window.jQuery,
    translate = window.translate,
    ko = window.ko;

function Scheduler(rootVm) {
    var self = this,
        TestViewModel = window.TestViewModel,
        delegate = new TestViewModelDelegate(self);

    self.rootVm = rootVm;
    self.schedulerTest = new TestViewModel(rootVm, delegate);
    self.rendered = false;
    self.$el = domify(template);

    self.calendarItems = ko.observableArray();
    self.unfilteredCalendarItems = ko.observableArray();
    self.updatedItem = new Array();
    self.devices = ko.computed(function() {
        return self.calculateDevicesList(self.unfilteredCalendarItems());
    });

    self.searchText = ko.observable("");
    self.checkedDevices = ko.observableArray([]);

    self.eventList = new EventList();
//    self.rootVm.testResultsHistoryHandlers.push(self);
    self.agenda = undefined;

    self.formats = {
        ldml: {
            date: "YYYY-MM-DD",
            time: "hh:mm"
        },
        strftime: {
            date: "%Y-%m-%d",
            time: "%h:%i"
        }
    };

    self.strings = {
        "Deleting a repeating event will delete all events in the series": window.translate("Deleting a repeating event will delete all events in the series"),
        "Editing a repeating event will update all events in the series": window.translate("Editing a repeating event will update all events in the series")
    };
}

Scheduler.create = function(rootVm) {
    if (!instance) {
        instance = new Scheduler(rootVm);
    }

    return instance;
}

Scheduler.prototype.render = function() {
    try {
        var self = this;

        if (self.rendered) {
            // If user click the 'calendar' tab, we need to check whether we have new history results need to add into Calendar cache
            if (self.updatedItem.length) {
                self.unfilteredCalendarItems(self.unfilteredCalendarItems().concat(self.updatedItem));
                self.calendarItems(self.calendarItems().concat(self.updatedItem));
                self.updatedItem = new Array();
            }

            self.reloadCalendar();

            return;
        }

        self.updatedItem = new Array();
        self.schedulingCalendarVisible = ko.observable(true);
        self.schedulingTestVisible = ko.computed(function () { return !self.schedulingCalendarVisible(); })

        document.querySelector('#main > .calendar').appendChild(self.$el);


        //self.eventList.render(self.calendarItems);

        self.initAgenda();

        self.$el.querySelector('.calendar-agenda-container').appendChild(self.agenda.$el);

        self.initCalendar();

        self.initBindings();

        self.init_render_adjust();

        self.rendered = true;
    } catch(e) { window.logger.error(e + ' stack: ' + e.stack); }
}

Scheduler.prototype.init_render_adjust = function() {
    var self = this,
        $el = self.$el,
        $agenda_button = $el.querySelector(".tab_agenda"),
        $calender_view_buttons = $el.querySelectorAll(".dhx_cal_tab"),
        $calender_date = $el.querySelector(".dhx_cal_date");

    classes($agenda_button).add('active');

    [].forEach.call($calender_view_buttons, function($buttons){
        if(classes($buttons).has('active')){
            classes($buttons).remove('active');
        }
    });

    $calender_date.textContent = self.agenda.get_date();
}

Scheduler.prototype.initAgenda = function() {
    var self = this,
        click_handler = function() {
            var event_self = this,
                $el = this.$el,
                model = this.model,
                devices = model.remote_devices() || [];

            if(devices && devices.length === 0){
                devices.unshift({
                    id: -1,
                    name: translate("Local chassis"),
                    host: null
                });
            }

            switch (model.type()) {
                // XXX DRY this two calls
                case "scheduled_test":
                    showEventBalloon(
                        $el,
                        model.name(),
                        moment(model.datetime()).format("LT"),
                        'scheduled',
                        undefined,
                        devices,

                        translate("Delete"),
                        function () {
                            var cancel_handler = function(){
                                model.cancelTestEvent(function() {
                                    self.agenda.reset(false);
                                })
                            };

                            if(model.event_info() && model.event_info().type === 'RECURRING'){
                                util.lightbox.confirmation_dialog(event_self,self.strings["Deleting a repeating event will delete all events in the series"],cancel_handler);
                            }
                            else{
                                cancel_handler();
                            }
                        },

                        translate("Edit"),
                        function () {
                            var edit_handler = function(){
                                var test = new TestTemplateViewModel(self.rootVm);
                                test.inflate(model.test_config());
                                self.schedulerTest.loadTest(test, new TestEvent(model.event_info()));
                            };

                            if(model.event_info() && model.event_info().type === 'RECURRING'){
                                util.lightbox.confirmation_dialog(event_self,self.strings["Editing a repeating event will update all events in the series"],edit_handler);
                            }
                            else{
                                edit_handler();
                            }
                        }
                    );
                    break;
                case "executed_test":
                    showEventBalloon(
                        $el,
                        model.name(),
                        moment(model.datetime()).format("LT"),
                        model.status(),
                        model.error_reason(),
                        devices,

                        undefined,
                        undefined,

                        translate("View results"),
                        function () {
                            self.openTestResultsPage(model.test_result_id());
                        }
                    );
                    break;

                case "remotely_scheduled_test":
                    showEventBalloon(
                        $el,
                        model.name(),
                        moment(model.datetime()).format("LT"),
                        window.translate('scheduled remotely (read-only)'),
                        model.error_reason(),
                        devices,

                        undefined,
                        undefined,

                        undefined,
                        undefined
                    );
                    break;
            }
        }

    self.agenda = AgendaViewModel.factory(click_handler);
    self.initAgendaBindings();
}

Scheduler.prototype.initCalendar = function() {
    var self = this,
        formats = self.formats.strftime;

    dhtmlxScheduler.config.readonly = true;
    dhtmlxScheduler.config.api_date = formats.date + ' ' + formats.time;
    dhtmlxScheduler.config.xml_date = formats.date + ' ' + formats.time;
    dhtmlxScheduler.config.drag_move = false;
    dhtmlxScheduler.config.drag_resize= false;
    dhtmlxScheduler.config.dblclick_create = false;
    dhtmlxScheduler.config.details_on_dblclick = false;
    dhtmlxScheduler.config.max_month_events = 3;
    dhtmlxScheduler.config.fix_tab_position = false;
    dhtmlxScheduler.config.separate_short_events = true;
    dhtmlxScheduler.xy.bar_height = 47;
    dhtmlxScheduler.xy.scale_width = 60;
    dhtmlxScheduler.xy.min_event_height = 34;
    dhtmlxScheduler.xy.scroll_width = 0;

    dhtmlxScheduler.renderEvent = function(container, event) {
        var event_bar_date = dhtmlxScheduler.templates.event_bar_date(event.start_date, event.end_date, event),
            event_bar_text = dhtmlxScheduler.templates.event_bar_text(event.start_date, event.end_date, event);

        container.innerHTML = event_bar_date + event_bar_text;
        return true;
    };

    dhtmlxScheduler.templates.event_class = function(start, end, calendarItem) {
        return calendarItem.status;
    };

    dhtmlxScheduler.templates.event_bar_icon = function(start, end, calendarItem) {
        var status = calendarItem.status;

        return status === undefined || status === 'pass' ? '' : '<span class="status-icon"></span>';
    };

    dhtmlxScheduler.templates.event_bar_date = function(start, end, calendarItem) {
        var html = dhtmlxScheduler.templates.event_bar_icon(start, end, calendarItem);

        html += ' <b>' + moment(start).format('LT') + '</b>';

        return html;
    };

    dhtmlxScheduler.templates.event_bar_text = function(start, end, calendarItem) {
        // XXX refactor to template!
        var result = "";
        //comment KO way because it conflict with calendar autosize
//        result += '<span class="calendar-item-devices event-devices" data-item-id=' + calendarItem.id + ' data-bind="foreach: devices">';
//        result += '  <span class="icon" data-bind="style: {backgroundColor: color, borderColor: color}"></span>';
//        result += '</span>';
//        result += '<div class="testName"><span title="'+ calendarItem.text+'">' + calendarItem.text + '</span></div>';

        result += '<span class="calendar-item-devices event-devices">';
        calendarItem.devices.forEach(function(device){
            var color = device.color;
            result += '  <span class="icon" style="background-color: '+ color+'; border-color:'+ color+';"></span>';
        });
        result += '</span>';
        result += '<div class="testName"><span title="'+ calendarItem.text+'">' + calendarItem.text + '</span></div>';
        return result;
    }

    dhtmlxScheduler.init('scheduler_here', new Date(), "day");

    self.calendarItems.subscribe(function(newVal) {
        dhtmlxScheduler.clearAll();
        dhtmlxScheduler.parse(newVal, "json");
//        self.bindCalendarDevicesKOHAndlers();
    })

    dhtmlxScheduler.attachEvent("onViewChange", Scheduler.prototype.reloadCalendarItems.bind(this));

    //this.reloadCalendarItems();
}

//Scheduler.prototype.bindCalendarDevicesKOHAndlers = function() {
//    var events = document.querySelectorAll('#scheduler_here .calendar-item-devices'),
//        self = this;
//    _.each(events, function(event) {
//        var itemId = event.dataset.itemId,
//            item = _.find(self.calendarItems(), function(item) { return item.id == itemId });
//        ko.applyBindings(item, event);
//    })
//}

Scheduler.prototype.calculateDevicesList = function(items) {
    // method semantics: items.map(&:devices).flatten.uniq
    // XXX refactor to underscore

    var resultMap = {},
        result = [];

    for (var i = 0, len = items.length; i < len; ++i) {
        var devices = items[i].devices;
        for (var j = 0, len2 = devices.length; j < len2; ++j) {
            resultMap[devices[j].id] = devices[j];
        }
    }

    for(var o in resultMap) {
        result.push(resultMap[o]);
    }

    return result;
}

Scheduler.prototype.reloadCalendarItems = function() {
    var self = this;

    var state = dhtmlxScheduler.getState();
    util.lightbox.working(new LightboxWorkingViewModel(window.translate("Start"), window.translate("Loading Calendar Items...")));
    CalendarItem.loadByRange(state.min_date, state.max_date, function(calendarItems) {
        var items = self.prepareItems(calendarItems);
        self.unfilteredCalendarItems(items);
        self.calendarItems(items);
        util.lightbox.close();
    })
}

Scheduler.prototype.updateCache = function(data) {
    var self = this;
    var tmpCalendarItems = self.calendarItems();
    // Make sure no expired tests existed in Calendar cache
    for (var i = 0; i < tmpCalendarItems.length; i++) {
        var currDate = new Date();
        if (tmpCalendarItems[i].start_date < currDate) {
            if (tmpCalendarItems[i].test_result_id == undefined) {
                self.calendarItems.remove(tmpCalendarItems[i]);
            }
        }
    }

    for (var i = 0; i < data.length; i++) {
        var updateData = data[i];
        for (var j = 0; j < self.calendarItems().length; j++) {
            if (data[i].result_id <= self.calendarItems()[j].test_result_id) {
                updateData = undefined;
                break;
            }
        }
        if (updateData) {
            self.updateCalendarItemByResultId(updateData.result_id);
        }
    }
}

Scheduler.prototype.updateCalendarItemByResultId = function(result_id) {
    var self = this;

    var state = dhtmlxScheduler.getState();
    util.lightbox.working(new LightboxWorkingViewModel(window.translate("Start"), window.translate("Loading Calendar Items...")));
    CalendarItem.loadByResultId(result_id, function(calendarItems) {
        var items = self.prepareItems(calendarItems);
        self.updatedItem = self.updatedItem.concat(items);
        // If current tab is 'calendar', we need to refresh the calendar cache automatically
        if (self.rootVm.selectedTab() == 'calendar') {
            self.unfilteredCalendarItems(self.unfilteredCalendarItems().concat(self.updatedItem));
            self.calendarItems(self.calendarItems().concat(self.updatedItem));
            self.updatedItem = new Array();
        }
        util.lightbox.close();
    })
}

Scheduler.prototype.prepareItems = function(items) {
    var result = [];
    for (var i = 0; i < items.length; i++) {
        result.push(items[i].viewModel(this.checkedDevices, this));
    }

    return result;
}

Scheduler.prototype.reloadCalendar = function() {
    var self = this,
        $el = self.$el,
        $agenda = $el.querySelector(".calendar-agenda-container"),
        $calender = $el.querySelector(".calendar-body");

    if(classes($calender).has('hidden')){
        self.agenda.reset(false);
    }
    else{
        self.reloadCalendarItems();
    }
}

Scheduler.prototype.initAgendaBindings = function() {
    var self = this,
        $el = self.$el,
        $agenda = $el.querySelector(".calendar-agenda-container"),
        $scheduler_here = $el.querySelector("#scheduler_here"),
        $calender = $el.querySelector(".calendar-body"),
        $agenda_button = $el.querySelector(".tab_agenda"),
        $today_button = $el.querySelector(".dhx_cal_today_button"),
        $prev_button = $el.querySelector(".dhx_cal_prev_button"),
        $next_button = $el.querySelector(".dhx_cal_next_button"),
        $calender_view_buttons = $el.querySelectorAll(".dhx_cal_tab"),
        $calender_date = $el.querySelector(".dhx_cal_date"),
        $calender_search = $el.querySelector(".scheduler-search input.shaded");

    var reset_search = function(){
            $calender_search.value = '';
            self.agenda.set_search_key('');
        },
        //agenda date -> calendar date
        sync_date_to_calendar = function(){
            if(window.scheduler && window.scheduler._date){
                window.scheduler._date = new Date(self.agenda.get_date()); //new Date(self.focused_datetime.format('YYYY-MM-DD'));
            }
        },
        //calendar date -> agenda date
        sync_date_from_calendar = function(){
            if(window.scheduler && window.scheduler._date){
                self.agenda.model.set_focused_date(moment(window.scheduler._date).startOf('day'));
            }
        },
        calender_views_handler = function(e){
            reset_search();
            if(classes($calender).has('hidden')){
                classes($calender).remove('hidden');
                classes($agenda).add('hidden');
                classes($agenda_button).remove('active');
            }
        },
        agenda_view_handler = function(e){
            reset_search();
            if(classes($agenda).has('hidden')){
                classes($agenda).remove('hidden');
                classes($agenda_button).add('active');
                classes($calender).add('hidden');
                $scheduler_here.removeAttribute("style");

            }
            [].forEach.call($calender_view_buttons, function($buttons){
                if(classes($buttons).has('active')){
                    classes($buttons).remove('active');
                }
            });
            sync_date_from_calendar();
            self.agenda.reset(false);
            $calender_date.textContent = self.agenda.get_date();
            self.unfilteredCalendarItems([]);
        },
        today_handler = function(e){
            if(classes($calender).has('hidden')){
                if (e && e.stopPropagation) {
                    e.stopImmediatePropagation();
                }
                self.agenda.reset(true);
                $calender_date.textContent = self.agenda.get_date();
                sync_date_to_calendar();
            }
        },
        prev_handler = function(e){
            if(classes($calender).has('hidden')){
                if (e && e.stopPropagation) {
                    e.stopImmediatePropagation();
                }
                self.agenda.model.shift_focused_date(-1);
                self.agenda.reset(false);
                $calender_date.textContent = self.agenda.get_date();
                sync_date_to_calendar();
            }
        },
        next_handler = function(e){
            if(classes($calender).has('hidden')){
                if (e && e.stopPropagation) {
                    e.stopImmediatePropagation();
                }
                self.agenda.model.shift_focused_date(1);
                self.agenda.reset(false);
                $calender_date.textContent = self.agenda.get_date();
                sync_date_to_calendar();
            }
        };

    var done_typing_interval = 1000,
        done_typing = function(){
            self.agenda.reset(false);
        },
        typing_timer,
        search_keyup_handler = function(e){
            if(classes($calender).has('hidden')){
                if (e && e.stopPropagation) {
                    e.stopImmediatePropagation();
                }
                clearTimeout(typing_timer);
                typing_timer = setTimeout(done_typing, done_typing_interval);
                self.agenda.set_search_key($calender_search.value);
            }
        };

    event.bind($today_button, 'click', today_handler);
    event.bind($prev_button, 'click', prev_handler);
    event.bind($next_button, 'click', next_handler);
    event.bind($agenda_button, 'click', agenda_view_handler);
    [].forEach.call($calender_view_buttons, function($buttons){
        event.bind($buttons, 'click', calender_views_handler);
    });

//    event.bind($calender_search, 'input', search_keyup_handler);
    $($calender_search).on('input', search_keyup_handler)

    classes($calender).add('hidden');
}

Scheduler.prototype.initBindings = function() {
    var self = this,
        scheduleButton = document.querySelector(".scheduler-test-button");


    event.bind(scheduleButton, "click", function() {
        self.schedulerTest.openTestCreationLightbox();
    })

    self.devices.subscribe(function(devices) {
        var ids = _.map(devices, function(device) { return device.id });
        self.checkedDevices(ids);
    })


    dhtmlxScheduler.attachEvent("onClick", function(id, e) {
        var calendarEvent = dhtmlxScheduler.getEvent(id);
        CalendarItem.itemOnClickHandler(e, calendarEvent, self);
    })

    self.searchText.subscribe(function(newVal) {
        self.filterItems();
    })

    ko.applyBindings(self, self.$el);
}


Scheduler.prototype.openTestResultsPage = function(test_result_id) {
    var self = this;
    var matchedResults = ko.utils.arrayFirst(self.rootVm.testResultsHistory(), function (item) {
        return item.result_id() === test_result_id;
    });

    if (matchedResults === null) {
        // Keep the context to use it later (In callback function)
        var context = self;
        self.rootVm.getResultHistory({"result_id" : test_result_id}, function(){
            matchedResults = ko.utils.arrayFirst(context.rootVm.testResultsHistory(), function (item) {
                return item.result_id() === test_result_id;
            });

            if (matchedResults !== null) {
                context.rootVm.loadRecentTest(matchedResults)
            }
        });
    } else {
        self.rootVm.loadRecentTest(matchedResults);
    }
}

Scheduler.prototype.filterItems = function() {
    var items = this.unfilteredCalendarItems(),
        filteredItems = this.filterRemoteBoxes(this.filterSearch(items));

    this.calendarItems(filteredItems);
}

Scheduler.prototype.filterSearch = function(items) {
    var result = [],
        searchText = this.searchText();

    for (var i = 0,len = items.length; i < len; ++i) {
        if (items[i].name.toLowerCase().indexOf(searchText.toLowerCase()) != -1) {
            result.push(items[i]);
        }
    }

    return result;
}

Scheduler.prototype.filterRemoteBoxes = function(items) {
    var result = [],
        checkedBoxes = this.checkedDevices();

    for (var i = 0,len = items.length; i < len; ++i) {
        if (items[i].hasAnyDevice(checkedBoxes)) {
            result.push(items[i]);
        }
    }

    return result;
}

Scheduler.prototype.toggleBoxChecker = function(device) {
    if (this.checkedDevices().indexOf(device.id) == -1){
        this.checkedDevices.push(device.id);
    } else {
        this.checkedDevices.remove(device.id);
    }
    this.filterItems();
}


module.exports = Scheduler;
