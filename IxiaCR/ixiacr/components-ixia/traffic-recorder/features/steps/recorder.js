var assert = require('chai').assert,
    English = require('yadda').localisation.English,
    View = require('../../views/recorder.js'),
    recorder,
    devices = [{id: 1, name: "Default"}];

module.exports = English.library()
    .given("I have no recorder", function (next) {
        next();
    })
    .when("I add a recorder", function (next) {
        recorder = new View(devices);
        recorder.render();
        next();
    })
    .then("the default device is selected", function (next) {
        var device_name = recorder.$el.name,
            default_name = devices[0].name;

        assert.strictEqual(device_name, default_name);
        next();
    })
    .then('the name is "New recorder"')
    .then('no ports are selected')
    .then('the option to truncate packets is not selected')
    .then('none of the stop criteria are selected')
    .then('the capture filter is blank')