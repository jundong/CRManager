var domify = require('domify'),
    $template = domify(require('./template.html')),
    classes = require('classes'),
    request = require('superagent'),
    no_cache = require('superagent-no-cache'),
    humanize = require('humanize-plus'),
    Visualization = require('./visualization'),
    lightbox = window.util.lightbox;

function DiskManagementViewModel() {
    this.$el = $template.cloneNode(true);
    this.rootVm = null;
    this.updating = ko.observable(0);

    this.space = {
        system: ko.observable(),
        backups: ko.observable(),
        diags: ko.observable(),
        captures: ko.observable(),
        free: ko.observable(),
        total: ko.observable(100)
    };

    this.visualization = new Visualization(this.$el.querySelector('.visualization'), this.space);
    this.colors = [];
    this.computed_container = {};
    this.chart_total_width = 600;
    this.strings = {
        "Delete backups confirm" : window.translate("This operation permanently deletes all backups."),
        "Delete captures confirm" : window.translate("This operation permanently deletes all captures."),
        "Delete diags confirm" : window.translate("This operation permanently deletes all diagnostic bundles.")
    };
}

DiskManagementViewModel.factory = function(rootVm) {
    var view = new DiskManagementViewModel();
    view.rootVm = rootVm;
    return view;
};

DiskManagementViewModel.prototype.render = function() {
    var self = this;

    this.visualization.render();
    self.bind();
    return this.$el;
};

DiskManagementViewModel.prototype.bind = function() {
    var self = this;

    ko.applyBindings(self, self.$el);
};

DiskManagementViewModel.prototype.inflate = function(data) {
    if(!data || !data.vm || !data.vm.usage || !data.vm.free) {
        return; // short-circuit
    }

    var self = this,
        system_space = 0,
        total_space = 0,
        user_content = ['diags', 'captures', 'backups'];

    Object.keys(data.vm.usage).forEach(function (key) {
        if (user_content.indexOf(key) !== -1) {
            self.space[key](data.vm.usage[key]);
        } else {
            system_space += data.vm.usage[key];
        }
        total_space += data.vm.usage[key];
    });

    total_space += data.vm.free;

    self.space.system(system_space);
    self.space.total(total_space);
    self.space.free(data.vm.free);

    self.visualization.inflate(self.space);
    self.colors = self.visualization.colors();

    if (self.rootVm) {
        self.rootVm.availableDiskSpace(data.vm.free);
    }
};

DiskManagementViewModel.prototype.update = function (done) {
    done = done || function () {};

    var self = this;

    self.updating(self.updating() + 1);

    request.get('/ixia/get_disk_info')
        .use(no_cache)
        .end(function (error, response) {
            var data;
            self.updating(self.updating() - 1);

            if (error || !response.ok || response.body.result === 'FAILURE') {
                return done(error || response.error.message || response.response.body.messages);
            }

            data = response.body;

            self.inflate(data);
            done();
        });
}

DiskManagementViewModel.prototype.get_chart_width = function(name) {
    var self = this;

    if(!('get_chart_width_' + name in self.computed_container)){
        self.computed_container['get_chart_width_' + name] = ko.computed(function () {
            return Math.ceil((self.space[name]()/self.space.total()) * self.chart_total_width) + 'px';
        });
    }

    return self.computed_container['get_chart_width_' + name];
}

DiskManagementViewModel.prototype.get_filesize = function(name) {
    var self = this;

    if(!('get_filesize_' + name in self.computed_container)){
        self.computed_container['get_filesize_' + name] = ko.computed(function () {
            return humanize.filesize(self.space[name]());
        });
    }

    return self.computed_container['get_filesize_' + name];
}

DiskManagementViewModel.prototype.get_percentage = function(name) {
    var self = this;

    if(!('get_percentage_' + name in self.computed_container)){
        self.computed_container['get_percentage_' + name] = ko.computed(function () {
            return (Math.floor((self.space[name]()/self.space.total()) * 10000) / 100) + '%'
        });
    }

    return self.computed_container['get_percentage_' + name];
}

DiskManagementViewModel.prototype.go_to_recorder = function() {
    var self = this;
    self.rootVm.selectedTab('recorder');
}

DiskManagementViewModel.prototype.go_to_backup = function() {
    var self = this;
    self.rootVm.vmAdministration.selectedTab('system backup restore');
}

DiskManagementViewModel.prototype.delete_all_backups = function() {
    var self = this,
        confirm_action = function() {
            self.rootVm.vmAdministration.deleteAllSystemBackups(self.update.bind(self));
        };

    lightbox.confirmation_dialog(self,this.strings["Delete backups confirm"], confirm_action);
}

DiskManagementViewModel.prototype.delete_all_captures = function() {
    var self = this,
        confirm_action = function() {
            self.updating(self.updating() + 1);
            request.del('/ixia/traffic-recorder/captures')
                .use(no_cache)
                .end(function (error, response) {
                    self.updating(self.updating() - 1);
                    self.update()
                });
        };

    lightbox.confirmation_dialog(self,this.strings["Delete captures confirm"], confirm_action);
}

DiskManagementViewModel.prototype.delete_all_diags = function() {
    var self = this,
        confirm_action = function() {
            self.updating(self.updating() + 1);
            request.del('/ixia/delete_all_diags')
                .use(no_cache)
                .end(function (error, response) {
                    self.updating(self.updating() - 1);
                    self.update()
                });
        };

    lightbox.confirmation_dialog(self,this.strings["Delete diags confirm"], confirm_action);
}

DiskManagementViewModel.prototype.show = function() {
    classes(this.$el).remove('hidden');
};

DiskManagementViewModel.prototype.hide = function() {
    classes(this.$el).add('hidden');
};

module.exports = DiskManagementViewModel;