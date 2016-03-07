var template = require("./templates/balloon.js"),
    domify = require("domify")

var $ = window.jQuery,
    _ko = window.ko,
    _translate = window.translate

var _balloon = null,
    _binding = null,
    _leftLabel = null,
    _leftButtonClick = null,
    _rightLabel = null,
    _rightButtonClick = null,

showEventBalloon = function (element, title, datetime, status, error_reason, devices, leftLabel, leftButtonClick, rightLabel, rightButtonClick) {
    element = $(element);
    element = element.attr('event_id') ? element : element.parents('[event_id]');

    var id = element.attr('event_id');

    if (_balloon == null) {
        initializeBalloon()
    }

    adjustData(title, datetime, status, error_reason, devices)
    adjustListeners(leftLabel, leftButtonClick, rightLabel, rightButtonClick)

    _balloon.show()
    adjustPosition(id)
    adjustPosition(id)
    $(window).on('resize', adjustPosition.bind(this, id, _balloon));
}

function initializeBalloon() {
    _balloon = $(domify(template)).appendTo("body")

    _binding = {
        leftButtonVisisble: ko.observable(false),
        rightButtonVisisble: ko.observable(false),

        labelDevices: _translate("Devices"),
        leftLabel: ko.observable(""),
        rightLabel: ko.observable(""),

        title: _ko.observable(""),
        datetime: _ko.observable(""),
        status: _ko.observable(""),
        error_reason: _ko.observable(""),
        devices: _ko.observable(""),

        onClose: function () {
            _balloon.hide()
        },
        leftButtonClick: function () {
            _balloon.hide()
            _leftButtonClick()
        },
        rightButtonClick: function () {
            _balloon.hide()
            _rightButtonClick()
        }
    };

    _binding.status_message = _ko.computed(function() {
        var status = _binding.status();

        if (!status) {
            return '';
        }

        status = status.charAt(0).toUpperCase() + status.slice(1);

        if (status === 'Error') {
            return 'Error: ' + _binding.error_reason();
        }

        return status;
    });

    _ko.applyBindings(_binding, _balloon[0])
}

function adjustPosition(id, balloon) {
    var element = $('[event_id=' + id + ']');
    balloon = balloon || _balloon;

    var elTopY = element.offset().top
//    if (totalHeight(_balloon) < elTopY) {
        balloon.css("top", elTopY - totalHeight(_balloon))
//    } else {
//        _balloon.css("top", elTopY + element.height() +
//            marginToInt(_balloon.css("margin-top")))
//    }

    var elCenterX = element.offset().left + totalWidth(element) / 2
    var balloonWidth = totalWidth(balloon)
    if (balloonWidth / 2 > elCenterX) {
        balloon.css("left", 0)
    } else if (balloonWidth / 2 > $(window).width() - elCenterX) {
        balloon.css("left", $(window).width() - balloonWidth)
    } else {
        balloon.css("left", elCenterX - balloonWidth / 2)
    }
}

function adjustData(title, datetime, status, error_reason, devices) {
    var devicesNames = []
    for (var i=0, len=devices.length; i<len; ++i) { devicesNames.push(devices[i].name) }

    _binding.title(title)
    _binding.datetime(datetime)
    _binding.status(status);
    _binding.error_reason(error_reason);
    _binding.devices(devicesNames.join(", "))
}

function adjustListeners(leftLabel, leftButtonClick, rightLabel, rightButtonClick) {
    _binding.leftLabel(leftLabel)
    _binding.rightLabel(rightLabel)

    _leftButtonClick = leftButtonClick
    _rightButtonClick = rightButtonClick

    _binding.leftButtonVisisble(!!_leftButtonClick)
    _binding.rightButtonVisisble(!!_rightButtonClick)
}

function totalHeight(el) {
    return el.outerHeight() + marginToInt(el.css("margin-top")) +
        marginToInt(el.css("margin-bottom"))
}

function totalWidth(el) {
    return el.width() + marginToInt(el.css("margin-left")) +
        marginToInt(el.css("margin-right"))
}

function marginToInt(margin) {
    return parseInt(margin.replace("px", ""))
}

module.exports = showEventBalloon
