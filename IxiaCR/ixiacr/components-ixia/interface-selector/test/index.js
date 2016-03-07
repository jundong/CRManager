/*global describe: true, it: true */

var assert = require('chai').assert,
    sinon = require('sinon'),
    Model = require('interface-model'),
    Selector = require('interface-selector'),
    classes = require('component-classes'),
    trigger = require('johntron-trigger-event'),
    emitter = require('component-emitter'),
    noop = function () {
    };

describe('InterfaceSelector', function () {
    it('should emit "select" with: model, $el, index', function (done) {
        var iface = new Model({physical_port: 1}),
            selector = new Selector([iface]),
            $interface;

        selector.render();
        selector.on('select', function (model, $el, index) {
            assert.strictEqual(model.physical_port(), iface.physical_port());
            assert.strictEqual($el, $interface);
            assert.isNumber(index);
            done();
        });

        $interface = selector.$interfaces[0];
        trigger($interface, 'click');
    });

    it('should re-render interface when changes', function (done) {
        var iface = new Model({physical_port: 1, enabled: false}),
            call_count = 0,
            renderer = function () {
                call_count += 1;
                if (call_count === 2) {
                    done();
                }
            },
            selector = new Selector([iface], renderer);

        selector.render(); // Calls renderer and bind
        iface.enabled(true);
    });

    describe('.render()', function () {
        it('should show message when no interfaces', function () {
            var selector = new Selector(),
                html,
                expected = selector.strings["No interfaces"];

            selector.render();

            html = selector.$el.innerHTML;
            assert.strictEqual(html, expected);
        });

        it('should call renderer for each interface', function () {
            var renderer = sinon.spy(),
                num = Math.floor(Math.random() * 10),
                i,
                interfaces = [],
                selector;

            for (i = 0; i < num; i += 1) {
                interfaces.push(new Model());
            }

            selector = new Selector(interfaces, renderer);
            selector.render();

            assert.strictEqual(renderer.callCount, interfaces.length);
        });

        it('should return a DOM element', function () {
            var selector = new Selector(),
                $result;

            selector.bind = noop;
            $result = selector.render();

            assert.ok($result.tagName !== undefined);
        });
    });
});
