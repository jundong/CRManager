function DeviceModelError(message) {
    this.name = 'DeviceModelError';
    this.message = message;
    this.stack = (new Error()).stack;
}
DeviceModelError.prototype = new Error();

module.exports = DeviceModelError;
