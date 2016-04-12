/*global $: true, LightboxWorkingViewModel: true */

var Logger = require('logger'),
    log_ajax = require('logger-jquery-ajax'),
    AssetManager = require('asset-manager'),
    Translator = require('translator'),
    DictionaryProvider = require('dictionary-provider'),
    Util = require('utility-functions'),
    InfoPane = require('info-pane'),
    promise = require('promise'),
    manager = new AssetManager(),
    lightbox = Util.lightbox,
    event = require('event'),
    classes = require('classes');


function translatorInitializer(language) {
    return promise(function getTranslator(resolve) {
        DictionaryProvider(language, function (dict) {
            window.translate = new Translator(dict);
            resolve();
        });
    });
}

function openLoadingLightbox() {
    return promise(function (resolve) {
        manager.queueDownload("static/images/spinner.gif");
        manager.downloadAll(function () {
            lightbox.open({
                url: 'html/lightbox_tmpl',
                selector: '#lightbox-working-template',
                isModal: true,
                onOpenComplete: resolve
            });
        });
    });
}

function loadingLightboxOpenComplete() {
    return promise(function (resolve) {
        var model = new LightboxWorkingViewModel(translate("Loading"), translate('Loading app...'), 10);
        lightbox.working(model);
        resolve();
    });
}

function getImageUrls() {
    return promise(function (resolve, reject) {
        $.ajax({
            type: "get",
            url: "/ixia/get_images",
            dataType: 'json',
            success: resolve,
            error: function (jqXhr, textStatus, errorThrown) {
                reject(errorThrown);
            }
        });
    });
}

function queueImages(build_number, data) {
    return promise(function (resolve) {
        var model = new LightboxWorkingViewModel(translate("Loading"), translate('Loading images...'), 20),
            imageFiles = data.files,
            i,
            x,
            subfolderImages;

        lightbox.working(model);
        for (i = 0; i < imageFiles.length; i++) {
            if (imageFiles[i].directory === true) {
                subfolderImages = imageFiles[i].children;
                for (x = 0; x < subfolderImages.length; x += 1) {
                    manager.queueDownload("static/images/" + imageFiles[i].name + "/" + subfolderImages[x] + '?' + build_number);
                }
            } else {
                manager.queueDownload("static/images/" + imageFiles[i].name + '?' + build_number);
            }
        }
        manager.downloadAll(resolve);
    });
}

function loadGlobals() {
    // Load modules that will be available to plain-JS scripts (non-component)
    window.DeviceModel = require('device-model');
    window.IxiaViewModel = require('ixia-view-model');
    window.TestHistoryViewModel = require('test-history-view-model');
    window.DashboardViewModel = require('dashboard-view-model');
    window.TestViewModel = require('test-view-model');
    window.TestTemplateViewModel = require('test-template-view-model');
    window.ConfiguredTestViewModel = require('configured-test-view-model');
    window.AdministrationViewModel = require('administration-view-model');
    window.TrafficPlayerViewModel = require('traffic-player-view-model');
    window.TestDeviceViewModel = require('test-device-view-model');
    window.LineRateMessageViewModel = require('line-rate-message-view-model');
    window.TestResultsFinalTableViewModel = require('test-results-final-table-view-model');
    window.InfoPane = require('info-pane');
}

function loadRootViewModel(settings) {
    return promise(function (resolve) {
        var model = new LightboxWorkingViewModel(translate("Loading"), translate('Loading data...'), 30);
        lightbox.working(model);
        var root_vm = new IxiaViewModel(settings);
        root_vm.setUser('Administrator');
        root_vm.init().done(resolve.bind(this, root_vm)).fail(function(e) { window.logger.error(e + ' trace: ' + e.stack); });
        ko.applyBindings(root_vm, document.getElementById('main'));
        window.ixiaCRVm = root_vm;
    });
}

function closeLoadingLightbox(ixiaCRVm) {
    return promise(function (resolve) {
        var model = new LightboxWorkingViewModel(translate("Loading"), translate('App loaded.'), 100);
        lightbox.working(model);
        setTimeout(function () {
            Util.lightbox.close();
        }, 166); // 1/10 of a second delay.
        resolve(ixiaCRVm);
    });
}

function bindScheduler(ixiaCRVm) {
    return promise(function(resolve) {
        try {
            ixiaCRVm.selectedTab.subscribe(function(name) {
            });
            resolve(ixiaCRVm);
        } catch(e) { window.logger.error( e + ' trace: ' + e.stack().toString()); }
    });
}

function loadInfoPane(ixiaCRVm) {
    return promise(function (resolve) {
        var $parent = document.querySelector('#header'),
            pane = new InfoPane($parent, ixiaCRVm);

        pane.render();
        pane.poll_reservation_status();
        pane.on('update:complete', pane.render.bind(pane));
        return resolve(ixiaCRVm);
    });
}

module.exports = function (settings, callback) {
    var level = settings.log_level.toLowerCase(),
        logger,
        load;

    window.appHistory = {
        push : function (vm) {
            var state = vm.getState();
            if (history.pushState) {
                history.pushState(state, "CyberRange");
            }
        }
    };

    // Setup logging

    level = Logger.levels[level];
    logger = new Logger(level, settings, '/ixia/log_js.json');

    if (window) {
        window.logger = logger;
        logger.attachWindowErrorHandler();
    }

    if ($) {
        logger.use(log_ajax);
    }

    ko.setTemplateEngine(new ko.nativeTemplateEngine())

    // Load assets

    load = translatorInitializer(settings.language)
        .then(openLoadingLightbox)
        .then(loadingLightboxOpenComplete)
        .then(getImageUrls)
        .then(queueImages.bind(this, settings.build_number))
        .then(loadGlobals)
        .then(loadRootViewModel.bind(this, settings));

    load.then(closeLoadingLightbox)
        .then(loadInfoPane)
        .then(callback, function (err) {
            logger.error(err);
        })
;
};