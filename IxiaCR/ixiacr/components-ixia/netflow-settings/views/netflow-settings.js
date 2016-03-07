/*global translate: true */

var domify = require('domify'),
    template = require('../templates/netflow-settings.js'),
    event = require('event'),
    GlobalSettings = require('./global-settings.js'),
    Interfaces = require('./interfaces.js'),
    Model = require('../models/netflow-settings.js'),
    InterfaceModel = require('interface-model'),
    classes = require('classes'),
    util = require('utility-functions'),
    lightbox = util.lightbox,
    task_status_url = util.getConfigSetting('get_task_status'),
    request = require('superagent'),
    no_cache = require('superagent-no-cache'),
    noop = function() {},
    spirentEnterpriseVm = window.spirentEnterpriseVm,
    results_status_observable = window.spirentEnterpriseVm.vmTest.vmResults.status,
    LoadingState = require('loading-state');

// Extend interface model
InterfaceModel.attr('collectors', {default: []});

function NetflowSettings(model) {
    this.setModel(model);
    this.$el = domify(template);
    this.globalSettingsPane = new GlobalSettings(model);
    this.interfacesPane = undefined;
    this.ports_observable = spirentEnterpriseVm.availableDevices()[0].ports;
    this.loading_state = new LoadingState(this.$el);
    //this.init_render = true;
    this.graber = undefined;

    this.strings = {
        "License invalid": window.translate("Your license is invalid. If you just updated, you may need a new license. Please upload a valid license or contact Spirent support at <a href='http://support.spirentforbusiness.com' target='_blank'>support.spirentforbusiness.com</a>."),
        "Updating": window.translate("Updating"),
        "Loading": window.translate("Loading"),
        "Exporting has not yet started": window.translate("Exporting has not yet started"),
        "Please allow approximately three minutes for exporting to begin.": window.translate("Please allow approximately three minutes for exporting to begin."),
        "Please wait for test to finish": window.translate("Please wait for test to finish"),
        "Netflow save confirmation": window.translate("Saving will interrupt any tests that are currently running.")
    };
}

NetflowSettings.factory = function (callback) {
    callback = callback || function() {};

    var view = new NetflowSettings(),
        handler = function (err, model) {
            if (err) {
                return callback(err);
            }

            view.setModel(model);
            return callback(null, view);
        };

    view.renderLoading();

    view.graber = function(){
        Model.get(undefined,handler);
    }

    view.graber();

    return view;
};

NetflowSettings.prototype.setModel = function (model) {
    if (!model) {
        return; // Short-circuit
    }

    var interfaces = [];


    // Convert interfaces object to models
    model.interfaces().forEach(function (iface) {
        interfaces.push(new InterfaceModel(iface));
    });

//    if(!this.init_render){
//        this.interfacesPane.update_interfaces(interfaces);
//        return;
//    }

    this.globalSettingsPane.setModel(model);
    this.model = model;

    this.interfacesPane = new Interfaces(interfaces, this.model.is_enabled());

};

NetflowSettings.prototype.render = function () {
    var updating = this.model.status() === 'updating',
        license_invalid = this.model.license_status() === 'invalid',
        $global = this.$el.querySelector('.global'),
        chassis_id = window.spirentEnterpriseVm.vmGlobalSettings.chassisId(),
        $flownba = this.$el.querySelector('#flownba');

    $flownba.href += '&id=' + encodeURIComponent(chassis_id);

    if (updating) {
        this.renderUpdating();
        return this.$el;
    }

    if (license_invalid) {
        this.renderInvalidLicense();
        return this.$el;
    }

//    if(!this.init_render){
//        this.transitionTo(results_status_observable());
//        return;
//    }

//    this.init_render = false;

    // Enabling Netflow re-allocates ports
    // And port re-allocation interrupts tests
    // So block UI when tests are running to avoid interrupting
    this.transitionTo(results_status_observable());
    results_status_observable.subscribe(this.transitionTo.bind(this));

    $global.querySelector('.mode .enable').checked = this.model.is_enabled();
    $global.querySelector('.mode .disable').checked = !this.model.is_enabled();

    this.globalSettingsPane.render();
    this.interfacesPane.render();

    $global.appendChild(this.globalSettingsPane.$el);
    this.$el.appendChild(this.interfacesPane.$el);

    this.bind();
    return this.$el;
};

NetflowSettings.prototype.renderUpdating = function () {
    var updating = this.strings.Updating,
        prev_html = this.$el.innerHTML,
        not_updating = function (data) {
            return data.status() !== 'updating';
        }.bind(this),
        updated = function (data) {
            if (!this.$el.parentNode || !this.$el.parentNode.contains(this.$el)) {
                // view was removed
                return;
            }

            /*global $:true */
            if ($ && $.fn && typeof $.fn.unblock === 'function') {
                this.loading_state.hide();
            } else {
                this.$el.innerHTML = prev_html;
            }
            this.model = data;
            this.interfacesPane.toggle('enabled' === this.model.status());
            this.render();
        }.bind(this);

    /*global $:true */
    if ($ && $.fn && typeof $.fn.block === 'function') {
        this.loading_state.show(updating);
    } else {
        this.$el.innerHTML = updating;
    }
    /*global $:false */

    this.pollUntil(not_updating, updated);
};

NetflowSettings.prototype.renderLoading = function () {
    var message = this.strings.Loading;
    this.loading_state.show(message);
};

NetflowSettings.prototype.blockForTesting = function () {
    var message = this.strings["Please wait for test to finish"];
    this.loading_state.show(message);
};

NetflowSettings.prototype.blockWithMessage = function (message) {
    this.loading_state.show(message);
};

NetflowSettings.prototype.unblock = function () {
    this.loading_state.hide();
};

NetflowSettings.prototype.transitionTo = function (state) {
    if ('running' === state) {
        this.blockForTesting();
    } else {
        this.unblock();
    }
};

NetflowSettings.prototype.pollUntil = function (condition, done) {
    Model.get(undefined, function (err, model) {
        if (condition(model)) {
            done(model);
        } else {
            setTimeout(this.pollUntil.bind(this, condition, done), 500);
        }
    }.bind(this));
};

NetflowSettings.prototype.renderInvalidLicense = function () {
    var message = this.strings["License invalid"],
        $message;


    /*global $:true */
    if ($ && $.fn && typeof $.fn.block === 'function') {
        this.transitionTo('license_invalid');
        var prev_defaults = $.blockUI.defaults.css;
        $.blockUI.defaults.css = {};
        $(this.$el).block({message: '<div class="lightbox-chrome">' + message + '</div>'});
        $.blockUI.defaults.css = prev_defaults;
    } else {
        $message = document.createTextNode(message);
        this.$el.appendChild($message);
    }
    /*global $:false */
};

NetflowSettings.prototype.bind = function () {
    var $enable = this.$el.querySelector('.mode .enable'),
        $disable = this.$el.querySelector('.mode .disable'),
        $save = this.$el.querySelector('.save');

    event.bind($enable, 'change', this.toggle.bind(this, true));
    event.bind($disable, 'change', this.toggle.bind(this, false));
    event.bind($save, 'click', this.validate.bind(this));

    this.model.on('saving', this.updateAllocations.bind(this));
};

NetflowSettings.prototype.validate = function (e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }

    var save = this.confirm_save.bind(this);

    this.globalSettingsPane.validate(save, noop);
};

NetflowSettings.prototype.confirm_save = function () {
    lightbox.confirmation_dialog(this,this.strings["Netflow save confirmation"],this.save)
}

NetflowSettings.prototype.save = function () {
    var poll = this.pollTask.bind(this),
        start_task_poller = function (nothing, response) {
            poll(response.body.task_id);
        },
        interfaces = [],
        offset,
        model;

    /*ignore jslint start*/
    if (typeof LightboxWorkingViewModel !== 'undefined' && typeof translate === 'function') {
    /*ignore jslint end*/
        model = new LightboxWorkingViewModel(translate("Saving"), translate('Saving...'));
        lightbox.working(model);
    }

    this.interfacesPane.models.forEach(function (iface) {
        offset = iface.physical_port() - 1;
        interfaces[offset] = iface.toJSON();
    });
    this.model.interfaces(interfaces);

    this.model.save(start_task_poller);
};

NetflowSettings.prototype.hide = function () {
    classes(this.$el).add('hidden');
};

NetflowSettings.prototype.show = function () {
    //this.syncPortsFrom();
    this.renderLoading();
    this.reload();

    classes(this.$el).remove('hidden');
};

NetflowSettings.prototype.reload = function () {
    //try to fetch a valid licence
    this.graber();
};

NetflowSettings.prototype.toggle = function (enabled) {
    enabled = enabled || false;
    this.model.toggle(enabled);
    this.globalSettingsPane.toggle(enabled);
    this.interfacesPane.toggle(enabled);
};

NetflowSettings.prototype.pollTask = function (task_id) {
    var self = this,
        url = task_status_url + '?task_id=' + task_id,
        poll = this.pollTask.bind(this, task_id),
        is_exporting = this.model.is_exporting(),
        strings = this.strings,
        show_warning = function () {
            lightbox.openAlert(strings['Exporting has not yet started'], strings['Please allow approximately three minutes for exporting to begin.']);
            lightbox.off('close', show_warning);
        },
        workingVm;

    request.get(url)
        .use(no_cache)
        .end(function (res) {
            if ('running' === res.body.status) {
                // Keep polling
                setTimeout(poll, 500);
                return;
            }

            workingVm = new LightboxWorkingViewModel(translate('Save'), translate('Saving...'));
            if (res.error) {
                // Show failure
                workingVm.status('error');
                lightbox.working(workingVm);
                return;
            }

            /*
            ports_observable().forEach(function (old_port) {
                interfaces.forEach(function (new_port) {
                    if (new_port.physical_port === old_port.id()) {
                        old_port.allocated_to(new_port.enabled ? new_port.allocated_to : 'stc');
                        old_port.available(!new_port.enabled);
                    }
                });
            });
            */
            self.syncPortsTo();

            workingVm.status('success');
            lightbox.working(workingVm);
            if (is_exporting) {
                // Warn of the ~3 min delay
                lightbox.on('close', show_warning);
            }
        });
};

//sync to global port observable
NetflowSettings.prototype.syncPortsTo = function(){
    var interfaces = this.model.interfaces(),
        ports_observable = this.ports_observable,
        netflow_enable = this.model.status();

    ports_observable().forEach(function (port_glob) {
        if(port_glob.allocated_to() === 'flowmon')
        {
            port_glob.allocated_to('');
        }
        else if (port_glob.allocated_to() === ''){
            port_glob.allocated_to(undefined);
        }
        interfaces.forEach(function (port_local) {
            if (netflow_enable === 'enabled' && port_local.physical_port === port_glob.id() && port_local.allocated_to === 'flowmon' && port_local.enabled) {
                port_glob.allocated_to('flowmon');
            }
        });
    });
}

//sync from global port observable, not currently used
NetflowSettings.prototype.syncPortsFrom = function(){
    var interfaces = this.interfacesPane.models,
        ports_observable = this.ports_observable;

    ports_observable().forEach(function (port_glob) {
        interfaces.forEach(function (port_local) {
            if (port_local.physical_port() === port_glob.id() && port_glob.allocated_to() !== 'flowmon' && port_glob.allocated_to() !== undefined) {
                port_local.allocated_to (port_glob.allocated_to() === '' ? 'flowmon' : port_glob.allocated_to());
                port_local.enabled(false);
            }
        });
    });
}

NetflowSettings.prototype.updateAllocations = function () {
    var interfaces = this.model.interfaces();

    interfaces.forEach(function (iface, i) {
        if (iface.enabled) {
            iface.allocated_to = 'flowmon';
        }
        interfaces[i] = iface;
    });
};

module.exports = NetflowSettings;