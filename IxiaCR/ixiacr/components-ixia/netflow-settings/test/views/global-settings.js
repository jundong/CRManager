/*global describe: true, it: true */

(function () {
    var assert = require('chai').assert,
        sinon = require('sinon'),
        Model = require('netflow-settings/models/netflow-settings.js'),
        GlobalSettings = require('netflow-settings/views/global-settings.js'),
        classes = require('component-classes'),
        trigger = require('johntron-trigger-event'),
        emitter = require('component-emitter'),
        noop = function () {
        };

    describe('GlobalSettings', function () {
        describe('.render()', function () {
            it('should show protocol selection', function () {
                var model = new Model(),
                    settings = new GlobalSettings(model),
                    insert_protocols = sinon.spy();

                settings.insertProtocols = insert_protocols;
                settings.render();

                assert.ok(insert_protocols.calledOnce);
            });

            it('should bind events', function () {
                var model = new Model(),
                    settings = new GlobalSettings(model),
                    bind = sinon.spy();

                settings.bind = bind;
                settings.render();

                assert.ok(bind.calledOnce);
            });

            it('should reflect model', function () {
                var expected = true,
                    model = new Model({
                        status: 'enabled',
                        protocol: [
                            {name: 'netflow-v5', selected: false},
                            {name: 'ipfix', selected: true},
                            {name: 'netflow-v9', selected: false}
                        ],
                        active_timeout: 1,
                        inactive_timeout: 2
                    }),
                    settings = new GlobalSettings(model),
                    $el = settings.$el,
                    $protocol = $el.querySelector('.protocol'),
                    $active_timeout = $el.querySelector('#active_timeout'),
                    $inactive_timeout = $el.querySelector('#inactive_timeout'),
                    toggle = sinon.spy();

                settings.toggle = toggle;
                settings.render();

                assert.ok(toggle.calledWith(expected));
                assert.strictEqual($protocol.selectedIndex, 1);
                assert.strictEqual($active_timeout.value, '1');
                assert.strictEqual($inactive_timeout.value, '2');
            });

            it('should return a DOM element', function () {
                var model = new Model(),
                    settings = new GlobalSettings(model),
                    $el;

                $el = settings.render();

                assert.ok($el.tagName !== undefined);
            });
        });

        describe('.insertProtocols()', function () {
            it('should insert element for each protocol', function () {
                var protocol = {name: '', selected: false},
                    protocols = [protocol, protocol, protocol],
                    model = new Model(),
                    settings = new GlobalSettings(model),
                    $protocols;

                settings.insertProtocols(protocols);
                $protocols = settings.$el.querySelectorAll('.protocol option');

                assert.strictEqual($protocols.length, protocols.length);
            });
        });

        describe('.bind()', function () {
            it('should handle protocol change', function () {
                var protocols = [{name: '', selected: false}],
                    model = new Model({protocol: protocols}),
                    settings = new GlobalSettings(model),
                    changed = sinon.spy(),
                    $protocol = settings.$el.querySelector('.protocol');

                settings.protocolChanged = changed;
                settings.bind();

                trigger($protocol, 'change');

                assert.ok(changed.calledOnce);
            });

            it('should handle (in)active timeout changes', function () {
                var model = new Model(),
                    settings = new GlobalSettings(model),
                    active_changed = sinon.spy(),
                    inactive_changed = sinon.spy(),
                    $active_timeout = settings.$el.querySelector('#active_timeout'),
                    $inactive_timeout = settings.$el.querySelector('#inactive_timeout');

                settings.activeTimeoutChanged = active_changed;
                settings.inactiveTimeoutChanged = inactive_changed;
                settings.bind();

                trigger($active_timeout, 'change');
                trigger($inactive_timeout, 'change');

                assert.ok(active_changed.calledOnce);
                assert.ok(inactive_changed.calledOnce);
            });
        });

        describe('.toggle()', function () {
            it('should show', function () {
                var model = new Model(),
                    settings = new GlobalSettings(model),
                    $el = settings.$el;

                settings.toggle(true);
                assert.notOk(classes($el).has('hidden'));
            });

            it('should hide', function () {
                var model = new Model(),
                    settings = new GlobalSettings(model),
                    $el = settings.$el;

                settings.toggle(false);
                assert.ok(classes($el).has('hidden'));
            });

            it('should toggle', function () {
                var enabled = true,
                    model = new Model({enabled: enabled}),
                    settings = new GlobalSettings(model),
                    $el = settings.$el;

                settings.toggle();
                assert.ok(classes($el).has('hidden'));

                settings.toggle();
                assert.notOk(classes($el).has('hidden'));
            });
        });

        describe('.protocolChanged()', function () {
            it('should update model', function () {
                var protocols = [{name: 'netflow-v5'}],
                    model = new Model({protocol: protocols}),
                    settings = new GlobalSettings(model),
                    $protocol = settings.$el.querySelector('.protocol');

                settings.render();
                $protocol.selectedIndex = 0;
                settings.protocolChanged();

                protocols = model.protocol();
                assert.ok(protocols[0].selected);
            });
        });

        describe('.activeTimeoutChanged()', function () {
            it('should update model', function () {
                var model = new Model(),
                    settings = new GlobalSettings(model),
                    $active_timeout = settings.$el.querySelector('#active_timeout'),
                    expected = 1;

                $active_timeout.value = expected;
                trigger($active_timeout, 'change');
                settings.activeTimeoutChanged();

                assert.strictEqual(model.active_timeout(), expected);
            });
        });

        describe('.inactiveTimeoutChanged()', function () {
            it('should update model', function () {
                var model = new Model(),
                    settings = new GlobalSettings(model),
                    $inactive_timeout = settings.$el.querySelector('#inactive_timeout'),
                    expected = 1;

                $inactive_timeout.value = expected;
                trigger($inactive_timeout, 'change');
                settings.inactiveTimeoutChanged();

                assert.strictEqual(model.inactive_timeout(), expected);
            });
        });
    });
})();