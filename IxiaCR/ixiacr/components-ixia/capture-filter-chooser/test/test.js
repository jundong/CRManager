/*global beforeEach: true, describe: true, it: true, afterEach: true */

var assert = require('chai').assert,
    sinon = require('sinon'),
    CaptureFilterChooser = require('capture-filter-chooser'),
    emitter = require('component-emitter'),
    domify = require('component-domify'),
    trigger_event = require('johntron-trigger-event'),
    classes = require('component-classes');

describe('CaptureFilterChooser', function () {
    it('should create a DOM element', function () {
        var chooser = new CaptureFilterChooser();
        assert.ok(chooser.$el.tagName !== undefined);
    });

    it('should support emitter methods', function () {
        var key;

        for (key in emitter.prototype) {
            if (emitter.prototype.hasOwnProperty(key)) {
                assert(CaptureFilterChooser.prototype.hasOwnProperty(key), 'supports Emitter.' + key);
            }
        }
    });

    describe('.emitSave()', function () {
        it('should emit "save"', function () {
            var chooser = new CaptureFilterChooser();
            chooser.emit = sinon.spy();
            chooser.getFilterString = function () {
            };

            chooser.emitSave();

            assert.strictEqual("save", chooser.emit.getCall(0).args[0]);
        });

        it('should emit filter string', function () {
            var chooser = new CaptureFilterChooser(),
                expected = 'expected';
            chooser.emit = sinon.spy();
            chooser.getFilterString = function () {
                return expected;
            };

            chooser.emitSave();

            assert.strictEqual(expected, chooser.emit.getCall(0).args[1]);
        });
    });

    describe('.setFilterString()', function () {
        it('should update input field', function () {
            var chooser = new CaptureFilterChooser(),
                $field = chooser.$el.querySelector('input.filter'),
                expected = 'expected';

            chooser.setFilterString(expected);

            assert.strictEqual($field.value, expected);
        });
    });

    describe('.getFilterString()', function () {
        it('should return input value', function () {
            var chooser = new CaptureFilterChooser(),
                expected = 'expected',
                template = domify('<div><input class="filter" value="' + expected + '" /></div>');

            chooser.$el = template;

            assert.strictEqual(expected, chooser.getFilterString());
        });

        it('should trim input value', function () {
            var chooser = new CaptureFilterChooser(),
                expected = 'expected';

            chooser.$el = {
                querySelector: function () {
                    return {
                        value: ' ' + expected + ' '
                    };
                }
            };

            assert.strictEqual(expected, chooser.getFilterString());
        });
    });

    describe('.render()', function () {
        it('should set presets', function () {
            var chooser = new CaptureFilterChooser();

            chooser.setPresets = sinon.spy();
            chooser.bind = function () {};

            chooser.render();

            assert.ok(chooser.setPresets.calledOnce);
        });

        it('should bind events', function () {
            var chooser = new CaptureFilterChooser();

            chooser.setPresets = function () {};
            chooser.bind = sinon.spy();

            chooser.render();

            assert.ok(chooser.bind.calledOnce);
        });

        it('should return a DOM element', function () {
            var chooser = new CaptureFilterChooser();

            chooser.setPresets = function () {};
            chooser.bind = function () {};

            assert.ok(chooser.$el.tagName !== undefined);
        });
    });

    describe('.show()', function () {
        it('should add hidden class', function () {
            var chooser = new CaptureFilterChooser(),
                classed;

            chooser.show();
            classed = classes(chooser.$el);

            assert.ok(!classed.has('hidden'));
        });

        it('should show presets with nothing selected', function () {
            var chooser = new CaptureFilterChooser(),
                $presets = chooser.$el.querySelector('.presets');

            chooser.render();
            chooser.show();

            assert.strictEqual($presets.selectedIndex, -1);

            [].forEach.call($presets, function ($option) {
                assert.notOk($option.selected);
            });
        });

        it('should forget selected preset when reopening', function () {
            var chooser = new CaptureFilterChooser(),
                $presets = chooser.$el.querySelector('.presets');

            chooser.render();
            chooser.show();
            $presets.selectedIndex = 0;
            $presets.options[0].selected = true;
            chooser.show();

            assert.strictEqual($presets.selectedIndex, -1);

            [].forEach.call($presets, function ($option) {
                assert.notOk($option.selected);
            });
        });
    });

    describe('.hide()', function () {
        it('should remove hidden class', function () {
            var chooser = new CaptureFilterChooser(),
                classed;

            chooser.hide();
            classed = classes(chooser.$el);

            assert.ok(classed.has('hidden'));
        });
    });

    describe('.bind()', function () {
        it('should emit "save" when "enter" key pressed in input field', function (done) {
            var chooser = new CaptureFilterChooser(),
                $text;

            chooser.bind();

            chooser.on('save', function () {
                done();
            });

            $text = chooser.$el.querySelector('input.filter');
            trigger_event($text, 'keyup', {key: 13});
        });

        it('should emit "save" when save button pressed', function (done) {
            var chooser = new CaptureFilterChooser(),
                $button;

            chooser.on('save', function () {
                done();
            });

            chooser.bind();

            $button = chooser.$el.querySelector('.save');
            trigger_event($button, 'click');
        });
    });

    describe('.selectPreset()', function () {
        it('should update text field', function () {
            var chooser = new CaptureFilterChooser(),
                expected = 'expected',
                template = '<div><select class="presets"><option value="' + expected + '" selected></option></select><input class="filter"/></div>',
                actual;

            chooser.$el = domify(template);

            chooser.selectPreset();

            actual = chooser.$el.querySelector('input.filter').value;

            assert.strictEqual(expected, actual);
        });
    });

    describe('.remove()', function () {
        it('should remove itself from DOM', function () {
            var chooser = new CaptureFilterChooser(),
                $parent = document.createElement('div'),
                $el = document.createElement('div');

            chooser.$el = $el;

            $parent.appendChild(chooser.$el);

            chooser.remove();

            assert.notOk($parent.hasChildNodes());
        });
    });
});