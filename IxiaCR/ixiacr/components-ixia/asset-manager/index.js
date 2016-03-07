//http://www.html5rocks.com/en/tutorials/games/assetmanager/

function AssetManager() {
    this.successCount = 0;
    this.errorCount = 0;
    this.cache = {};
    this.downloadQueue = [];
}

module.exports = AssetManager;

AssetManager.prototype.queueDownload = function (path) {
    var self = AssetManager.typesafe(this);

    if (self.downloadQueue.indexOf(path) === -1) {
        self.downloadQueue.push(path);
    }
};

AssetManager.prototype.downloadAll = function (callback) {
    var self = AssetManager.typesafe(this);

    if (self.downloadQueue.length === 0 || self.isDone()) {
        callback();
    }

    for (var i = 0; i < self.downloadQueue.length; i++) {
        var path = this.downloadQueue[i];
        var img = new Image();
        img.addEventListener("load", function () {
            self.successCount++;
            if (self.isDone()) {
                callback();
            }
        }, false);
        img.addEventListener("error", function () {
            self.errorCount++;
            if (self.isDone()) {
                callback();
            }
        }, false);
        img.src = path;
        self.cache[path] = img;
    }
};

AssetManager.prototype.getAsset = function (path) {
    var self = AssetManager.typesafe(this);

    return self.cache[path];
}

AssetManager.prototype.isDone = function () {
    var self = AssetManager.typesafe(this);

    return self.downloadQueue.length === self.successCount + self.errorCount;
};

//Type check
AssetManager.typesafe = function (that) {
    if (!(that instanceof AssetManager)) {
        throw new Error('This method must be executed on a AssetManager');
    }

    return that;
};