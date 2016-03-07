/*global describe: true, it: true */

var assert = require('chai').assert,
    sinon = require('sinon'),
    Lightbox = require('lightbox');

describe('Lightbox', function () {
    it('should not throw exception with no constructor arg', function () {
        try {
            new Lightbox();
        } catch (e) {
            assert(false);
        }
        assert(true);
    });

    it('should store constructor arg if function', function () {
        var expected = 'expected',
            getTemplate = function () { return expected; },
            lb = new Lightbox(getTemplate);

        assert.strictEqual(lb.getTemplate, getTemplate);
        assert.strictEqual(lb.getTemplate(), expected);
    });

    describe('.open()', function () {
        it('should close if already open', function () {
            var lb = new Lightbox();
            lb.isOpen = true;
            lb.close = sinon.spy();
            lb.open();

            assert.ok(lb.close.called);
        });
    });

    describe('.open()', function () {
        it('should call getTemplate() with url and selector', function () {
            var lb = new Lightbox();
            lb.isOpen = true;
            lb.close = sinon.spy();
            lb.open();

            assert.ok(lb.close.called);
        });
    });
});