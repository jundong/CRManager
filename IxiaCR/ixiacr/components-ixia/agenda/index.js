var domify = require('domify'),
    $template = domify(require('./templates/index.js')),
    $loading_more = domify(require('./templates/loading-more.js')),
    classes = require('classes'),
    Model = require('./models/agenda.js'),
    AsyncPoller = require('async-poller'),
    LoadingState = require('loading-state'),
    events = require('event'),
    lightbox = window.util.lightbox,
    request = require('superagent'),
    no_cache = require('superagent-no-cache'),
    moment = require('moment'),
    AgendaEvent = require('./views/agenda-event.js'),
    AgendaDate = require('./views/agenda-date.js');

function AgendaViewModel(){
    this.$el = $template.cloneNode(true);
    this.loading_state = new LoadingState(this.$el);
    this.strings = {
        "Saving": window.translate("Saving")
    };
    this.date_list = new Array();
    this.click_handler = undefined;
    this.max_height = 420;

    //flags for insert empty empty today
    this.earlier_than_today = false;
    this.later_than_today = false;

    this.$loading_more_up = undefined;
    this.$loading_more_down = undefined;
}

AgendaViewModel.factory = function(click_handler){
    var agendavm = new AgendaViewModel(),
        handler = function(model){

            agendavm.render();
            agendavm.bind();
            util.lightbox.close();
        };

    util.lightbox.working(new LightboxWorkingViewModel(window.translate("Start"), window.translate("Loading Calendar Items...")));
    agendavm.set_model(Model.get(handler));

    if(click_handler){
        agendavm.click_handler = click_handler;
    }

    return agendavm;
}

AgendaViewModel.prototype.set_model = function (model) {
    this.model = model;
}

AgendaViewModel.prototype.render = function () {
    var self = this,
        focued_date = self.model.focused_datetime.format("YYYY-MM-DD"),
        today = moment().format("YYYY-MM-DD"),
        date_list = self.date_list;

    if(!self.model){
        //this.render_loading();
        return;
    };

    if(focued_date === today){
        self.earlier_than_today = true;
        self.later_than_today = true;
    }
    else if(focued_date < today){
        self.earlier_than_today = true;
    }
    else{
        self.later_than_today = true;
    }

    if(self.model.current_events && self.model.current_events.length > 0){
        self.model.current_events.forEach(function(agenda_event){
            var date_view = self.get_date_view(agenda_event,'down');
            date_view.append_event(AgendaEvent.factory(agenda_event,self.click_handler));
        });
    }

    //if init agenda is empty
    if(!(focued_date in date_list)){
        self.add_empty_date_view(focued_date,'down','');
    }

    if(!self.model.cached_events_down || self.model.cached_events_down.length === 0){
        self.later_than_today = true;
        if(self.earlier_than_today
            && self.later_than_today
            && !(today in self.date_list)){
            self.add_empty_date_view(today,'down','');
        }
    }

    self.adjust_scroll();
    self.$el.scrollTop = 1;
}

AgendaViewModel.prototype.add_empty_date_view = function (empty_date,direction,message) {
    var self = this,
        date_list = self.date_list;

    var view = new AgendaDate.factory(empty_date, self);
    date_list[empty_date] = view;

    if(direction === 'up'){
        var $date_el = view.render();
        self.$el.insertBefore($date_el,self.$el.firstChild);
        self.adjust_scroll($date_el.offsetHeight);
    }
    else{
        self.$el.appendChild(view.render());
    }
}

AgendaViewModel.prototype.adjust_scroll = function (new_el_offsetHeight) {
    var self = this,
        $el = self.$el;

    if($el.scrollHeight < self.max_height){
        $el.style.height = ($el.scrollHeight - 2) + 'px';
    }
    else{
        $el.style.height = self.max_height + 'px';
        if(new_el_offsetHeight){
            $el.scrollTop = $el.scrollTop + new_el_offsetHeight;
        }
    }
}

AgendaViewModel.prototype.get_date_view = function (agenda_event,direction) {
    var self = this,
        return_view = undefined,
        date_list = self.date_list,
        agenda_date = moment(agenda_event.datetime()).format("YYYY-MM-DD");

    if(!(agenda_date in date_list)){
        var focued_date = self.model.focused_datetime.format("YYYY-MM-DD"),
            today = moment().format("YYYY-MM-DD");
        if(!(focued_date in date_list)
            && agenda_date > focued_date){
            self.add_empty_date_view(focued_date,'down','');
        }

        if(agenda_date < today){
            self.earlier_than_today = true;
        }
        else{
            self.later_than_today = true;
        }

        if(self.earlier_than_today
            && self.later_than_today
            && !(today in date_list)
            && agenda_date !== today){
            self.add_empty_date_view(today,direction,'');
        }

        var date_view = new AgendaDate.factory(agenda_date, self);

        date_list[agenda_date] = date_view;

        if(direction === 'up'){
            var $date_el = date_view.render();
            self.$el.insertBefore($date_el,self.$el.firstChild);
            self.adjust_scroll($date_el.offsetHeight);
        }
        else{
            self.$el.appendChild(date_view.render());
        }

        return_view = date_view;
    }
    else{
        return_view = date_list[agenda_date];
    }

    return return_view;
}

AgendaViewModel.prototype.bind = function () {
    //scroll events
    var self = this,
        scroll_handler = function(){
            if(this.scrollHeight - this.scrollTop === this.clientHeight){
                self.append_events();
                //alert("top");
            }
            if(this.scrollTop === 0){
                self.prepend_events();
            }
        };

    self.$el.onscroll = scroll_handler;
}

AgendaViewModel.prototype.render_loading_more = function (direction) {
    var self = this;

    if(direction === 'up'){
        if(!self.$loading_more_up){
            self.$loading_more_up = $loading_more.cloneNode(true);
            self.$el.insertBefore(self.$loading_more_up,self.$el.firstChild);
            classes(self.$loading_more_up).add('up');
        }
    }
    else{
        if(!self.$loading_more_down){
            self.$loading_more_down = $loading_more.cloneNode(true);
            self.$el.appendChild(self.$loading_more_down);
            classes(self.$loading_more_down).add('down');
        }
    }
}

AgendaViewModel.prototype.remove_loading_more = function (direction) {
    var self = this;

    if(direction === 'up'){
        if(self.$loading_more_up){
            var handler_down = function() {
                self.$el.removeChild(self.$loading_more_up);
                self.$loading_more_up = undefined;
                self.prepend_events();
            }

            classes(self.$loading_more_up).add('disappear');
            setTimeout(handler_down,500);
        }
    }
    else{
        if(self.$loading_more_down){
            var handler_down = function() {
                self.$el.removeChild(self.$loading_more_down);
                self.$loading_more_down = undefined;
                self.append_events();
            }

            classes(self.$loading_more_down).add('disappear');
            setTimeout(handler_down,500);
        }
    }

}

AgendaViewModel.prototype.append_events = function () {
    var self = this,
        $el = self.$el;

    if(self.$loading_more_down){
        return;
    }

    if(self.model.cached_events_down && self.model.cached_events_down.length > 0){
        self.model.cached_events_down.forEach(function(agenda_event){
            var date_view = self.get_date_view(agenda_event,'down');
            date_view.append_event(AgendaEvent.factory(agenda_event,self.click_handler));
        });
        self.model.current_events = self.model.current_events.concat(self.model.cached_events_down);
        self.model.cached_events_down = undefined;
    }
    else if(!self.model.endbottom && $el.scrollHeight - $el.scrollTop === $el.clientHeight)
    {
        //$el.scrollTop = $el.scrollHeight - $el.clientHeight - 1;
        self.render_loading_more('down');
    }

    if(!self.model.endbottom && !self.model.loading_down){
        self.model.load_consecutive_events('down',self.remove_loading_more.bind(self));
    }
    else if(self.model.endbottom){
        var today = moment().format("YYYY-MM-DD");
        self.later_than_today = true;

        if(self.earlier_than_today
            && self.later_than_today
            && !(today in self.date_list)){
            self.add_empty_date_view(today,'down','');
        }
    }
}

AgendaViewModel.prototype.prepend_events = function () {
    var self = this,
        $el = self.$el;

    if(self.$loading_more_up){
        return;
    }

    if(self.model.cached_events_up && self.model.cached_events_up.length > 0){
        self.model.cached_events_up.reverse().forEach(function(agenda_event){
            var $event_el,
                date_view = self.get_date_view(agenda_event,'up');

            $event_el = date_view.prepend_event(AgendaEvent.factory(agenda_event,self.click_handler));

            self.adjust_scroll($event_el.offsetHeight);
        });
        self.model.current_events = self.model.cached_events_up.concat(self.model.current_events);
        self.model.cached_events_up = undefined;
    }
    else if(!self.model.endtop && $el.scrollTop === 0)
    {
        //$el.scrollTop = 1;
        self.render_loading_more('up');
    }

    if(!self.model.endtop && !self.model.loading_up){
        self.model.load_consecutive_events('up',self.remove_loading_more.bind(self));
    }
    else if(self.model.endtop){
        var today = moment().format("YYYY-MM-DD");
        self.earlier_than_today = true;

        if(self.earlier_than_today
            && self.later_than_today
            && !(today in self.date_list)){
            self.add_empty_date_view(today,'up','');
        }
    }
}

AgendaViewModel.prototype.reset = function (if_today) {
    var self = this,
        reload_handler = function () {
            self.clean();
            self.render();
            util.lightbox.close();
        };

    util.lightbox.working(new LightboxWorkingViewModel(window.translate("Start"), window.translate("Loading Calendar Items...")));
    if (if_today) {
        self.model.set_focused_date(moment().startOf('day'));
    }
    self.model.reload(reload_handler);
}

AgendaViewModel.prototype.clean = function () {
    var self = this;

    this.date_list = new Array();

    this.earlier_than_today = false;
    this.later_than_today = false;

    while (self.$el.firstChild) {
      self.$el.removeChild(self.$el.firstChild);
    }

    self.$el.style.height = '';
    self.$loading_more_down = undefined;
    self.$loading_more_up = undefined;

}

AgendaViewModel.prototype.set_search_key = function (search_key) {
    var self = this;
    if(self.model){
        self.model.search = search_key;
    }
}

AgendaViewModel.prototype.get_date = function (format_str) {
    format_str = format_str || 'LL';
    return this.model.focused_datetime.format(format_str);
}

AgendaViewModel.prototype.render_loading = function () {
    var message = 'Loading...';
    this.loading_state.set_el(this.$el);

    this.loading_state.show(message);

    return this.$el;
};


module.exports = AgendaViewModel;