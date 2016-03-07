#!/local/pythonenv/bin/python
import json
import os
import types

from ixiacr.lib.engines.portmapper import LocalPortMapper

import unittest2 as unittest

JSON_DIR = os.path.join(os.path.dirname(__file__), 'json')


def load_json(name):
    data = None
    with open(os.path.join(JSON_DIR, name)) as f:
        data = json.loads(f.read())
    return data


def get_nic32_hardware_info(dummy):
    return load_json('nic32.hardware-info.json')


def get_aonic_hardware_info(dummy):
    return load_json('aonic.hardware-info.json')


def get_stc_nic32_hardware_allocations(dummy):
    return load_json('stc.nic32.hardware-allocations.json')


def get_stc_aonic_hardware_allocations(dummy):
    return load_json('stc.aonic.hardware-allocations.json')


def get_mixed_hardware_allocations(dummy):
    return load_json('mixed.nic32.hardware-allocations.json')


def get_portmapper(pm_type):
    pm = LocalPortMapper()

    if pm_type == 'stc.aonic':
        pm._get_hw_info = types.MethodType(get_aonic_hardware_info, pm)
        pm._get_hw_allocation = types.MethodType(
            get_stc_aonic_hardware_allocations, pm)
    elif pm_type == 'stc.nic32':
        pm._get_hw_info = types.MethodType(get_nic32_hardware_info, pm)
        pm._get_hw_allocation = types.MethodType(
            get_stc_nic32_hardware_allocations, pm)
    elif pm_type == 'mixed.nic32':
        pm._get_hw_info = types.MethodType(get_nic32_hardware_info, pm)
        pm._get_hw_allocation = types.MethodType(
            get_mixed_hardware_allocations, pm)
    else:
        print 'XXX: USING HARDWARE ALLOCATION HELPER !!!'

    pm._hw_info = pm._get_hw_info()  # Reset internal data

    return pm


class TestSequenceFunctions(unittest.TestCase):

    def test_init(self):
        pm = get_portmapper('stc.aonic')
        port_map = pm.port_map
        self.assertEqual(len(port_map.keys()), 2)

    def test_map_basics(self):
        pm = get_portmapper('stc.nic32')
        port_map = pm.port_map
        self.assertNotIn(0, port_map)  # ports are 1 indexed
        self.assertNotIn(5, port_map)  # Only 4 of them

        # Make sure port map has the right format
        for i in range(1, 5, 1):
            self.assertIn('engine', port_map[i])
            self.assertIn('logical_port', port_map[i])

    def test_stc_map(self):
        pm = get_portmapper('stc.nic32')

        # Make sure port map has mapped correctly
        expected_map = {1: '//169.254.0.3/1/4',
                        2: '//169.254.0.3/1/3',
                        3: '//169.254.0.3/1/2',
                        4: '//169.254.0.3/1/1'}

        port_map = pm.port_map
        for i in range(1, 5, 1):
            self.assertEqual(port_map[i]['engine'], 'stc')
            self.assertEqual(port_map[i]['logical_port'], expected_map[i])

    def test_stc_map_aonic(self):
        pm = get_portmapper('stc.aonic')

        # Make sure port map has mapped correctly
        expected_map = {1: '//169.254.0.3/1/2',
                        2: '//169.254.0.3/1/1'}

        port_map = pm.port_map
        for i in range(1, 3, 1):
            self.assertEqual(port_map[i]['engine'], 'stc')
            self.assertEqual(port_map[i]['logical_port'], expected_map[i])

    def test_mixed_map_nic32(self):
        pm = get_portmapper('mixed.nic32')

        expected_map = {1: '//169.254.0.3/1/3',
                        2: '//169.254.0.3/1/2',
                        3: '//169.254.0.3/1/1',
                        4: 'eth2'}

        port_map = pm.port_map
        for i in range(1, 3, 1):
            if expected_map[i].startswith('eth'):
                expected_vm = 'flowmon'
            else:
                expected_vm = 'stc'
            self.assertEqual(port_map[i]['engine'], expected_vm)
            self.assertEqual(port_map[i]['logical_port'], expected_map[i])



if __name__ == "__main__":
    unittest.main()
