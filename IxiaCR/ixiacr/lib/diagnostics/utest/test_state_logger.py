import unittest
import logging
import time
import json
from ixiacr.lib.diagnostics.logger_utils import is_dict_equal
from ixiacr.lib.diagnostics import StateLogger


class IsDictEqualTests(unittest.TestCase):

    def test_empty(self):
        a = {}
        b = {}
        self.assertTrue(is_dict_equal(a, b))

    def test_simple(self):
        a = {'a': 1}
        b = {'a': 1}
        self.assertTrue(is_dict_equal(a, b))
        c = {}
        self.assertFalse(is_dict_equal(a, c))
        c = {'a': 2}
        self.assertFalse(is_dict_equal(a, c))

    def test_multiple(self):
        a = {'z': 1, 'd': 2, 'a': 5, 'c': 3, 'w': 4}
        b = {'z': 1, 'd': 2, 'a': 5, 'c': 3, 'w': 4}
        self.assertTrue(is_dict_equal(a, b))

    def test_list(self):
        a = {'a': [1, 2]}
        b = {'a': [1, 2]}
        self.assertTrue(is_dict_equal(a, b))
        c = {'a': 1}
        self.assertFalse(is_dict_equal(a, c))
        c = {'a': []}
        self.assertFalse(is_dict_equal(a, c))
        c = {'a': [1]}
        self.assertFalse(is_dict_equal(a, c))
        c = {'a': [1, 99]}
        self.assertFalse(is_dict_equal(a, c))

    def test_dict(self):
        a = {'a': {'aa': 1}}
        b = {'a': {'aa': 1}}
        self.assertTrue(is_dict_equal(a, b))
        c = {'a': {}}
        self.assertFalse(is_dict_equal(a, c))
        c = {'a': {'bb': 99}}
        self.assertFalse(is_dict_equal(a, c))
        c = {'a': {'aa': 99}}
        self.assertFalse(is_dict_equal(a, c))
        c = {'a': None}
        self.assertFalse(is_dict_equal(a, c))
        c = {'a': {'aa': 1, 'bb': 99}}
        self.assertFalse(is_dict_equal(a, c))
        c = {'a': {'aa': [1]}}
        self.assertFalse(is_dict_equal(a, c))

    def test_dict_list(self):
        a = {'a': {'aa': [1, 5, 7]}}
        b = {'a': {'aa': [1, 5, 7]}}
        self.assertTrue(is_dict_equal(a, b))
        c = {'a': {'aa': [1]}}
        self.assertFalse(is_dict_equal(a, c))
        c = {'a': {'aa': [1, 5, 7, 9]}}
        self.assertFalse(is_dict_equal(a, c))

    def test_list_dicts(self):
        a = {'a': [{'a': 1}, {'b': 5}]}
        b = {'a': [{'a': 1}, {'b': 5}]}
        self.assertTrue(is_dict_equal(a, b))

    def test_dict_dict(self):
        a = {'a': {'aa': {'aaa': 1}}}
        b = {'a': {'aa': {'aaa': 1}}}
        self.assertTrue(is_dict_equal(a, b))
        c = {'a': {'aa': {'aaa': 2}}}
        self.assertFalse(is_dict_equal(a, c))

    def test_link_status(self):
        a = {u'interfaces':
                  {u'1': {u'duplex': u'full', u'speed': u'1000', u'state': u'up', u'link': 1, u'name': u'eth1'},
                   u'0': {u'duplex': u'full', u'speed': u'1000', u'state': u'up', u'link': 1, u'name': u'eth0'},
                   u'3': {u'duplex': u'full', u'speed': u'1000', u'state': u'up', u'link': 1, u'name': u'eth3'},
                   u'2': {u'duplex': u'full', u'speed': u'1000', u'state': u'up', u'link': 1, u'name': u'eth2'}},
                u'log': [
                    u'sending incremental file list',
                    u'',
                    u'sent 36 bytes  received 12 bytes  96.00 bytes/sec', u'total size is 12220  speedup is 254.58',
                    u'sending incremental file list',
                    u'',
                    u'sent 44 bytes  received 12 bytes  112.00 bytes/sec',
                    u'total size is 881  speedup is 15.73',
                    u'Settings for eth0:',
                    u'\tSupported ports: [ TP ]',
                    u'\tSupported link modes:   10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full',
                    u'\t                        1000baseT/Full ',
                    u'\tSupports auto-negotiation: Yes',
                    u'\tAdvertised link modes:  10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full ',
                    u'\t                        1000baseT/Full ',
                    u'\tAdvertised auto-negotiation: Yes',
                    u'\tSpeed: 1000Mb/s',
                    u'\tDuplex: Full',
                    u'\tPort: Twisted Pair',
                    u'\tPHYAD: 1',
                    u'\tTransceiver: internal',
                    u'\tAuto-negotiation: on',
                    u'\tSupports Wake-on: pumbg',
                    u'\tWake-on: g',
                    u'\tCurrent message level: 0x00000007 (7)',
                    u'\tLink detected: yes',
                    u'Settings for eth1:',
                    u'\tSupported ports: [ TP ]',
                    u'\tSupported link modes:   10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full',
                    u'\t                        1000baseT/Full ',
                    u'\tSupports auto-negotiation: Yes',
                    u'\tAdvertised link modes:  10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full ',
                    u'\t                        1000baseT/Full ',
                    u'\tAdvertised auto-negotiation: Yes',
                    u'\tSpeed: 1000Mb/s',
                    u'\tDuplex: Full',
                    u'\tPort: Twisted Pair',
                    u'\tPHYAD: 1',
                    u'\tTransceiver: internal',
                    u'\tAuto-negotiation: on',
                    u'\tSupports Wake-on: d',
                    u'\tWake-on: d',
                    u'\tCurrent message level: 0x00000007 (7)',
                    u'\tLink detected: yes',
                    u'Settings for eth2:',
                    u'\tSupported ports: [ TP ]',
                    u'\tSupported link modes:   10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full ',
                    u'\t                        1000baseT/Full ',
                    u'\tSupports auto-negotiation: Yes',
                    u'\tAdvertised link modes:  10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full ',
                    u'\t                        1000baseT/Full ',
                    u'\tAdvertised auto-negotiation: Yes',
                    u'\tSpeed: 1000Mb/s',
                    u'\tDuplex: Full',
                    u'\tPort: Twisted Pair',
                    u'\tPHYAD: 1',
                    u'\tTransceiver: internal',
                    u'\tAuto-negotiation: on',
                    u'\tSupports Wake-on: d',
                    u'\tWake-on: d',
                    u'\tCurrent message level: 0x00000007 (7)',
                    u'\tLink detected: yes',
                    u'Settings for eth3:',
                    u'\tSupported ports: [ TP ]',
                    u'\tSupported link modes:   10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full ',
                    u'\t                        1000baseT/Full ',
                    u'\tSupports auto-negotiation: Yes',
                    u'\tAdvertised link modes:  10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full ',
                    u'\t                        1000baseT/Full ',
                    u'\tAdvertised auto-negotiation: Yes',
                    u'\tSpeed: 1000Mb/s',
                    u'\tDuplex: Full',
                    u'\tPort: Twisted Pair',
                    u'\tPHYAD: 1',
                    u'\tTransceiver: internal',
                    u'\tAuto-negotiation: on',
                    u'\tSupports Wake-on: d',
                    u'\tWake-on: d',
                    u'\tCurrent message level: 0x00000007 (7)',
                    u'\tLink detected: yes']}

        b = {u'interfaces':
                  {u'1': {u'duplex': u'full', u'speed': u'1000', u'state': u'up', u'link': 1, u'name': u'eth1'},
                   u'3': {u'duplex': u'full', u'speed': u'1000', u'state': u'up', u'link': 1, u'name': u'eth3'},
                   u'2': {u'duplex': u'full', u'speed': u'1000', u'state': u'up', u'link': 1, u'name': u'eth2'},
                   u'0': {u'duplex': u'full', u'speed': u'1000', u'state': u'up', u'link': 1, u'name': u'eth0'}},
                u'log': [
                    u'sending incremental file list',
                    u'',
                    u'sent 36 bytes  received 12 bytes  96.00 bytes/sec', u'total size is 12220  speedup is 254.58',
                    u'sending incremental file list',
                    u'',
                    u'sent 44 bytes  received 12 bytes  112.00 bytes/sec',
                    u'total size is 881  speedup is 15.73',
                    u'Settings for eth0:',
                    u'\tSupported ports: [ TP ]',
                    u'\tSupported link modes:   10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full',
                    u'\t                        1000baseT/Full ',
                    u'\tSupports auto-negotiation: Yes',
                    u'\tAdvertised link modes:  10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full ',
                    u'\t                        1000baseT/Full ',
                    u'\tAdvertised auto-negotiation: Yes',
                    u'\tSpeed: 1000Mb/s',
                    u'\tDuplex: Full',
                    u'\tPort: Twisted Pair',
                    u'\tPHYAD: 1',
                    u'\tTransceiver: internal',
                    u'\tAuto-negotiation: on',
                    u'\tSupports Wake-on: pumbg',
                    u'\tWake-on: g',
                    u'\tCurrent message level: 0x00000007 (7)',
                    u'\tLink detected: yes',
                    u'Settings for eth1:',
                    u'\tSupported ports: [ TP ]',
                    u'\tSupported link modes:   10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full',
                    u'\t                        1000baseT/Full ',
                    u'\tSupports auto-negotiation: Yes',
                    u'\tAdvertised link modes:  10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full ',
                    u'\t                        1000baseT/Full ',
                    u'\tAdvertised auto-negotiation: Yes',
                    u'\tSpeed: 1000Mb/s',
                    u'\tDuplex: Full',
                    u'\tPort: Twisted Pair',
                    u'\tPHYAD: 1',
                    u'\tTransceiver: internal',
                    u'\tAuto-negotiation: on',
                    u'\tSupports Wake-on: d',
                    u'\tWake-on: d',
                    u'\tCurrent message level: 0x00000007 (7)',
                    u'\tLink detected: yes',
                    u'Settings for eth2:',
                    u'\tSupported ports: [ TP ]',
                    u'\tSupported link modes:   10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full ',
                    u'\t                        1000baseT/Full ',
                    u'\tSupports auto-negotiation: Yes',
                    u'\tAdvertised link modes:  10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full ',
                    u'\t                        1000baseT/Full ',
                    u'\tAdvertised auto-negotiation: Yes',
                    u'\tSpeed: 1000Mb/s',
                    u'\tDuplex: Full',
                    u'\tPort: Twisted Pair',
                    u'\tPHYAD: 1',
                    u'\tTransceiver: internal',
                    u'\tAuto-negotiation: on',
                    u'\tSupports Wake-on: d',
                    u'\tWake-on: d',
                    u'\tCurrent message level: 0x00000007 (7)',
                    u'\tLink detected: yes',
                    u'Settings for eth3:',
                    u'\tSupported ports: [ TP ]',
                    u'\tSupported link modes:   10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full ',
                    u'\t                        1000baseT/Full ',
                    u'\tSupports auto-negotiation: Yes',
                    u'\tAdvertised link modes:  10baseT/Half 10baseT/Full ',
                    u'\t                        100baseT/Half 100baseT/Full ',
                    u'\t                        1000baseT/Full ',
                    u'\tAdvertised auto-negotiation: Yes',
                    u'\tSpeed: 1000Mb/s',
                    u'\tDuplex: Full',
                    u'\tPort: Twisted Pair',
                    u'\tPHYAD: 1',
                    u'\tTransceiver: internal',
                    u'\tAuto-negotiation: on',
                    u'\tSupports Wake-on: d',
                    u'\tWake-on: d',
                    u'\tCurrent message level: 0x00000007 (7)',
                    u'\tLink detected: yes']}

        self.assertTrue(is_dict_equal(a, b))

    def test_ui_log(self):
        js1 = '{"environment": {"debug": true, "build_number": "103170", "log_level": "DEBUG", "features": ["scheduler", "traffic-recorder", "pulse"], "language": "en"}, "timestamp": "2014-09-08T15:54:26.863Z", "message": "Getting time sync status", "type": "INFO"}'
        js2 = '{"environment": {"debug": true, "build_number": "103170", "log_level": "DEBUG", "features": ["scheduler", "traffic-recorder", "pulse"], "language": "en"}, "timestamp": "2014-09-08T15:54:26.863Z", "message": "Getting time sync status", "type": "INFO"}'

        a = json.loads(js1)
        b = json.loads(js2)

        self.assertTrue(is_dict_equal(a, b))

        js3 = '{"environment": {"debug": true, "build_number": "103171", "log_level": "DEBUG", "features": ["scheduler", "traffic-recorder", "pulse"], "language": "en"}, "timestamp": "2014-09-08T15:54:26.863Z", "message": "Getting time sync status", "type": "INFO"}'
        c = json.loads(js3)
        self.assertFalse(is_dict_equal(a, c))


    def test_hardware_allocations(self):
        js1 = '{"1": {"engine": "stc", "engine_port_index": 3, "pci_addr": "01:00.3", "logical_port": "//169.254.0.3/1/3"}, "3": {"engine": "stc", "engine_port_index": 1, "pci_addr": "01:00.1", "logical_port": "//169.254.0.3/1/1"}, "2": {"engine": "stc", "engine_port_index": 2, "pci_addr": "01:00.2", "logical_port": "//169.254.0.3/1/2"}, "4": {"engine": "streetwise", "engine_port_index": 1, "pci_addr": "01:00.0", "logical_port": "eth1"}}'
        js2 = '{"1": {"engine": "stc", "engine_port_index": 3, "pci_addr": "01:00.3", "logical_port": "//169.254.0.3/1/3"}, "3": {"engine": "stc", "engine_port_index": 1, "pci_addr": "01:00.1", "logical_port": "//169.254.0.3/1/1"}, "2": {"engine": "stc", "engine_port_index": 2, "pci_addr": "01:00.2", "logical_port": "//169.254.0.3/1/2"}, "4": {"engine": "streetwise", "engine_port_index": 1, "pci_addr": "01:00.0", "logical_port": "eth1"}}'

        a = json.loads(js1)
        b = json.loads(js2)

        self.assertTrue(is_dict_equal(a, b))

        js3 = '{"1": {"engine": "stc", "engine_port_index": 3, "pci_addr": "02:00.3", "logical_port": "//169.254.0.3/1/3"}, "3": {"engine": "stc", "engine_port_index": 1, "pci_addr": "01:00.1", "logical_port": "//169.254.0.3/1/1"}, "2": {"engine": "stc", "engine_port_index": 2, "pci_addr": "01:00.2", "logical_port": "//169.254.0.3/1/2"}, "4": {"engine": "streetwise", "engine_port_index": 1, "pci_addr": "01:00.0", "logical_port": "eth1"}}'
        c = json.loads(js3)
        self.assertFalse(is_dict_equal(a, c))


class StateLoggerTests(unittest.TestCase):

    class StubLogger(logging.Logger):
        def __init__(self, name):
            logging.Logger.__init__(self, name, logging.DEBUG)
            self.msg = None
            self.calls = 0

        def debug(self, msg, *args, **kwargs):
            self.msg = msg
            self.calls += 1

    def test_state_logger(self):
        msg = 'Logger message'
        obj = {'a': 1}

        child_logger = StateLoggerTests.StubLogger('test')

        logger = StateLogger('state', timeout=2, logger=child_logger)
        logger.debug_state('key1', obj, msg)
        logger.debug_state('key1', obj, msg)
        self.assertEquals(child_logger.msg, msg)
        self.assertEquals(child_logger.calls, 1)
        time.sleep(2)
        self.assertEquals(child_logger.calls, 1)
        logger.debug_state('key1', obj, msg)
        self.assertEquals(child_logger.msg, msg)
        self.assertEquals(child_logger.calls, 2)


if __name__ == '__main__':
    unittest.main()
