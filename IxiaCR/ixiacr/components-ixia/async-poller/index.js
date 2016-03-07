function AsyncPoller(fn, delay) {
    this.fn = fn;
    this.delay = delay || 10000;
    this.timeout = undefined;
}

AsyncPoller.prototype.poll = AsyncPoller.prototype.start = function () {
    // Call function immediately, then poll
    this.fn(this.callback.bind(this));
};

AsyncPoller.prototype.stop = function () {
    if (this.timeout) {
        clearTimeout(this.timeout);
    }
};

AsyncPoller.prototype.callback = function () {
    // Always overwrite any previous polling
    this.stop();

    this.timeout = setTimeout(this.poll.bind(this), this.delay); // Recursion
};

module.exports = AsyncPoller;
