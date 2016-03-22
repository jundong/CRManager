/*global ko:true */

/**
 * Used to show a clickable icon informing the user Axon may be unstable when
 * bandwidth is near line rate of Tx port
 */
function LineRateMessageViewModel() {
    this.source = undefined;
    this.line_speed = undefined;
    this.bandwidth = undefined;
    this.strings = {
        "Running a test at speeds near line-rate can result in unexpected or errant latency in the test results": window.translate('Running a test at speeds near line-rate can result in unexpected or errant latency in the test results. To learn more about what causes this, read <a href="https://www.ixiacom.com/support/solutions/articles/1000060929-line-rate" target="_blank">line rate latency</a>.')
    };
    this.show_icon = ko.observable(false);
    this.show_message = ko.observable(false);
    this.message = this.strings["Running a test at speeds near line-rate can result in unexpected or errant latency in the test results"];
}

LineRateMessageViewModel.prototype.update = function () {
    var max_stable_line_rate;

    if (this.line_speed && this.bandwidth) {
        max_stable_line_rate = this.line_speed * 0.995; // 99.5% of line rate
        if (this.bandwidth >= max_stable_line_rate) {
            this.show_icon(true);
            return; // Short-circuit
        }
    }

    // Hide icon and message by default
    this.show_icon(false);
    this.show_message(false);
};

/**
 * Event handler for showing/hiding line rate message tooltip
 *
 * @param data TestSupplementalConfigurationFieldViewModel|TestTrafficSettingViewModel
 * @param e MouseEvent
 * @returns {boolean}
 */
LineRateMessageViewModel.prototype.toggle = function (data, e) {
    var self = data.lineRateVm;

    if (e.target.tagName === 'A') {
        // Allow hyperlinks to be followed
        return true;
    }

    self.show_message(!self.show_message());
};

module.exports = LineRateMessageViewModel;
