var InterfaceModel = require('interface-model'),
    PulseInterfaceModel = InterfaceModel;

PulseInterfaceModel
    .attr('enabled')
    .attr('vlan')
    .attr('dhcp')
    .attr('ip')
    .attr('netmask')
    .attr('gateway');

module.exports = PulseInterfaceModel;