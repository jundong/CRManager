#!/local/pythonenv/bin/python

import ixiacr.lib.engines.models as models
import ixiacr.lib.engines.utest.utils as utils

import unittest2 as unittest


class TestSequenceFunctions(unittest.TestCase):

    def test_vlan_priority_decorator(self):
        test = utils.get_simple_frames_test()
        self.assertIsNotNone(test)

        # Add vlan_ids (lucky #12) to our endpoints
        test.playlists[0].sources[0].vlan_id = 12
        test.playlists[0].sinks[0].vlan_id = 12

        # Make sure we can instantiate our decorated playlist
        dp = models.PlaylistVlanPriorityDecorator(test.playlists[0])
        self.assertIsNotNone(dp)

        # Now, replace old playlist with decorated one
        test.playlists[0] = dp

        # Check that test is still valid
        self.assertTrue(test.is_valid)

        # Verify that test validation checks decorator
        for x in [-12, 2.3, 'blah']:
            dp.vlan_priority = x
            self.assertFalse(test.is_valid, 'x = %s' % x)

        dp.vlan_priority = 3
        self.assertTrue(test.is_valid)
        self.assertEqual(3, test.playlists[0].vlan_priority)

        # Verify vlan priority requires vlan_ids on endpoints
        test.playlists[0].sources[0].vlan_id = None
        self.assertFalse(test.is_valid)

        test.playlists[0].sources[0].vlan_id = 12
        self.assertTrue(test.is_valid)

        # Verify that test validation still checks other test objects
        test.playlists[0].sinks[0].ip = 'this is not an IP address'
        self.assertFalse(test.is_valid)

    def test_diffserv_decorator(self):
        test = utils.get_simple_protocol_test()
        self.assertIsNotNone(test)

        # Make sure we can instantiate our decorated playlist
        dp = models.PlaylistDiffServCodePointDecorator(test.playlists[0])
        self.assertIsNotNone(dp)

        # Now, replace old playlist with decorated one
        test.playlists[0] = dp

        # Check that test is still valid
        self.assertTrue(test.is_valid)

        # Verify that test validation checks decorator
        for x in [-12, 2.3, 'blah']:
            dp.diffserv_code_point = x
            self.assertFalse(test.is_valid, 'x = %s' % x)

        dp.diffserv_code_point = 46
        self.assertTrue(test.is_valid)
        self.assertEqual(46, test.playlists[0].diffserv_code_point)

        # Verify that test validation still checks other test objects
        test.playlists[0].sinks[0].ip = 'this is not an IP address'
        self.assertFalse(test.is_valid)

    def test_double_decorators(self):
        test = utils.get_simple_frames_test()
        self.assertIsNotNone(test)

        # Add vlan_ids (lucky #12) to our endpoints
        test.playlists[0].sources[0].vlan_id = 12
        test.playlists[0].sinks[0].vlan_id = 12

        # Make sure we can instantiate our decorated playlist
        dp = models.PlaylistVlanPriorityDecorator(test.playlists[0])
        self.assertIsNotNone(dp)

        # Now, replace old playlist with decorated one
        test.playlists[0] = dp

        # Check that test is still valid
        self.assertTrue(test.is_valid)

        # Add QoS Decorator
        dp = models.PlaylistDiffServCodePointDecorator(test.playlists[0])
        self.assertIsNotNone(dp)

        # Replace decorated playlist with twice decorated playlist
        test.playlists[0] = dp

        self.assertTrue(hasattr(test.playlists[0], 'diffserv_code_point'))
        self.assertTrue(hasattr(test.playlists[0], 'vlan_priority'))

        # Check that validation occurs for both decorators and
        # the original playlist
        self.assertTrue(test.is_valid)

        print 'Double test: %s' % test.playlists[0].vlan_priority

        test.playlists[0].vlan_priority = -1
        self.assertFalse(test.is_valid)

        test.playlists[0].vlan_priority = 3
        self.assertTrue(test.is_valid)

        test.playlists[0].diffserv_code_point = 99
        self.assertFalse(test.is_valid)

        test.playlists[0].diffserv_code_point = 48
        self.assertTrue(test.is_valid)

        test.playlists[0].sources[0].vlan_id = 'steve'
        self.assertFalse(test.is_valid)

        test.playlists[0].sources[0].vlan_id = 12
        self.assertTrue(test.is_valid)

    def test_type_check(self):
        test = utils.get_simple_frames_test()
        self.assertIsNotNone(test)

        # Add vlan_ids (lucky #12) to our endpoints
        test.playlists[0].sources[0].vlan_id = 12
        test.playlists[0].sinks[0].vlan_id = 12

        # Make sure we can instantiate our decorated playlist
        dp = models.PlaylistVlanPriorityDecorator(test.playlists[0])
        self.assertIsNotNone(dp)

        ddp = models.PlaylistDiffServCodePointDecorator(dp)
        self.assertIsNotNone(ddp)

        self.assertTrue(isinstance(dp, models.BasePlaylistDecorator))
        self.assertTrue(isinstance(ddp, models.BasePlaylistDecorator))

        pl = ddp
        while hasattr(pl, '_playlist'):
            pl = getattr(pl, '_playlist')

        self.assertTrue(isinstance(pl, models.FramesPlaylist))

if __name__ == "__main__":
    unittest.main()
