/*global $:true */

function handler(jqXhr, textStatus, e) {
    e.ajax = true;
    e.timeStamp = jqXhr.timeStamp;
    e.textStatus = textStatus;
    this.error(e);
}

module.exports = function (logger) {
    // Handle ajax errors and pass em' back to the server
    $(document).ajaxError(handler.bind(logger));
};
