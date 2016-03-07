#!/local/pythonenv/bin/python

import unittest2 as unittest

from ixiacr.lib.engines import models
from ixiacr.lib.engines.factory import PlaylistFactory
from ixiacr.lib.engines.utest.utils import TEST_VIDEO


class TestSequenceFunctions(unittest.TestCase):

    test_playlist = 'System/NFS/NFS_V2_UDP.xml'
    port80_playlist = 'System/base_threats/BEAWeblogic_XSS.xml'

    def get_endpointA(self):
        return models.Endpoint(ip='192.85.1.101',
                               prefix='24',
                               gateway='192.85.1.201',
                               location='//169.254.0.3/1/1')

    def get_endpointB(self):
        return models.Endpoint(ip='192.85.1.201',
                               prefix='24',
                               gateway='192.85.1.101',
                               location='//169.254.0.3/1/2')

    def get_endpointC(self):
        return models.Endpoint(gateway='2001::1',
                               prefix='64',
                               ip='2001::CCCC',
                               location='//169.254.0.3/1/3')

    def get_endpointD(self):
        return models.Endpoint(gateway='2001::1',
                               prefix='64',
                               ip='2001::DDDD',
                               location='//169.254.0.3/1/4')

    def get_multicast_endpointB(self):
        return models.MulticastEndpoint(end_ip='FF1E::DD10',
                               ip='FF1E::DD00',
                               protocol_version=models.MulticastEndpoint.MulticastProtocol.MLD_V2)

    def get_multicast_endpointA(self):
        return models.MulticastEndpoint(ip='225.0.0.201',
                               end_ip='225.0.0.210',
                               protocol_version=models.MulticastEndpoint.MulticastProtocol.IGMP_V3)

    def get_multicast_Edge_EndpointA(self, ipv6=False):
        if ipv6:
            return models.MulticastEndpoint(end_ip='FF01::10',
                                   ip='FF01::1',
                                   protocol_version=models.MulticastEndpoint.MulticastProtocol.MLD_V2)
        return models.MulticastEndpoint(ip='225.0.0.1',
                               end_ip='225.0.0.10',
                               protocol_version=models.MulticastEndpoint.MulticastProtocol.IGMP_V3)

    def get_multicast_Edge_EndpointB(self, ipv6=False):
        if ipv6:
            return models.MulticastEndpoint(end_ip='FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF',
                                   ip='FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF',
                                   protocol_version=models.MulticastEndpoint.MulticastProtocol.MLD_V2)
        return models.MulticastEndpoint(ip='239.255.255.255',
                               end_ip='239.255.255.255',
                               protocol_version=models.MulticastEndpoint.MulticastProtocol.IGMP_V3)

    def test_frames_playlist(self):
        fp = models.FramesPlaylist()
        self.assertIsNotNone(fp)

        self.assertFalse(fp.is_valid)

        # Add endpoints
        fp.sources.append(self.get_endpointA())
        fp.sinks.append(self.get_endpointB())

        # Still invalid, no tracks
        self.assertFalse(fp.is_valid)

        fp.tracks.append(
            models.FixedFrameLengthTrack(
                frame_length=64, weight=7))
        fp.tracks.append(
            models.FixedFrameLengthTrack(
                frame_length=576, weight=4))
        fp.tracks.append(
            models.FixedFrameLengthTrack(
                frame_length=1518, weight=1))

        # Still not valid, no actions
        self.assertFalse(fp.is_valid)

        fp.actions.append(models.StartPlaylistTrafficAction())
        fp.actions.append(models.WaitAction())
        fp.actions.append(models.StopPlaylistTrafficAction())

        # Now it's valid
        errors = list()
        fp._do_validation(errors)
        self.assertTrue(fp.is_valid)

        # Make sure our load is what we expect
        self.assertEqual(fp.load.units,
                         models.BaseLoad.LoadUnits.MBPS,
                         'Load unit mismatch!')

    def test_multicast_frames_playlist(self):
        fp = models.MulticastFramesPlaylist()
        self.assertIsNotNone(fp)

        self.assertFalse(fp.is_valid)

        # Add endpoints
        fp.sources.append(self.get_endpointA())
        fp.sinks.append(self.get_endpointB())
        fp.multicast_endpoint = self.get_multicast_endpointA()

        # Still invalid, no tracks
        self.assertFalse(fp.is_valid)

        fp.tracks.append(
            models.FixedFrameLengthTrack(
                frame_length=64, weight=7))
        fp.tracks.append(
            models.FixedFrameLengthTrack(
                frame_length=576, weight=4))
        fp.tracks.append(
            models.FixedFrameLengthTrack(
                frame_length=1518, weight=1))

        # Still not valid, no actions
        self.assertFalse(fp.is_valid)

        fp.actions.append(models.StartPlaylistTrafficAction())
        fp.actions.append(models.WaitAction())
        fp.actions.append(models.StopPlaylistTrafficAction())

        # Now it's valid
        errors = list()
        fp._do_validation(errors)
        self.assertTrue(fp.is_valid)

        # Make sure our load is what we expect
        self.assertEqual(fp.load.units,
                         models.BaseLoad.LoadUnits.MBPS,
                         'Load unit mismatch!')

    def test_mld_frames_playlist(self):
        fp = models.MulticastFramesPlaylist()
        self.assertIsNotNone(fp)

        self.assertFalse(fp.is_valid)

        # Add endpoints
        fp.sources.append(self.get_endpointC())
        fp.sinks.append(self.get_endpointD())
        fp.multicast_endpoint = self.get_multicast_endpointB()

        # Still invalid, no tracks
        self.assertFalse(fp.is_valid)

        fp.tracks.append(
            models.FixedFrameLengthTrack(
                frame_length=128, weight=7))
        fp.tracks.append(
            models.FixedFrameLengthTrack(
                frame_length=576, weight=4))
        fp.tracks.append(
            models.FixedFrameLengthTrack(
                frame_length=1518, weight=1))

        # Still not valid, no actions
        self.assertFalse(fp.is_valid)

        fp.actions.append(models.StartPlaylistTrafficAction())
        fp.actions.append(models.WaitAction())
        fp.actions.append(models.StopPlaylistTrafficAction())

        # Now it's valid
        errors = list()
        fp._do_validation(errors)
        self.assertTrue(fp.is_valid)

        # Make sure our load is what we expect
        self.assertEqual(fp.load.units,
                         models.BaseLoad.LoadUnits.MBPS,
                         'Load unit mismatch!')

    def test_frames_playlist_minimum_frame_size_vlan_validation(self):
        fp = models.FramesPlaylist()
        self.assertIsNotNone(fp)

        # Add IPv4 endpoints
        fp.sources.append(self.get_endpointA())
        fp.sinks.append(self.get_endpointB())

        # Add 64 byte track
        fp.tracks.append(
            models.FixedFrameLengthTrack(
                frame_length=64, weight=1))

        # Add actions
        fp.actions.append(models.StartPlaylistTrafficAction())
        fp.actions.append(models.WaitAction())
        fp.actions.append(models.StopPlaylistTrafficAction())

        # Playlist should be valid
        self.assertTrue(fp.is_valid)

        # Add vlans
        map(lambda src: setattr(src, 'vlan_id', 101), fp.sources)

        # Playlist should now be invalid
        self.assertFalse(fp.is_valid)

        # Increase the frame size
        map(lambda track: setattr(track, 'frame_length', 128), fp.tracks)

        # Playlist should be valid again
        self.assertTrue(fp.is_valid)

    def test_frames_playlist_minimum_frame_size_ipv6_validation(self):
        fp = models.FramesPlaylist()
        self.assertIsNotNone(fp)

        # Add IPv6 endpoints
        fp.sources.append(self.get_endpointC())
        fp.sinks.append(self.get_endpointD())

        # Add 64 byte track
        fp.tracks.append(
            models.FixedFrameLengthTrack(
                frame_length=64, weight=1))

        # Add actions
        fp.actions.append(models.StartPlaylistTrafficAction())
        fp.actions.append(models.WaitAction())
        fp.actions.append(models.StopPlaylistTrafficAction())

        # Playlist should be invalid
        self.assertFalse(fp.is_valid)

        # Increaes the frame size
        map(lambda track: setattr(track, 'frame_length', 128), fp.tracks)

        # Playlist should be valid again
        self.assertTrue(fp.is_valid)

    def test_protocol_playlist(self):
        pp = models.ProtocolPlaylist()
        self.assertIsNotNone(pp)

        # Add endpoints
        pp.sources.append(self.get_endpointA())
        pp.sinks.append(self.get_endpointB())

        # Still invalid, no tracks
        self.assertFalse(pp.is_valid)

        pp.tracks.append(models.HttpProtocolTrack())
        pp.tracks.append(
            models.PlaylistProtocolTrack(
                playlist=self.test_playlist))

        # Still not valid, no actions
        self.assertFalse(pp.is_valid)

        pp.actions.append(models.StartPlaylistTrafficAction())
        pp.actions.append(models.WaitAction())
        pp.actions.append(models.StopPlaylistTrafficAction())

        # Now it's valid
        self.assertTrue(pp.is_valid)

        # Make sure our load is what we expect
        self.assertEqual(pp.load.units,
                         models.BaseLoad.LoadUnits.USERS,
                         'Load unit mismatch!')

        # Make sure we can't stick two servers with the
        # same port on our playlist
        pp.tracks.append(models.HttpProtocolTrack())

        self.assertFalse(pp.is_valid)

        pp.tracks.pop()
        self.assertTrue(pp.is_valid)

        # Also make sure we can't stick two identical
        # playlistProtocols on our playlist
        pp.tracks.append(
            models.PlaylistProtocolTrack(
                playlist=self.test_playlist))

        self.assertFalse(pp.is_valid)

        pp.tracks.pop()
        self.assertTrue(pp.is_valid)

        # Make sure we can't stick a protocol and a playlist
        # that use the same port
        pp.tracks.append(
            models.PlaylistProtocolTrack(
                playlist=self.port80_playlist))

        self.assertFalse(pp.is_valid)

    def test_multicast_protocol_playlist(self):
        pp = models.MulticastProtocolPlaylist()
        self.assertIsNotNone(pp)

        # Add endpoints
        pp.sources.append(self.get_endpointA())
        pp.sinks.append(self.get_endpointB())
        pp.multicast_endpoint = self.get_multicast_endpointA()

        # Still invalid, no tracks
        self.assertFalse(pp.is_valid)

        pp.tracks.append(models.HttpProtocolTrack())
        pp.tracks.append(models.VideoProtocolTrack(video_file=TEST_VIDEO))
        pp.tracks.append(
            models.PlaylistProtocolTrack(
                playlist=self.test_playlist))

        # Still not valid, no actions
        self.assertFalse(pp.is_valid)

        pp.actions.append(models.StartPlaylistTrafficAction())
        pp.actions.append(models.WaitAction())
        pp.actions.append(models.StopPlaylistTrafficAction())

        # Now it's valid
        self.assertTrue(pp.is_valid)

        # Make sure our load is what we expect
        self.assertEqual(pp.load.units,
                         models.BaseLoad.LoadUnits.USERS,
                         'Load unit mismatch!')

        # Make sure we can't stick two servers with the
        # same port on our playlist
        pp.tracks.append(models.HttpProtocolTrack())

        self.assertFalse(pp.is_valid)

        pp.tracks.pop()
        self.assertTrue(pp.is_valid)

        # Also make sure we can't stick two identical
        # playlistProtocols on our playlist
        pp.tracks.append(
            models.PlaylistProtocolTrack(
                playlist=self.test_playlist))

        self.assertFalse(pp.is_valid)

        pp.tracks.pop()
        self.assertTrue(pp.is_valid)

        # Make sure we can't stick a protocol and a playlist
        # that use the same port
        pp.tracks.append(
            models.PlaylistProtocolTrack(
                playlist=self.port80_playlist))

        self.assertFalse(pp.is_valid)

    def test_mld_protocol_playlist(self):
        pp = models.MulticastProtocolPlaylist()
        self.assertIsNotNone(pp)

        # Add endpoints
        pp.sources.append(self.get_endpointC())
        pp.sinks.append(self.get_endpointD())
        pp.multicast_endpoint = self.get_multicast_endpointB()

        # Still invalid, no tracks
        self.assertFalse(pp.is_valid)

        pp.tracks.append(models.HttpProtocolTrack())
        pp.tracks.append(models.VideoProtocolTrack(video_file=TEST_VIDEO))
        pp.tracks.append(
            models.PlaylistProtocolTrack(
                playlist=self.test_playlist))

        # Still not valid, no actions
        self.assertFalse(pp.is_valid)

        pp.actions.append(models.StartPlaylistTrafficAction())
        pp.actions.append(models.WaitAction())
        pp.actions.append(models.StopPlaylistTrafficAction())

        # Now it's valid
        self.assertTrue(pp.is_valid)

        # Make sure our load is what we expect
        self.assertEqual(pp.load.units,
                         models.BaseLoad.LoadUnits.USERS,
                         'Load unit mismatch!')

        # Make sure we can't stick two servers with the
        # same port on our playlist
        pp.tracks.append(models.HttpProtocolTrack())

        self.assertFalse(pp.is_valid)

        pp.tracks.pop()
        self.assertTrue(pp.is_valid)

        # Also make sure we can't stick two identical
        # playlistProtocols on our playlist
        pp.tracks.append(models.HttpProtocolTrack())

        self.assertFalse(pp.is_valid)

        pp.tracks.pop()
        self.assertTrue(pp.is_valid)

    def test_multi_protocol_playlist_validator(self):
        # Instantiate multi playlist validation
        mppv = models.MultiPlaylistProtocolValidator()
        self.assertIsNotNone(mppv)

        # Create two identical playlists
        playlists = list()
        for i in range(2):
            pp = models.ProtocolPlaylist()
            self.assertIsNotNone(pp)

            # Add endpoints
            pp.sources.append(self.get_endpointA())
            pp.sinks.append(self.get_endpointB())

            # Add track
            pp.tracks.append(models.HttpProtocolTrack())

            # Add actions
            pp.actions.append(models.StartPlaylistTrafficAction())
            pp.actions.append(models.WaitAction())
            pp.actions.append(models.StopPlaylistTrafficAction())

            self.assertTrue(pp.is_valid)
            playlists.append(pp)

        # Add playlists to mpvv
        mppv.add_playlist(playlists[0])
        self.assertTrue(mppv.is_valid)  # Only one valid playlist, so fine
        mppv.add_playlist(playlists[1])
        self.assertFalse(mppv.is_valid)  # Same protocols on same endpoints is
                                         # not allowed

    def test_source_sink_validation(self):

        def _empty_list(l):
            while len(l) > 0:
                l.pop(0)

        pp = models.ProtocolPlaylist()
        self.assertIsNotNone(pp)

        # Add endpoints
        pp.sources.append(self.get_endpointA())
        pp.sinks.append(self.get_endpointB())

        # Still invalid, no tracks
        self.assertFalse(pp.is_valid)

        pp.tracks.append(models.HttpProtocolTrack())
        pp.tracks.append(
            models.PlaylistProtocolTrack(
                playlist=self.test_playlist))

        # Still not valid, no actions
        self.assertFalse(pp.is_valid)

        pp.actions.append(models.StartPlaylistTrafficAction())
        pp.actions.append(models.WaitAction())
        pp.actions.append(models.StopPlaylistTrafficAction())

        # Now it's valid
        self.assertTrue(pp.is_valid)

        # Add v6 source endpoint
        pp.sources.append(self.get_endpointC())
        self.assertFalse(pp.is_valid)

        # Remove v4 source
        pp.sources.pop(0)

        # Still not valid, v6 source/v4 sink
        self.assertFalse(pp.is_valid)

        # Remove v4 sink; add v6 sink
        pp.sinks.pop(0)
        pp.sinks.append(self.get_endpointD())

        # Valid src/sink are IPv6
        self.assertTrue(pp.is_valid)

        # add v4 sink
        pp.sinks.append(self.get_endpointB())
        self.assertFalse(pp.is_valid)

    def test_video_server_limit(self):
        pp = models.ProtocolPlaylist()
        self.assertIsNotNone(pp)

        # Add tracks and actions
        pp.tracks.append(models.VideoProtocolTrack(video_file=TEST_VIDEO))

        pp.actions.append(models.StartPlaylistTrafficAction())
        pp.actions.append(models.WaitAction())
        pp.actions.append(models.StopPlaylistTrafficAction())

        pp.sources.append(models.Endpoint(ip='198.18.1.1',
                                          end_ip='198.18.9.255',
                                          prefix=16,
                                          gateway='198.18.0.1'))

        pp.sinks.append(models.Endpoint(ip='198.19.1.1',
                                        end_ip='198.19.9.255',
                                        prefix=16,
                                        gateway='198.19.0.1'))

        # Too many servers, should be invalid.
        self.assertFalse(pp.is_valid)

        # Lower the number of servers
        pp.sources[0].end_ip = '198.18.1.255'

        # Should now be valid
        self.assertTrue(pp.is_valid)

    def test_playlist_factory(self):
        fp = PlaylistFactory().make_adapter(track_type_id=1)
        self.assertIsInstance(fp, models.FramesPlaylist)

        fp = PlaylistFactory().make_adapter(track_type_id=1, use_multicast=False)
        self.assertIsInstance(fp, models.FramesPlaylist)

        fp = PlaylistFactory().make_adapter(track_type_id=2, use_multicast=False)
        self.assertIsInstance(fp, models.ProtocolPlaylist)

        fp = PlaylistFactory().make_adapter(track_type_id=2)
        self.assertIsInstance(fp, models.ProtocolPlaylist)

        fp = PlaylistFactory().make_adapter(track_type_id=1, use_multicast=True)
        self.assertIsInstance(fp, models.MulticastFramesPlaylist)
        fp = PlaylistFactory().make_adapter(track_type_id=2, use_multicast=True)
        self.assertIsInstance(fp, models.MulticastProtocolPlaylist)

    def test_multicast_queriers(self):
        pp = models.MulticastProtocolPlaylist()
        self.assertIsNotNone(pp)

        # Add endpoints
        endpointA = self.get_endpointA()
        endpointA.vlan_id = 100
        pp.sources.append(endpointA)
        endpointB = self.get_endpointB()
        endpointB.vlan_id = 100
        pp.sinks.append(endpointB)
        pp.multicast_endpoint = self.get_multicast_endpointA()

        # Still invalid, no tracks
        self.assertFalse(pp.is_valid)

        pp.tracks.append(models.HttpProtocolTrack())
        pp.tracks.append(models.VideoProtocolTrack(video_file=TEST_VIDEO))
        pp.tracks.append(
            models.PlaylistProtocolTrack(
                playlist=self.test_playlist))

        # Still not valid, no actions
        self.assertFalse(pp.is_valid)

        pp.actions.append(models.StartPlaylistTrafficAction())
        pp.actions.append(models.WaitAction())
        pp.actions.append(models.StopPlaylistTrafficAction())

        # Now it's valid
        self.assertTrue(pp.is_valid)

        self.assertTrue(pp.use_querier)

    def test_playlist_multicast_edge(self):
        pp = models.MulticastProtocolPlaylist()
        self.assertIsNotNone(pp)

        # Add endpoints
        endpointA = self.get_endpointA()
        endpointA.vlan_id = 100
        pp.sources.append(endpointA)
        endpointB = self.get_endpointB()
        endpointB.vlan_id = 100
        pp.sinks.append(endpointB)

        pp.multicast_endpoint = self.get_multicast_Edge_EndpointB()
        self.assertFalse(pp.is_valid)

        pp.multicast_endpoint = self.get_multicast_Edge_EndpointA()
        # Still invalid, no tracks
        self.assertFalse(pp.is_valid)

        pp.tracks.append(models.HttpProtocolTrack())
        pp.tracks.append(models.VideoProtocolTrack(video_file=TEST_VIDEO))
        pp.tracks.append(
            models.PlaylistProtocolTrack(
                playlist=self.test_playlist))

        # Still not valid, no actions
        self.assertFalse(pp.is_valid)

        pp.actions.append(models.StartPlaylistTrafficAction())
        pp.actions.append(models.WaitAction())
        pp.actions.append(models.StopPlaylistTrafficAction())

        # Now it's valid
        self.assertTrue(pp.is_valid)

        self.assertTrue(pp.use_querier)

if __name__ == "__main__":
    unittest.main()
