/*global describe: true, it: true, before: true, after: true, Image: true */

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

        it('should not be executed on other classes', function () {
            var fake = Object.create(Object);
            fake.prototype.queueDownload = AssetManager.prototype.queueDownload;
            assert.throw(fake.queueDownload, Error);
        });
    });

    describe(".downloadAll()", function () {
        it('should fire callback if .downloadQueue empty', function () {
            var manager = new AssetManager();

            var callback = sinon.spy();
            manager.downloadAll(callback);
            assert.isTrue(callback.called);
        });

        var prevImage;
        before(function() {
            prevImage = Image;
            Image = function() {};
        });

        it('should fire callback for each item in .downloadQueue', function () {
            var manager = new AssetManager();
            manager.downloadQueue = [
                '#',
                '#'
            ];
            Image.prototype.addEventListener = function(event) {
                if ('load' === event) {
                    callback();
                }
            };

            var callback = sinon.spy();
            manager.downloadAll(callback);
            assert.strictEqual(2, callback.callCount);
            Image = prevImage;
        });

        after(function() {
            Image = prevImage;
        });

        it('should cache items in .downloadQueue', function () {
            var manager = new AssetManager();
            manager.downloadQueue = ['#'];
            manager.downloadAll(function() {
                assert.strictEqual(1, Object.keys(manager.cache).length)
            });
        });

        it('should not be executed on other classes', function () {
            var fake = Object.create(Object);
            fake.prototype.downloadAll = AssetManager.prototype.downloadAll;
            assert.throw(fake.downloadAll, Error);
        });
    });

    describe(".getAsset()", function () {
        it('should return cached item given path', function () {
            var manager = new AssetManager();
            var expected = 'expected';
            manager.cache[expected] = expected;
            assert.strictEqual(expected, manager.getAsset(expected));
        });

        it('should not be executed on other classes', function () {
            var fake = Object.create(Object);
            fake.prototype.getAsset = AssetManager.prototype.getAsset;
            assert.throw(fake.getAsset, Error);
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

        it('should not be executed on other classes', function () {
            var fake = Object.create(Object);
            fake.prototype.isDone = AssetManager.prototype.isDone;
            assert.throw(fake.isDone, Error);
        });
    });

    describe(".typesafe()", function () {
        it('should throw Error if used on other classes', function () {
            var fake = Object.create(Object);
            fake.prototype.isDone = AssetManager.prototype.isDone;
            assert.throw(fake.isDone, Error);
        });

        it('should return parameter if instance of AssetManager', function () {
            var expected = new AssetManager;
            assert.strictEqual(expected, AssetManager.typesafe(expected));
        });
    });
});