#!/local/pythonenv/bin/python

import ixiacr.lib.engines.utils as utils

import ipaddr
import unittest2 as unittest

class TestSequenceFunctions(unittest.TestCase):

    def test_ipv4_addr_generator_simple(self):
        testData = [('192.85.1.1', '192.85.1.5', ['192.85.1.1',
                                                  '192.85.1.2',
                                                  '192.85.1.3',
                                                  '192.85.1.4',
                                                  '192.85.1.5'])]

        for (start, stop, items) in testData:
            gen_items = [x for x in utils.IpAddressGenerator(start, stop)]

            for (x,y) in zip(items, gen_items):
                self.assertEqual(ipaddr.IPAddress(x), y, '%s = %s' % (x, y))

    def test_ipv4_addr_generator_step(self):
        testData = [('192.85.1.1', '192.85.1.100', 10, ['192.85.1.1',
                                                      '192.85.1.11',
                                                      '192.85.1.21',
                                                      '192.85.1.31',
                                                      '192.85.1.41'])]

        for (start, stop, step, items) in testData:
            gen_items = [x for x in utils.IpAddressGenerator(start, stop, step)]

            for (x,y) in zip(items, gen_items):
                self.assertEqual(ipaddr.IPAddress(x), y, '%s = %s' % (x, y))

    def test_ipv4_addr_generator_negative_step(self):
        testData = [('192.85.1.100', '192.85.1.1', -10, ['192.85.1.100',
                                                         '192.85.1.90',
                                                         '192.85.1.80',
                                                         '192.85.1.70',
                                                         '192.85.1.60'])]

        for (start, stop, step, items) in testData:
            gen_items = [x for x in utils.IpAddressGenerator(start, stop, step)]

            for (x,y) in zip(items, gen_items):
                self.assertEqual(ipaddr.IPAddress(x), y, '%s = %s' % (x, y))

    def test_ipv6_addr_generator_simple(self):
        testData = [('2001::1', '2001::5', ['2001::1',
                                            '2001::2',
                                            '2001::3',
                                            '2001::4',
                                            '2001::5'])]

        for (start, stop, items) in testData:
            gen_items = [x for x in utils.IpAddressGenerator(start, stop)]

            for (x,y) in zip(items, gen_items):
                self.assertEqual(ipaddr.IPAddress(x), y, '%s = %s' % (x,y))

    def test_ipv6_addr_generator_step(self):
        testData = [('2001::1', '2001::5:FFFF', 0x10000, ['2001::0:1',
                                                          '2001::1:1',
                                                          '2001::2:1',
                                                          '2001::3:1',
                                                          '2001::4:1'])]

        for (start, stop, step, items) in testData:
            gen_items = [x for x in utils.IpAddressGenerator(start, stop, step)]

            for (x,y) in zip(items, gen_items):
                self.assertEqual(ipaddr.IPAddress(x), y, '%s = %s' % (x, y))

    def test_ipv6_addr_generator_negative_step(self):
        testData = [('2001::FFFF', '2001::FF00', -16, ['2001::FFFF',
                                                       '2001::FFEF',
                                                       '2001::FFDF',
                                                       '2001::FFCF',
                                                       '2001::FFBF'])]

        for (start, stop, step, items) in testData:
            gen_items = [x for x in utils.IpAddressGenerator(start, stop, step)]

            for (x,y) in zip(items, gen_items):
                self.assertEqual(ipaddr.IPAddress(x), y, '%s = %s' % (x, y))

    def test_ip_group_edge_addr(self):
        # IPv4 lower edge
        ip_list = [ip for ip in utils.IpAddressGenerator(
            '225.0.0.0', None, 1, 512)]
        self.assertTrue(len(ip_list), 1)
        self.assertTrue(str(ip_list[0]), '225.0.0.0')

        # IPv4 upper edge
        ip_list = [ip for ip in utils.IpAddressGenerator(
            '239.255.255.255', None, 1, 512)]
        self.assertTrue(len(ip_list), 1)
        self.assertTrue(str(ip_list[0]), '239.255.255.255')

        # IPv6 lower edge
        ip_list = [ip for ip in utils.IpAddressGenerator(
            'FF00::0', None, 1, 512)]
        self.assertTrue(len(ip_list), 1)
        self.assertTrue(str(ip_list[0]).lower(), 'FF00::0'.lower())

        # IPv6 upper edge
        ip_list = [ip for ip in utils.IpAddressGenerator(
            'FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF', None, 1, 512)]
        self.assertTrue(len(ip_list), 1)
        self.assertTrue(str(ip_list[0]).lower(), 'FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF'.lower())


if __name__ == "__main__":
    unittest.main()
