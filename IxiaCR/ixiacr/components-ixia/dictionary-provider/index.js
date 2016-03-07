var request = require('superagent'),
    no_cache = require('superagent-no-cache'),
    dictionaries = {};

function DictionaryProvider(language, next) {
    if (dictionaries.hasOwnProperty(language)) {
        next(dictionaries[language]);
    }

    // Load the dict before firing callback
    DictionaryProvider.load(language, next);
}

module.exports = DictionaryProvider;

DictionaryProvider.set = function (language, dict) {
    dictionaries[language] = dict;
};

DictionaryProvider.get = function (language) {
    return dictionaries[language];
};

DictionaryProvider.load = function (language, callback) {
    request.get('/static/translations/' + language + '.json?' + window.Axon.build_number)
        .use(no_cache)
        .set('Accept', 'application/json')
        .end(function (res) {

            DictionaryProvider.set(language, res.body);
            callback(DictionaryProvider.get(language));
        });
};