var model = require('model'),
    defaults = require('model-defaults');

var Interface = model('Interface')
    .use(defaults)
    .attr('physical_port')
    .attr('available', {"default": true}) // True if port can be re-allocated
    .attr('allocated_to')
    .attr('enabled', {"default": false});

Interface.primaryKey = "physical_port";

Interface.from_device_view_model = function (view_model) {
    var physical_port = view_model.toFlatObject();
    return new this({physical_port: physical_port});
};

module.exports = Interface;