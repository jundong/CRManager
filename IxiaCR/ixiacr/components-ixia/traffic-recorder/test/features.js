//(function() {
//var Yadda = require('yadda'),
//    English = Yadda.localisation.English,
//    FeatureParser = Yadda.parsers.FeatureParser,
//    parser = new FeatureParser(English),
//    recorder = require('traffic-recorder/features/recorder.feature.js'),
//    steps = require('traffic-recorder/features/steps/recorder.js'),
//    steps = new Yadda.Yadda(steps),
//    steps = steps.yadda.bind(steps);
//
//mocha.setup('bdd');
//Yadda.plugins.mocha();
//
//feature(recorder, function (feature) {
//    scenarios(feature.scenarios, function(scenario, done) {
//        steps(scenario.steps, done);
//    });
//});
//})();