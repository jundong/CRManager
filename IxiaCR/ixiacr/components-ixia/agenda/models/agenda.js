var request = require('superagent'),
    no_cache = require('superagent-no-cache'),
    AgendaEventModel = require('./agenda-event.js'),
    moment = require('moment'),
    tz = window.jstz.determine();

function AgendaModel(){
    var self = this;
    self.qty = 15;
    self.current_events = undefined;
    self.cached_events_up = undefined;
    self.cached_events_down = undefined;

    self.focused_datetime = moment().startOf('day');
    self.earliest_time = undefined;
    self.latest_time = undefined;
    self.endtop = false;
    self.endbottom = false;
    self.loading_up = false;
    self.loading_bottom = false;
    self.search = '';

}

AgendaModel.get = function(done){
    var model = new AgendaModel();

    model.load_event_by_datetime(done);
    return model;
}

AgendaModel.prototype.reload = function(done){
    var self = this;

    self.current_events = undefined;
    self.cached_events_up = undefined;
    self.cached_events_down = undefined;

    self.earliest_time = undefined;
    self.latest_time = undefined;
    self.endtop = false;
    self.endbottom = false;
    self.loading_up = false;
    self.loading_bottom = false;

    self.load_event_by_datetime(done);
}

AgendaModel.prototype.load_event_by_datetime = function(callback){
    callback = callback || function(){};
    var self = this;

    request
        .get('/ixia/agenda')
        .use(no_cache)
        .query('date_time=' + self.focused_datetime.format("YYYY-MM-DD HH:mm"))
        .query('qty=' + self.qty)
        .query('timezone=' + tz.name())
        .query('search=' + self.search)
        .set('Accept', 'application/json')
        .end(function(error, response){
            var data;

            if(error){
                return callback(null,error);
            };

            if( response.body && response.body.result === 'FAILURE' ){
                return callback(null,response.body.message);
            };

            data =  response.body;

            self.inflate_with_data(data);

            return callback(self);


        });


    return self;
}

AgendaModel.prototype.inflate_with_data = function(data) {
    var self = this;

    if(data.result && data.result.length > 0){
        self.current_events = data.result.map(function(event){
            return AgendaEventModel.factory(event);
        });
    }

    if(data.up && data.up.length > 0){
        self.cached_events_up = data.up.map(function(event){
            return AgendaEventModel.factory(event);
        });
    }

    if(data.down && data.down.length > 0){
        self.cached_events_down = data.down.map(function(event){
            return AgendaEventModel.factory(event);
        });
    }

    if(data.endtop){
       self.endtop = data.endtop;
    }

    if(data.endbottom){
        self.endbottom = data.endbottom;
    }

    if(data.earliest_time){
        self.earliest_time = moment(data.earliest_time);
    }

    if(data.latest_time){
        self.latest_time = moment(data.latest_time);
    }


    //self.earliest_time

}


AgendaModel.prototype.load_consecutive_events = function(direction, callback) {
    callback = callback || function(){};
    var self = this,
        date_time = undefined;

    if(direction === 'up'){
        self.loading_up = true;
        date_time = self.earliest_time;
    }
    else if(direction === 'down'){
        self.loading_down = true;
        date_time = self.latest_time;
    }

    request
        .get('/ixia/agenda/' + direction)
        .use(no_cache)
        .query('date_time=' + date_time.format("YYYY-MM-DD HH:mm"))
        .query('qty=' + self.qty)
        .query('timezone=' + tz.name())
        .query('search=' + self.search)
        .set('Accept', 'application/json')
        .end(function(error, response){
            var data;

            if(error){
                return callback(null,error);
            };

            if( response.body && response.body.result === 'FAILURE' ){
                return callback(null,response.body.message);
            };

            data =  response.body;

            self.inflate_with_data(data);

            //return callback(self);

            if(direction === 'up'){
                self.loading_up = false;
            }
            else if(direction === 'down'){
                self.loading_down = false;
            }
            callback(direction);
        });
}

AgendaModel.prototype.set_focused_date = function(datetime){
    var self = this;
    self.focused_datetime = datetime;
}

AgendaModel.prototype.shift_focused_date = function(days){
    var self = this;
    self.focused_datetime = self.focused_datetime.add('days', days);
}

module.exports = AgendaModel;