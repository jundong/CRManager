var domify = require('domify'),
    template = require('./template.js'),
    event = require('event'),
    emitter = require('emitter'),
    classes = require('classes');
var mobile = {};
    mobile.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|windows phone/i.test(navigator.userAgent);

function CaptureFilterChooser(string) {
    this.$el = domify(template);
    this.current_filter = string || '';
    this.presets = {
        "TCP only": "tcp",
        "IP only": "ip",
        "No DNS": "tcp port not 53 and udp port not 53",
        "IPv4 address only": "ip host 1.2.3.4",
        "IPv6 address only": "ip6 host 2001::2",
        "Host (MAC) address only": "xx:xx:xx:xx:xx:xx",
        "TCP port": "tcp port 80",
        "Only web traffic": "tcp port 80 or tcp port 443",
        "Multiple hosts": "ip host a or ip6 host b",
        "Source port": "tcp src port 1000",
        "Traffic between hosts": "(ip src a and ip dst b) or (ip src b and ip dst a)"
    };
}

emitter(CaptureFilterChooser.prototype);

CaptureFilterChooser.prototype.set = function (string) {
    this.current_filter = string;
};
CaptureFilterChooser.prototype.get = function () {
    return this.current_filter;
};

CaptureFilterChooser.prototype.render = function () {
    var $presets = this.$el.querySelector('.presets'),
        presets = this.presets,
        label,
        current_filter = this.current_filter,
        filter_string,
        $choice;

    if(mobile.isMobile){
        $($presets).removeAttr("multiple");
        $($presets).css("height","2em");
    }

    $presets.innerHTML = '';

    for (label in presets) {
        if (presets.hasOwnProperty(label)) {
            filter_string = presets[label];
            $choice = domify('<option></option>');
            $choice.innerHTML = label;
            $choice.value = filter_string;
            $choice.selected = current_filter.trim() === filter_string;
            $presets.add($choice);
        }
    }

    this.bind();

    return this.$el;
};

CaptureFilterChooser.prototype.show = function () {
    classes(this.$el).remove('hidden');
};

CaptureFilterChooser.prototype.hide = function () {
    classes(this.$el).add('hidden');
};

CaptureFilterChooser.prototype.bind = function () {
    var select = this.select.bind(this),
        $cancel = this.$el.querySelector('.cancel'),
        hide = this.hide.bind(this),
        $done = this.$el.querySelector('.done');

    event.bind($done, 'click', select);
    event.bind($cancel, 'click', hide);
};

CaptureFilterChooser.prototype.select = function () {
    var $presets = this.$el.querySelector('select.presets'),
        i = $presets.options.selectedIndex,
        $selected;

    if (i !== -1) {
        $selected = $presets.options.item(i);
        this.filter_string = $selected.value;
        this.emit('select', this.filter_string);
    }
};

CaptureFilterChooser.prototype.remove = function () {
    this.$el.parentNode.removeChild(this.$el);
};

module.exports = CaptureFilterChooser;