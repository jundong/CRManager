var domify = require('domify'),
    classes = require('classes'),
    event = require('event'),
    moment = require('moment'),
    strings = {
        "seconds": window.translate("seconds"),
        "bytes": window.translate("bytes"),
        "packets": window.translate("packets")
    };

function CaptureView(model) {
    this.model = model;
    this.$el = undefined;
}

CaptureView.factory = function (model, template) {
    var view = new this(model);
    view.$el = template.cloneNode(true);

    return view;
};

CaptureView.prototype.render = function () {
    var model = this.model,
        $el = this.$el,
        $title = $el.querySelector('.title'),
        $started = $el.querySelector('.started'),
        $duration = $el.querySelector('.duration'),
        $size = $el.querySelector('.size'),
        $packets = $el.querySelector('.packets'),
        $download = $el.querySelector('.download a'),
        $none = $el.querySelector('.none');

    this.$el = $el;

    if (!model) {
        classes($started).add('hidden');
        classes($duration).add('hidden');
        classes($size).add('hidden');
        classes($packets).add('hidden');
        classes($download).add('hidden');
        classes($none).remove('hidden');
        return $el;
    }

    if ($title) {
        // Only used in capture history
        $title.innerHTML = model.title();
    }
    $started.innerHTML = moment(model.started()).fromNow();
    $duration.innerHTML = model.time_in_secs() + ' ' + strings.seconds;
    $size.innerHTML = model.size_in_bytes() + ' ' + strings.bytes;
    $packets.innerHTML = model.packet_count() + ' ' + strings.packets;
    classes($started).remove('hidden');
    classes($duration).remove('hidden');
    classes($size).remove('hidden');
    classes($packets).remove('hidden');
    classes($none).add('hidden');

    if ('COMPLETED' === model.status() && model.download_uri()) {
        $download.href = model.download_uri();
        classes($download).remove('hidden');
    } else {
        $download.href = '#';
        classes($download).add('hidden');
    }

    return $el;
};

CaptureView.prototype.bind = function () {
    this.model.on('change status', this.render.bind(this));
};

module.exports = CaptureView;