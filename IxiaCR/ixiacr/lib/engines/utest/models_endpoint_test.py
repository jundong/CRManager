#!/local/pythonenv/bin/python

import ipaddr
import unittest2 as unittest

from ixiacr.lib.engines import models
from ixiacr.lib.engines.factory import EndpointFactory


class TestSequenceFunctions(unittest.TestCase):
    def test_create(self):
        e = models.Endpoint()
        self.assertTrue(e is not None)

    def test_v4_create(self):
        e = models.Endpoint(gateway='10.0.0.1',
                            prefix='16',
                            ip='10.0.0.100',
                            end_ip='10.0.0.200')
        self.assertTrue(e is not None)

    def test_dhcpv4_create(self):
        endpoint = models.Endpoint(use_dhcp=True,
                                   count=10,
                                   version=4,
                                   location='//169.254.0.3/1/1')
        self.assertTrue(endpoint is not None)

    def test_dhcpv6_create(self):
        endpoint = models.Endpoint(use_dhcp=True,
                                   count=10,
                                   version=6,
                                   location='//169.254.0.3/1/1')

        self.assertTrue(endpoint is not None)

    def test_v6_create(self):
        e = models.Endpoint(gateway='2001::1',
                            prefix='64',
                            ip='2001::AAAA',
                            end_ip='2001::BBBB')
        self.assertTrue(e is not None)

    def test_v4_equality_simple(self):
        e1 = models.Endpoint(gateway='10.0.0.1',
                             prefix='24',
                             ip='10.0.0.100')
        e2 = models.Endpoint(gateway='10.0.0.1',
                             prefix='24',
                             ip='10.0.0.100')
        self.assertEqual(e1, e2)

        e2.ip = '10.0.0.101'

        self.assertNotEqual(e1, e2)

    def test_v4_equality_vlan(self):
        e1 = models.Endpoint(gateway='10.0.0.1',
                             prefix='24',
                             ip='10.0.0.100')
        e2 = models.Endpoint(gateway='10.0.0.1',
                             prefix='24',
                             ip='10.0.0.100')
        self.assertEqual(e1, e2)

        e1.vlan_id = 100
        self.assertNotEqual(e1, e2)

        e2.vlan_id = 100
        self.assertEqual(e1, e2)

        e1.vlan_id = 101
        self.assertNotEqual(e1, e2)

    def test_v4_equality_range(self):
        e1 = models.Endpoint(gateway='10.0.0.1',
                             prefix='24',
                             ip='10.0.0.100',
                             end_ip='10.0.0.110')

        e2 = models.Endpoint(gateway='10.0.0.1',
                             prefix='24',
                             ip='10.0.0.100',
                             end_ip='10.0.0.110')

        self.assertEqual(e1, e2)

        e2.end_ip = '10.0.0.112'

        self.assertNotEqual(e1, e2)

        e2.ip = '10.0.0.111'

        self.assertNotEqual(e1, e2)

    def test_v4_overlapped(self):
        e1 = models.Endpoint(gateway='10.0.0.1',
                             prefix='24',
                             ip='10.0.0.100')

        e2 = models.Endpoint(gateway='10.0.0.1',
                             prefix='24',
                             ip='10.0.0.100',
                             end_ip='10.0.0.110')

        self.assertNotEqual(e1, e2)
        self.assertTrue(e1.is_overlapped(e2))
        self.assertNotEqual(e2, e1)
        self.assertTrue(e2.is_overlapped(e1))

        e1 = models.Endpoint(gateway='10.0.0.1',
                             prefix='24',
                             ip='10.0.0.50',
                             end_ip='10.0.0.110')

        self.assertNotEqual(e1, e2)
        self.assertTrue(e1.is_overlapped(e2))
        self.assertNotEqual(e2, e1)
        self.assertTrue(e2.is_overlapped(e1))

    def test_v4_inequality(self):
        e1 = models.Endpoint(gateway='10.0.0.1',
                             prefix='24',
                             ip='10.0.0.100',
                             end_ip='10.0.0.110')

        e2 = models.Endpoint(gateway='11.0.0.1',
                             prefix='24',
                             ip='11.0.0.100',
                             end_ip='11.0.0.110')

        self.assertTrue(e1 < e2)
        self.assertTrue(e2 > e1)
        self.assertNotEqual(e1, e2)
        self.assertNotEqual(e2, e1)

        e2 = models.Endpoint(gateway='10.0.0.1',
                             prefix='24',
                             ip='10.0.0.200',
                             end_ip='10.0.0.210')

        self.assertTrue(e1 < e2)
        self.assertTrue(e2 > e1)
        self.assertNotEqual(e1, e2)
        self.assertNotEqual(e2, e1)

    def test_v4_with_network_addr(self):
        e = models.Endpoint(gateway='10.0.0.1',
                            prefix='24',
                            ip='10.0.0.0',
                            end_ip='10.0.0.110')
        errors = list()
        self.assertRaises(AssertionError, e._do_validation, errors)
        e.ip = '10.0.0.100'
        e.end_ip = '10.0.0.0'
        self.assertRaises(AssertionError, e._do_validation, errors)
        e.end_ip = '10.0.0.110'
        e.gateway = '10.0.0.0'
        self.assertRaises(AssertionError, e._do_validation, errors)

    def test_end_v4_bigger(self):
        e = models.Endpoint(gateway='10.0.0.1',
                            prefix='24',
                            ip='10.0.0.110',
                            end_ip='10.0.0.10')
        errors = list()
        self.assertRaises(AssertionError, e._do_validation, errors)

    def test_end_v6_bigger(self):
        e = models.Endpoint(gateway='2002::1',
                            prefix='48',
                            ip='2002::AA',
                            end_ip='2002::A')
        errors = list()
        self.assertRaises(AssertionError, e._do_validation, errors)

    def test_v6_equality_simple(self):
        e1 = models.Endpoint(gateway='2002::1',
                             prefix='48',
                             ip='2002::A')
        e2 = models.Endpoint(gateway='2002::1',
                             prefix='48',
                             ip='2002::A')
        self.assertEqual(e1, e2)

        e1.ip = '2002::B'

        self.assertNotEqual(e1, e2)

    def test_v6_equality_range(self):
        e1 = models.Endpoint(gateway='2002::1',
                             prefix='48',
                             ip='2002::A',
                             end_ip='2002::AA')
        e2 = models.Endpoint(gateway='2002::1',
                             prefix='48',
                             ip='2002::A',
                             end_ip='2002::AA')
        self.assertEqual(e1, e2)

        e1.ip = '2002::A0'
        self.assertNotEqual(e1, e2)

        e1.ip = '2002::BB'
        e1.end_ip = '2002::BD'
        self.assertNotEqual(e1, e2)

    def test_v6_inequality(self):
        e1 = models.Endpoint(gateway='2001::1',
                             prefix='64',
                             ip='2001::10')
        e2 = models.Endpoint(gateway='2001::1',
                             prefix='64',
                             ip='2001::AA')

        self.assertTrue(e1 < e2)
        self.assertTrue(e2 > e1)
        self.assertNotEqual(e1, e2)
        self.assertNotEqual(e2, e1)

    def test_v6_with_network_addr(self):
        e = models.Endpoint(gateway='2002::1',
                            prefix='48',
                            ip='2002::0',
                            end_ip='2002::AA')
        errors = list()
        self.assertRaises(AssertionError, e._do_validation, errors)
        e.ip = '2002::A'
        e.end_ip = '2002::0'
        self.assertRaises(AssertionError, e._do_validation, errors)
        e.end_ip = '2002::AA'
        e.gateway = '2002::0'
        self.assertRaises(AssertionError, e._do_validation, errors)

    def test_v4_slice(self):
        e = models.Endpoint(gateway='10.0.0.1',
                            prefix='24',
                            ip='10.0.0.100',
                            end_ip='10.0.0.110')

        self.assertEqual(ipaddr.IPAddress('10.0.0.101'), e[1])
        self.assertEqual(ipaddr.IPAddress('10.0.0.110'), e[-1])
        self.assertEqual(ipaddr.IPAddress('10.0.0.109'), e[-2])

        self.assertEqual(len(e[0:5:1]), 5,
                         'Wrong number of items in list: %s' % e[0:5:1])

        self.assertRaises(IndexError, e.__getitem__, 12)

    def test_v6_slice(self):
        e = models.Endpoint(gateway='2002::1',
                            prefix='64',
                            ip='2002::100',
                            end_ip='2002::110')

        self.assertEqual(ipaddr.IPAddress('2002::100'), e[0])
        self.assertEqual(ipaddr.IPAddress('2002::101'), e[1])
        self.assertEqual(ipaddr.IPAddress('2002::110'), e[-1])
        self.assertEqual(ipaddr.IPAddress('2002::10F'), e[-2])

        self.assertEqual(len(e[0:5:1]), 5,
                         'Wrong number of items in list: %s' % e[0:5:1])

        self.assertRaises(IndexError, e.__getitem__, 17)

    def test_v4_non_dhcp_errors(self):
        e = models.Endpoint(gateway='192.168.0.3',
                            prefix='24',
                            ip='192.168.16.116')

        self.assertEqual(e.version, 4, 'Wrong IP version')
        self.assertFalse(e.is_valid)

        e = models.Endpoint(gateway='169.168.16.1',
                            prefix='24',
                            ip='192.168.16.116',
                            end_ip='192.168.17.12')

        self.assertEqual(e.version, 4, 'Wrong IP version')
        self.assertFalse(e.is_valid)

    def test_v6_non_dhcp_errors(self):
        e = models.Endpoint(gateway='2001::1',
                            prefix=64,
                            ip='2002::2')

        self.assertEqual(e.version, 6, 'Wrong IP version')
        self.assertFalse(e.is_valid)

        e = models.Endpoint(gateway='2001::1',
                            prefix=64,
                            ip='2001::2',
                            end_ip='2002::1')

        self.assertEqual(e.version, 6, 'Wrong IP version')
        self.assertFalse(e.is_valid)

    def test_version_errors(self):
        e = models.Endpoint(gateway='2001::1',
                            prefix=64,
                            ip='192.168.1.1')

        self.assertEqual(e.version, None, 'IP version is not None')
        self.assertFalse(e.is_valid)

        e = models.Endpoint(gateway='192.168.1.1',
                            prefix=64,
                            ip='192.168.1.10')

        self.assertEqual(e.version, None, 'IP version is not None')
        self.assertFalse(e.is_valid)

        e.prefix = 24

        self.assertEqual(e.version, 4, 'Wrong IP version')
        self.assertTrue(e.is_valid)

        e.end_ip = '2001::1'

        self.assertEqual(e.version, None, 'IP version is not None')
        self.assertFalse(e.is_valid)

    def test_address_limit(self):
        # Note ipaddr math in inclusive,
        # e.g. base + 2 = 3 addrs
        addr = ipaddr.IPAddress('198.18.1.1')
        limit = models.Endpoint.ADDRESS_LIMIT

        e = models.Endpoint(ip=str(addr),
                            end_ip=str(addr + limit - 2),  # limit - 1
                            prefix=16,
                            gateway='198.18.0.1')
        self.assertTrue(e.is_valid)

        e.end_ip = str(addr + limit - 1)  # limit # of addrs
        self.assertTrue(e.is_valid)

        # Go over limit, no longer valid
        e.end_ip = str(addr + limit + 1)  # limit + 1
        self.assertFalse(e.is_valid)

    def test_prefix_errors(self):
        e = models.Endpoint(gateway='2001::1',
                            prefix=129,
                            ip='2001::100')

        self.assertEqual(e.version, None, 'IP version is not None')
        self.assertFalse(e.is_valid)

        e.prefix = 0
        self.assertFalse(e.is_valid)

        e = models.Endpoint(gateway='192.168.1.1',
                            prefix=33,
                            ip='192.168.1.10')

        self.assertEqual(e.version, None, 'IP version is not None')
        self.assertFalse(e.is_valid)

        e.prefix = 0
        self.assertFalse(e.is_valid)

    def test_multicast_protocol(self):
        e = models.MulticastEndpoint(end_ip='FF03::100',
                                     ip='FF03::1')

        self.assertEqual(e.version, 6, 'Wrong IP version')
        self.assertTrue(e.is_valid)

        e.protocol_version = models.MulticastEndpoint.MulticastProtocol.MLD_V1
        self.assertTrue(e.is_valid)

        self.assertRaises(TypeError, setattr,
                          (e, 'protocol_version', 'MLD_V1'))

        self.assertRaises(TypeError, setattr,
                          (e, 'protocol_version',
                           models.MulticastEndpoint.MulticastProtocol.IGMP_V1))

        e = models.MulticastEndpoint(ip='234.168.1.1',
                                     end_ip='234.168.1.10',
                                     protocol_version=models.MulticastEndpoint.MulticastProtocol.IGMP_V3)

        self.assertEqual(e.version, 4, 'Wrong IP version')
        self.assertTrue(e.is_valid)

        e.protocol_version = models.MulticastEndpoint.MulticastProtocol.IGMP_V1
        self.assertTrue(e.is_valid)

        e.protocol_version = models.MulticastEndpoint.MulticastProtocol.IGMP_V2
        self.assertTrue(e.is_valid)

        self.assertRaises(TypeError, setattr,
                          (e, 'protocol_version',
                           models.MulticastEndpoint.MulticastProtocol.MLD_V1))

        self.assertRaises(TypeError, setattr,
                          (e, 'protocol_version', 'IGMPv4'))

    def test_multicast_filter_mode(self):
        e = models.MulticastEndpoint(ip='FF02::1',
                                     end_ip='FF02::100')

        self.assertEqual(e.version, 6, 'Wrong IP version')
        self.assertTrue(e.is_valid)

        e.protocol_version = models.MulticastEndpoint.MulticastProtocol.MLD_V2
        self.assertTrue(e.is_valid)

        e = models.MulticastEndpoint(ip='226.168.1.1',
                                     end_ip='226.168.1.10')

        self.assertEqual(e.version, 4, 'Wrong IP version')
        self.assertTrue(e.is_valid)

        e.protocol_version = models.MulticastEndpoint.MulticastProtocol.IGMP_V1
        self.assertTrue(e.is_valid)

        e.protocol_version = models.MulticastEndpoint.MulticastProtocol.IGMP_V3
        self.assertTrue(e.is_valid)

    def test_multicast_groups(self):
        e = models.MulticastEndpoint(ip='FF02::1',
                                     end_ip='FF02::10')

        self.assertEqual(e.version, 6, 'Wrong IP version')
        self.assertTrue(e.is_valid)
        self.assertTrue(16, len(e.groups))

        e = models.MulticastEndpoint(ip='236.0.0.1',
                                     end_ip='236.0.0.10')

        self.assertEqual(e.version, 4, 'Wrong IP version')
        self.assertTrue(e.is_valid)
        self.assertTrue(10, len(e.groups))

    def test_multicast_edge_endpoint(self):
        e = models.MulticastEndpoint(ip='FF01::1',
                                     end_ip='FF01::10')

        self.assertEqual(e.version, 6, 'Wrong IP version')
        self.assertTrue(e.is_valid)
        self.assertTrue(16, len(e.groups))

        # Edge tests
        e = models.MulticastEndpoint(ip='225.0.0.1',
                                     end_ip='225.0.0.10')

        self.assertEqual(e.version, 4, 'Wrong IP version')
        self.assertTrue(e.is_valid)
        self.assertTrue(10, len(e.groups))

        # Edge tests
        e = models.MulticastEndpoint(ip='239.255.255.255',
                                     end_ip='239.255.255.255')

        self.assertEqual(e.version, 4, 'Wrong IP version')
        self.assertTrue(e.is_valid)
        self.assertTrue(1, len(e.groups))

        self.assertTrue(10, len(e.groups))

    def test_multicast_groups_range(self):
        e = models.MulticastEndpoint(ip='EF02::1',
                                     end_ip='FF02::10')

        self.assertEqual(e.version, 6, 'Wrong IP version')
        self.assertFalse(e.is_valid)

        e.ip = 'FF02::1'
        self.assertTrue(e.is_valid)

        e = models.MulticastEndpoint(ip='126.168.1.1',
                                     end_ip='226.168.1.10')

        self.assertEqual(e.version, 4, 'Wrong IP version')
        self.assertFalse(e.is_valid)

        e.ip = '226.168.1.1'
        self.assertTrue(e.is_valid)

    def test_multicast_groups_edge(self):
        e = models.MulticastEndpoint(ip='FF00::0',
                                     end_ip='FF00::10')

        self.assertEqual(e.version, 6, 'Wrong IP version')
        self.assertTrue(e.is_valid)

        e = models.MulticastEndpoint(ip='FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF')

        self.assertEqual(e.version, 6, 'Wrong IP version')
        self.assertTrue(e.is_valid)

        e = models.MulticastEndpoint(ip='225.0.0.0',
                                     end_ip='225.0.0.10')

        self.assertEqual(e.version, 4, 'Wrong IP version')
        self.assertTrue(e.is_valid)

        e = models.MulticastEndpoint(ip='239.255.255.255')

        self.assertEqual(e.version, 4, 'Wrong IP version')
        self.assertTrue(e.is_valid)

    def test_endpoint_factory(self):
        endpoint = EndpointFactory().make_adapter(gateway='10.0.0.1',
                                                  prefix='16',
                                                  ip='10.0.0.100',
                                                  end_ip='10.0.0.200',
                                                  use_dhcp=False,
                                                  location='//192.168.1.1/1/1')
        self.assertIsInstance(endpoint, models.Endpoint)

        endpoint = EndpointFactory().make_adapter(gateway='2001::1',
                                                  prefix='64',
                                                  ip='2001::AAAA',
                                                  end_ip='2001::BBBB',
                                                  use_dhcp=False,
                                                  location='//192.168.1.1/1/1')
        self.assertIsInstance(endpoint, models.Endpoint)

        endpoint = EndpointFactory().make_adapter(
            end_ip='FF03::100',
            ip='FF03::1',
            protocol_version=models.MulticastEndpoint.MulticastProtocol.MLD_V2)

        self.assertIsInstance(endpoint, models.MulticastEndpoint)

        endpoint = EndpointFactory().make_adapter(
            end_ip='234.168.1.10',
            protocol_version=models.MulticastEndpoint.MulticastProtocol.IGMP_V3,
            ip='234.168.1.1')

        self.assertIsInstance(endpoint, models.MulticastEndpoint)

        # Edge Endpoints
        endpoint = EndpointFactory().make_adapter(
            end_ip='225.0.0.1',
            protocol_version=models.MulticastEndpoint.MulticastProtocol.IGMP_V3,
            ip='225.0.0.10')

        self.assertIsInstance(endpoint, models.MulticastEndpoint)

        endpoint = EndpointFactory().make_adapter(
            end_ip='FF01::10',
            ip='FF01::1',
            protocol_version=models.MulticastEndpoint.MulticastProtocol.MLD_V2)

        self.assertIsInstance(endpoint, models.MulticastEndpoint)


if __name__ == "__main__":
    unittest.main()
