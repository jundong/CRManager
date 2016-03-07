var template = require("./templates/event-list.js"),
    domify = require("domify")

var document = window.document,
    ko = window.ko


var _created = false

function EventList() {
    if (_created) {
        throw "Event list can be initialized only once"
    }
    _created = true

    this.listViewVisible = ko.observable(false)
}

EventList.prototype.render = function(items) {
    var calHeader = document.querySelector('.dhx_cal_header'),
        eventListContainer = document.querySelector("#event-list-container")

    eventListContainer.style.top = calHeader.style.top
    eventListContainer.style.left = calHeader.style.left
    eventListContainer.appendChild(domify(template))

    ko.applyBindings({ items: items }, eventListContainer)
}

module.exports = EventList
