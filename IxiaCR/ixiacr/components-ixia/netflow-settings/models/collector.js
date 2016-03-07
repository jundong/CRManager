var model = require('model'),
    defaults = require('model-defaults');


var Collector = model('Collector')
    .route('/netflow-settings/collectors')
    .use(defaults)
    .attr('id')
    .attr('address', {"default": ''})
    .attr('port', {"default": '2055'});

Collector.primaryKey = 'id';

Collector.prototype.destroy = function () {
    this.model.emit('destroying', this);
    this.emit('destroying');
    this.destroyed = true;
    this.model.emit('destroy', this);
    this.emit('destroy');
};

module.exports = Collector;