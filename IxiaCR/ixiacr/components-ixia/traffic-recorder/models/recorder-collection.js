var emitter = require('emitter'),
    Recorder = require('./recorder.js'),
    Interface = require('interface-model');

function Collection() {}
Collection.prototype = Object.create(Array.prototype);

emitter(Collection.prototype);

Collection.get = function (fn) {
    fn = fn || function () {};
    var recorders = new this(),
        map_recorders = function (err, collection) {
            if(collection){
                collection.forEach(function (recorder) {
                    recorder = Recorder.factory(recorder.attrs);
                    recorders.push(recorder, true);
                });
            }
            recorders.emit('reset', recorders);
            fn(recorders);
        };

    Recorder.all(map_recorders);
    return recorders;
};

Collection.prototype.push = function (item, silent) {
    silent = silent || false;
    Array.prototype.push.call(this, item);
    if (!silent) {
        this.emit('added', item);
    }
};

Collection.prototype.indexOf = function (item) {
    var id = item.id(),
        index = -1;

    this.map(function (current, i) {
        if (-1 === index && id === current.id()) {
            index = i;
        }
    });

    return index;
};


module.exports = Collection;