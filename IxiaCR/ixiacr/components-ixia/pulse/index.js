var domify = require('domify'),
    $template = domify(require('./templates/index.js')),
    classes = require('classes'),
    Model = require('./models/pulse.js'),
    AsyncPoller = require('async-poller'),
    LoadingState = require('loading-state'),
    InterfaceSelector = require('interface-selector'),
    NetworkSettingsView = require('network-settings-view'),
    events = require('event'),
    task_status_url = util.getConfigSetting('get_task_status'),
    lightbox = window.util.lightbox,
    request = require('superagent'),
    no_cache = require('superagent-no-cache'),
    $license = domify(require('./templates/license.js')),
    results_status_observable = window.spirentEnterpriseVm.vmTest.vmResults.status;


function PulseViewModel() {
    this.$orgtemp = $template.cloneNode(true);
    this.$el = this.$orgtemp;
    this.poller = undefined;
    this.loading_state = new LoadingState(this.$el);
    this.interface_selector = undefined;
    this.network_settings = new NetworkSettingsView();
    this.ports_observable = spirentEnterpriseVm.availableDevices()[0].ports;
    this.validator = undefined;
    this.port_selected = false;
    this.strings = {
        "Saving": window.translate("Saving"),
        "Saving...": window.translate('Saving...'),
        "Select a port": window.translate("Select a port"),
        "Please wait for test to finish": window.translate("Please wait for test to finish"),
        "AxonPoint desc": window.translate("If you have AxonPoint devices on your network, you can enable and configure this AxonCore to participate as an AxonPulse Endpoint for TCP throughput tests. From the AxonCloud Control portal, configure your AxonPoint devices to use this AxonPulse Endpoint."),
        "pulse save confirmation": window.translate("Saving will interrupt any tests that are currently running."),
        "pulse port overwrite confirmation": window.translate("Reallocating this port to Pulse will stop exporting Netflow data on this port.")
    };
    this.event_handlers = [];
    this.$interface_selector = undefined;
    this.$network_settings = undefined;
//    this.init_render = true;
}

PulseViewModel.factory = function (done) {
    var view = new PulseViewModel(),
        poll = function (next) {
            Model.get(function (err, model) {
                if (err) {
                    return done(err);
                }

                if (model.status() === 'loading') {
                    // Continue polling
                    return next();
                }

                view.poller.stop();
                view.set_model(model);
                view.render();
                done(null, view);
            });
        };

    // Poll for pulse until it's done loading
    view.poller = new AsyncPoller(poll, 500);
    view.poller.poll();

    return view;
};

PulseViewModel.prototype.set_model = function (model) {
    if(this.model){
        this.unbind();
    }

    this.model = model;

    if(this.interface_selector){
        this.interface_selector = undefined;
//        this.interface_selector.unbind();
//        //this.model.interfaces(model.interfaces());
//        this.interface_selector.set_models(this.model.interfaces());
//         this.network_settings.hide();
//        return;
    }

    this.interface_selector = new InterfaceSelector(model.interfaces(), this.render_interface.bind(this));
};

PulseViewModel.prototype.render = function () {
    if (!this.model || this.model.status() === 'loading') {
        this.render_loading();
        return this.$el; // Short-circuit
    }

    if (this.model.license_status() === 'invalid') {
        $lict = $license.cloneNode(true);
        this.$el.parentNode.replaceChild($lict, this.$el);
        this.$el = $lict;
        this.loading_state.hide();
        return; // Short-circuit
    }

//    if(!this.init_render){
//        this.loading_state.hide();
//        return; // Short-circuit for show()
//    }

//    this.init_render = false;
    this.$el.parentNode.replaceChild(this.$orgtemp,this.$el);
    this.$el = this.$orgtemp;

    this.$el.querySelector('.desc ul li').textContent = this.strings["AxonPoint desc"];

    this.transitionTo(results_status_observable());
    results_status_observable.subscribe(this.transitionTo.bind(this));

    var $settings = this.$el.querySelector('.settings');

    //this.loading_state.hide();

    this.interface_selector.render();
    this.network_settings.render();
    this.network_settings.hide();

    if(this.$interface_selector){
        this.$interface_selector.parentNode.removeChild(this.$interface_selector);
    }
    if(this.$network_settings){
        this.$network_settings.parentNode.removeChild(this.$network_settings);
    }

    this.$interface_selector = this.interface_selector.$el;
    this.$network_settings = this.network_settings.$el;

    $settings.appendChild(this.$interface_selector);
    $settings.appendChild(this.$network_settings);

    this.bind();
    this.network_settings.bind();
//    this.init_render = false;

    return this.$el;
};

PulseViewModel.prototype.render_loading = function () {
    var message = 'Loading...';
    this.loading_state.set_el(this.$el);

    this.loading_state.show(message);

    return this.$el;
};

PulseViewModel.prototype.show = function () {
    //after uploaded valid license, not necessary anymore, cause it poll every time when show()
//    if(this.model.license_status() === 'invalid')
//    {
//        this.render_loading();
//        this.reload();
//    }

    //this.syncPortsFrom();
    this.render_loading();
    this.reload();
    //regular
    classes(this.$el).remove('hidden');
};

PulseViewModel.prototype.reload = function () {
    //try to fetch a valid licence
    this.poller.poll();
};

PulseViewModel.prototype.hide = function () {
    classes(this.$el).add('hidden');
    if (this.poller.stop) {
        this.poller.stop();
    }
};

PulseViewModel.prototype.bind = function () {
    var $el = this.$el,
        model = this.model,
        $enable = $el.querySelector('.status .enable'),
        enable = model.status.bind(this.model, 'enabled'),
        $disable = $el.querySelector('.status .disable'),
        disable = model.status.bind(this.model, 'disabled'),
        $save = $el.querySelector('.save'),
        validate = this.validate.bind(this),
        $settings = $el.querySelector('.settings'),
        toggle_state = function () {
            if (model.enabled()) {
                $enable.checked = true;
                $disable.checked = false;
                classes($settings).remove('hidden');
            } else {
                $enable.checked = false;
                $disable.checked = true;
                classes($settings).add('hidden');
            }
        };

    // UI -> UI
    this.interface_selector.on('select', this.select_port.bind(this));


    // UI -> model
    this.event_handlers = [
        [$enable, 'change', enable],
        [$disable, 'change', disable],
        [$save, 'click', validate]
    ];

    this.event_handlers.forEach(function (handler) {
        events.bind(handler[0], handler[1], handler[2]);
    });
//    events.bind($enable, 'change', enable);
//    events.bind($disable, 'change', disable);
//    events.bind($save, 'click', validate);

    // Model -> UI
    model.on('change status', toggle_state);
    toggle_state();
};

PulseViewModel.prototype.unbind = function () {
    this.event_handlers.forEach(function (handler) {
        events.unbind(handler[0], handler[1], handler[2]);
    });
};

PulseViewModel.prototype.select_port = function (model) {
    var self = this,
        select_port_action = function () {
            this.model.interfaces().forEach(function (iface) {
                if (model.physical_port() === iface.physical_port()) {
                    iface.enabled(true);
                    iface.allocated_to('streetwise');
                } else if (iface.allocated_to() === 'streetwise') {
                    iface.enabled(false);
                    iface.allocated_to('stc');
                }
            });

            this.port_selected = true;
            this.network_settings.unbind();
            this.network_settings.set_model(model);
            this.network_settings.render();
            this.network_settings.bind();
            this.network_settings.show();
        };

    if(model.allocated_to() !== 'stc' && model.allocated_to() !== 'streetwise'){
        lightbox.confirmation_dialog(self,self.strings["pulse port overwrite confirmation"],select_port_action);
//            this.port_overwrite_confirmation(select_port_action);
        return;
    }

    select_port_action.call(self);

};

PulseViewModel.prototype.render_interface = function (model, $el) {
    var classed = classes($el);

    classed.remove('streetwise');


    if (model.allocated_to()) {
        classed.add(model.allocated_to());
    }

    if (model.available()) {
        classed.add('available');
    } else {
        classed.remove('available');
    }

    return $el;
};

PulseViewModel.prototype.validate = function (e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }

    // Make sure a port is selected
    this.hide_select_a_port();
    if(this.model.enabled()){
        if (!this.port_selected) {
            // Show validation error
            this.show_select_a_port();
            return;
        }

        this.network_settings.validate(this.confirm_save.bind(this));
    }
    else
    {
        this.confirm_save();
    }

};

PulseViewModel.prototype.confirm_save = function () {
    lightbox.confirmation_dialog(this,this.strings["pulse save confirmation"],this.save);
}

PulseViewModel.prototype.save = function () {
    var poll = this.pollTask.bind(this),
        start_task_poller = function (nothing, response) {
            poll(response.body.task_id);
        },
        model;

    /*ignore jslint start*/
    if (typeof LightboxWorkingViewModel !== 'undefined' && typeof translate === 'function') {
    /*ignore jslint end*/
        model = new LightboxWorkingViewModel(translate("Saving"), translate('Saving...'));
        lightbox.working(model);
    }

    this.model.save(start_task_poller);
};

PulseViewModel.prototype.pollTask = function (task_id) {
    var self = this,
        url = task_status_url + '?task_id=' + task_id,
        poll = self.pollTask.bind(self, task_id),
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

            self.syncPortsTo();

            workingVm.status('success');
            lightbox.working(workingVm);

        });
};

//sync to global port observable, not currently used
PulseViewModel.prototype.syncPortsTo = function(){
    var interfaces = this.model.interfaces(),
        ports_observable = this.ports_observable,
        pulse_enable = this.model.status();

    ports_observable().forEach(function (port_glob) {
        if(port_glob.allocated_to() === 'streetwise')
        {
            port_glob.allocated_to('');
        }
        else if (port_glob.allocated_to() === ''){
            port_glob.allocated_to(undefined);
        }
        interfaces.forEach(function (port_local) {
            if ( pulse_enable === "enabled" && port_local.physical_port() === port_glob.id() && port_local.allocated_to() === 'streetwise') {
                port_glob.allocated_to('streetwise');
                //old_port.available(!new_port.enabled());
            }
        });
    });
}

//sync from global port observable, not currently used
PulseViewModel.prototype.syncPortsFrom = function(){
    var interfaces = this.model.interfaces(),
        ports_observable = this.ports_observable;

    ports_observable().forEach(function (port_glob) {
        interfaces.forEach(function (port_local) {
            if (port_local.physical_port() === port_glob.id()) {
                if(port_glob.allocated_to() !== 'streetwise' && port_glob.allocated_to() !== undefined){
                    port_local.allocated_to(port_glob.allocated_to() === '' ? 'stc': port_glob.allocated_to());
                }
            }
        });
    });
}


PulseViewModel.prototype.show_select_a_port = function() {
    var el = this.interface_selector.$el,
        message = domify('<label class="validator-message">');

    message.textContent = this.strings["Select a port"];

    classes(el).add('invalid');
    if (el.parentNode) {
        el.parentNode.insertBefore(message, el.nextSibling);
    }
};

PulseViewModel.prototype.hide_select_a_port = function() {
    window.util.clear_validation_messages(this.interface_selector.$el);
};

PulseViewModel.prototype.unblock = function () {
    this.loading_state.hide();
};

PulseViewModel.prototype.transitionTo = function (state) {
    if ('running' === state) {
        this.blockForTesting();
    } else {
        this.unblock();
    }
};

PulseViewModel.prototype.blockForTesting = function () {
    var message = this.strings["Please wait for test to finish"];
    this.loading_state.show(message);
};

module.exports = PulseViewModel;