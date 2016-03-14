module.exports = '<form class="netflow-settings main">\n    <div>\n        <h3>NetFlow</h3>\n        <button class="save-button save">Save</button>\n    </div>\n    <div class="single-pane no-padding global">\n        <h4>Global settings</h4>\n        <ul>\n            <li class="mode">\n                <label for="netflow-on">Enable</label>\n                <input type="radio" class="enable" id="netflow-on" name="mode">\n                <label for="netflow-off">Disable</label>\n                <input type="radio" class="disable" id="netflow-off" name="mode">\n            </li>\n        </ul>\n    </div>\n    <div class="single-pane no-padding tip">\n        <h4>Need a collector?</h4>\n        <div>\n            <p>\n                FlowNBA Cloud is a Netflow collector service. Send your Netflow\n                data to FlowNBA, then configure the collector\'s monitoring and\n                anomaly detection with your browser.\n            </p>\n            <p>\n                Check out <a id="flownba" href="https://www.flownba.com/?utm_source=axon" target="_blank">FlowNBA.com</a>\n                for more information.\n            </p>\n        </div>\n    </div>\n</form>';