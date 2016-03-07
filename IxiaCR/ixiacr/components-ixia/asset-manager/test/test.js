/*global describe: true, it: true, before: true, after: true, Image: true */

(function () {

    var assert = require('chai').assert,
        sinon = require('sinon'),
        AssetManager = require('asset-manager');

    describe('AssetManager', function () {
        describe('.queueDownload()', function () {
            it('should push path onto .downloadQueue', function () {
                var manager = new AssetManager();
                manager.queueDownload('.');
                assert.strictEqual(1, manager.downloadQueue.length);
            });

            it('should ignore paths already in .downloadQueue', function () {
                var manager = new AssetManager();
                manager.queueDownload('.');
                manager.queueDownload('.');
                assert.strictEqual(1, manager.downloadQueue.length);
            });
        });

        describe(".downloadAll()", function () {
            it('should fire callback if .downloadQueue empty', function () {
                var manager = new AssetManager(),
                    callback = sinon.spy();

                manager.downloadAll(callback);
                assert.isTrue(callback.called);
            });

            var prevImage;
            before(function () {
                prevImage = Image;
                Image = function () {
                };
            });

            it('should fire callback for each item in .downloadQueue', function () {
                var manager = new AssetManager(),
                    callback = sinon.spy();

                manager.downloadQueue = [
                    '#',
                    '#'
                ];
                Image.prototype.addEventListener = function (event) {
                    if ('load' === event) {
                        callback();
                    }
                };

                manager.downloadAll(callback);
                assert.strictEqual(2, callback.callCount);
                Image = prevImage;
            });

            after(function () {
                Image = prevImage;
            });

            it('should cache items in .downloadQueue', function () {
                var manager = new AssetManager();
                manager.downloadQueue = ['#'];
                manager.downloadAll(function () {
                    assert.strictEqual(1, Object.keys(manager.cache).length);
                });
            });
        });

        describe(".getAsset()", function () {
            it('should return cached item given path', function () {
                var manager = new AssetManager(),
                    expected = 'expected';

                manager.cache[expected] = expected;
                assert.strictEqual(expected, manager.getAsset(expected));
            });
        });

        describe(".isDone()", function () {
            it('should return false if items need to be downloaded', function () {
                var manager = new AssetManager();

                manager.queueDownload('#');
                assert.isFalse(manager.isDone());
            });

            it('should return true if items have downloaded', function () {
                var manager = new AssetManager();

                manager.queueDownload('#');
                manager.successCount = 1;
                assert.isTrue(manager.isDone());
            });

            it('should return true if items have downloaded with errors', function () {
                var manager = new AssetManager();
                manager.queueDownload('#');
                manager.errorCount = 1;
                assert.isTrue(manager.isDone());
            });
        });
    });
})();