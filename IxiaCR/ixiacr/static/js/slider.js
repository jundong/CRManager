'use strict';
/**
 * Created with JetBrains PhpStorm.
 * User: David
 * Date: 6/26/12
 * Time: 9:59 AM
 * To change this template use File | Settings | File Templates.
 */

function Resizable($resizeElement) {
    var self = this;

    self.$resizeElement = $resizeElement;

    self.startWidth = 0;
    self.widthPercentage = 0;
    self.colorId = 0;
}

function ResizableKnob($knobElement) {
    var self = this;

    self.$knobElement = $knobElement;

    self.startLeft = 0;
    self.leftMax = 0;
    self.leftMin = 0;
}

function PlaylistSlider($container, resizablesSelector, playlist, viewModel, isEditable) {
    var createSlider = function () {
        $container.empty();

        var thePlaylist = playlist(),
            tracks = thePlaylist.tracks(),
            i, elLi, elSpan, track;

        for (i = 0; i < tracks.length; i += 1) {
            elLi = document.createElement('li');

            elSpan = document.createElement('span');

            track = tracks[i]();

            $(elSpan).html(track.name());

            $(elLi).html(elSpan);
            $(elLi).addClass('resizable');
            $(elLi).attr('data-color-id', track.colorId());
            $container.append(elLi);
        }

        $container.addClass('slider');
    };

    var createResizables = function () {
        $container.children(resizablesSelector).each(function (index){
            var resizable = new Resizable(jQuery(this));
            resizables.push(resizable);
        });
    };

    var getHasPreconfiguredWidths = function () {
        var hasPreconfiguredWidths = false;

        var thePlaylist = playlist();

        if (thePlaylist.getTrackLayer() >= 4) {
            return true;
        }

        var preconfiguredTotalPercentage = 0;
        var tracks = thePlaylist.tracks();
        if (tracks.length > 0) {
            for (var i = 0; i < tracks.length; i++) {
                preconfiguredTotalPercentage += tracks[i]().percentage();
            }

            if (preconfiguredTotalPercentage == 100) {
                hasPreconfiguredWidths = true;
            }
        }

        return hasPreconfiguredWidths;
    };

    var initializeWithPreconfiguredWidths = function () {
        var totalWidth = 0;

        var thePlaylist = playlist();
        var tracks = thePlaylist.tracks();

        if (tracks.length != resizables.length) {
            setTimeout(initializeWithPreconfiguredWidths, 50);
            return;
        }

        var resizable = null;
        //playlist().calculatePercentagesForApplicationLayerTracks();
        for (var i = 0; i < tracks.length; i++) {
            resizable = resizables[i];
            var resizableStartWidth = Math.floor((tracks[i]().percentage() * 0.01) * fullWidth);

            if (isNaN(resizableStartWidth)) {
                resizableStartWidth = 0;
            }
            if (resizableStartWidth < minWidth) {
                resizableStartWidth = minWidth - 1;
            }

            resizable.startWidth = resizableStartWidth;
            resizable.$resizeElement.width(resizableStartWidth);
            resizable.widthPercentage = tracks[i]().percentage;

            setColorClass(resizable.$resizeElement, i);

            totalWidth += resizableStartWidth;
        }

        if (totalWidth != fullWidth) {
            if (totalWidth < fullWidth) {
                var widthAdjustment = fullWidth - totalWidth;

                resizable = resizables[tracks.length - 1];

                resizable.startWidth += widthAdjustment;

                resizable.$resizeElement.width(resizable.startWidth);
            } else {
                for (var i = 0; i < tracks.length; i++) {
                    resizable = resizables[i];

                    if (resizable.startWidth > minWidth) {
                        resizable.startWidth -= 1;

                        resizable.$resizeElement.width(resizable.startWidth);

                        totalWidth -= 1;

                        if (totalWidth == fullWidth) {
                            break;
                        }
                    }

                    if (i == tracks.length - 1
                        && totalWidth != fullWidth) {
                        i = -1;
                    }
                }
            }
        }

        if (totalWidth < fullWidth) {
        }
    };

    var initializeWithDefaultWidths = function () {
        var startWidth = Math.floor(fullWidth / resizablesCount);
        var remainder = fullWidth - (startWidth * resizablesCount);

        for (var i = 0; i < resizablesCount; i++) {
            var resizable = resizables[i];
            resizable.startWidth = startWidth;
            resizable.$resizeElement.width(startWidth);

            setColorClass(resizable.$resizeElement, i);
        }

        if (resizablesCount > 0) {
            resizables[resizables.length - 1].startWidth += remainder;
            resizables[resizables.length - 1].$resizeElement.width(resizables[resizables.length - 1].startWidth);
        }
    };

    var setColorClass = function ($resizeElement, index) {
        $resizeElement.removeClass('color1 color2 color3 color4 color5 color6 color7 color8 color9');
        $resizeElement.addClass('color' + (parseInt($resizeElement.attr('data-color-id')) + 1));
        return;
        switch (index % 9) {
            case 0:
                $resizeElement.removeClass('color1 color2 color3 color4 color5 color6 color7 color8 color9').addClass('color1');
                break;
            case 1:
                $resizeElement.removeClass('color1 color2 color3 color4 color5 color6 color7 color8 color9').addClass('color2');
                break;
            case 2:
                $resizeElement.removeClass('color1 color2 color3 color4 color5 color6 color7 color8 color9').addClass('color3');
                break;
            case 3:
                $resizeElement.removeClass('color1 color2 color3 color4 color5 color6 color7 color8 color9').addClass('color4');
                break;
            case 4:
                $resizeElement.removeClass('color1 color2 color3 color4 color5 color6 color7 color8 color9').addClass('color5');
                break;
            case 5:
                $resizeElement.removeClass('color1 color2 color3 color4 color5 color6 color7 color8 color9').addClass('color6');
                break;
            case 6:
                $resizeElement.removeClass('color1 color2 color3 color4 color5 color6 color7 color8 color9').addClass('color7');
                break;
            case 7:
                $resizeElement.removeClass('color1 color2 color3 color4 color5 color6 color7 color8 color9').addClass('color8');
                break;
            case 8:
                $resizeElement.removeClass('color1 color2 color3 color4 color5 color6 color7 color8 color9').addClass('color9');
                break;
        }
    };

    var createKnobs = function () {
        for (var i = 0; i < resizablesCount - 1; i++) {
            var $knob = jQuery(document.createElement('div')).addClass('knob');

            $container.append($knob);

            resizableKnobs.push(new ResizableKnob($knob));
        }
    };

    var getKnobWidth = function () {
        var knobWidth = 0;

        if (resizableKnobs.length > 0) {
            knobWidth = resizableKnobs[0].$knobElement.width();

            knobWidth += parseInt(resizableKnobs[0].$knobElement.css('border-left-width'), 10);
            knobWidth += parseInt(resizableKnobs[0].$knobElement.css('border-right-width'), 10);
        }

        return knobWidth;
    };

    var setPercentagesButNotVm = function () {
        var totalPercentage = 0;

        for (var i = 0; i < resizablesCount; i++) {
            var resizable = resizables[i];

            var percentage = Math.floor((resizable.$resizeElement.width() / fullWidth) * 100);
            resizable.widthPercentage = ko.observable(percentage);
            totalPercentage += percentage;

//            playlist().tracks()[i]().percentage(resizable.widthPercentage());
        }

        // correcting initial percentage values
        while (totalPercentage < 100) {
            if (resizablesCount===0){
                break;
            }
            for (i = resizablesCount - 1; i >= 0; i--) {
                if (totalPercentage == 100) {
                    break;
                }

                if (i == 0) {
//                    playlist().tracks()[i]().percentage(playlist().tracks()[i]().percentage() + 1);
                    resizables[i].widthPercentage(resizables[i].widthPercentage() + 1);
                    totalPercentage += 1;
                    break;
                }

//                if (playlist().tracks()[i]().percentage() == playlist().tracks()[i - 1]().percentage()) {
                if (resizables[i].widthPercentage() == resizables[i - 1].widthPercentage()) {
//                    playlist().tracks()[i]().percentage(playlist().tracks()[i]().percentage() + 1);
                    resizables[i].widthPercentage(resizables[i].widthPercentage() + 1);
                    totalPercentage += 1;
                }
            }

        }

        while (totalPercentage > 100) {
            for (i = resizablesCount - 1; i >= 0; i--) {
                if (totalPercentage == 100) {
                    i = 0;
                    break;
                }

                if (i == 0) {
//                    playlist().tracks()[i]().percentage(playlist().tracks()[i]().percentage() - 1);
                    resizables[i].widthPercentage(resizables[i].widthPercentage() - 1);
                    totalPercentage -= 1;
                    break;
                }

                if (resizables[i].widthPercentage() == resizables[i - 1].widthPercentage()) {
//                    playlist().tracks()[i]().percentage(playlist().tracks()[i]().percentage() - 1);
                    resizables[i].widthPercentage(resizables[i].widthPercentage() - 1);
                    totalPercentage -= 1;
                }
            }

        }

    };

    var setPercentages = function () {
//        playlist().settingPercentages = true;
        var totalPercentage = 0;

        var thePlaylist = playlist();
        var tracks = thePlaylist.tracks();

        for (var i = 0; i < resizablesCount; i++) {
            var resizable = resizables[i];

            var percentage = Math.floor((resizable.$resizeElement.width() / fullWidth) * 100);
            resizable.widthPercentage = ko.observable(percentage);
            totalPercentage += percentage;

            tracks[i]().percentage(resizable.widthPercentage());
        }

        // correcting initial percentage values
        while (totalPercentage < 100) {
            if (resizablesCount===0){
                break;
            }
            for (i = resizablesCount - 1; i >= 0; i--) {
                if (totalPercentage == 100) {
                    break;
                }

                if (i == 0) {
                    tracks[i]().percentage(tracks[i]().percentage() + 1);
                    resizables[i].widthPercentage(resizables[i].widthPercentage() + 1);
                    totalPercentage += 1;
                    break;
                }

                if (tracks[i]().percentage() == tracks[i - 1]().percentage()) {
                    tracks[i]().percentage(tracks[i]().percentage() + 1);
                    resizables[i].widthPercentage(resizables[i].widthPercentage() + 1);
                    totalPercentage += 1;
                }
            }

        }

        while (totalPercentage > 100) {
            for (i = resizablesCount - 1; i >= 0; i--) {
                if (totalPercentage == 100) {
                    i = 0;
                    break;
                }

                if (i == 0) {
                    tracks[i]().percentage(tracks[i]().percentage() - 1);
                    resizables[i].widthPercentage(resizables[i].widthPercentage() - 1);
                    totalPercentage -= 1;
                    break;
                }

                if (tracks[i]().percentage() == tracks[i - 1]().percentage()) {
                    tracks[i]().percentage(tracks[i]().percentage() - 1);
                    resizables[i].widthPercentage(resizables[i].widthPercentage() - 1);
                    totalPercentage -= 1;
                }
            }

        }
//        playlist().settingPercentages = false;
    };

    var updateViewModel = function (resizable1, resizable2, index, nextIndex) {
        var externalPercentageTotal = 0;

        for (var i in resizables) {
            if (resizables[i] == resizable1 || resizables[i] == resizable2 ) {
                continue;
            }

            externalPercentageTotal += resizables[i].widthPercentage();
        }

        var maxWidth = resizable1.$resizeElement.width() + resizable2.$resizeElement.width();

        var maxPercentage = 100 - externalPercentageTotal - 2;

        var thePlaylist = playlist();
        var tracks = thePlaylist.tracks();
        var track1 = tracks[index]();
        var track2 = tracks[nextIndex]();

        if (maxPercentage == 0) {
            thePlaylist.sliderTooltip.value1Index(track1.colorId());
            thePlaylist.sliderTooltip.value1Name(track1.name());
            thePlaylist.sliderTooltip.value1Percentage('1%');
            thePlaylist.sliderTooltip.value2Index(track2.colorId());
            thePlaylist.sliderTooltip.value2Name(track2.name());
            thePlaylist.sliderTooltip.value2Percentage('1%');

            return;
        }

        maxPercentage = maxPercentage * 0.01;

        var offsetWidth = (maxWidth - (2 * minWidth)) / maxPercentage;

        var newWidth1Percentage = Math.round((((resizable1.$resizeElement.width() - minWidth) + (0.01*offsetWidth)) / offsetWidth) * 100);

        var newWidth2Percentage = null;
        var difference = null;

        var originalWidth1Percentage = resizable1.widthPercentage();
        if (newWidth1Percentage != originalWidth1Percentage) {
            difference = newWidth1Percentage - originalWidth1Percentage;
            newWidth2Percentage = resizable2.widthPercentage() - difference;

            resizable1.widthPercentage(newWidth1Percentage);
            resizable2.widthPercentage(newWidth2Percentage);

            tracks[index]().percentage(newWidth1Percentage);
            tracks[nextIndex]().percentage(newWidth2Percentage);

            thePlaylist.sliderTooltip.value1Index(track1.colorId());
            thePlaylist.sliderTooltip.value1Name(track1.name());
            thePlaylist.sliderTooltip.value1Percentage(newWidth1Percentage + '%');
            thePlaylist.sliderTooltip.value2Index(track2.colorId());
            thePlaylist.sliderTooltip.value2Name(track2.name());
            thePlaylist.sliderTooltip.value2Percentage(newWidth2Percentage + '%');
        }
    };

    var positionKnobsAndSetMax = function () {
        for (var i = 0; i < resizableKnobs.length; i++) {
            var startLeft = 0;
            var leftMax = 0;

            for (var j = 0; j <= i; j++) {
                startLeft += resizables[j].startWidth;
            }

            startLeft -= (knobWidth/2);

            resizableKnobs[i].startLeft = startLeft;

            resizableKnobs[i].$knobElement.css('left', startLeft);

            for (j = 0; j <= i + 1; j++) {
                leftMax += resizables[j].startWidth;
            }

            leftMax -= minWidth;

            resizableKnobs[i].leftMax = leftMax;
        }
    };

    var setKnobsMin = function () {
        for (var i = 0; i < resizableKnobs.length; i++) {
            var leftMin = minWidth;

            if (i-1 >= 0) {
                leftMin += resizableKnobs[i-1].startLeft + (knobWidth/2)
            }

            resizableKnobs[i].leftMin = leftMin;
        }
    };

    var initializeKnobsDraggable = function () {
        for (var i = 0; i < resizableKnobs.length; i++) {
            var resizableKnob = resizableKnobs[i];
            resizableKnob.$knobElement.data('index', i);

            resizableKnob.$knobElement.draggable({
                containment: [resizableKnob.leftMin + containmentXOffset, 0, resizableKnob.leftMax + containmentXOffset, 0],
                axis: 'x',
                stop: function (event, ui) {
                    self.dragging = false;
                    var $knobTooltip = $container.parent().parent().find('.knob-tooltip');
                    $knobTooltip.hide();

                    var index = parseInt(jQuery(ui.helper.context).data('index'));

                    resizableKnobs[index].startLeft = ui.position.left;

                    var previousIndex = index-1;
                    if (previousIndex >= 0) {
                        resizableKnobs[previousIndex].leftMax = resizableKnobs[index].startLeft + (knobWidth/2) - minWidth;

                        resizableKnobs[previousIndex].$knobElement.draggable('option', 'containment', [resizableKnobs[previousIndex].leftMin + containmentXOffset, 0, resizableKnobs[previousIndex].leftMax + containmentXOffset, 0]);
                    }

                    var nextIndex = index+1;
                    if (nextIndex < resizableKnobs.length) {
                        resizableKnobs[nextIndex].leftMin = resizableKnobs[index].startLeft + (knobWidth/2) + minWidth;

                        resizableKnobs[nextIndex].$knobElement.draggable('option', 'containment', [resizableKnobs[nextIndex].leftMin + containmentXOffset, 0, resizableKnobs[nextIndex].leftMax + containmentXOffset, 0]);
                    }

                    resizables[index].startWidth = resizables[index].$resizeElement.width();
                    resizables[nextIndex].startWidth = resizables[nextIndex].$resizeElement.width();

                    updateViewModel(resizables[index], resizables[nextIndex], index, nextIndex);
                    attachTooltips();
                },
                drag: function (event, ui) {
                    var $knobTooltip = $container.parent().parent().find('.knob-tooltip');
                    $knobTooltip.show();
                    self.dragging = true;


                    var index = parseInt(jQuery(ui.helper.context).data('index'));
                    var nextIndex = index+1;

                    var currentPosition = ui.position.left + (knobWidth/2);

                    $knobTooltip.offset({ left: resizables[nextIndex].$resizeElement.offset().left});

                    var offset = resizables[index].$resizeElement.position().left;

                    var diff = (currentPosition - offset) - resizables[index].startWidth;

                    var newWidth1 = resizables[index].startWidth + diff;
                    var newWidth2 = resizables[nextIndex].startWidth - diff;

                    resizables[index].$resizeElement.width(newWidth1);
                    resizables[nextIndex].$resizeElement.width(newWidth2);

                    updateViewModel(resizables[index], resizables[nextIndex], index, nextIndex);

                    attachTooltips();
                }
            });
        }
    };

    var attachTooltips = function () {
        var thePlaylist = playlist();
        var tracks = thePlaylist.tracks();

        if (resizables.length != tracks.length) {
            setTimeout(attachTooltips, 50);
            return;
        }

        for (var i = 0; i < resizables.length; i++) {
            var resizable = resizables[i];

            resizable.$resizeElement.attr('data-title', tracks[i]().name() + ' ' + tracks[i]().percentage() + '%');
        }
    };

    var attachListenersForTrackPercentageUpdates = function () {
        var thePlaylist = playlist();

        thePlaylist.addPlaylistUpdatedCallback(updateWidthsAndTooltips.bind(self));
    };

    var updateWidthsAndTooltips = function () {
        if (self.initializing) {
            setTimeout(function (){
                updateWidthsAndTooltips();
            }, 50);
            return;
        }

        initializeWithPreconfiguredWidths();
        attachTooltips();
    };

    var self = this;

    self.initializing = true;
    self.dragging = false;
    self.setPercentages = setPercentages;
    playlist = playlist();

    createSlider();

    var resizables = new Array();

    var fullWidth = parseInt($container.width());

    createResizables();

    var resizablesCount = resizables.length;

    var hasPreconfiguredWidths = getHasPreconfiguredWidths();

    var resizableKnobs = new Array();

    var thePlaylist = playlist();

    if (thePlaylist.isEdit() && viewModel.playlistIsEdit() && !$container.data('collapsed') && thePlaylist.getTrackLayer() < 4) {
        createKnobs();
    }

    var knobWidth = getKnobWidth();

    var containmentXOffset = $container.offset().left - (knobWidth / 2);

    var minWidth = knobWidth + 5;

    if (hasPreconfiguredWidths) {
        initializeWithPreconfiguredWidths();
    } else {
        initializeWithDefaultWidths();
    }

    if (!hasPreconfiguredWidths) {
        if (isEditable) {
            setPercentages();
        } else {
            setPercentagesButNotVm();
        }
    }

    if (thePlaylist.isEdit() && viewModel.playlistIsEdit() && !$container.data('collapsed') && thePlaylist.getTrackLayer() < 4) {
        positionKnobsAndSetMax();

        setKnobsMin();

        initializeKnobsDraggable();
        attachTooltips();
    } else {
        attachTooltips();
    }

    if (hasPreconfiguredWidths) {
        attachListenersForTrackPercentageUpdates();
    }

    self.initializing = false;
}

ko.bindingHandlers.playlistSlider = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var $ = jQuery;
        var playlistObservable = valueAccessor();
        var playlist = playlistObservable();
        var $element = $(element);
        $element.data('collapsed', false);

        if (viewModel.currentPlaylist == playlist
            && viewModel.currentPlaylistEditable == playlist.isEdit()
            && viewModel.currentPlaylistNumTracks == playlist.tracks().length
            && !playlist.redraw()
            && $element.data('rendered')) {
//            && !playlist().rendering) {
            return;
        }

//        playlist().rendering = true;
        playlist.redraw(false);
        $element.data('rendered', true);
        viewModel.currentPlaylist = playlist;
        viewModel.currentPlaylistEditable = playlist.isEdit();
        viewModel.currentPlaylistNumTracks = playlist.tracks().length;

        var slider = new PlaylistSlider($element, '.resizable', valueAccessor, viewModel, true);

        var $tooltip = $element.parent().parent().find('.tooltip');
        $element.find('.resizable').each(function () {
            var $this = $(this);

            $this.unbind('mouseover');
            $this.unbind('mouseout');


            $this.bind('mousemove', function (e){
                if (!slider.dragging) {
                    $tooltip.show();
                    $tooltip.offset({left:e.pageX, top:(e.pageY - 50)});
                    $tooltip.html($this.attr('data-title'));
                }

            });

            $this.bind('mouseout', function (){
                $tooltip.offset({left:0, top:0});

                $tooltip.hide();

            });
        });

        playlist.sliderControl = slider;
        playlist.rendering = false;
    }
};

ko.bindingHandlers.collapsedPlaylistSlider = {
    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var $ = jQuery;
        var playlist = valueAccessor();
        var $element = $(element);
        $element.data('collapsed', true);

        if (viewModel.currentPlaylist == playlist()
            && viewModel.currentPlaylistEditable == playlist().isEdit()
            && viewModel.currentPlaylistNumTracks == playlist().tracks().length
            && !playlist().redraw()
            && $element.data('rendered')) {
//            && !playlist().rendering) {
            return;
        }

//        playlist().rendering = true;
        $element.data('rendered', true);

        var slider = new PlaylistSlider($element, '.resizable', valueAccessor, viewModel, false);

//        playlist().collapsedSliderControl = slider;

        var $tooltip = $element.parent().parent().find('.tooltip');
        $element.find('.resizable').each(function () {
            var $this = $(this);

            $this.unbind('mouseover');
            $this.unbind('mouseout');


            $this.bind('mousemove', function (e){
                if (!slider.dragging) {
                    $tooltip.show();
                    $tooltip.offset({left:e.pageX, top:(e.pageY - 50)});
                    $tooltip.html($this.attr('data-title'));
                }
            });

            $this.bind('mouseout', function (){
                $tooltip.offset({left:0, top:0});

                $tooltip.hide();

            });
        });

        playlist().rendering = false;
    }
};
