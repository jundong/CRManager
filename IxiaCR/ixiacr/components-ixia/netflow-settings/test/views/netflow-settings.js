/*global describe: true, it: true */

(function () {
    var assert = require('chai').assert,
        sinon = require('sinon'),
        NetflowSettings = require('netflow-settings'),
        Model = require('netflow-settings/models/netflow-settings.js'),
        classes = require('component-classes'),
        noop = function () {
        },
        trigger = require('johntron-trigger-event');

    describe('NetflowSettings', function () {
        describe('.render()', function () {
            it('should block UI if license not valid', function () {
                var license = 'invalid',
                    model = new Model({license_status: license}),
                    settings = new NetflowSettings(model),
                    render_invalid = sinon.spy();

                settings.renderInvalidLicense = render_invalid;
                settings.render();

                assert.ok(render_invalid.calledOnce);
            });

            it('should reflect model state', function () {
                var status = 'enabled',
                    model = new Model({status: status, license_status: 'valid'}),
                    settings = new NetflowSettings(model),
                    $enable = settings.$el.querySelector('.mode .enable'),
                    $disable = settings.$el.querySelector('.mode .disable');

                settings.render();
                assert.ok($enable.checked);
                assert.notOk($disable.checked);

                model.toggle(false);
                settings.render();
                assert.ok($disable.checked);
                assert.notOk($enable.checked);
            });

            it('should include global settings', function () {
                var model = new Model({license_status: 'valid'}),
                    settings = new NetflowSettings(model),
                    $el = settings.$el,
                    $global_settings = settings.globalSettingsPane.$el;

                settings.render();
                assert.ok($el.contains($global_settings));
            });

            it('should include interfaces', function () {
                var model = new Model({license_status: 'valid'}),
                    settings = new NetflowSettings(model),
                    $el = settings.$el,
                    $interfaces = settings.interfacesPane.$el;

                settings.render();
                assert.ok($el.contains($interfaces));
            });

            it('should bind events', function () {
                var model = new Model({license_status: 'valid'}),
                    settings = new NetflowSettings(model),
                    bind = sinon.stub(settings, 'bind');

                settings.render();
                assert.ok(bind.calledOnce);
                bind.restore();
            });

            it('should return a DOM element', function () {
                var model = new Model({license_status: 'valid'}),
                    settings = new NetflowSettings(model),
                    $el;

                $el = settings.render();

                assert.ok($el.tagName !== undefined);
            });
        });

        describe('.bind()', function () {
            it('should save', function () {
                var model = new Model(),
                    settings = new NetflowSettings(model),
                    save = sinon.mock(settings).expects('save').once(),
                    $save = settings.$el.querySelector('.save');

                settings.render(); // calls bind
                trigger($save, 'click');
            });
        });

        describe('.save()', function () {
            it('should persist model', function () {
                var status = 'enabled',
                    model = new Model({status: status}),
                    save = sinon.stub(model, 'save'),
                    settings = new NetflowSettings(model);

                settings.save();
                assert.ok(save.calledOnce);

                save.restore();
            });
        });

        describe('.remove()', function () {
            it('should remove from DOM', function () {
                var model = new Model(),
                    settings = new NetflowSettings(model),
                    $parent = document.createElement('div');

                $parent.appendChild(settings.$el);

                settings.remove();

                assert.ok(!$parent.contains(settings.$el));
            });
        });

        describe('.toggle()', function () {
            it('should update model', function () {
                var model = new Model(),
                    settings = new NetflowSettings(model),
                    toggle = sinon.spy(),
                    $enable = settings.$el.querySelector('.mode .enable'),
                    $disable = settings.$el.querySelector('.mode .disable');

                settings.toggle = toggle;
                settings.bind();

                trigger($enable, 'change');

                trigger($disable, 'change');
                assert.notOk(model.is_enabled());
            });

            it('should toggle global settings', function () {
                var model = new Model(),
                    settings = new NetflowSettings(model),
                    toggle = sinon.spy();

                settings.globalSettingsPane.toggle = toggle;

                settings.toggle();

                assert.ok(toggle.calledOnce);
            });

            it('should toggle interfaces', function () {
                var model = new Model(),
                    settings = new NetflowSettings(model),
                    toggle = sinon.spy();

                settings.interfacesPane.toggle = toggle;

                settings.toggle();

                assert.ok(toggle.calledOnce);
            });
        });
    });
})();
