/*global $: true */

var emitter = require('emitter'),
    lightboxOptionDefaults = {
        url: "",
        selector: "",
        data: null,
        cancelSelector: null,
        isModal: false,
        onOpenComplete: $.noop,
        onClose: $.noop
    };

function Lightbox(template) {
    if ('[object Function]' === Object.prototype.toString.call(template)) {
        this.getTemplate = template;
    } else {
        this.getTemplate = function () {};
    }
    this.lastCancelSelector = '';
    this.default_title = document.querySelector('title').textContent;
}

emitter(Lightbox.prototype);

module.exports = Lightbox;

//Warning: if used with a click event be sure to stopPropogation so click handlers on body aren't fired.
Lightbox.prototype.open = function (options) {
    if (this.isOpen) {
        this.close();
    }

    options = $.extend({}, lightboxOptionDefaults, options);

    this.getTemplate(options.url, options.selector, this.openWithElement.bind(this, options));
};

Lightbox.prototype.error = function (header, message) {
    message = message || header;

    var workingVm = new LightboxWorkingViewModel(header, message);
    workingVm.status('error');
    this.working(workingVm);
};

Lightbox.prototype.openWithElement = function (options, element) {
    if ($("#fade").length === 0) {
        $("body").append("<div id='fade'></div>");
        $("#fade").append(element.tmpl(options.data));
    } else {
        $("#fade").empty().append(element);
    }

    this.bindEvents(options.isModal, options.cancelSelector, options.onClose);

    options.onOpenComplete(element);
    if ($(window).height() < $("#fade > div").height()) {
        bodyHeight = $(window).height() - 25;
        $("#fade > div").height(bodyHeight);
        $("#fade > div").css({'overflow-y': 'scroll', 'overflow-x': 'hidden'});
    }
    this.isOpen = true;
};

Lightbox.prototype.bindEvents = function (isModal, cancelSelector, onClose) {
    var $mousedown_target = undefined;

    this.unbindEvents();

    if (!isModal) {
        $("body").on("keydown.lightbox", function (e) {
            if (e.which === 27) { //esc
                onClose();
                this.close();
            }
        }.bind(this));
        $("#fade").on("mousedown.lightbox", function (e) {
            $mousedown_target = e.target;
        });
        $("#fade").on("click.lightbox", function () {
            var $dialog = document.querySelector('#fade > div');

            // Make sure they didn't mousedown on dialog first
            if ($dialog.contains($mousedown_target)) {
                return; // Short-circuit
            }

            onClose();
            this.close();
        }.bind(this));
        $(cancelSelector).on("click.lightbox", function (e) {
            onClose();
            this.close();
        }.bind(this));

        this.lastCancelSelector = cancelSelector;
    }
    $("#fade").children().on("click.lightbox", function (e) {
        e.stopPropagation();
    });
};

Lightbox.prototype.unbindEvents = function () {
    $("body").off(".lightbox");
    $(this.lastCancelSelector).off(".lightbox");
    $("#fade").children().off(".lightbox");
};

Lightbox.prototype.openError = function (header, message) {
    var lightboxErrorVm = new LightboxErrorViewModel(header, message);

    var options = {
        url: 'html/lightbox_tmpl',
        selector: '#lightbox-error-template',
        cancelSelector: '.ok-button',
        onOpenComplete: function () {
            ko.applyBindings(lightboxErrorVm, document.getElementById('lightbox-error'));
        }
    };

    this.open(options);
};

Lightbox.prototype.openDeviceAuthError = function (testConfigVm, device, header, message) {
    var lightboxErrorVm = new LightboxDeviceAuthErrorViewModel(testConfigVm, device, header, message);

    var options = {
        url: 'templates/lightbox.tmpl.html',
        selector: '#lightbox-device-auth-error-template',
        cancelSelector: '.cancel',
        onOpenComplete: function () {
            ko.applyBindings(lightboxErrorVm, document.getElementById('lightbox-device-auth-error'));
        }
    };

    this.open(options);
};

Lightbox.prototype.openMessage = function (message) {
    var options = {
        url: 'templates/lightbox.tmpl.html',
        selector: '#lightbox-message-template',
        cancelSelector: '.ok-button',
        onOpenComplete: function () {
            ko.applyBindings({lightboxText: message}, document.getElementById('lightbox-message'));
        }
    };

    this.open(options);
};

Lightbox.prototype.openAlert = function (header, message) {
    var lightboxWarningVm = new LightboxErrorViewModel(header, message);

    var options = {
        url: 'templates/lightbox.tmpl.html',
        selector: '#lightbox-alert-template',
        cancelSelector: '.ok-button',
        onOpenComplete: function () {
            ko.applyBindings(lightboxWarningVm, document.getElementById('lightbox-alert'));
        }
    };

    this.open(options);
};


Lightbox.prototype.openWarning = function (header, message) {
    var lightboxWarningVm = new LightboxErrorViewModel(header, message);

    var options = {
        url: 'templates/lightbox.tmpl.html',
        selector: '#lightbox-error-warning-template',
        cancelSelector: '.ok-button',
        onOpenComplete: function () {
            ko.applyBindings(lightboxWarningVm, document.getElementById('lightbox-error-warning'));
        }
    };

    this.open(options);
};

Lightbox.prototype.confirmIgnoreWorking = function () {
    var text = 'Working';
    if (this instanceof LightboxWorkingViewModel) {
        text = this.actionText().replace('...', '');
    }
    return "Are you sure you want to leave the page while " + text + "?";
}

Lightbox.prototype.working = function (workingVm) {
    var $lb = document.getElementById('lightbox-working'),
        $title = document.querySelector('title');

    window.onbeforeunload = this.confirmIgnoreWorking.bind(workingVm);

    $title.textContent = workingVm.actionText() || 'Loading';

    if ($lb) {
        ko.applyBindings(workingVm, $lb);
    } else {
        this.open({
            url: 'html/lightbox_tmpl',
            selector: '#lightbox-working-template',
            cancelSelector: '.cancel-button',
            isModal: true,
            onOpenComplete: function () {
                ko.applyBindings(workingVm, document.getElementById('lightbox-working'));
            }
        });
    }
    return workingVm;
}

Lightbox.prototype.close = function () {
    $("#fade").remove();
    $("body").off(".lightbox");
    this.isOpen = false;
    window.onbeforeunload = null;
    document.querySelector('title').textContent = this.default_title;
    this.emit('close');
}

Lightbox.prototype.confirmation_dialog = function (invoker, text, okFunction) {
    var self = this;
    invoker.okFunction = function() {
        self.close();
        okFunction.call(invoker);
    };
    invoker.lightboxText = text;
    this.open({
        url: 'html/lightbox_tmpl',
        selector: '#lightbox-warning-template',
        cancelSelector: '.cancel-button',
        onOpenComplete: function () {
            ko.applyBindings(invoker, document.getElementById('lightbox-warning'));
        }
    });
};
