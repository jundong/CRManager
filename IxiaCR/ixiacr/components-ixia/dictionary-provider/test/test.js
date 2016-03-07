/*global beforeEach: true, describe: true, it: true, afterEach: true */

(function () {
    var assert = require('chai').assert,
        sinon = require('sinon'),
        DictionaryProvider = require('dictionary-provider'),
        request = require('superagent'),
        old_end;

    describe('DictionaryProvider', function () {
        beforeEach(function () {
            old_end = request.Request.end;
            request.Request.end = function () {
                this.callback();
            };
        });

        it('should request translation JSON', function (done) {
            sinon.spy(request, 'get');
            var x = new DictionaryProvider('en', function () {
                assert.ok(request.get.calledOnce);
                request.get.restore();
                done();
            });
        });

        it('should cache translation files', function (done) {
            sinon.spy(request, 'get');
            var x = new DictionaryProvider('en', function () {
            });

            x = new DictionaryProvider('en', function () {
                assert.strictEqual(1, request.get.callCount);
                request.get.restore();
                done();
            });
        });

        afterEach(function () {
            request.Request.end = old_end;
        });

        describe('.set()', function () {
            it('should set language to dict', function () {
                var expected = 'expected',
                    lang = 'test',
                    x = DictionaryProvider.set(lang, expected);

                assert.strictEqual(expected, DictionaryProvider.get(lang));
            });
        });

        describe('.get()', function () {
            it('should return undefined if lang not set', function () {
                var lang = 'does not exist';
                assert.strictEqual(undefined, DictionaryProvider.get(lang));
            });
        });
    });
})();