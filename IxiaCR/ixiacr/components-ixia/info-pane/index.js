var emitter = require('emitter'),
    util = require('utility-functions'),
    classes = require('classes'),
    event = require('event'),
    Poller = require('async-poller'),
    domify = require('domify'),
    template = domify(require('./template.html')),
    moment = require('moment-timezone');

function InfoPane($parent, spirentEnterpriseVm) {
    this.$parent = $parent;
    this.$el = template.cloneNode(true);
    this.reservation_status = {reserved: false};
    this.reservation_poller = new Poller(this.get_reservation_status.bind(this));
    this.rootVm  = spirentEnterpriseVm;
    this.bind_diskmanagement();
}

emitter(InfoPane.prototype);

InfoPane.prototype.render = function () {
    var reservation = this.reservation_status,
        strings = {
            user: reservation.reserved_by,
            from: reservation.reserved_addr,
            since: moment.tz(reservation.reserved_since, 'UTC').format('LLL')
        },
        self = this,
        space_limit = 5e+9,
        show = false;

    if (!this.$parent.contains(this.$el)) {
        this.$parent.appendChild(this.$el);
    }

    // Remove old messages
    while (this.$el.firstChild) {
        this.$el.removeChild(this.$el.firstChild);
    }

    if (reservation.reserved) {
        if (reservation.is_reserved_by_me === true) {
            // Currently running a test
            var message = 'A test is currently running';
            var $msg = this.add_message(message);
            classes($msg).add('running');
        } else {
            // Another Axon is running a test
            var message = window.translate('This Axon is currently reserved by {user} from {from} since {since}.', strings);
            var $msg = this.add_message(message);
            classes($msg).add('reserved');
        }
        show = true;
    }

    if (self.rootVm.availableDiskSpace() !== undefined && self.rootVm.availableDiskSpace() <= space_limit) {
        self.show_disk_warning();
        show = true;
    }

    if (show) {
        self.show();
    } else {
        self.hide();
    }
};

InfoPane.prototype.add_message = function (str) {
    var $message = document.createElement('div');
    classes($message).add('message');
    $message.innerHTML = str;
    this.$el.appendChild($message);
    return $message;
};

InfoPane.prototype.poll_reservation_status = function () {
    this.reservation_poller.poll();
};

InfoPane.prototype.get_reservation_status = function (callback) {
    callback = callback || function () {};

    var self = this;

    function handle_response(data, error) {
        return

        if (error) {
            util.lightbox.openError(window.translate('Error'), window.translate('Unable to get reservation status.'));
            window.logger.error(error);
            self.emit('update:error', error);
            return callback(error);
        }

        self.reservation_status = data.reserved_remotely;
        self.reservation_status.reserved = self.reservation_status.reserved || false;

        self.emit('update:complete', self.reservation_status);

        if (self.reservation_status.reserved) {
            // Continue
            return callback(null, self.reservation_status);
        }

        self.reservation_poller.stop();
    }

    util.get_chassis_reservationa_status(handle_response);
};

InfoPane.prototype.bind_diskmanagement = function () {
    var self = this;

    self.rootVm.availableDiskSpace.subscribe(function (newVal) {
        self.emit('update:complete', newVal);
    });
};

InfoPane.prototype.show_disk_warning = function () {
    // disk is almost full
    var self = this,
        msg = window.translate('This Axon\'s disk space is almost full. <a href="#">Manage disk usage</a>'),
        $msg = this.add_message(msg);

    classes($msg).add('diskfull');

    function select_disk_management() {
        self.rootVm.vmAdministration.selectTab('disk');
    }

    function goto_disk_management(e) {
        e.preventDefault();
        self.rootVm.selectTab('administration', select_disk_management);
    }

    event.bind($msg.querySelector('a'), 'click', goto_disk_management);
};

InfoPane.prototype.hide = function () {
    classes(this.$el).add('collapsed');
};

InfoPane.prototype.show = function () {
    classes(this.$el).remove('collapsed');
};


module.exports = InfoPane;