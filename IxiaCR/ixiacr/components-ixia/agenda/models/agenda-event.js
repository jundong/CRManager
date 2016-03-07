var model = require('model'),
    request = require('superagent');

var AgendaEventModel = model('AgendaEventModel')
                    .attr('datetime')
                    .attr('name')
                    .attr('type')
                    .attr('duration')
                    .attr('event_info')
                    .attr('test_result_id')
                    .attr('status')
                    .attr('error_reason')
                    .attr('remote_devices')
                    .attr('test_config');

AgendaEventModel.factory = function(model){
    var model = new AgendaEventModel(model);

    return model;
}


AgendaEventModel.prototype.set_view = function(view){
    this.view = view;
}

AgendaEventModel.prototype.cancelTestEvent = function(done){
    var id = this.event_info().id;
    request
        .post('/spirent/schedule/test-events/' + id + '/cancel')
        .send('')
        .set('Accept', 'application/json')
        .end(function (err, res) {
            if (err || res.body.result === 'FAILURE') {
                window.logger.error(err || res.body);
                window.util.lightbox.error(window.translate("Canceling scheduled test"));
                return;
            }

            return done(res);
        });
}

module.exports = AgendaEventModel;