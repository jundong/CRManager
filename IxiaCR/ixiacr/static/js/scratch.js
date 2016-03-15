/**
 * Created with JetBrains PhpStorm.
 * User: David
 * Date: 6/26/12
 * Time: 9:58 AM
 * To change this template use File | Settings | File Templates.
 */
/*


 Begin Test Efforts


 */


function PacketLossViewModel() {
    var self = this;

    self.tracks = [
        {name: 'HTTP'},
        {name: 'FTP'},
        {name: 'HTTPS'},
        {name: 'DNS'},
        {name: 'JOHN'},
        {name: 'PAUL'},
        {name: 'GEORGE'},
        {name: 'RINGO'}
    ];

    self.portUserUnits = [
        {unitId: 0, unit: '-'},
        {unitId: 1, unit: 'k'},
        {unitId: 2, unit: 'mil.'},
        {unitId: 3, unit: 'bil.'}
    ];

    self.devices = [
        new DeviceWithPorts('Device 1', 4, self.portUserUnits),
        new DeviceWithPorts('Device 2', 4, self.portUserUnits),
        new DeviceWithPorts('Device 3', 4, self.portUserUnits),
        new DeviceWithPorts('Device 4', 4, self.portUserUnits)
    ];

    self.playlists = [
        { name: 'Playlist 1'},
        { name: 'Playlist 2'},
        { name: 'Playlist 3'},
        { name: 'Playlist 4'},
        { name: 'Playlist 5'}
    ];

    self.durations = [
        {durationId: 0, duration: '1 minute'},
        {durationId: 1, duration: '2 minutes'},
        {durationId: 2, duration: '3 minutes'},
        {durationId: 3, duration: '5 minutes'},
        {durationId: 4, duration: '8 minutes'},
        {durationId: 5, duration: '11 minutes'}
    ];

    self.lineRateUnits = [
        {unitId: 0, unit: 'Kb'},
        {unitId: 1, unit: 'Mb'},
        {unitId: 2, unit: 'Tb'}
    ];

    self.currentPort = ko.observable();
    self.currentDevice = ko.observable();
    self.currentConfigurableDevice = ko.observable();

    self.mouseoverPortDetail = ko.observable(null);

    self.showPortDetail = function (port) {
        self.mouseoverPortDetail(port);
    };

    self.hidePortDetail = function (port) {
        self.mouseoverPortDetail(null);
    };

    self.clearCurrentConfigurableDevice = function (device) {
        self.currentConfigurableDevice(null);
        self.currentDevice(null);
        self.currentPort(null);
    };

    self.setCurrentPort = function(actingConfigurableDevice, port, event) {
        if (port.configured() && port.configuredVia() != actingConfigurableDevice) {
            return;
        }

        self.currentDevice(port.device);
        self.currentPort(port);
        self.currentConfigurableDevice(actingConfigurableDevice);
        port.actingConfigurableDevice = actingConfigurableDevice;
    };

    self.configurableDevice1 = ko.observable(new ConfigurableDevice('Configurable Device 1', self.clearCurrentConfigurableDevice));
    self.configurableDevice1().device(self.devices[0]);


    self.testDuration = ko.observable(self.durations[0]);
    self.lineRate = ko.observable(10);
    self.lineRateUnit = ko.observable(self.lineRateUnits[1]);
    self.playlist = ko.observable(self.playlists[0]);

    self.configurableDevice2 = ko.observable(new ConfigurableDevice('Configurable Device 2', self.clearCurrentConfigurableDevice));
    self.configurableDevice2().device(self.devices[1]);

    self.resize1 = ko.observable();
    self.resize2 = ko.observable();
    self.resize3 = ko.observable();
    self.resize4 = ko.observable();


    self.resizables = ko.observableArray();

    self.sliderWidth = 800;
    self.slider = null;

    self.initializeCustomSlider = function () {
        self.slider = new CustomSlider('#test .slider', '.resizable');
    };

    self.closePortConfiguration = function() {
        self.clearCurrentConfigurableDevice(null);
    };

    self.getConfiguredLabel = function(port) {
        return port.configuredLabel();
    };
}

function PacketLossTest() {
    var self = this;


}

function ConfigurableDevice(name, deviceChangedCallback) {
    var self = this;
    var index = null;
    var onDeviceChanged = deviceChangedCallback;

    self.name = name;
    self.device = ko.observable();
    self.availablePorts = ko.observableArray();

    self.setDevice = function (device) {
        if (self.device() != null) {
            if (self.availablePorts().length > 0) {
                for (index in self.availablePorts()) {
                    if (self.availablePorts()[index].configuredVia() == self) {
                        self.availablePorts()[index].unset();
                    }
                }
            }
        }

        self.availablePorts.removeAll();

        var availablePorts = self.getAvailablePorts();
        for (index in availablePorts) {
            self.availablePorts.push(availablePorts[index]);
        }

        if (jQuery.isFunction(onDeviceChanged)) {
            onDeviceChanged(device);
        }
    };

    self.device.subscribe(self.setDevice);

    self.getAvailablePorts = function () {
        var availablePorts = new Array();

        if (self.device() == null) {
            return availablePorts;
        }

        var allPorts = self.device().ports;
        for (var index in allPorts) {
            availablePorts.push(allPorts[index]);
        }

        return availablePorts;
    };
}

function DeviceWithPorts(name, numPorts, portUserUnits) {
    var self = this;

    self.name = name;

    self.ports = new Array();

    for (var i = 0; i < numPorts; i++) {
        self.ports.push(new Port('Port ' + (i + 1), self, portUserUnits));
    }
}

function Port(name, device, portUserUnits) {
    var self = this;

    self.name = name;
    self.device = device;

    self.configuredVia = ko.observable();
    self.configured = ko.observable(false);

    self.actingConfigurableDevice = null;

    self.records = ko.observableArray();

    self.initializeRecords = function () {
        self.records.removeAll();

        for (var i = 0; i < 4; i++) {
            self.records.push(new ConfigurationRecord(self.setConfigured, portUserUnits));
        }
    };

    self.setConfigured = function (data) {
        self.configured(true);
        self.configuredVia(self.actingConfigurableDevice);
    };

    self.unset = function () {
        self.configuredVia(null);
        self.configured(false);
        self.actingConfigurableDevice = null;

        self.initializeRecords();
    };

    self.configuredLabel = function () {
        if (self.configured()) {
            return 'Yes';
        }

        return 'No';
    };

    self.configurableLabel = function (currentConfigurableDevice) {
        if (self.configured() && self.configuredVia() != currentConfigurableDevice) {
            return 'No';
        }

        if (self.configured()) {
            return 'Yes - currently configured';
        }

        return 'Yes - not configured';
    };

    self.configurationOwned = function (currentConfigurableDevice) {
        return self.configured() && self.configuredVia() == currentConfigurableDevice;
    };

    self.initializeRecords();
}

function ConfigurationRecord(updatedCallback, portUserUnits) {
    var self = this;

    self.onUpdated = updatedCallback;
    self.userUnits = portUserUnits;

    self.name = ko.observable();
    self.vlan_id = ko.observable();
    self.ipAddress = ko.observable();
    self.routerIp = ko.observable();
    self.netmask = ko.observable();
    self.numUsers = ko.observable();
    self.userUnit = ko.observable(self.userUnits[0]);

    if (jQuery.isFunction(self.onUpdated)) {
        self.name.subscribe(self.onUpdated);
        self.vlan_id.subscribe(self.onUpdated);
        self.ipAddress.subscribe(self.onUpdated);
        self.routerIp.subscribe(self.onUpdated);
        self.netmask.subscribe(self.onUpdated);
        self.numUsers.subscribe(self.onUpdated);
        self.userUnit.subscribe(self.onUpdated);
    }
}

// lifted from http://www.knockmeout.net/2011/05/dragging-dropping-and-sorting-with.html
//connect items with observableArrays
ko.bindingHandlers.sortableList = {
    init: function(element, valueAccessor, allBindingsAccessor, context) {
        $(element).data("sortList", valueAccessor()); //attach meta-data
        $(element).sortable({
            update: function(event, ui) {
                var item = ui.item.data("sortItem");
                if (item) {
                    //identify parents
                    var originalParent = ui.item.data("parentList");
                    var newParent = ui.item.parent().data("sortList");
                    //figure out its new position
                    var position = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                    if (position >= 0) {
                        originalParent.remove(item);
                        newParent.splice(position, 0, item);
                    }

                    ui.item.remove();

                    packetLossViewModel.initializeCustomSlider();
                }
            },
            revert: true
//                    connectWith: '.draggable'
        });
    }
};

ko.bindingHandlers.sortableListFromDraggable = {
    init: function(element, valueAccessor, allBindingsAccessor, context) {
        $(element).data("sortList", valueAccessor()); //attach meta-data
        $(element).sortable({
            update: function(event, ui) {
                var item = ui.item.data('sortItem');
                if (item) {
                    //identify parents
                    var originalParent = ui.item.data('parentList');
                    var newParent = ui.item.parent().data('sortList');

                    // delete a duplicate entry
                    if (jQuery.inArray(item, newParent()) != -1) {
                        // we don't want to delete items being moved *within* the list
                        if (newParent != originalParent) {
                            ui.item.remove();
                            return;
                        }
                    }
                    //figure out its new position
                    var position = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                    if (position >= 0) {
                        // don't want to delete an available track
                        if (originalParent != packetLossViewModel.availableTracks) {
                            originalParent.remove(item);
                        }

                        newParent.splice(position, 0, item);
                    }

                    ui.item.remove();

                    packetLossViewModel.initializeCustomSlider();
                }
            },
            receive: function (event, ui) {
                var newSortableItem = jQuery(this).data().sortable.currentItem;

                newSortableItem.data('sortItem', ui.item.data('sortItem'));
                newSortableItem.data('parentList', ui.item.data('parentList'));
            },
            revert: true
        });
    }
};

ko.bindingHandlers.draggableList = {
    init: function(element, valueAccessor, allBindingsAccessor, context) {
        $(element).data("sortList", valueAccessor()); //attach meta-data
        $(element).children('li').not('.configured').each(function () {
            $(this).draggable({
                revert: 'invalid',
                update: function(event, ui) {
                    var item = ui.item.data("sortItem");
                    if (item) {
                        //identify parents
                        var newParent = ui.item.parent().data("sortList");
                        //figure out its new position
                        var position = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                        if (position >= 0) {
                            newParent.splice(position, 0, item);
                        }

                        ui.item.remove();

                        packetLossViewModel.refreshAvailableTrackList();

                        packetLossViewModel.initializeCustomSlider();
                    }
                },
                helper: function (event, ui) {
                    var $helper = jQuery(document.createElement('li')).append(jQuery(this).html());
                    $helper.data('sortItem', jQuery(this).data('sortItem'));
                    $helper.data('parentList', jQuery(this).data('parentList'));
                    return $helper;
                },
                connectToSortable: '.droppable'
            });
            $(this).addClass('configured');
        });
    },
    update: function(element, valueAccessor, allBindingsAccessor, context) {
        $(element).children('li').not('.configured').each(function () {
            $(this).draggable({
                revert: 'invalid',
                update: function(event, ui) {
                    var item = ui.item.data("sortitem");
                    if (item) {
                        //identify parents
                        var newParent = ui.item.parent().data("sortList");
                        //figure out its new position
                        var position = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
                        if (position >= 0) {
                            newParent.splice(position, 0, item);
                        }

                        ui.item.remove();

                        packetLossViewModel.refreshAvailableTrackList();

                        packetLossViewModel.initializeCustomSlider();
                    }
                },
                helper: function (event, ui) {
                    var $helper = jQuery(document.createElement('li')).append(jQuery(this).html());
                    $helper.data('sortItem', jQuery(this).data('sortItem'));
                    $helper.data('parentList', jQuery(this).data('parentList'));
                    return $helper;
                },
                connectToSortable: '.droppable'
            });
            $(this).addClass('configured');
        });
    }
};

//attach meta-data
ko.bindingHandlers.sortableItem = {
    init: function(element, valueAccessor) {
        var options = valueAccessor();
        $(element).data("sortItem", options.item);
        $(element).data("parentList", options.parentList);
    }
};
