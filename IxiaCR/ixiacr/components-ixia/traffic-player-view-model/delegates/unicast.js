var MultiplePortDeviceViewModel = require('device-view-model').MultiplePortDeviceViewModel;

function UnicastTrafficPlayerDelegate(parent) {
    this.parent = parent;

    this.strings = {
        source: window.translate("Tx"),
        destination: window.translate("Rx")
    };
}

UnicastTrafficPlayerDelegate.prototype.inflate = function (data) {
    var parent = this.parent,
        source_data,
        destination_data,
        source = new MultiplePortDeviceViewModel(parent.testConfigVm),
        destination = new MultiplePortDeviceViewModel(parent.testConfigVm);

    // Source
    if (data.source) {
        source_data = data.source.devices ? data.source.devices[0] : data.source;
    }

    source.trafficPlayer = parent;
    source.label(this.strings.source);
    parent.source(source);
    parent.source().inflate(source_data);
    source.on('changed:device', this.onDeviceChange.bind(this, parent.source));

    // Destination
    if (data.destination) {
        destination_data = data.destination.devices ? data.destination.devices[0] : data.destination;
    }

    destination.trafficPlayer = parent;
    destination.label(this.strings.destination);
    parent.destination(destination);
    parent.destination().inflate(destination_data);
    destination.on('changed:device', this.onDeviceChange.bind(this, parent.destination));

    parent.timingAccuracy = destination.timingAccuracy; // Remove once we move unicast timing accuracies to Rx side so they match multicast
};

UnicastTrafficPlayerDelegate.prototype.toFlatObject = function (obj) {
    obj.source = {
        devices: [this.parent.source().toFlatObject()]
    };

    obj.destination = {
        devices: [this.parent.destination().toFlatObject()]
    };

    return obj;
};
UnicastTrafficPlayerDelegate.prototype.validate = function () {};

UnicastTrafficPlayerDelegate.prototype.canAcceptPlaylist = function (playlist) {
    var self = this,
        supported_layers = self.parent.get_supported_layers();

    return playlist.tracks().every(function (track) {
        var accapted_player_types;
        if (track().attributes && track().attributes.player_types) {
            accapted_player_types = track().attributes.player_types;
        } else {
            accapted_player_types = ['unicast']; //backup plan for old custom player
        }
        return supported_layers.indexOf(track().layer()) > -1 && accapted_player_types.indexOf('unicast') > -1;
    });
};

UnicastTrafficPlayerDelegate.prototype.canAcceptTrack = function (track) {
    return track.attributes.player_types.indexOf('unicast') > -1;
};

UnicastTrafficPlayerDelegate.prototype.getDeviceIds = function () {
    var ids = [],
        source = this.parent.source(),
        destination = this.parent.destination(),
        unique = [];

    if (source) {
        ids = ids.concat(source.getDeviceIds());
    }

    if (destination) {
        ids = ids.concat(destination.getDeviceIds());
    }

    ids.forEach(function (id) {
        if (unique.indexOf(id) === -1) {
            unique.push(id);
        }
    });

    return unique;
};

/**
 * Updates source the same way as DeviceCollectionViewModel.onDeviceChange()
 *
 * @param player_device_observable ko.observable TrafficPlayerViewModel.source or .destination
 * @param device TestDeviceViewModel
 */
UnicastTrafficPlayerDelegate.prototype.onDeviceChange = function (player_device_observable, device) {
    var parent = this.parent,
        view_model = new MultiplePortDeviceViewModel(parent.testConfigVm),
        data = {
            device: device.toFlatObject()
        },
        previous = player_device_observable(),
        $previous = previous.$el,
        $parent = $previous.parentNode;

    view_model.label(previous.label());
    player_device_observable(view_model);
    player_device_observable().inflate(data);

    view_model.once('changed:device', this.onDeviceChange.bind(this, player_device_observable));
    previous.off();

    // Render
    view_model.render();
    if (player_device_observable === parent.destination) {
        view_model.show_timing_accuracy();
    }

    $parent.insertBefore(view_model.$el, $previous);
    $parent.removeChild($previous);

    // Notify parent so port status, etc. is updated
    parent.onDeviceChange();
};

UnicastTrafficPlayerDelegate.prototype.setTimingAccuracies = function (accuracies) {
    var self = this,
        source = self.parent.source(),
        destination = self.parent.destination();

    if (source && destination) {
        accuracies.some(function (accuracy) {
            if (source.id() === accuracy.source && destination.id() === accuracy.destination) {
                accuracy = Math.abs(accuracy.accuracy).toFixed(3);
                destination.timingAccuracy(accuracy);
                return true;
            }
        });
    }
};

module.exports = UnicastTrafficPlayerDelegate;