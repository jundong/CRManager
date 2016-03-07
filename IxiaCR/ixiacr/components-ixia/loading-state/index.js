var domify = require('domify'),
    $template = domify(require('./template.js'));

function LoadingState($el) {
    this.$template = $template.cloneNode(true);
    this.set_el($el);
}

LoadingState.prototype.show = function (message) {
    var $message = this.$template.querySelector('h3'),
        prev = $.blockUI.defaults.css; // We need to reset the block UI's CSS

    $message.textContent = message;

    $.blockUI.defaults.css = {};
    $(this.$el).block({
        message: this.$template,
        width: '100%'
    });
    $.blockUI.defaults.css = prev;

    return this.$el;
};

LoadingState.prototype.hide = function () {
    $(this.$el).unblock();
};

LoadingState.prototype.set_el = function ($el) {
    this.$el = $el;
};


module.exports = LoadingState;