module.exports = '<div class="endpoint-pane" data-bind="visible: is_selected">\n    <section>\n        <ul class="form">\n            <li class="enable"><label><input type="checkbox" id="enable"> Enable this port</label></li>\n            <li>\n                <label class="vlan">VLAN ID</label>\n                <input type="text" name="vlan_id" class="vlan" data-bind="value: vlan_id" placeholder="1 to 4096">\n                <span class="save small-round-button-outer"><a class="small-round-button"><img src="static/images/save.png" title="Save" alt="Save"></a></span>\n            </li>\n            <li class="selector dhcpContainer">\n                <input type="radio" value="false" data-bind="checked: use_dhcp">\n                <label class="dhcp"> No DHCP</label>\n\n                <input type="radio" value="v4" data-bind="checked: use_dhcp">\n                <label class="dhcp normalCase"> DHCPv4</label>\n\n                <input type="radio" value="v6" data-bind="checked: use_dhcp">\n                <label class="dhcp normalCase"> DHCPv6</label>\n            </li>\n            <li data-bind="visible: use_dhcp() != \'false\'" class="dhcp dhcp-hosts">\n                <ul>\n                    <label class="dhcpHosts">Number of hosts</label>\n                    <input type="text" name="dhcp_hosts" data-bind="value: dhcp_hosts">\n                </ul>\n            </li>\n            <li data-bind="visible: use_dhcp() == \'false\'">\n                <ul>\n                    <li class="static ip">\n                        <label class="startingIpAddress">Starting IP</label>\n                        <input type="text" name="starting_ip" placeholder="IPv4 or IPv6" data-bind="value: ip">\n                    </li>\n                    <li class="static end_ip">\n                        <label>Ending IP</label>\n                        <input type="text" name="ending_ip" placeholder="IPv4 or IPv6" data-bind="value: end_ip">\n                    </li>\n                    <li class="static prefix">\n                        <label>Prefix</label>\n                        <input type="text" name="prefix" placeholder="1 to 128" data-bind="value: prefix">\n                    </li>\n                    <li class="static gateway">\n                        <label>Gateway</label>\n                        <input type="text" name="gateway" placeholder="IPv4 or IPv6" data-bind="value: gateway">\n                    </li>\n                </ul>\n            </li>\n        </ul>\n    </section>\n</div>';