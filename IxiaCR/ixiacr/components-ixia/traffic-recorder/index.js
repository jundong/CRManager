var domify = require('domify'),
    template = domify(require('./templates/index.js')),
    Collection = require('./models/recorder-collection.js'),
    Model = require('./models/recorder.js'),
    View = require('./views/recorder.js'),
    classes = require('classes'),
    event = require('event');

function TrafficRecorder(recorders, ports_observable) {
    this.models = recorders || new Collection();
    this.$el = template;
    this.views = [];
    this.ports_observable = ports_observable;
}

TrafficRecorder.factory = function (ports_observable) {
    var recorders = Collection.get(),
        recorder = new TrafficRecorder(recorders, ports_observable);

    recorder.render();
    return recorder;
};

TrafficRecorder.prototype.render = function () {
    var add = this.add.bind(this);

    this.models.forEach(add);

    this.bind();

    return this.$el;
};

TrafficRecorder.prototype.show = function () {
    var classed = classes(this.$el);
    classed.remove('hidden');
};

TrafficRecorder.prototype.hide = function () {
    var classed = classes(this.$el);
    classed.add('hidden');
};


TrafficRecorder.prototype.add = function (model) {
    var view = new View(model, this.ports_observable),
        $recorders = this.$el.querySelector('.recorders');

    this.views.push(view);
    view.render();
    $recorders.appendChild(view.$el);
};

TrafficRecorder.prototype.remove = function (model) {
    var $recorders = this.$el.querySelector('.recorders'),
        views = this.views;

    views.forEach(function (view, i) {
        if (view.model.id() === model.id()) {
            $recorders.removeChild(view.$el);
            views.splice(i, 1);
        }
    });
};

TrafficRecorder.prototype.bind = function () {
    var remove = this.remove.bind(this),
        add = this.add.bind(this),
        $add = this.$el.querySelector('.add'),
        models = this.models,
        add_clicked = function () {
            var model = new Model();
            models.push(model);
        };

    // DOM -> data
    event.bind($add, 'click', add_clicked);

    // Data -> DOM
    models.on('added', add);
    models.on('removed', remove);
    models.on('reset', function (collection) {
        if (!collection.length) {
            var model = new Model();
            collection.push(model, true);
        }
        collection.forEach(add);
    });

};

module.exports = TrafficRecorder;