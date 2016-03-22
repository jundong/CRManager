var mobile = {};
    mobile.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|windows phone/i.test(navigator.userAgent);
var $ = jQuery;
$.fn.makeTooltip = function(tooltip_element, tooltip_text){
    // Mouse enters the target element
    $(this).on("mouseover", function()
    {
        // Make the tooltip visible
        tooltip_element.css("display", "inline");

        // Set custom text
        tooltip_element.html(tooltip_text);

        // Start listening to the mousemove event, memory is allocated for it
        $(this).on("mousemove", function(event) {
            tooltip_element.offset({left:(event.pageX - (tooltip_element.width() - (tooltip_element.width() / 2))), top:(event.pageY - 60)});
        });
    });

//    // Mouse leaves the target element
//    $(this).off("mouseout", function()
//    {
//        // Stop listening to the mousemove event, memory is released
//        $(this).off("mousemove");
//    });

    $(this).on("mouseout", function()
    {
        // Hide the tooltip
        tooltip_element.css("display", "none");

        //Stop listening to the mousemove event, memory is released
        $(this).off("mousemove");
    });
};

ko.bindingHandlers.testDropTarget = {
    init: function(element, valueAccessor, allBindingsAccessor, context) {
        var $ = jQuery;
        var $element = $(element);
        $element.data('testVm', valueAccessor());
        $element.droppable({
            drop: function(event, ui) {
                if (ui.draggable.hasClass('test')) {
                    var test = ui.draggable.data('test');

                    if (test) {
                        $element.data('testVm').loadTest(test);
                    }

                }
            },
            accept: '.test'
        });
    }
};

ko.bindingHandlers.draggableTest = {
    init: function(element, valueAccessor, allBindingsAccessor, context) {
        var $ = jQuery;
        var $element = $(element);
        $element.data('test', valueAccessor()); //attach meta-data
        $element.draggable({
            revert: 'invalid',
            appendTo: '#main',
            containment:'#main',
            helper: function (event, ui) {
                var $this = $(this);
                var $helper = $(document.createElement('li')).append($this.html());
                $helper.data('test', $this.data('test'));
                $helper.addClass('draggable');
                return $helper;
            }
        });

        $element.addClass('configured').addClass('test');
    }
};

ko.bindingHandlers.render = {
    init: function (element, valueAccessor, allBindingsAccessor, context) {
        var vm = valueAccessor();
        var $vm = vm.render();

        element.appendChild($vm);

        return { controlsDescendantBindings: true };
    }
};

ko.bindingHandlers.trafficSettingSlider = {
    update: function(element, valueAccessor, allBindingsAccessor, context) {
        var $ = jQuery;
        var $element = $(element);
        //var $tooltip = $element.parent().parent().parent().parent().parent().parent().parent().find('.tooltip'); // WHOA, WTF!?
        var $tooltip = $(".playlist").find(".tooltip"); // do not "touch" its ancestors! ^_^

        var updateTrafficSettingValue = function (trafficSetting, percentage) {
            var min = trafficSetting.min();
            var range = trafficSetting.max() - min;
            var percentageDecimal = percentage / 100;

            var newValue = Math.floor(range * percentageDecimal);
            trafficSetting.value(newValue + min);
        };

        var getStartValue = function () {
            var value = valueAccessor();
            var trafficSetting = value.trafficSettings();

            var min = trafficSetting.min();
            var range = trafficSetting.max() - min;
            var percentageDecimal = (trafficSetting.value() - min) / range;

            var percentage = Math.floor(percentageDecimal * 100);
            return percentage;
        };

        var showTooltip = function (trafficSetting, ui) {
            var min = trafficSetting.min();
            var range = trafficSetting.max() - min;
            var percentageDecimal = ui.value / 100;

            var newValue = Math.floor(range * percentageDecimal);
            newValue = newValue + min;

            var $handle = $(ui.handle);

            $tooltip.show();
            $tooltip.html(newValue + ' ' + trafficSetting.unit());

            var left = $handle.offset().left;
            var top = $handle.offset().top;

            $tooltip.offset({left: (left - ($tooltip.width()/2) ), top:(top - 40)});
        };

        var hideTooltip = function () {
            $tooltip.hide();
        };

        var bindMouseoverInfo = function () {
            $element.bind('mousemove', function (e) {
                var value = valueAccessor();
                var trafficSetting = value.trafficSettings();

                $tooltip.html(trafficSetting.value() + ' ' + trafficSetting.unit());
                $tooltip.show();
                $tooltip.offset({left:(e.pageX - ($tooltip.width() - ($tooltip.width() / 2))), top:(e.pageY - 50)});
            });
            $element.bind('mouseout', function (e) {
                $tooltip.hide();
            });
        };

        $element.slider({
            value: getStartValue(),
            range: 'min',
            stop: function (event, ui) {
                hideTooltip(ui);
                var value = valueAccessor();
                var trafficSetting = value.trafficSettings();

                updateTrafficSettingValue(trafficSetting, ui.value);
                bindMouseoverInfo();
            },
            slide: function (event, ui) {
                $element.unbind('mousemove');
                $element.unbind('mouseout');

                var value = valueAccessor();
                var trafficSetting = value.trafficSettings();

                showTooltip(trafficSetting, ui);
            }
        });

        $element.find('.ui-slider-range').removeClass('color1 color2 color3 color4 color5 color6 color7 color8 color9');
        $element.find('.ui-slider-range').addClass('color' + (valueAccessor().index() + 1));
        bindMouseoverInfo();
    }
};

ko.bindingHandlers.stopBindings = {
    init: function() {
        return { controlsDescendantBindings: true };
    }
};

ko.bindingHandlers.autoSuggest = {
    init: function(element, valueAccessor, allBindingsAccessor, context) {
        var $ = jQuery;
        var $element = $(element);
        var currentArgumentValue = valueAccessor();

        var data = currentArgumentValue.data;
        var observable = currentArgumentValue.value;

        var valueSelector = '#as-values-hidden-field';

        $element.autoSuggest(data, {
            preFill:observable(),
            asHtmlID:'hidden-field',
            selectionAdded: function (elem) {
                observable($(valueSelector).val());
            },
            selectionRemoved: function (elem) {
                observable($(valueSelector).val());
            }
        });
    }
};

ko.bindingHandlers.timeSyncAlertTooltip = {
    update: function (element, valueAccessor, allBindingsAccessor, context) {
        var alertMessage = valueAccessor();
        if (alertMessage == null || alertMessage == undefined) {
            return;
        }

        var $element = $(element);
        var $tooltip = $('.time-sync-alert-tooltip');

        $element.makeTooltip($tooltip, '<h6>Accuracy Alert!</h6>' + alertMessage);
    }
};

ko.bindingHandlers.chart = {
    update : function(element, valueAccessor, allBindingsAccessor, viewModel){
        var chart = valueAccessor().chart();
        chart.root = $(element).parent();
        chart.draw.call(chart);
    }
};

ko.bindingHandlers.scrollPanel = {
    init : function(element, valueAccessor, allBindingAccessor, viewModel){
        var currentValue = valueAccessor(),
            i,
            boundObservables;

        $(element).scroller(currentValue.settings);

        function updateScroller() {
            setTimeout(function(){
                $(element).scroller("update");
            }, 0);
        }

        boundObservables = currentValue.boundObservables || [];
        for (i = 0; i < boundObservables.length; i += 1) {
            boundObservables[i].subscribe(updateScroller);
        }
    },
    update : function(element, valueAccessor, allBindingAccessor, viewModel){
        setTimeout(function(){
            $(element).scroller("update");
        }, 0);
    }
};

ko.bindingHandlers.customDropdown = {
    init : function(element, valueAccessor, allBindingsAccessor, viewModel){
        var sibling = $(element).prev();
    },
    update : function(element, valueAccessor, allBindingsAccessor, viewModel){
    }
};

ko.bindingHandlers.debug = {
    init : function(element, valueAccessor, allBindingsAccessor, viewModel){
        var unwrapped = util.recursiveUnwrapObservable(valueAccessor(), true);
        logger.debug("INIT <" + element.tagName + " id=" + element.id + " class=" + element.className + "> debug-bind-value=" + unwrapped.value + " (wrapped " + unwrapped.counter + " times)");
    },
    update : function(element, valueAccessor, allBindingsAccessor, viewModel){
        debugger;
        var unwrapped = util.recursiveUnwrapObservable(valueAccessor(), true);
        logger.debug("UPDATE <" + element.tagName + " id=" + element.id + " class=" + element.className + "> debug-bind-value=" + unwrapped.value + " (wrapped " + unwrapped.counter + " times)");
    }
};

ko.bindingHandlers.disable = {
    update : function(element, valueAccessor, allBindingsAccessor, contex){
        var value = util.recursiveUnwrapObservable(valueAccessor());
        if(value){
            $(element).attr("disabled", "disabled");
        }else{
            $(element).removeAttr("disabled");
        }
    }
};

ko.bindingHandlers.blockUI = {
    update: function(element, valueAccessor, allBindingsAccessor, context) {
        var $ = jQuery;
        var $element = $(element);
        if($element.attr("class") != 'test' && valueAccessor()() == 'running') {
            $element.block({ message: null, overlayCSS: { backgroundColor: '#000', opacity: 0.3 } });
        }
    }
};

ko.bindingHandlers.blockUpdatesUI = {
    update: function(element, valueAccessor, allBindingsAccessor, context) {
        var $ = jQuery;
        var $element = $(element);
            $element.unblock();
    } 
};

ko.bindingHandlers.rentalBlockUI = {
    update: function(element, valueAccessor, allBindingsAccessor, context) {
        var $ = jQuery;
        var $element = $(element);
        $('.test-controller > .container').unblock();
    }
};

ko.bindingHandlers.testConfigSidebar = {
    update: function(element, valueAccessor, allBindingsAccessor, context) {
        $(window).unbind('scroll');
        $(window).unbind('resize');
        var $selected_tab = $('.' + ixiaCRVm.selectedTab()),
            $sidebar = $selected_tab.find('.sidebar'),
            $placeholder = $selected_tab.find('.sidebar-placeholder'),
            $testHeader = $selected_tab.find('.test-header'),
            $header = $('#header'),
            $schConfigure = $selected_tab.find('.scheduler-configure');

        $(window).scroll(function (e) {
            var scrollHeight = $testHeader.outerHeight() + $header.outerHeight();
            if($schConfigure){
                scrollHeight += $schConfigure.outerHeight();
            }

            if ($(this).scrollTop() > scrollHeight && !$sidebar.hasClass('locked')) {
                $sidebar.addClass('locked');
                $placeholder.addClass('locked');
                $sidebar.width($testHeader.width());
            } else if ($(this).scrollTop() <= scrollHeight && $sidebar.hasClass('locked')) {
                $sidebar.removeClass('locked');
                $placeholder.removeClass('locked');
                $sidebar.css('width', '');
            }
        });

        $(window).resize(function (e) {
            if ($sidebar.hasClass('locked')) {
                $sidebar.width($testHeader.width());
            }
        });
    }
};

ko.bindingHandlers.datePicker = {
    update: function(element, valueAccessor, allBindingsAccessor, context) {
        var $ = jQuery;
        var $element = $(element);
        $element.datepicker({
            maxDate: 0
        });
    }
};

ko.bindingHandlers.schedulerDatePicker = {
    update: function(element, valueAccessor, allBindingsAccessor, context) {
        var $ = jQuery;
        var $element = $(element);
        $element.datepicker({
            dateFormat: 'yy-mm-dd',
            minDate: 0
        });
    }
};

ko.bindingHandlers.tooltip = {
    update: function (element, valueAccessor, allBindingsAccessor, context) {
        var $ = jQuery;
        var $element = $(element);
        $element.unbind('mouseover');
        $element.unbind('mouseout');

        // Try to use nested tooltip
        var $tooltip = $element.parent().find('.tooltip');

        if (!$tooltip.length) {
            // Reuse the previously-inserted tooltip
            $tooltip = $('.tooltip.custom-binding');
        }

        if (!$tooltip.length) {
            // Insert a new tooltip
            $tooltip = $(document.createElement('div'));
            $tooltip.addClass('tooltip');
            $tooltip.addClass('custom-binding');
            $tooltip.hide();
            $tooltip.appendTo('body');
        }

        $element.bind('mousemove', function (e){
            var offset = $element.offset();

            // Adjust for size of $tooltip
            offset.left -= $tooltip.outerWidth() / 2;
            offset.top -= $tooltip.outerHeight();

            // Adjust for size of $element
            offset.left += $element.outerWidth() / 2;

            $tooltip.offset({left: offset.left, top: offset.top});
            $tooltip.html($element.attr('data-title'));
            $tooltip.show();
        });

        $element.bind('mouseout', function (){
            $tooltip.hide();
        });
    }
}
ko.bindingHandlers.adminTooltip = {
    update: function (element, valueAccessor, allBindingsAccessor, context) {
        var $ = jQuery;
        var $element = $(element);
        $element.unbind('mouseover');
        $element.unbind('mouseout');
        var tooltipId = "#"+$element.attr('data-tooltip');
        var $tooltip = $(tooltipId);

        $element.bind('mousemove', function (e){
            $tooltip.show();
            $tooltip.offset({left:(e.pageX - ($tooltip.width() * 0.5)), top:(e.pageY - ($tooltip.height() + 30))});
            $tooltip.html($element.attr('data-title'));
        });

        $element.bind('mouseout', function (){
            $tooltip.offset({left:0, top:0});

            $tooltip.hide();
        });
    }
}

ko.bindingHandlers.validateOldPassword = {
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var $ = jQuery;
        var $element = $(element);
        var timer = 0;
        var checkPassword = function() {
            if ($element.val() != ""){
                $.ajax({
                    type: 'POST',
                    url: util.getConfigSetting('verify_password'),
                    data: '{"password": "'+$element.val()+'"}',
                    dataType: 'json',
                    invokeData: {
                        viewModel:viewModel
                    },
                    success: function (data, textStatus, jqXhr) {
                            this.invokeData.viewModel.validateOldPassword(data.result);
                    }
                });
            }
        }

        $element.on('keyup', function(){
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(checkPassword, 400);
        });
    }
};

ko.bindingHandlers.validateNewPassword = {
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var $ = jQuery;
        var $element = $(element);
        var timer = 0;
        var checkPasswords = function() {
            if ($('#newPassword').val() != "" && $('#newPasswordVerify').val() != ""){
                if ($('#newPassword').val() === $('#newPasswordVerify').val()){
                    viewModel.validateNewPassword('confirmed');
                } else {
                    viewModel.validateNewPassword('error');
                }
            } else {
                    viewModel.validateNewPassword(undefined);
            }
        }
        $element.on('keyup', function(){
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(checkPasswords, 400);
        });
    }
};

ko.bindingHandlers.stcLicenseFileUpload = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, context){
        new qq.FileUploader({
            // If we're using jQuery, there's another way of selecting the DOM node
            element: $('#fine-uploader')[0],
            action: '/spirent/set_stc_license',
            debug: true,
            multiple: false,
            allowedExtensions: ['lic'],
            sizeLimit: 102400, // 50 kB = 50 * 1024 bytes
            uploadButtonText: translate('Upload license bundle'),
            showMessage: function(message) {
            // Using Bootstrap's classes and jQuery selector and DOM manipulation
                $('#fine-uploader > div.error, #fine-uploader > div.validated').remove();
                $('#fine-uploader').append('<div class="error">' + message + '</div>');
            },
            onComplete: function(id, fileName, responseJSON) {
                var completedPollingFunction=function(taskname, data){
                    $('#fine-uploader > div.error, #fine-uploader > div.validated').remove();

                    if (data.status==='complete') {
                        var message = data.messages[0];
                        if (message.is_error) {
                            util.lightbox.openError(message.header, message.content);
                        } else {
                            var workingVm = new LightboxWorkingViewModel(translate('Refreshing License Status'), translate('Refreshing License Status'));
                            util.lightbox.working(workingVm);
                            setTimeout(function(){
                                $.ajax({
                                    type: 'POST',
                                    url: util.getConfigSetting('get_global_settings'),
                                    dataType: 'json',
                                    success: function (data, textStatus, jqXhr) {
                                        viewModel.globalSettingsVm.inflate(data);
                                        util.lightbox.close();
                                    }
                                });
                            }, 10000);
                        }
                    }
                }
                viewModel.showTaskStatus({ "status": "running", "messages": [{"header": translate("Starting license upload"), "content": translate("Starting license upload")}]}, translate("License Upload"), responseJSON.task_id, completedPollingFunction);
            },
            failedUploadTextDisplay: {
                mode: 'custom',
                maxChars: 40,
                isErrorPropertyCheck: 'is_error',
                responseProperty: 'messages[0].content',
                enableTooltip: true
            }
        });
    }
};

ko.bindingHandlers.backupFileUpload = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, context){
        new qq.FileUploader({
            // If we're using jQuery, there's another way of selecting the DOM node
            element: $('#backup-uploader')[0],
            action: '/spirent/upload_backup',
            debug: true,
            multiple: false,
            allowedExtensions: ['axon'],
            sizeLimit: 0,
            uploadButtonText: translate('Upload backup'),
            showMessage: function(message) {
            // Using Bootstrap's classes and jQuery selector and DOM manipulation
                $('#backup-uploader > div.error, #backup-uploader > div.validated').remove();
                $('#backup-uploader').append('<div class="error">' + message + '</div>');
            },
            onSubmit: function(id, fileName) {
                util.lightbox.close();
                util.lightbox.working(new LightboxWorkingViewModel(translate("Uploading backup..."), translate("Uploading backup...")));
            },
            onComplete: function(id, fileName, responseJSON) {
                $('#backup-uploader > div.error, #backup-uploader > div.validated').remove();

                if (responseJSON.result === 'SUCCESS') {
                    globalSettingsCallback = function(){
                        self.lightboxText =translate('Success');
                        util.lightbox.open({
                            url : 'html/lightbox_tmpl',
                            selector : '#lightbox-message-template',
                            cancelSelector: '.ok-button',
                            onOpenComplete: function(){
                                ko.applyBindings(self, document.querySelector('#fade #lightbox-message'));
                            }
                        });
                    };

                    window.ixiaCRVm.getGlobalSettings(globalSettingsCallback, true);
                    util.lightbox.working(new LightboxWorkingViewModel(translate("Refreshing backup list"), translate("Refreshing backup list")));
                }
                else {
                    util.lightbox.openError(translate('Upload failed'), (responseJSON.messages & response.messages.length > 0) ? data.messages[0] : 'Unknown failure');
                }
            },
            failedUploadTextDisplay: {
                mode: 'custom',
                maxChars: 40,
                isErrorPropertyCheck: 'is_error',
                responseProperty: 'messages[0].content',
                enableTooltip: true
            }
        });
    }
};

ko.bindingHandlers.refreshDhcpSettings = {
    update: function(element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var $ = jQuery;
        var $element = $(element);
        if($element.is(':checked')){
            $.ajax({
                type: 'GET',
                url: util.getConfigSetting('get_global_settings'),
                dataType: 'json',
                invokeData: {
                    viewModel:viewModel
                },
                success: function (data, textStatus, jqXhr) {
                    this.invokeData.viewModel.globalSettingsVm.host(data.host);
                    this.invokeData.viewModel.globalSettingsVm.chassisPrefix(data.chassis_prefix);
                    this.invokeData.viewModel.globalSettingsVm.gateway(data.gateway);
                }
            });
        }
    }
};

ko.bindingHandlers.debug =
{
    init: function(element, valueAccessor)
    {
        logger.debug( 'Knockoutbinding:' );
        logger.debug( element );
        logger.debug( valueAccessor() );
    }
};

//=============================================================================
//KO overrides
//=============================================================================
function ensureDropdownSelectionIsConsistentWithModelValue(element, modelValue, preferModelValue) {
    if (preferModelValue) {
        if (modelValue !== ko.selectExtensions.readValue(element))
            ko.selectExtensions.writeValue(element, modelValue);
    }

    // No matter which direction we're syncing in, we want the end result to be equality between dropdown value and model value.
    // If they aren't equal, either we prefer the dropdown value, or the model value couldn't be represented, so either way,
    // change the model value to match the dropdown.
    if (modelValue !== ko.selectExtensions.readValue(element))
        ko.utils.triggerEvent(element, "change");
};

ko.bindingHandlers.numericValue = {
    init : function(element, valueAccessor, allBindingsAccessor) {
        var underlyingObservable = valueAccessor();
        var interceptor = ko.dependentObservable({
            read: underlyingObservable,
            write: function(value) {
                if (!isNaN(value)) {
                    underlyingObservable(parseInt(value));
               }
            } 
        });
        ko.bindingHandlers.value.init(element, function() { return interceptor }, allBindingsAccessor);
    },
    update : ko.bindingHandlers.value.update
};
