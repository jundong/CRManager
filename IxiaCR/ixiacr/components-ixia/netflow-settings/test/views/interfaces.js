/*global describe: true, it: true */

var assert = require('chai').assert,
    sinon = require('sinon'),
    Model = require('interface-model'),
    Interfaces = require('netflow-settings/views/interfaces.js'),
    classes = require('component-classes'),
    trigger = require('johntron-trigger-event'),
    emitter = require('component-emitter'),
    noop = function () {
    };

describe('Interfaces', function () {
    describe('.render()', function () {
        it('should instruct user to choose a port', function () {
            var interfaces = new Interfaces([], true),
                html,
                expected = 'expected';

            interfaces.models = [1];
            interfaces.add = noop;
            interfaces.bind = noop;
            interfaces.hide = noop;

            interfaces.strings["Select a port"] = expected;
            interfaces.render();

            html = interfaces.$el.querySelector('.settings p').innerHTML;
            assert.strictEqual(html, expected);
        });

        it('should hide if appropriate', function () {
            var expected = true,
                interfaces = new Interfaces(null, expected),
                toggle = sinon.spy();

            interfaces.toggle = toggle;
            interfaces.render();

            assert.ok(toggle.calledWith(expected));
        });

        it('should return a DOM element', function () {
            var interfaces = new Interfaces(null, false),
                result;

            interfaces.bind = noop;
            result = interfaces.render();

            assert.ok(result.tagName !== undefined);
        });
    });

    describe('.bind()', function () {
        it('should emit \'changed\' when interface settings change', function (done) {
            var iface = new Model({physical_port: 1}),
                interfaces = new Interfaces([iface]);

            interfaces.render(); // calls .bind()
            interfaces.on('changed', function () {
                done();
            });
            interfaces.views[0].emit('changed');
        });
    });

    describe('.toggle()', function () {
        it('should show', function () {
            var interfaces = new Interfaces(null, false),
                $el = interfaces.$el;

            interfaces.toggle(true);
            assert.notOk(classes($el).has('hidden'));
        });

        it('should hide', function () {
            var interfaces = new Interfaces(null, true),
                $el = interfaces.$el;

            interfaces.toggle(false);
            assert.ok(classes($el).has('hidden'));
        });

        it('should toggle', function () {
            var interfaces = new Interfaces(null, true),
                $el = interfaces.$el;

            interfaces.toggle(true);
            interfaces.toggle();
            assert.ok(classes($el).has('hidden'));
        });
    });

    describe('.add(interface, index)', function () {
        it('should insert 1 settings pane per interface', function () {
            var iface = new Model(),
                num = Math.floor(Math.random() * 16) + 1,
                i = num,
                interfaces = new Interfaces([], true),
                original_length = interfaces.$el.querySelectorAll('.settings > *').length,
                final_length;

            interfaces.bind = noop;
            interfaces.hide = noop;

            while (i) {
                interfaces.add(iface);
                i -= 1;
            }

            final_length = interfaces.$el.querySelectorAll('.settings > *').length;

            assert.strictEqual(final_length - original_length, num);
        });

        it('should hide new settings panes', function () {
            var iface = new Model(),
                interfaces = new Interfaces([], true);

            interfaces.add(iface);

            assert.notOk(interfaces.views[0].is_visible());
        });
    });

    describe('.select(model, $selector)', function () {
        it('should remove "select a port" message', function () {
            var iface = new Model({physical_port: 1}),
                interfaces = new Interfaces([iface]),
                $message;

            interfaces.render();
            $message = interfaces.$el.querySelector('.settings > p');
            interfaces.select(iface);
            assert.notOk(interfaces.$el.contains($message));
        });

        it('should hide settings for other interfaces', function () {
            var iface = new Model({physical_port: 1}),
                other_iface = new Model({physical_port: 2}),
                interfaces = new Interfaces([iface, other_iface]),
                hide;

            interfaces.render();
            hide = sinon.spy(interfaces.views[1], 'hide');

            interfaces.select(iface);
            assert.ok(hide.calledOnce);
        });

        it('should show settings for interface', function () {
            var iface = new Model({physical_port: 1}),
                interfaces = new Interfaces(),
                index = 500;

            interfaces.add(iface, index);
            interfaces.select(iface);
            assert.ok(interfaces.views[index].is_visible());
        });
    });
});
