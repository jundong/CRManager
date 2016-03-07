/*global describe: true, it: true */

(function () {
    var assert = require('chai').assert,
        sinon = require('sinon'),
        Collector = require('netflow-settings/views/collector.js'),
        Model = require('netflow-settings/models/collector.js'),
        classes = require('component-classes'),
        trigger = require('johntron-trigger-event'),
        validate = require('segmentio-validate-form'),
        noop = function () {
        };

    describe('Collector', function () {
        describe('.view()', function () {
            it('should use model to update HTML', function () {
                var address = 'asdf',
                    port = '2',
                    model = new Model({address: address, port: port}),
                    collector = new Collector(model),
                    $address = collector.$view.querySelector('.address'),
                    $port = collector.$view.querySelector('.port');

                collector.view();

                assert.equal($address.innerHTML, address);
                assert.equal($port.innerHTML, port);
            });

            it('should update view\'s $el', function () {
                var model = new Model(),
                    collector = new Collector(model),
                    $prev = document.createElement('div');

                collector.$el = $prev;
                collector.view();

                assert.notEqual(collector.$el, $prev);
            });

            it('should emit a mode_changed event when editing', function (done) {
                var model = new Model(),
                    collector = new Collector(model, true);

                collector.on('mode_changed', function () {
                    done();
                });
                collector.view();
            });

            it('should not emit a mode_changed event when viewing', function () {
                var model = new Model(),
                    collector = new Collector(model, false);

                collector.on('mode_changed', function () {
                    assert.fail();
                });
                collector.view();
            });

            it('should persist a change in state', function () {
                var model = new Model(),
                    previous = true,
                    collector = new Collector(model, previous);

                collector.view();
                assert.equal(collector.editing, !previous);

                previous = !previous;
                collector = new Collector(model, previous);

                collector.view();
                assert.equal(collector.editing, previous);
            });
        });

        describe('.edit()', function () {
            it('should use model to update HTML', function () {
                var address = '1',
                    port = '2',
                    model = new Model({address: address, port: port}),
                    collector = new Collector(model),
                    $address = collector.$edit.querySelector('[name=address]'),
                    $port = collector.$edit.querySelector('[name=port]');

                collector.edit();

                assert.equal($address.value, address);
                assert.equal($port.value, port);
            });

            it('should update view\'s $el', function () {
                var model = new Model(),
                    collector = new Collector(model),
                    $prev = document.createElement('div');

                collector.$el = $prev;
                collector.edit();

                assert.notEqual(collector.$el, $prev);
            });

            it('should emit a mode_changed event when viewing', function (done) {
                var model = new Model(),
                    collector = new Collector(model, false);

                collector.on('mode_changed', function () {
                    assert.ok(true);
                    done();
                });
                collector.edit();
            });

            it('should not emit a mode_changed event when editing', function () {
                var model = new Model(),
                    collector = new Collector(model, true);

                collector.on('mode_changed', function () {
                    assert.fail();
                });
                collector.edit();
            });

            it('should persist a change in state', function () {
                var model = new Model(),
                    previous = false,
                    collector = new Collector(model, previous);

                collector.edit();
                assert.equal(collector.editing, !previous);

                previous = !previous;
                collector = new Collector(model, previous);

                collector.edit();
                assert.equal(collector.editing, previous);
            });
        });

        describe('.save()', function () {
            it('should update model from HTML', function () {
                var address = '1',
                    port = '2',
                    model = new Model({}),
                    collector = new Collector(model, true),
                    $address = collector.$edit.querySelector('[name=address]'),
                    $port = collector.$edit.querySelector('[name=port]');

                $address.value = address;
                $port.value = port;

                collector.save();

                assert.equal(model.address(), address);
                assert.equal(model.port(), port);
            });

            it('should emit a saved event with new model', function (done) {
                var model = new Model(),
                    collector = new Collector(model, true);

                collector.on('saved', function (new_model) {
                    assert.strictEqual(new_model, model);
                    done();
                });
                collector.save();
            });
        });

        describe('.remove()', function () {
            it('should destroy model', function () {
                var destroy = sinon.spy(),
                    model = new Model(),
                    collector = new Collector(model);

                model.destroy = destroy;
                collector.remove();

                assert.ok(destroy.calledOnce);
            });

            it('should emit a removed event with destroyed model', function (done) {
                var model = new Model(),
                    collector = new Collector(model, true);

                collector.on('removed', function (destroyed) {
                    assert.strictEqual(destroyed, model);
                    done();
                });
                collector.remove();
            });
        });

        describe('.render()', function () {
            it('should call .bind()', function () {
                var model = new Model(),
                    collector = new Collector(model),
                    bind = sinon.spy();

                collector.bind = bind;
                collector.render();

                assert.ok(bind.calledOnce);
            });

            it('should call .edit() if editing', function () {
                var model = new Model(),
                    collector = new Collector(model, true),
                    edit = sinon.spy();

                collector.edit = edit;
                collector.bind = noop;
                collector.render();

                collector = new Collector(model, false);
                collector.edit = edit;
                collector.bind = noop;
                collector.render();

                assert.ok(edit.calledOnce);
            });

            it('should call .view() if viewing', function () {
                var model = new Model(),
                    collector = new Collector(model, true),
                    view = sinon.spy();

                collector.view = view;
                collector.bind = noop;
                collector.render();

                collector = new Collector(model, false);
                collector.view = view;
                collector.bind = noop;
                collector.render();

                assert.ok(view.calledOnce);
            });

            it('should return an element', function () {
                var model = new Model(),
                    collector = new Collector(model),
                    $el;

                collector.bind = noop;
                $el = collector.render();

                assert.ok($el.tagName !== undefined);
            });
        });

        describe('.bind()', function () {
            it('should bind edit handler', function () {
                var model = new Model(),
                    collector = new Collector(model),
                    handler = sinon.spy(),
                    $el = collector.$view.querySelector('.edit');

                collector.edit = handler;
                collector.bind();

                trigger($el, 'click');

                assert.ok(handler.calledOnce);
            });

            it('should bind remove handler', function () {
                var model = new Model(),
                    collector = new Collector(model),
                    handler = sinon.spy(),
                    $el = collector.$view.querySelector('.delete');

                collector.remove = handler;
                collector.bind();

                trigger($el, 'click');

                assert.ok(handler.calledOnce);
            });

            it('should bind cancel handler', function () {
                var model = new Model(),
                    collector = new Collector(model),
                    handler = sinon.spy(),
                    $el = collector.$edit.querySelector('.cancel');

                collector.remove = handler;
                collector.bind();

                trigger($el, 'click');

                assert.ok(handler.calledOnce);
            });

            it('should bind save handler', function () {
                var model = new Model(),
                    collector = new Collector(model),
                    handler = sinon.spy(),
                    $el = collector.$edit.querySelector('.save');

                collector.validate = handler;
                collector.bind();

                trigger($el, 'click');

                assert.ok(handler.calledOnce);
            });
        });

        describe('.validate()', function () {
            it('should call .save() if valid', function (done) {
                var model = new Model({address: 'domain.com', port: '1'}),
                    collector = new Collector(model, true),
                    save = sinon.mock(collector).expects('save').once();

                collector.render();
                collector.validate(done, done);
            });

            it('should only call .save() if valid', function (done) {
                var model = new Model(),
                    collector = new Collector(model, true),
                    save = sinon.mock(collector).expects('save').never();

                collector.render();
                collector.validate(done, done);
            });
        });
    });

})();