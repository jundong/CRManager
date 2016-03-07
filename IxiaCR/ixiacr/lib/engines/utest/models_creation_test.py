#!/local/pythonenv/bin/python
import pickle

from ixiacr.lib.engines.stc.utest.core import TestCenterBllTestCase
from ixiacr.lib.engines.utest import utils
from ixiacr.lib.engines import models

import unittest2 as unittest


class TestSequenceFunctions(TestCenterBllTestCase):
    NAME = 'Engine Model Creation Unit Test'

    port80_playlist = 'System/base_threats/BEAWeblogic_XSS.xml'

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_frames_creation(self):
        test = utils.get_simple_frames_test()
        self.assertTrue(test.is_valid)

        # Make sure that the test object is picklable
        pickle.dumps(test)

    def test_protocol_creation(self):
        test = utils.get_simple_protocol_test()
        self.assertTrue(test.is_valid)

        # Make sure that the test object is picklable
        pickle.dumps(test)

    def test_error_validation(self):
        test = utils.get_protocols_test(utils.HTTP)
        self.assertTrue(test.is_valid)

        # Add a duplicate playlist; validation should fail
        source = test.playlists[0].sources[0]
        sink = test.playlists[0].sinks[0]
        test.playlists.append(
            utils.get_protocol_playlist(
                source, sink, utils.HTTP, 100))

        self.assertFalse(test.is_valid)

        test.actionize(60)

        self.assertFalse(test.is_valid)

        # Pop duplicate playlist and add a playlist using the same port
        test.playlists.pop()
        self.assertTrue(test.is_valid)

        test.playlists.append(
            utils.get_protocol_playlist(
                source, sink, utils.PLAYLIST, 100, [self.port80_playlist]))

        self.assertFalse(test.is_valid)

        test.actionize(60)

        self.assertFalse(test.is_valid)

    def test_endpoints_validation(self):
        def _empty_list(l):
            while len(l) > 0:
                l.pop(0)

        test = utils.get_simple_frames_test()
        self.assertTrue(test.is_valid)

        # Add overlapped IP range into sources
        ip_range = models.Endpoint(ip='192.85.1.101',
                                   prefix='24',
                                   gateway='192.85.1.1',
                                   end_ip='192.85.1.201',
                                   location='//169.254.0.3/1/1')

        test.playlists[0].sources.append(ip_range)
        self.assertFalse(test.is_valid)

        # Remove overlapped endpoint
        test.playlists[0].sources.pop(-1)
        self.assertTrue(test.is_valid)

        # Add overlapped IP range but with different location
        test.playlists[0].sources.append(models.Endpoint(ip='192.85.1.101',
                                                         prefix='24',
                                                         gateway='192.85.1.1',
                                                         end_ip='192.85.1.201',
                                                         location='//169.254.0.3/1/2'))
        self.assertTrue(test.is_valid)
        # Remove overlapped endpoint
        test.playlists[0].sources.pop(-1)
        self.assertTrue(test.is_valid)

        # Rebind traffics
        test.playlists[0].sources.append(models.Endpoint(ip='192.85.1.101',
                                                         prefix='24',
                                                         gateway='192.85.1.201',
                                                         location='//169.254.0.3/1/2'))
        self.assertTrue(test.is_valid)

        # completely duplicate endpoints are ok, the existing endpoint will just get
        # reused
        test.playlists[0].sinks.append(models.Endpoint(ip='192.85.1.201',
                                                       prefix='24',
                                                       gateway='192.85.1.101',
                                                       location='//169.254.0.3/1/3'))
        self.assertTrue(test.is_valid)

        # Make sure that the test object is picklable
        pickle.dumps(test)


if __name__ == "__main__":
    unittest.main()
