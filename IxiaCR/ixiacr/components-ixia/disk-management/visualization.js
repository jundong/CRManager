var classes = require('classes'),
    slicer = require('color-slicer');

function get_scale_x(domain_max, range_max) {
    return function scale_x(value) {
        return value * range_max / domain_max;
    };
}

function DiskManagementVisualization($el, data) {
    this.$el = $el;
    classes(this.$el).add('visualization');
    this.data = {};
    this.total = 0;
    this.scale_x = function () {};
    this.inflate(data);
}

DiskManagementVisualization.prototype.inflate = function (data) {
    this.data = data;
    this.total = 0;
    Object.keys(data).forEach(function (group) {
        if (group === 'total') {
            return; // short-circuit
        }
        this.total += data[group]();
    }, this);
};

DiskManagementVisualization.prototype.colors = function () {
    var total = Object.keys(this.data).length - 1; // Ignore 'totals' attribute
    return slicer.getColors(total, 20, {bright: true});
};

DiskManagementVisualization.prototype.render = function () {
    var width = this.$el.clientWidth,
        scale_x = get_scale_x(this.total, width),
        colors = this.colors();

    // Remove old elements
    while (this.$el.firstChild) {
        this.$el.removeChild(this.$el.firstChild);
    }

    Object.keys(this.data).forEach(function (group, i) {
        if (group === 'total') {
            return; // short-circuit
        }

        var val = this.data[group](),
            $el = document.createElement('div');

        $el.style.width = scale_x(val) + 'px';
        $el.style.backgroundColor = colors[i];
        classes($el).add(group);
        this.$el.appendChild($el);
    }, this);
    return this.$el;
};

module.exports = DiskManagementVisualization;