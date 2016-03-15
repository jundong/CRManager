/*global ko:true, translate:true */

var noop = function () {},
    util = require('utility-functions'),
    domify = require('domify'),
    event = require('event'),
    classes = require('classes'),
    EndpointValidator = require('../validator.js'),
    validate = require('validate-form');

function UnicastEndpointViewModel(rootVm) {
    var self = this;

    self.rootVm = rootVm;

    self.id = ko.observable(0);
    self.name = ko.observable();
    self.tagged = ko.observable(false);
    self.use_dhcp = ko.observable(false);
    self.dhcp_hosts = ko.observable(20);

    self.vlan_id = ko.observable();
    self.ip = ko.observable();
    self.end_ip = ko.observable();
    self.prefix = ko.observable();
    self.gateway = ko.observable();

    self.customer = ko.observable();
    self.location = ko.observable();
    self.tags = ko.observableArray();
    self.unqualifiedTags = ko.observable();
    self.favorite = ko.observable();

    self.displayTags = ko.computed({
        read: self.displayTagsRead.bind(self),
        write: self.displayTagsWrite.bind(self)
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.useDhcpOrDhcpV6Text = ko.computed(function () {
        if (self.use_dhcp()) {
            return translate('Yes');
        }

        return translate('No');
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.taggedText = ko.computed(function () {
        if (self.tagged()) {
            return translate('Yes');
        }

        return translate('No');
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.basicTabClass = ko.computed(function () {
        return self.tagged() ? null : 'selected';
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.taggedTabClass = ko.computed(function () {
        return self.tagged() ? 'selected' : null;
    }).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.showDhcpHosts = ko.computed(self.computeShowDhcpHosts.bind(self)).extend({ throttle: self.rootVm.defaultThrottleDuration });

    self.strings = {
        "An endpoint already exists with this name": translate("An endpoint already exists with this name"),
        "Save": translate("Save"),
        "Update": translate("Update")
    };
    this.validator = new EndpointValidator();
}

module.exports = UnicastEndpointViewModel;

UnicastEndpointViewModel.prototype.is_new = function () {
    return !this.id();
};

UnicastEndpointViewModel.prototype.render = function () {
    var template = document.querySelector('#endpoint-template').innerHTML;

    this.$el = domify(template);
    this.renderForm(this.$el);

    return this.$el;
};

UnicastEndpointViewModel.prototype.bind = function () {
    var $save = this.$el.querySelector('.save a'),
        show_save_dialog = this.openSaveModal.bind(this),
        $form = this.$el.querySelector('.form');

    ko.applyBindings(this, this.$el);

    event.bind($save, 'click', show_save_dialog);

    this.bindForm($form);

    // Validator isn't bound until addressing scheme has been selected - see setAddressingScheme()
};

UnicastEndpointViewModel.prototype.renderForm = function ($form) {
    var static_ip_fields = ['ip', 'end_ip', 'prefix', 'gateway'],
        $el,
        observable,
        $save_header = $form.querySelector('.save-header'),
        $save_button;

    // Set static IP values
    static_ip_fields.forEach(function (field) {
        $el = $form.querySelector('.' + field + ' input');
        observable = this[field];
        $el.value = observable() || '';
    }, this);

    this.setAddressingScheme($form, this.use_dhcp());

    if ($save_header) {
        $save_button = $save_header.querySelector('.save');

        classes($save_header).remove('update');

        $save_button.textContent = this.strings["Save"];
        if (!this.is_new()) {
            classes($save_header).add('update');
        }
    }
};

UnicastEndpointViewModel.prototype.bindForm = function ($form) {
    var $radios = $form.querySelectorAll('.selector > input[type="radio"]'),
        scheme,
        set_scheme = this.use_dhcp,
        scheme_changed = function (scheme) {
            scheme = scheme === 'false' ? false : scheme;
            set_scheme(scheme);
        };

    // DOM -> data
    [].forEach.call($radios, function ($radio) {
        scheme = $radio.value;
        event.bind($radio, 'change', scheme_changed.bind(this, scheme));
    }, this);

    // Data -> DOM
    set_scheme.subscribe(this.setAddressingScheme.bind(this, $form));

    this.bindStaticIPHandlers($form);
    this.bindDHCPHandlers($form);
};

UnicastEndpointViewModel.prototype.bindModal = function ($el, callback) {
    var $save = $el.querySelector('.save'),
        save = this.save.bind(this, callback),
        save_if_valid = function (err, valid, msg) {
            if (valid) {
                save();
            }
        },
        validate = this.validate.bind(this, save_if_valid),
        validate_name = this.validateName.bind(this, validate);

    event.bind($save, 'click', validate_name);
};

UnicastEndpointViewModel.prototype.bindStaticIPHandlers = function ($form) {
    var view = this,
        fields = ['ip', 'end_ip', 'prefix', 'gateway'],
        selector,
        observable,
        $field,
        value,
        update_observable = function (field, e) {
            value = e.target.value;
            field(value);
        },
        update_dom = function ($field, value) {
            $field.value = value;
        };

    fields.forEach(function (field) {
        observable = view[field];
        selector = '.' + field + ' input';
        $field = $form.querySelector('.' + field + ' input');

        // DOM -> Data
        event.bind($field, 'change', update_observable.bind(view, observable));

        // Data -> DOM
        observable.subscribe(update_dom.bind(view, $field));
    });
};

UnicastEndpointViewModel.prototype.bindDHCPHandlers = function ($form) {
    var $hosts = $form.querySelector('li.dhcp-hosts input'),
        hosts = this.dhcp_hosts;

    // DOM -> Data
    event.bind($hosts, 'change', function () {
        hosts(+this.value);
    });
    // Data -> DOM
    $hosts.value = (this.dhcp_hosts() !== undefined && this.dhcp_hosts() !== '') ? this.dhcp_hosts() : 20;
};

UnicastEndpointViewModel.prototype.setAddressingScheme = function ($form, scheme) {
    // Note: A scheme of 'false' denotes static IP addressing - this is historical
    $form = $form || this.$el.querySelector('.form');

    var is_dhcp = this.is_dhcp(scheme),
        visible_selector = is_dhcp ? 'li.dhcp' : 'li.static',
        hidden_selector = is_dhcp ? 'li.static' : 'li.dhcp',
        $inputs = $form.querySelectorAll('.selector > input[type="radio"]'),
        $hidden = $form.querySelectorAll(hidden_selector),
        $visible = $form.querySelectorAll(visible_selector);

    this.validator.bind($form, is_dhcp);

    [].forEach.call($inputs, function ($el) {
        if ($el.value === 'false' && !scheme) {
            $el.checked = true;
        } else if ($el.value === scheme) {
            $el.checked = true;
        } else {
            $el.checked = false;
        }
    });

    [].forEach.call($hidden, function ($el) {
        classes($el).add('hidden');
    });

    [].forEach.call($visible, function ($el) {
        classes($el).remove('hidden');
    });
};

UnicastEndpointViewModel.typesafe = function (that) {
    if (!(that instanceof UnicastEndpointViewModel)) {
        throw 'This method must be executed on a EndpointViewModel';
    }

    return that;
};

UnicastEndpointViewModel.prototype.matchesSearch = function (searchString) {
    var self = UnicastEndpointViewModel.typesafe(this);

    var searchTerms = searchString.split(' ');

    if (searchTerms.length == 0) {
        return true;
    }

    var name = self.name().toUpperCase();
    var customer ='';
    var location ='';
    if (!self.location() == '' || !self.location() == null) {
        location = self.location().toUpperCase();
    }
    if (!self.customer() == '' || !self.customer() == null) {
        customer = self.customer().toUpperCase();
    }

    for (var i = 0; i < searchTerms.length; i++) {
        if (searchTerms[i] == '' || searchTerms[i] == null) {
            continue;
        }

        if (name.indexOf(searchTerms[i].toUpperCase()) == -1
            && customer.indexOf(searchTerms[i].toUpperCase()) == -1
            && location.indexOf(searchTerms[i].toUpperCase()) == -1) {
            return false;
        }
    }

    return true;
};

/**
 *
 * @param result {ValidationResultsViewModel|callback}
 * @param targetName optional if using callback for first parameter
 */
UnicastEndpointViewModel.prototype.validate = function (result, targetName) {
    var callback;

    if (result instanceof ValidationResultsViewModel) {
        this.validator.validate(result, targetName);
    } else {
        callback = result;
        this.validator.validate(callback);
    }
}

UnicastEndpointViewModel.prototype.validateName = function (callback) {
    var self = UnicastEndpointViewModel.typesafe(this),
        $form = document.querySelector('#lightbox-save-endpoint'),
        existing,
        is_unique = function (name) {
            // Check if an endpoint with same name exists (and is not self)
            existing = ko.utils.arrayFirst(self.rootVm.availableEndpoints(), function (item) {
                return name.toLowerCase() == item.name().toLowerCase() && self.id() != item.id();
            });

            return existing === null || existing.id() === self.id(); //existing === null --> create, existing.id() === self.id()--> update
        },
        validation_handler = function(err, valid, msg) {
            if (valid) {
                callback();
            }
        };

    validate($form).on('blur')
        .field('name')
            .is('required', self.strings['Field is required'])
            .is(is_unique, self.strings['An endpoint already exists with this name'])
        .validate(validation_handler);
};

UnicastEndpointViewModel.prototype.computeShowDhcpHosts = function () {
    return !!this.use_dhcp();
};

UnicastEndpointViewModel.prototype.inflate = function (endpoint) {
    var self = UnicastEndpointViewModel.typesafe(this);

    if(endpoint.id)
        self.id(endpoint.id);

    if(endpoint.name)
        self.name(endpoint.name);
    else if (!util.isNullOrEmpty(endpoint.vlan_id))
        self.name(endpoint.vlan_id);
    else if (!endpoint.use_dhcp)
        self.name(endpoint.ip);
    else
        self.name(translate("DHCP"));

    self.tagged(endpoint.tagged);
    self.use_dhcp(endpoint.use_dhcp === 'false' ? false : endpoint.use_dhcp);
    self.dhcp_hosts(+endpoint.dhcp_hosts);
    if (typeof(endpoint.vlan_id) != "undefined" && endpoint.vlan_id != null) {
        self.vlan_id(endpoint.vlan_id.toString());
    }
    self.ip(endpoint.ip);
    self.end_ip(endpoint.end_ip);
    self.prefix(endpoint.prefix);
    self.gateway(endpoint.gateway);

    util.setTags(self, endpoint.tags);

    return self;
};

UnicastEndpointViewModel.prototype.clone = function() {
    var data = this.toFlatObject(),
        endpoint;

    data.id = undefined;
    endpoint = new UnicastEndpointViewModel(this.rootVm);
    return endpoint.inflate(data);
};

UnicastEndpointViewModel.prototype.deleteEndpoint = function(){
    var self = UnicastEndpointViewModel.typesafe(this);

    util.lightbox.close();

    var workingVm = new LightboxWorkingViewModel(translate('Delete'), translate('Deleting...'));
    util.lightbox.working(workingVm);
    var id = self.id();

    var data = {
        id : id
    };

    $.ajax({
        type : util.getRequestMethod('delete_endpoint'),
        url : util.getConfigSetting('delete_endpoint'),
        data : JSON.stringify(data),
        dataType : "json",
        success: function (data, textStatus, jqXhr) {
            var message = data.messages[0];
            if(!message.is_error && message.header == "Success"){
                var callbackFunction = function(){workingVm.status("success");};
                self.rootVm.getAvailableEndpoints(callbackFunction);
            }else{
                workingVm.status("error");
                workingVm.close(util.lightbox.close.bind(util.lightbox));
            }
        },
        error: function (jqXhr, textStatus, errorThrown) {
            workingVm.status('error');
        }
    });
};

UnicastEndpointViewModel.prototype.toFlatObject = function () {
    var self = UnicastEndpointViewModel.typesafe(this);

    var flatEndpoint = {
        id: self.id(),
        name: self.name() || "",
        use_dhcp: self.use_dhcp(),
        dhcp_hosts: +self.dhcp_hosts() || 20,
        vlan_id: self.vlan_id() || "",
        ip: self.ip() || "",
        end_ip: self.end_ip() || "",
        prefix: self.prefix() || "",
        gateway: self.gateway() || "",
        tags: util.getTags(self)
    };

    return flatEndpoint;
};

UnicastEndpointViewModel.prototype.save = function (callback) {
    var self = UnicastEndpointViewModel.typesafe(this);
    var name = self.name();
    var workingVm = new LightboxWorkingViewModel(translate('Save'), translate('Saving...'));

    self.unqualifiedTags(self.tags().join(', '));

    //loop availableEndpoints[] to check if new- added endpoint exists or not
    var foundExisting = ko.utils.arrayFirst(self.rootVm.availableEndpoints(), function (item) {
        return name.toLowerCase() == item.name().toLowerCase();
    });
    util.lightbox.close();
    if(foundExisting){
        self.id(foundExisting.id());
        workingVm = new LightboxWorkingViewModel(translate('Update'), translate('Updating...'));
    }
    util.lightbox.working(workingVm);
    var data = self.toFlatObject();
    $.ajax({
        type: util.getRequestMethod('save_endpoint'),
        url: util.getConfigSetting('save_endpoint'),
        data: util.formatRequestData('save_endpoint', data),
        dataType: 'json',
        success: function (data, textStatus, jqXhr) {
            if (data.result == "SUCCESS") {
                self.id(data.items[0].id);
                logger.info('Updated endpoint id: ' + data.items[0].id);
                workingVm.status('success');

                if (foundExisting === null) {
                    self.rootVm.availableEndpoints.push(self);
                } else {
                    self.rootVm.availableEndpoints.replace(foundExisting, self);
                }

                //sort endpoints by name after adding- HungTran
                self.rootVm.availableEndpoints.sort(function(a,b) {return (a.name() > b.name()) ? 1 : ((b.name() > a.name()) ? -1 : 0);} );
            } else {
                workingVm.status('error');
                logger.error({message: 'Failed to save endpoint', data: data, textStatus: textStatus});
            }

            if (typeof callback === 'function') { // Could be jQuery.Event
                callback(self.toFlatObject());
            }
        },
        error: function (jqXhr, textStatus, errorThrown) {
            workingVm.status('error');
            logger.error(errorThrown);
        }
    });

};

UnicastEndpointViewModel.prototype.openSaveModal = function (e, callback) {
    callback = callback || function(){};
    var self = UnicastEndpointViewModel.typesafe(this),
        refreshDraggables = false,
        $form;

    if (e && e.preventDefault !== undefined) {
        e.preventDefault();
    }

    util.lightbox.close();
    util.lightbox.open({
        url : 'html/lightbox_tmpl',
        selector : '#lightbox-save-endpoint-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function(){
            $form = document.getElementById('lightbox-save-endpoint');

            if(self.id() == 0){
                if(!self.use_dhcp()){
                    if(util.isNullOrEmpty(self.vlan_id()) && util.isNullOrEmpty(self.ip())){
                       self.name('');
                    }
                    if(!util.isNullOrEmpty(self.vlan_id())){
                       self.name(self.vlan_id());
                    }else if(!util.isNullOrEmpty(self.ip())){
                       self.name(self.ip());
                    }
                }else if(self.use_dhcp()){
                    if(!util.isNullOrEmpty(self.vlan_id())){
                       self.name(self.vlan_id());
                    }else
                       self.name(translate("DHCP"));
                }
            }

            self.startState = self.toFlatObject();
            ko.applyBindings(self, $form);
            self.renderForm($form);
            self.bindForm($form);
            self.bindModal($form, callback);
            self.inflate(self.startState); // Update modal with current state
        },
        onClose: function(){
            if (self.name() === '') {
                refreshDraggables = true;
            }
            self.inflate(self.startState);

            if (refreshDraggables) {
                self.rootVm.refreshTestDraggables();
            }
        }
    });
};

UnicastEndpointViewModel.prototype.displayTagsRead = function () {
    var self = UnicastEndpointViewModel.typesafe(this);
    if (!self.unqualifiedTags()) {
        self.unqualifiedTags(self.tags().join(', '));
    }
    return util.sanitizeUnqualifiedTagGroup(self.unqualifiedTags());
};

UnicastEndpointViewModel.prototype.displayTagsWrite = function (value) {
    var self = UnicastEndpointViewModel.typesafe(this);

    if (value == null) {
        return;
    }

    var newArray = value.split(',');

    self.tags.removeAll();
    for (var i = 0; i < newArray.length; i++) {
        var trimmedValue = util.trimTag(newArray[i]);

        if (trimmedValue == '') {
            continue;
        }

        if (self.tags().indexOf(trimmedValue) == -1) {
            self.tags.push(trimmedValue);
        }
    }
    self.unqualifiedTags(util.sanitizeUnqualifiedTagGroup(value));
    self.unqualifiedTags.valueHasMutated();
};

UnicastEndpointViewModel.prototype.is_dhcp = function (scheme) {
    if (scheme === undefined) {
        scheme = this.use_dhcp();
    }

    // Only DHCP has schemes
    return scheme === 'v4' || scheme === 'v6';
};