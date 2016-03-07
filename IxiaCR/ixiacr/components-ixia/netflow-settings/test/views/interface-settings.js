/*global describe: true, it: true */

(function () {
    var assert = require('chai').assert,
        sinon = require('sinon'),
        InterfaceSettings = require('netflow-settings/views/interface-settings.js'),
        Model = require('interface-model'),
        classes = require('component-classes'),
        noop = function () {
        },
        trigger = require('johntron-trigger-event');

    describe('InterfaceSettings', function () {
        describe('.render()', function () {
            it('should reflect interface state (enabled/disabled)', function () {
                var model = new Model({ enabled: true }),
                    settings = new InterfaceSettings(model),
                    $checkbox = settings.$el.querySelector('.export input');

                settings.render();
                assert.ok($checkbox.checked);

                model.enabled(false);
                settings.render();
                assert.ok(!$checkbox.checked);
            });

            it('should show list of collectors when interface is enabled', function () {
                var model = new Model({ enabled: true }),
                    settings = new InterfaceSettings(model),
                    $collectors,
                    hidden;

                settings.render();

                $collectors = settings.$el.querySelector('.collectors');
                hidden = classes($collectors).has('hidden');
                assert.ok(!hidden);
            });

            it('should hide list of collectors when interface is disabled', function () {
                var model = new Model({ enabled: false }),
                    settings = new InterfaceSettings(model),
                    $collectors,
                    hidden;

                settings.render();

                $collectors = settings.$el.querySelector('.collectors');
                hidden = classes($collectors).has('hidden');
                assert.ok(hidden);
            });

            it('should call .bind()', function () {
                var model = new Model({ enabled: true }),
                    settings = new InterfaceSettings(model);

                settings.bind = sinon.spy();
                settings.render();

                assert.ok(settings.bind.calledOnce);
            });

            it('should return a DOM element', function () {
                var model = new Model({ enabled: true }),
                    settings = new InterfaceSettings(model),
                    $el = settings.render();

                assert.ok($el.tagName !== undefined);
            });
        });

        describe('.is_visible()', function () {
            it('should return true if showing', function () {
                var model = new Model(),
                    settings = new InterfaceSettings(model);

                settings.show();

                assert.ok(settings.is_visible());
            });

            it('should return false if not showing', function () {
                var model = new Model(),
                    settings = new InterfaceSettings(model);

                settings.hide();

                assert.notOk(settings.is_visible());
            });
        });

        describe('.bind()', function () {
            it('should call .enable(state) when checkbox changes', function () {
                var model = new Model({ enabled: true }),
                    settings = new InterfaceSettings(model),
                    $checkbox = settings.$el.querySelector('.export input');

                settings.enable = sinon.spy();
                settings.bind();
                trigger($checkbox, 'change');

                assert.ok(settings.enable.calledOnce);
            });
        });

        describe('.setInterface()', function () {
            it('should update .model', function () {
                var dummy = {model: undefined},
                    expected = 'expected';

                InterfaceSettings.prototype.setInterface.call(dummy, expected);

                assert.strictEqual(dummy.model, expected);
            });
        });

        describe('.enable()', function () {
            it('should update model', function () {
                var enabled = sinon.spy(),
                    model = new Model(),
                    settings = new InterfaceSettings(model);

                model.enabled = enabled;
                settings.render = noop;
                settings.enable(true);

                assert.ok(enabled.calledOnce);
                assert.ok(enabled.getCall(0).args[0]);
            });
        });
    });
})();
