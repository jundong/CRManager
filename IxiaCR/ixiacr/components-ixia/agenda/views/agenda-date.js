var domify = require('domify'),
    $template = domify(require('../templates/agenda-date.js')),
    moment = require('moment'),
    classes = require('classes');

function AgendaDateModelView(){
    var self = this;
    self.$el = $template.cloneNode(true);
    self.agenda_date = undefined;
    self.events_count = 0;
    self.parent = undefined;
    self.strings = {
        "Today": window.translate("Today")
    };
}

AgendaDateModelView.factory = function(agenda_date, agenda){
    var view = new AgendaDateModelView();
    view.agenda_date = moment(agenda_date);

    if(agenda){
        view.parent = agenda;
    }

    return view;
}

AgendaDateModelView.prototype.render = function(){
    this.bind();
    return this.$el;
}

AgendaDateModelView.prototype.bind = function(){
    var self = this,
        $el = this.$el,
        $title = $el.querySelector('.title');


    if(moment().format("YYYY-MM-DD") === self.agenda_date.format("YYYY-MM-DD")){
        classes($el).add("today");
        $title.textContent = self.strings.Today;
    } else {
        $title.textContent = self.agenda_date.format('dddd, LL');
    }

    if(self.parent && self.parent.get_date("YYYY-MM-DD") === self.agenda_date.format("YYYY-MM-DD")){
        classes($el).add("focused");
    }
}

AgendaDateModelView.prototype.append_event = function(agenda_event_view){
    var self = this,
        $events = self.$el.querySelector('.events'),
        $agenda_event_el = agenda_event_view.render();

    $events.appendChild($agenda_event_el);
    self.events_count++;
    return $agenda_event_el;
}

AgendaDateModelView.prototype.prepend_event = function(agenda_event_view){
    var self = this,
        $events = self.$el.querySelector('.events'),
        $agenda_event_el = agenda_event_view.render();

    $events.insertBefore($agenda_event_el,$events.firstChild);
    self.events_count++;
    return $agenda_event_el;
}

module.exports = AgendaDateModelView;