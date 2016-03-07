/*global ko:true */

var domify = require('domify'),
    $template = domify(require('./templates/template.js')),
    EndpointValidator = require('../validator.js'),
    classes = require('classes'),
    event = require('event'),
    UnicastEndpointVm  =  require('../unicast/view-model.js');

function MulticastEndpointViewModel(port) {
    var self = this;

    self.$el = undefined;

    self.device = undefined;

    self.enabled = ko.observable(false);

    self.port = ko.observable(port);

    self.id = ko.observable(0);
    self.name = ko.observable('');
    self.tagged = ko.observable(false);
    self.use_dhcp = ko.observable("false");
    self.dhcp_hosts = ko.observable(20);

    self.vlan_id = ko.observable('');
    self.ip = ko.observable('');
    self.end_ip = ko.observable('');
    self.prefix = ko.observable('');
    self.gateway = ko.observable('');

    self.portLabel = ko.computed(self.computePortLabel.bind(self));
    self.vlanLabel = ko.computed(self.computeVlanLabel.bind(self));
    self.ipDetails = ko.computed(self.computeIpDetails.bind(self));

    self.customer = ko.observable();
    self.location = ko.observable();
    self.tags = ko.observableArray();
    self.unqualifiedTags = ko.observable();
    self.favorite = ko.observable();

    self.strings = {
        "IP details": window.translate("IP details")
    };

    self.validator = new EndpointValidator();
}

MulticastEndpointViewModel.factory = function(port, parent){
    var view = new MulticastEndpointViewModel(port);

    view.set_parent(parent);

    return view;
}

MulticastEndpointViewModel.prototype.set_parent = function(parent) {
    var self = this;
    self.device = parent;
    self.is_selected = ko.computed(function () {
        return self.port() === self.device.selectedPort();
    });
}

MulticastEndpointViewModel.prototype.render = function(){
    var self = this;

    self.$el =  $template.cloneNode(true);

    self.bind();

    return self.$el;
}

MulticastEndpointViewModel.prototype.inflate = function(data){
    var self = this;

    Object.keys(data).forEach(function (prop) {
        var val = data[prop];

        if (!self.hasOwnProperty(prop)) {
            return; // Short-circuit
        }

        if (self[prop].constructor === ko.observable().constructor || self[prop].constructor === ko.observableArray().constructor) {
            self[prop](val);
        } else {
            self[prop] = val;
        }

        if(prop === 'use_dhcp' && data[prop] === false){
            self[prop]('false');
        }
    });
};

MulticastEndpointViewModel.prototype.bind = function(){
    ko.applyBindings(this, this.$el);

    var self = this,
        $self = self.$el,
        $save = $self.querySelector('.save a'),
        show_save_dialog = self.show_save_dialog.bind(self),
        $enable = $self.querySelector('.enable input');

    // View-Model > DOM
    $enable.checked = this.enabled();
    this.toggle();

    // DOM > View-Model
    event.bind($enable, 'click', function (e) {
        self.enabled(e.target.checked);
        self.toggle();
        self.update_validator();
    });
    event.bind($save, 'click', show_save_dialog);
    this.update_validator();

    this.use_dhcp.subscribe(this.update_validator.bind(this));
};

MulticastEndpointViewModel.prototype.toggle = function(){
    var self = this,
        $show = self.$el.querySelectorAll('.form li:not(.enable)');

    [].forEach.call($show, function ($el) {
        if (self.enabled()) {
            classes($el).remove('hidden');
        } else {
            classes($el).add('hidden');
        }
    })
};

MulticastEndpointViewModel.prototype.update_validator = function(){
    if (!this.enabled()) {
        this.validator.unbind();
        return;
    }

    var is_dhcp = this.is_dhcp();
    this.validator.bind(this.$el, is_dhcp);
};

/**
 *
 * @param result {ValidationResultsViewModel|callback}
 * @param targetName optional if using callback for first parameter
 */
MulticastEndpointViewModel.prototype.validate = function (result, targetName) {
    var callback;

    if (!this.enabled()) {
        return result;
    }

    targetName = window.translate('{name}, port {port}', {
        name: targetName,
        port: this.port()
    });

    if (result instanceof ValidationResultsViewModel) {
        this.validator.validate(result, targetName);
    } else {
        callback = result;
        this.validator.validate(callback);
    }
};

MulticastEndpointViewModel.prototype.toFlatObject = function(){
    var self = this;

//    if(!self.enabled()){
//        return null;
//    }

    var flat_object = {
        port: self.port(),
        enabled: self.enabled(),
        id: self.id(),
        name: self.name() || "",
        use_dhcp: self.use_dhcp(),
        dhcp_hosts: +self.dhcp_hosts() || 20,
        vlan_id: self.vlan_id() || "",
        ip: self.ip() || "",
        end_ip: self.end_ip() || "",
        prefix: self.prefix() || "",
        gateway: self.gateway() || "",
        tags: window.util.getTags(self)
    };

    return flat_object;
};

MulticastEndpointViewModel.prototype.is_dhcp = function (scheme) {
    if (scheme === undefined) {
        scheme = this.use_dhcp();
    }

    // Only DHCP has schemes
    return scheme === 'v4' || scheme === 'v6';
};

MulticastEndpointViewModel.prototype.computePortLabel = function () {
    if (this.port() === null) {
        return translate('No Port');
    }

    return translate('Port {port}', {port: this.port()});
};

MulticastEndpointViewModel.prototype.computeVlanLabel = function () {
    if (this.vlan_id() === null) {
        return translate('No Vlan');
    }

    return translate("VLAN {id}", {id: this.vlan_id()});
};

MulticastEndpointViewModel.prototype.computeIpDetails = function () {
    if (this.is_dhcp()) {
        var details = [];

        return window.translate("Number of hosts: {hosts}", {
            hosts: this.dhcp_hosts()
        });
    }

    return translate('Starting IP: {startingIp}, Ending IP: {endingIp}', {
        startingIp: this.ip(),
        endingIp: this.end_ip()
    });
};

MulticastEndpointViewModel.prototype.show_save_dialog = function () {
    var self = this,
        endpointViewModel = new UnicastEndpointVm(self.device.testConfigVm.rootVm),
        sync_handler = function(data){
            self.inflate(data);
        };

    endpointViewModel.inflate(self.toFlatObject());
    endpointViewModel.openSaveModal(null, sync_handler);
};


module.exports = MulticastEndpointViewModel;