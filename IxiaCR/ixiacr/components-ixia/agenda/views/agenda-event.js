var domify = require('domify'),
    $template = domify(require('../templates/agenda-event.js')),
    classes = require('classes'),
    moment = require('moment'),
    events = require('event');

function AgendaEventViewModel(){
    this.$el = $template.cloneNode(true);
    this.strings = {
        "Saving": window.translate("Saving"),
        "Type": window.translate("Type")
    };
    this.event_handlers = [];
    this.click_handler = undefined;
}

AgendaEventViewModel.factory = function(model,click_handler){
    var view = new AgendaEventViewModel();

    view.model = model;
    //view.model.set_view(view);
    if(click_handler){
        view.click_handler = click_handler;
    }

    return view;
}

AgendaEventViewModel.prototype.bind = function () {
    var self = this,
        $el = self.$el,
        model = self.model,
        $name = $el.querySelector('.description .name'),
        $template_name = $el.querySelector('.test-template'),
        $status = $el.querySelector('.status'),
        $time = $el.querySelector('.time'),
        $duration = $el.querySelector('.duration');

    $name.textContent = model.name();
    if (model.test_config()) {
        $template_name.textContent = self.strings.Type + ': ' + model.test_config().template_name;
        $duration.textContent = model.test_config().duration + (model.test_config().duration === 1?' minute':' minutes');
    }
    classes($status).add(model.status() || 'scheduled');
    $time.textContent = moment(model.datetime()).format('LT');
    $el.setAttribute('event_id', 'AG' + moment(model.datetime()).format("YYYYMMDDHHmmss"));

    if(self.click_handler){
        events.bind($el, 'click', self.click_handler.bind(self));
    }

}

AgendaEventViewModel.prototype.render = function () {
    this.bind();
    return this.$el;
}

AgendaEventViewModel.prototype.destroy = function () {

}


module.exports = AgendaEventViewModel;