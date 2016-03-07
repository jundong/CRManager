/*global beforeEach: true, describe: true, it: true, afterEach: true */

var assert = require('chai').assert,
    Translator = require('translator');

describe('Translator', function () {
    it('should return a translate() function', function () {
        var t = Translator();
        assert.strictEqual("[object Function]", Object.prototype.toString.call(t));
    });

    describe('.translate()', function () {
        it('should translate key-value pair with string for value', function () {
            var expected = 'out';
            var t = Translator({
                content: {
                    'in': expected
                }
            });
            assert.strictEqual(expected, t('in'));
        });

        it('should translate key-value pair with interpolation', function () {
            var expected = 'out',
                t,
                actual;

            t = Translator({
                content: {
                    'in': '{placeholder}'
                }
            });

            actual = t('in', {'placeholder': expected});

            assert.strictEqual(actual, expected);
        });

        it('should translate key-value pair with plural indicator', function () {
            var expected = 'out',
                t,
                actual;

            t = Translator({
                pluralFormExpression: '0',
                content: {
                    'in': {
                        0: expected
                    }
                }
            });

            actual = t('in', {'placeholder': expected}, 'placeholder');

            assert.strictEqual(actual, expected);
        });

        it('should translate key-value pair with plural indicator and interpolation', function () {
            var expected = 'out',
                t,
                actual;

            t = Translator({
                pluralFormExpression: '0',
                content: {
                    'in': {
                        0: '{placeholder}'
                    }
                }
            });

            actual = t('in', {'placeholder': expected}, 'placeholder');

            assert.strictEqual(actual, expected);
        });
    });
});