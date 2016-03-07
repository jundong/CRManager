/*global describe: true, it: true */

(function () {
    var assert = require('chai').assert,
        sinon = require('sinon'),
        Model = require('netflow-settings/models/collector.js'),
        List = require('netflow-settings/views/collector-list.js'),
        classes = require('component-classes'),
        trigger = require('johntron-trigger-event'),
        emitter = require('component-emitter'),
        event = require('component-event'),
        noop = function () {
        };

    describe('CollectorList', function () {
        describe('.render()', function () {
            it('should add element for each collector', function () {
                var collector = new Model(),
                    list = new List([collector]),
                    add = sinon.spy();

                list.add = add;
                list.render();

                assert.ok(add.calledOnce);
            });

            it('should show message if no collectors', function () {
                var list = new List([]),
                    show_message = sinon.spy();

                list.addEmptyMessage = show_message;
                list.render();

                assert.ok(show_message.calledOnce);
            });

            it('should return an element', function () {
                var list = new List(),
                    $el;

                list.bind = noop;
                $el = list.render();

                assert.ok($el.tagName !== undefined);
            });
        });

        describe('.bindItem(index, $el, view)', function () {
            it('should add mode_changed handler', function () {
                var model = new Model(),
                    view = emitter({}),
                    list = new List([model]),
                    index = 0,
                    $el = document.createElement('div');

                list.bindItem(index, $el, view);

                assert.ok(view.hasListeners('mode_changed'));
            });

            it('should add saved handler', function () {
                var model = new Model(),
                    view = emitter({}),
                    list = new List([model]),
                    index = 0,
                    $el = document.createElement('div');

                list.bindItem(index, $el, view);

                assert.ok(view.hasListeners('saved'));
            });

            it('should add removed handler', function () {
                var model = new Model(),
                    view = emitter({}),
                    list = new List([model]),
                    index = 0,
                    $el = document.createElement('div');

                list.bindItem(index, $el, view);

                assert.ok(view.hasListeners('removed'));
            });

            it('should emit \'changed\' when view is saved', function (done) {
                var model = new Model(),
                    view = emitter({}),
                    list = new List([model]),
                    index = 0,
                    $el = document.createElement('div');

                list.bindItem(index, $el, view);

                list.on('changed', function () {
                    done();
                });

                view.emit('saved', model);
            });

            it('should emit \'changed\' when view is removed', function (done) {
                var model = new Model(),
                    view = emitter({}),
                    list = new List([model]),
                    index = 0,
                    $el = document.createElement('div');

                list.remove = noop;

                list.on('changed', function () {
                    done();
                });

                list.bindItem(index, $el, view);
                view.emit('removed', model);
            });

            it('should remove list item when item\'s view is removed', function () {
                var model = new Model(),
                    view = emitter({}),
                    list = new List([model]),
                    index = 0,
                    $el = document.createElement('div'),
                    remove = sinon.spy().withArgs(1);

                list.remove = remove;

                list.bindItem(index, $el, view);
                view.emit('removed', model);

                assert.ok(remove.calledOnce);
            });
        });

        describe('.add(model|event)', function () {
            it('should add a list item', function () {
                var model = new Model(),
                    list = new List([]);

                list.add(model);

                assert.strictEqual(list.$collectors.length, 1);
            });

            it('should remove empty message', function () {
                var model = new Model(),
                    list = new List([]),
                    $message;

                list.render();
                $message = list.$el.querySelector('.empty-message');
                list.add(model);

                assert.notOk(list.$el.contains($message));
            });

            it('should work as event handler', function () {
                var list = new List([]),
                    $el = document.createElement('div'),
                    $lis = list.$collectors,
                    add = list.add.bind(list);

                list.bindItem = noop;

                event.bind($el, 'click', add);

                trigger($el, 'click');

                assert.strictEqual($lis.length, 1);
            });
        });

        describe('.remove(index)', function () {
            it('should remove item at index', function () {
                var index = 500,
                    list = new List([]),
                    $el = document.createElement('li');

                list.models[index] = {};
                list.$collectors[index] = $el;
                list.views[index] = {};
                list.$el.appendChild($el);

                list.remove(index);

                assert.notOk(list.models[index]);
                assert.notOk(list.$collectors[index]);
                assert.notOk(list.views[index]);
                assert.notOk(list.$el.contains($el));
            });

            it('should show message if no collectors', function () {
                var model = new Model(),
                    list = new List([model]),
                    show_message = sinon.spy();

                list.addEmptyMessage = show_message;
                list.render();
                list.remove(0);
                assert.ok(show_message.calledOnce);
            });
        });
    });
})();