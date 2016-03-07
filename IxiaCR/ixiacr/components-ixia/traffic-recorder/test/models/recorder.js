var Model = require('model'),
    Main = require('traffic-recorder'),
    Recorder = require('traffic-recorder/models/recorder.js'),
    Collection = require('traffic-recorder/models/recorder-collection.js'),
    Capture = require('traffic-recorder/models/capture.js'),
    Int = require('interface-model');

//var int = new Int({physical_port: 1});
//
//var r = new Recorder({interfaces: [int]});
//console.info('New recorder', r.toJSON());
//
//r.start();
//console.info('Starting a recorder', r.toJSON());
//
//r.max_packet_length_in_bytes(0);
//r.stop_at_bytes(1);
//r.packet_count(2);
//r.time_in_secs(3);
//r.save();
//console.info('Saving some changes', r.toJSON());
//
//// Loading a recorder
//r = Recorder.get(1, function (r) {
//    console.info('Loading a recorder', r.toJSON());
//});
//
//// Loading a capture
//Capture.get(1, function (c) {
//    console.info('Loading a capture', c.toJSON());
//});
//
//Capture.get_for_recorder(1, function (cap) {
//    console.info('Getting captures', cap.toJSON());
//});
//
//var c = new Capture({id: 1});
//c.download();
//console.info('Getting pcap data', c.toJSON());

var c = new Collection();
c.on('added', function (item) {
    console.info("Added recorder: ", item.toJSON());
});
c.push(new Recorder({id: 12}));
c.push(new Recorder({id: 13}));

var main = new Main(c, [
    {physical_port: function () { return 1; }, on: function () {}},
    {physical_port: function () { return 2; }, on: function () {}},
    {physical_port: function () { return 3; }, on: function () {}},
    {physical_port: function () { return 4; }, on: function () {}}
]);
console.info('Rendering main');
document.body.appendChild(main.render());
c.push(new Recorder());