var MultiplePortDeviceViewModel = require('device-view-model').MultiplePortDeviceViewModel,
    DeviceCollectionViewModel = require('device-collection-view-model'),
    MulticastSettingsViewModel = require('multicast-settings');

function MulticastTrafficPlayerDelegate(parent) {
    this.parent = parent;
    this.multicast_settings = undefined;
    this.strings = {
        source: window.translate("server"),
        destination: window.translate("client(s)")
    };
}

MulticastTrafficPlayerDelegate.prototype.inflate = function (data) {
    var parent = this.parent,
        source_data,
        source = new MultiplePortDeviceViewModel(parent.testConfigVm),
        destination = new DeviceCollectionViewModel(parent.testConfigVm, true);

    if (data.source) {
        source_data = data.source.devices ? data.source.devices[0] : data.source;
    }

    /**
     * @param device_vm {MultiplePortDeviceViewModel|DeviceCollectionViewModel}
     */
    function subscribe_parent(device_vm) {
        if (!device_vm) {
            return; // Short-circuit
        }

        device_vm.on('changed:device', parent.onDeviceChange.bind(parent, parent.destination));
    }

    // Source
    source.trafficPlayer = parent;
    source.label(this.strings.source);
    parent.source(source);
    parent.source().inflate(source_data);
    source.on('changed:device', this.onDeviceChange.bind(this, parent.source));

    // Destination
    destination.label(this.strings.destination);
    destination.trafficPlayer = parent;
    parent.destination(destination);
    parent.destination().inflate(data.destination);
    parent.destination.subscribe(subscribe_parent);
    subscribe_parent(destination);

    // Settings
    if (data && data.supplemental_configuration && data.supplemental_configuration.multicast_settings) {
        // Handle multicast setting reload from Calendar
        this.multicast_settings = new MulticastSettingsViewModel(data.supplemental_configuration.multicast_settings);
        this.multicast_settings.inflate(data.supplemental_configuration.multicast_settings);
    } else {
        this.multicast_settings = new MulticastSettingsViewModel(data.multicast_settings);
        this.multicast_settings.inflate(data.multicast_settings);
    }
    parent.multicast_settings = this.multicast_settings;
};

MulticastTrafficPlayerDelegate.prototype.toFlatObject = function (obj) {
    obj.source = {
        devices: [this.parent.source().toFlatObject()]
    };

    obj.destination = this.parent.destination().toFlatObject();

    obj.supplemental_configuration = obj.supplemental_configuration || {};
    obj.supplemental_configuration.multicast_settings = this.multicast_settings.toFlatObject();

    return obj;
};

/**
 * @param result ValidationResultsViewModel
 * @param targetName context used in validation lightbox. e.g. "Tx ..."
 * @returns ValidationResultsViewModel
 */
MulticastTrafficPlayerDelegate.prototype.validate = function (result, targetName) {
    var settingsName = window.translate('{name} multicast group settings', {
        name: targetName
    });
    this.multicast_settings.validate(result, settingsName);

    return result;
};

MulticastTrafficPlayerDelegate.prototype.canAcceptPlaylist = function (playlist) {
    var self = this,
        supported_layers = self.parent.get_supported_layers();

    return playlist.tracks().every(function (track) {
        var accapted_player_types;
        if (track().attributes && track().attributes.player_types) {
            accapted_player_types = track().attributes.player_types;
        } else {
            accapted_player_types = ['unicast']; //backup plan for old custom player
        }
        return supported_layers.indexOf(track().layer()) > -1 && accapted_player_types.indexOf('multicast') > -1;
    });
};

MulticastTrafficPlayerDelegate.prototype.canAcceptTrack = function (track) {
    return track.attributes.player_types.indexOf('multicast') > -1;
};

MulticastTrafficPlayerDelegate.prototype.getDeviceIds = function () {
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
 * @param player_device_observable ko.observable TrafficPlayerViewModel.source
 * @param device TestDeviceViewModel
 */
MulticastTrafficPlayerDelegate.prototype.onDeviceChange = function (player_device_observable, device) {
    var parent = this.parent,
        view_model = new MultiplePortDeviceViewModel(parent.testConfigVm),
        data = {
            device: device.toFlatObject()
        },
        previous = player_device_observable(),
        $previous = previous.$el,
        $parent = $previous.parentNode;

    view_model.label(this.strings.source);
    player_device_observable(view_model);
    player_device_observable().inflate(data);

    view_model.once('changed:device', this.onDeviceChange.bind(this, player_device_observable));
    previous.off();

    // Render
    view_model.render();

    $parent.insertBefore(view_model.$el, $previous);
    $parent.removeChild($previous);

    // Notify parent so port status, etc. is updated
    parent.onDeviceChange();
};

MulticastTrafficPlayerDelegate.prototype.setTimingAccuracies = function (accuracies) {
    var source = this.parent.source(),
        destination = this.parent.destination();

    if (!source || !destination) {
        return; // Short-circuit
    }

    // Only include accuracies that use source device
    accuracies = accuracies.filter(function (accuracy) {
        return accuracy.source === source.id();
    });

    destination.setTimingAccuracies(accuracies);
};

module.exports = MulticastTrafficPlayerDelegate;