from ixiacr.lib.engines import models

# Protocol flags
HTTP = 0x01
FTP = 0x02
RAW_TCP = 0x04
VOICE = 0x08
VIDEO = 0x10
PLAYLIST = 0x20

TEST_VIDEO = '/local/media/files/Ixia_HDTV_RedKayak_H264_5Mbps.mp4'

MIN_FRAME_SIZE = 64


def get_simple_frames_test():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create endpoints
    src = models.Endpoint(ip='192.85.1.101',
                          prefix='24',
                          gateway='192.85.1.201',
                          location='//169.254.0.3/1/1')
    sink = models.Endpoint(ip='192.85.1.201',
                           prefix='24',
                           gateway='192.85.1.101',
                           location='//169.254.0.3/1/3')

    # 3. Create playlist
    playlist = get_frames_playlist(src, sink, 100)

    # 6. Add playlistt to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_simple_igmp_frames_test():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create endpoints
    src = models.Endpoint(ip='192.85.1.101',
                          prefix='24',
                          gateway='192.85.1.201',
                          location='//169.254.0.3/1/1')
    sink = models.Endpoint(ip='192.85.1.201',
                           prefix='24',
                           gateway='192.85.1.101',
                           location='//169.254.0.3/1/3')

    igmp = models.MulticastEndpoint(ip='225.0.0.1',
                                    end_ip='225.0.0.10')

    # 3. Create playlist
    playlist = get_multicast_frames_playlist(src, sink, igmp, 100)

    # 6. Add playlistt to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_simple_mld_frames_test():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create endpoints
    src = models.Endpoint(ip='2001::101',
                          prefix='64',
                          gateway='2001::201',
                          location='//169.254.0.3/1/1')
    sink = models.Endpoint(ip='2001::201',
                           prefix='64',
                           gateway='2001::101',
                           location='//169.254.0.3/1/3')

    mld = models.MulticastEndpoint(ip='FF0A::1',
                                   end_ip='FF0A::10')

    # 3. Create playlist
    playlist = get_multicast_frames_playlist(src, sink, mld, 100)

    # 6. Add playlist to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test

def get_simple_multicast_edge_groups_frames_test(version=4, start=True):
    # 1. Create test
    test = models.SimpleTest()
    src=None
    sink=None
    group=None

    # 2. Create endpoints
    if version == 4:
        src = models.Endpoint(ip='192.85.1.101',
                              prefix='24',
                              gateway='192.85.1.201',
                              location='//169.254.0.3/1/1')
        sink = models.Endpoint(ip='192.85.1.201',
                               prefix='24',
                               gateway='192.85.1.101',
                               location='//169.254.0.3/1/3')
        if start:
            group = models.MulticastEndpoint(ip='225.0.0.0')
        else:
            group = models.MulticastEndpoint(ip='239.255.255.255')
    elif version == 6:
        src = models.Endpoint(ip='2001::101',
                              prefix='64',
                              gateway='2001::201',
                              location='//169.254.0.3/1/1')
        sink = models.Endpoint(ip='2001::201',
                               prefix='64',
                               gateway='2001::101',
                               location='//169.254.0.3/1/3')
        if start:
            group = models.MulticastEndpoint(ip='FF00::0')
        else:
            group = models.MulticastEndpoint(ip='FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF')

    # 3. Create playlist
    playlist = get_multicast_frames_playlist(src, sink, group, 100)

    # 6. Add playlist to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_simple_igmp_multi_frames_test():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create endpoints
    src = models.Endpoint(ip='192.85.1.101',
                          prefix='24',
                          gateway='192.85.1.201',
                          location='//169.254.0.3/1/1')
    sink = models.Endpoint(ip='192.85.1.201',
                           prefix='24',
                           gateway='192.85.1.101',
                           location='//169.254.0.3/1/2')

    sink2 = models.Endpoint(ip='192.85.1.211',
                            prefix='24',
                            gateway='192.85.1.101',
                            location='//169.254.0.3/1/3')

    igmp = models.MulticastEndpoint(ip='225.0.0.1',
                                    end_ip='225.0.0.10')

    # 3. Create playlist
    playlist = get_multicast_frames_playlist(src, sink, igmp, 100)
    playlist.sinks.append(sink2)

    # 6. Add playlistt to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_multi_playlist_igmp_frames_test():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create endpoints
    src = models.Endpoint(ip='192.85.1.101',
                          prefix='24',
                          gateway='192.85.1.201',
                          location='//169.254.0.3/1/1')
    sink = models.Endpoint(ip='192.85.1.201',
                           prefix='24',
                           gateway='192.85.1.101',
                           location='//169.254.0.3/1/2')

    sink2 = models.Endpoint(ip='192.85.1.211',
                            prefix='24',
                            gateway='192.85.1.101',
                            location='//169.254.0.3/1/3')

    igmp = models.MulticastEndpoint(ip='225.0.0.1',
                                    end_ip='225.0.0.10')

    igmp2 = models.MulticastEndpoint(ip='239.0.0.1',
                                     end_ip='239.0.0.10')

    # 3. Create and add playlists
    playlist = get_multicast_frames_playlist(src, sink, igmp, 10)
    playlist.sinks.append(sink2)
    test.playlists.append(playlist)

    playlist2 = get_multicast_frames_playlist(src, sink, igmp2, 10)
    playlist2.sinks.append(sink2)
    test.playlists.append(playlist2)

    # 4. Finish config
    test.actionize(60)

    return test


def get_simple_mld_multi_frames_test():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create endpoints
    src = models.Endpoint(ip='2001::101',
                          prefix='64',
                          gateway='2001::201',
                          location='//169.254.0.3/1/1')
    sink = models.Endpoint(ip='2001::201',
                           prefix='64',
                           gateway='2001::101',
                           location='//169.254.0.3/1/2')

    sink2 = models.Endpoint(ip='2001::211',
                            prefix='64',
                            gateway='2001::101',
                            location='//169.254.0.3/1/3')

    mld = models.MulticastEndpoint(ip='FF0A::1',
                                   end_ip='FF0A::10')

    # 3. Create playlist
    playlist = get_multicast_frames_playlist(src, sink, mld, 100)
    playlist.sinks.append(sink2)

    # 6. Add playlist to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_multi_playlist_igmp_mld_frames_test():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create endpoints
    src_v4 = models.Endpoint(ip='198.18.1.101',
                             end_ip='198.18.1.150',
                             prefix=16,
                             gateway='198.18.0.1',
                             location='//169.254.0.3/1/3')

    dst_v4 = models.Endpoint(ip='198.19.1.101',
                             end_ip='198.19.1.150',
                             prefix=16,
                             gateway='198.19.0.1',
                             location='//169.254.0.3/1/1')

    igmp = models.MulticastEndpoint(ip='225.0.0.1',
                                    end_ip='225.0.0.10')

    src_v6 = models.Endpoint(ip='2001:0:0:18::101',
                             end_ip='2001:0:0:18::110',
                             prefix=64,
                             gateway='2001:0:0:18::1',
                             location='//169.254.0.3/1/3')

    dst_v6 = models.Endpoint(ip='2001:0:0:19::101',
                             end_ip='2001:0:0:19::110',
                             prefix=64,
                             gateway='2001:0:0:19::1',
                             location='//169.254.0.3/1/1')

    mld = models.MulticastEndpoint(ip='FF0A::1',
                                   end_ip='FF0A::10')

    # 3. Create playlists
    playlist = get_multicast_frames_playlist(src_v4, dst_v4, igmp, 100)
    playlist2 = get_multicast_frames_playlist(dst_v6, src_v6, mld, 100)

    # 4. Add playlists to test
    test.playlists.append(playlist)
    test.playlists.append(playlist2)

    # 5. Add actions
    test.actionize(60)

    return test

def get_simple_custom_test(duration=60):
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create endpoints
    src = models.Endpoint(ip='192.85.1.101',
                          prefix='24',
                          gateway='192.85.1.201',
                          location='//169.254.0.3/1/1')
    sink = models.Endpoint(ip='192.85.1.201',
                           prefix='24',
                           gateway='192.85.1.101',
                           location='//169.254.0.3/1/3')

    # 4. Create playlist
    playlist = get_custom_playlist(src, sink, 100)

    # 5. Add playlistt to test
    test.playlists.append(playlist)

    # 6. Prepare custom action args
    def create_throughput_test(stc, parent, handles, cmd_args):
        cmd_args.update({'under': parent})
        if not cmd_args['trafficgroups']:
            for stream in handles:
                group = stc.get(stream, 'Affiliationtrafficgroup-Sources')
                if group:
                    cmd_args.update({'trafficgroups': stc.get(group, 'GroupName')})
                    break

        return stc.create('ixia.ixiacr.throughput_test.ThroughputTestCommand', **cmd_args)

    cmd_args = {
        'trafficgroups': None,
        'verifyduration': duration,
        'trialduration': 10,
        'initialload': 10,
        'loadlowerlimit': 10,
        'loadupperlimit': 100,
        'loadstep': 10,
        'resolution': 10,
        'averagejitter': 0,
        'averagelatency': 0,
        'acceptableframeloss': 0,
        'optionalparameters': {},
    }

    # 7. Add custom action into test
    test.playlists[0].actions.append(models.CustomTestAction(
        duration=duration,
        engine_kwargs=cmd_args,
        engine_create_fn=create_throughput_test))

    return test

def get_simple_custom_frames_test(duration=60):
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create endpoints
    src = models.Endpoint(ip='192.85.1.101',
                          prefix='24',
                          gateway='192.85.1.201',
                          location='//169.254.0.3/1/1')
    sink = models.Endpoint(ip='192.85.1.201',
                           prefix='24',
                           gateway='192.85.1.101',
                           location='//169.254.0.3/1/3')

    # 3. Create playlist
    playlist = get_custom_playlist(src, sink, 100)
    playlist2 = get_frames_playlist(src, sink, 100)

    # 4. Add playlist to test
    test.playlists.append(playlist2)
    test.actionize(duration)
    test.playlists.insert(len(test.playlists) - 1, playlist)

    # 5. Prepare custom action args
    def create_throughput_test(stc, parent, handles, cmd_args):
        cmd_args.update({'under': parent})
        if not cmd_args['trafficgroups']:
            for stream in handles:
                group = stc.get(stream, 'Affiliationtrafficgroup-Sources')
                if group:
                    cmd_args.update({'trafficgroups': stc.get(group, 'GroupName')})
                    break

        return stc.create('ixia.ixiacr.throughput_test.ThroughputTestCommand', **cmd_args)

    cmd_args = {
        'trafficgroups': None,
        'verifyduration': duration,
        'trialduration': 10,
        'initialload': 10,
        'loadlowerlimit': 10,
        'loadupperlimit': 100,
        'loadstep': 10,
        'resolution': 10,
        'averagejitter': 0,
        'averagelatency': 0,
        'acceptableframeloss': 0,
        'optionalparameters': {},
    }

    # 6. Add custom action into test
    test.playlists[0].actions.append(models.CustomTestAction(
        duration=duration,
        engine_kwargs=cmd_args,
        engine_create_fn=create_throughput_test))

    return test

def get_simple_custom_protocol_test(duration=60, proto_flags=HTTP | FTP):
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create endpoints
    src = models.Endpoint(ip='192.85.1.101',
                          prefix='24',
                          gateway='192.85.1.201',
                          location='//169.254.0.3/1/1')
    sink = models.Endpoint(ip='192.85.1.201',
                           prefix='24',
                           gateway='192.85.1.101',
                           location='//169.254.0.3/1/3')

    # 3. Create playlist
    playlist = get_custom_playlist(src, sink, 100)
    playlist2 = get_protocol_playlist(src, sink, proto_flags, 88)

    # 4. Add playlist to test
    test.playlists.append(playlist2)
    test.actionize(duration)
    test.playlists.insert(len(test.playlists) - 1, playlist)

    # 5. Prepare custom action args
    def create_throughput_test(stc, parent, handles, cmd_args):
        cmd_args.update({'under': parent})
        if not cmd_args['trafficgroups']:
            for stream in handles:
                group = stc.get(stream, 'Affiliationtrafficgroup-Sources')
                if group:
                    cmd_args.update({'trafficgroups': stc.get(group, 'GroupName')})
                    break

        return stc.create('ixia.ixiacr.throughput_test.ThroughputTestCommand', **cmd_args)

    cmd_args = {
        'trafficgroups': None,
        'verifyduration': duration,
        'trialduration': 10,
        'initialload': 10,
        'loadlowerlimit': 10,
        'loadupperlimit': 100,
        'loadstep': 10,
        'resolution': 10,
        'averagejitter': 0,
        'averagelatency': 0,
        'acceptableframeloss': 0,
        'optionalparameters': {},
    }

    # 6. Add custom action into test
    test.playlists[0].actions.append(models.CustomTestAction(
        duration=duration,
        engine_kwargs=cmd_args,
        engine_create_fn=create_throughput_test))

    return test

def get_bidirectional_frames_test_ipv4():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create endpoints
    src = models.Endpoint(ip='198.18.1.101',
                          end_ip='198.18.1.150',
                          prefix=16,
                          gateway='198.18.0.1',
                          location='//169.254.0.3/1/3')

    dst = models.Endpoint(ip='198.19.1.101',
                          end_ip='198.19.1.150',
                          prefix=16,
                          gateway='198.19.0.1',
                          location='//169.254.0.3/1/1')

    # 3. Create playlists
    playlist = get_frames_playlist(src, dst, 100)
    playlist2 = get_frames_playlist(dst, src, 100)

    # 4. Add playlists to test
    test.playlists.append(playlist)
    test.playlists.append(playlist2)

    # 5. Add actions
    test.actionize(60)

    return test


def get_bidirectional_frames_test_mixed():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create endpoints
    src_v4 = models.Endpoint(ip='198.18.1.101',
                             end_ip='198.18.1.150',
                             prefix=16,
                             gateway='198.18.0.1',
                             location='//169.254.0.3/1/3')

    dst_v4 = models.Endpoint(ip='198.19.1.101',
                             end_ip='198.19.1.150',
                             prefix=16,
                             gateway='198.19.0.1',
                             location='//169.254.0.3/1/1')

    src_v6 = models.Endpoint(ip='2001:0:0:18::101',
                             end_ip='2001:0:0:18::110',
                             prefix=64,
                             gateway='2001:0:0:18::1',
                             location='//169.254.0.3/1/3')

    dst_v6 = models.Endpoint(ip='2001:0:0:19::101',
                             end_ip='2001:0:0:19::110',
                             prefix=64,
                             gateway='2001:0:0:19::1',
                             location='//169.254.0.3/1/1')

    # 3. Create playlists
    playlist = get_frames_playlist(src_v4, dst_v4, 100)
    playlist2 = get_frames_playlist(dst_v6, src_v6, 100)

    # 4. Add playlists to test
    test.playlists.append(playlist)
    test.playlists.append(playlist2)

    # 5. Add actions
    test.actionize(60)

    return test


def get_simple_frames_test_ipv4():
    return get_simple_frames_test()


def get_asymmetric_frames_test_ipv4():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create playlist
    playlist = models.FramesPlaylist()

    # 3. Add endpoints to playlist
    playlist.sources.append(models.Endpoint(ip='192.85.1.101',
                                            prefix='24',
                                            gateway='192.85.1.201',
                                            location='//169.254.0.3/1/1'))
    playlist.sources.append(models.Endpoint(ip='192.85.1.111',
                                            end_ip='192.85.1.120',
                                            prefix='24',
                                            gateway='192.85.1.201',
                                            location='//169.254.0.3/1/1'))

    playlist.sinks.append(models.Endpoint(ip='192.85.1.201',
                                          prefix='24',
                                          gateway='192.85.1.101',
                                          location='//169.254.0.3/1/3'))

    # 4. Add traffic to playlist
    playlist.tracks.append(
        models.FixedFrameLengthTrack(
            frame_length=128, weight=7))
    playlist.tracks.append(
        models.FixedFrameLengthTrack(
            frame_length=576, weight=4))
    playlist.tracks.append(
        models.FixedFrameLengthTrack(
            frame_length=1518, weight=1))

    # 5. Set load
    playlist.load.value = 100

    # 6. Add playlist to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_simple_frames_test_ipv6():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create endpoints
    src = models.Endpoint(ip='2001::101',
                          prefix='64',
                          gateway='2001::201',
                          location='//169.254.0.3/1/1')
    sink = models.Endpoint(ip='2001::201',
                           prefix='64',
                           gateway='2001::101',
                           location='//169.254.0.3/1/3')

    # 3. Create playlist
    playlist = get_frames_playlist(src, sink, 100)

    # 6. Add playlist to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_minimal_frame_size_test():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create playlist
    playlist = models.FramesPlaylist()

    # 3. Add endpoints to playlist
    playlist.sources.append(models.Endpoint(ip='192.85.1.1',
                                            prefix='24',
                                            gateway='192.85.1.2',
                                            location='//169.254.0.3/1/1'))
    playlist.sinks.append(models.Endpoint(ip='192.85.1.2',
                                          prefix='24',
                                          gateway='192.85.1.1',
                                          location='//169.254.0.3/1/3'))

    # 4. Add traffic to playlist
    playlist.tracks.append(models.FixedFrameLengthTrack(
        frame_length=MIN_FRAME_SIZE, weight=1))

    # 5. Set load
    playlist.load.value = 100

    # 6. Add playlist to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_simple_protocol_test():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create playlist
    playlist = models.ProtocolPlaylist()

    # 3. Add endpoints to playlist
    playlist.sources.append(models.Endpoint(ip='192.85.1.1',
                                            prefix='24',
                                            gateway='192.85.1.2',
                                            location='//169.254.0.3/1/1'))
    playlist.sinks.append(models.Endpoint(ip='192.85.1.2',
                                          prefix='24',
                                          gateway='192.85.1.1',
                                          location='//169.254.0.3/1/3'))

    # 4. Add traffic to playlist
    playlist.tracks.append(models.HttpProtocolTrack(weight=3))
    playlist.tracks.append(models.FtpProtocolTrack(weight=1))

    # 5. Set load
    playlist.load.value = 100

    # 6. Add playlist to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_simple_igmp_protocol_test():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create playlist
    playlist = models.MulticastProtocolPlaylist()

    # 3. Add endpoints to playlist
    playlist.sources.append(models.Endpoint(ip='192.85.1.1',
                                            prefix='24',
                                            gateway='192.85.1.2',
                                            location='//169.254.0.3/1/1'))
    playlist.sinks.append(models.Endpoint(ip='192.85.1.2',
                                          prefix='24',
                                          gateway='192.85.1.1',
                                          location='//169.254.0.3/1/3'))

    playlist.multicast_endpoint = models.MulticastEndpoint(ip='225.0.0.1',
                                                           end_ip='225.0.0.10')

    # 4. Add traffic to playlist
    #playlist.tracks.append(models.HttpProtocolTrack(weight=3))
    #playlist.tracks.append(models.FtpProtocolTrack(weight=1))
    #playlist.tracks.append(models.VoiceProtocolTrack(weight=1))
    playlist.tracks.append(models.VideoProtocolTrack(weight=1, video_file=TEST_VIDEO))

    # 6. Set load
    playlist.load.value = 100

    # 7. Add playlist to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_simple_mld_protocol_test():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create playlist
    playlist = models.MulticastProtocolPlaylist()

    # 3. Create endpoints
    playlist.sources.append(models.Endpoint(ip='2001::101',
                                            prefix='64',
                                            gateway='2001::201',
                                            location='//169.254.0.3/1/1'))
    playlist.sinks.append(models.Endpoint(ip='2001::201',
                                          prefix='64',
                                          gateway='2001::101',
                                          location='//169.254.0.3/1/3'))

    playlist.multicast_endpoint = models.MulticastEndpoint(ip='FF0A::1',
                                                           end_ip='FF0A::10')

    # 4. Add traffic to playlist
    playlist.tracks.append(models.VideoProtocolTrack(weight=1, video_file=TEST_VIDEO))

    # 6. Set load
    playlist.load.value = 100

    # 7. Add playlist to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_simple_protocol_test_ipv4():
    return get_simple_protocol_test()


def get_asymmetric_protocol_test_ipv4():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create playlist
    playlist = models.ProtocolPlaylist()

    # 3. Add endpoints to playlist
    playlist.sources.append(models.Endpoint(ip='192.85.1.101',
                                            prefix='24',
                                            gateway='192.85.1.201',
                                            location='//169.254.0.3/1/1'))
    playlist.sources.append(models.Endpoint(ip='192.85.1.111',
                                            end_ip='192.85.1.120',
                                            prefix='24',
                                            gateway='192.85.1.201',
                                            location='//169.254.0.3/1/1'))

    playlist.sinks.append(models.Endpoint(ip='192.85.1.201',
                                          prefix='24',
                                          gateway='192.85.1.101',
                                          location='//169.254.0.3/1/3'))

    # 4. Add traffic to playlist
    playlist.tracks.append(models.HttpProtocolTrack(weight=3))
    playlist.tracks.append(models.FtpProtocolTrack(weight=1))

    # 5. Set load
    playlist.load.value = 100

    # 6. Add playlist to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_simple_protocol_test_ipv6():
    # 1. Create test
    test = models.SimpleTest()

    # 2. Create playlist
    playlist = models.ProtocolPlaylist()

    # 3. Add endpoints to playlist
    playlist.sources.append(models.Endpoint(ip='2001::101',
                                            prefix='64',
                                            gateway='2001::201',
                                            location='//169.254.0.3/1/1'))
    playlist.sinks.append(models.Endpoint(ip='2001::201',
                                          prefix='64',
                                          gateway='2001::101',
                                          location='//169.254.0.3/1/3'))

    # 4. Add traffic to playlist
    playlist.tracks.append(models.HttpProtocolTrack(weight=3))
    playlist.tracks.append(models.FtpProtocolTrack(weight=1))

    # 5. Set load
    playlist.load.value = 100

    # 6. Add playlist to test
    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_frames_playlist(source, sink, load=None):
    # Create
    playlist = models.FramesPlaylist()

    # Add source/sink
    playlist.sources.append(source)
    playlist.sinks.append(sink)

    # Add tracks
    playlist.tracks.append(
        models.FixedFrameLengthTrack(
            frame_length=128, weight=7))
    playlist.tracks.append(
        models.FixedFrameLengthTrack(
            frame_length=576, weight=4))
    playlist.tracks.append(
        models.FixedFrameLengthTrack(
            frame_length=1518, weight=1))
    playlist.tracks.append(
        models.RandomFrameLengthTrack(
            frame_length_min=128, frame_length_max=1518, weight=1))

    # set load
    if load is not None:
        playlist.load.value = load

    return playlist


def get_multicast_frames_playlist(source, sink, multicast_endpoint, load=None):
    # Create
    playlist = models.MulticastFramesPlaylist()

    # Add source/sink
    playlist.sources.append(source)
    playlist.sinks.append(sink)
    playlist.multicast_endpoint = multicast_endpoint

    # Add tracks
    playlist.tracks.append(
        models.FixedFrameLengthTrack(
            frame_length=128, weight=7))
    playlist.tracks.append(
        models.FixedFrameLengthTrack(
            frame_length=576, weight=4))
    playlist.tracks.append(
        models.FixedFrameLengthTrack(
            frame_length=1518, weight=1))
    playlist.tracks.append(
        models.RandomFrameLengthTrack(
            frame_length_min=128, frame_length_max=1518, weight=1))

    # set load
    if load is not None:
        playlist.load.value = load

    return playlist


def get_custom_playlist(source, sink, load=None):
    # Create
    playlist = models.FramesPlaylist()

    # Add source/sink
    playlist.sources.append(source)
    playlist.sinks.append(sink)

    # Add tracks
    playlist.tracks.append(
        models.FixedFrameLengthTrack(
            frame_length=128, weight=7))
    playlist.tracks.append(
        models.FixedFrameLengthTrack(
            frame_length=576, weight=4))
    playlist.tracks.append(
        models.FixedFrameLengthTrack(
            frame_length=1518, weight=1))

    # set load
    if load is not None:
        playlist.load.value = load

    return playlist


def get_protocol_playlist(source, sink, proto_flags,
                          load=None, track_playlists=None):
    # Create
    playlist = models.ProtocolPlaylist()

    # Add source/sink
    playlist.sources.append(source)
    playlist.sinks.append(sink)

    # Add tracks as indicated by flags
    if proto_flags & HTTP:
        playlist.tracks.append(models.HttpProtocolTrack(weight=1))

    if proto_flags & FTP:
        playlist.tracks.append(models.FtpProtocolTrack(weight=1))

    if proto_flags & RAW_TCP:
        playlist.tracks.append(models.RawTcpProtocolTrack(weight=1))

    if proto_flags & VOICE:
        playlist.tracks.append(models.VoiceProtocolTrack(weight=1))

    if proto_flags & VIDEO:
        playlist.tracks.append(
            models.VideoProtocolTrack(weight=1, video_file=TEST_VIDEO))

    if proto_flags & PLAYLIST:
        assert track_playlists is not None, (
            'Missing playlists argument for playlist track creation')
        for track_playlist in track_playlists:
            playlist.tracks.append(
                models.PlaylistProtocolTrack(
                    weight=1, playlist=track_playlist))

    # set load
    if load is not None:
        playlist.load.value = load

    return playlist


def get_multicast_protocol_playlist(source, sink, multicast_endpoint, proto_flags,
                                    load=None, track_playlists=None):
    # Create
    playlist = models.MulticastProtocolPlaylist()

    # Add source/sink
    playlist.sources.append(source)
    playlist.sinks.append(sink)
    playlist.multicast_endpoint = multicast_endpoint

    # Add tracks as indicated by flags
    if proto_flags & HTTP:
        playlist.tracks.append(models.HttpProtocolTrack(weight=1))

    if proto_flags & FTP:
        playlist.tracks.append(models.FtpProtocolTrack(weight=1))

    if proto_flags & RAW_TCP:
        playlist.tracks.append(models.RawTcpProtocolTrack(weight=1))

    if proto_flags & VOICE:
        playlist.tracks.append(models.VoiceProtocolTrack(weight=1))

    if proto_flags & VIDEO:
        playlist.tracks.append(
            models.VideoProtocolTrack(weight=1, video_file=TEST_VIDEO))

    if proto_flags & PLAYLIST:
        assert track_playlists is not None, (
            'Missing playlists argument for playlist track creation')
        for track_playlist in track_playlists:
            playlist.tracks.append(
                models.PlaylistProtocolTrack(
                    weight=1, playlist=track_playlist))

    # set load
    if load is not None:
        playlist.load.value = load

    return playlist


def get_simple_mixed_test_ipv4():
    # Create test
    test = models.SimpleTest()

    # Creaet sink/source
    source = models.Endpoint(ip='192.85.1.1',
                             prefix='24',
                             gateway='192.85.1.2',
                             location='//169.254.0.3/1/1')

    sink = models.Endpoint(ip='192.85.1.2',
                           prefix='24',
                           gateway='192.85.1.1',
                           location='//169.254.0.3/1/3')

    # Get playlists and add them tot he test
    frames_playlist = get_frames_playlist(source, sink, 500)
    test.playlists.append(frames_playlist)

    protocol_playlist = get_protocol_playlist(source, sink, HTTP | FTP, 88)
    test.playlists.append(protocol_playlist)

    # Expand action list
    test.actionize(60)

    return test


def get_all_protocols_test():
    # Create test
    test = models.SimpleTest()

    # Creaet sink/source
    source = models.Endpoint(ip='192.85.1.1',
                             prefix='24',
                             gateway='192.85.1.2',
                             location='//169.254.0.3/1/1')

    sink = models.Endpoint(ip='192.85.1.2',
                           prefix='24',
                           gateway='192.85.1.1',
                           location='//169.254.0.3/1/3')

    # Get playlists and add them tot he test
    protocol_playlist = get_protocol_playlist(
        source, sink, HTTP | FTP | RAW_TCP | VIDEO | VOICE, 100)
    test.playlists.append(protocol_playlist)

    # Expand action list
    test.actionize(60)

    return test


def get_all_protocols_test_ipv4():
    return get_all_protocols_test()


def get_protocols_test(flags=None, dscp=None, ipv6=None, pplaylist=None, load=None):
    if flags is None:
        flags = HTTP

    if load is None:
        load = 100

    # Create test
    test = models.SimpleTest()

    # Creaet sink/source
    if not ipv6:
        source = models.Endpoint(ip='192.85.1.1',
                                 prefix='24',
                                 gateway='192.85.1.2',
                                 location='//169.254.0.3/1/1')

        sink = models.Endpoint(ip='192.85.1.2',
                               prefix='24',
                               gateway='192.85.1.1',
                               location='//169.254.0.3/1/3')
    else:
        source = models.Endpoint(ip='2001::101',
                                 prefix='64',
                                 gateway='2001::201',
                                 location='//169.254.0.3/1/1')
        sink = models.Endpoint(ip='2001::201',
                               prefix='64',
                               gateway='2001::101',
                               location='//169.254.0.3/1/3')

    # Get playlists and add them tot he test
    protocol_playlist = get_protocol_playlist(source, sink, flags, load, pplaylist)

    if dscp is not None:
        protocol_playlist = models.PlaylistDiffServCodePointDecorator(
            protocol_playlist)
        protocol_playlist.diffserv_code_point = dscp

    test.playlists.append(protocol_playlist)

    # Expand action list
    test.actionize(60)

    return test


def get_multicast_protocols_test(flags=None, dscp=None, ipv6=None):
    if flags is None:
        flags = HTTP

    # Create test
    test = models.SimpleTest()

    # Creaet sink/source
    if not ipv6:
        source = models.Endpoint(ip='192.85.1.1',
                                 prefix='24',
                                 gateway='192.85.1.2',
                                 location='//169.254.0.3/1/1')

        sink = models.Endpoint(ip='192.85.1.2',
                               prefix='24',
                               gateway='192.85.1.1',
                               location='//169.254.0.3/1/3')

        # sink2 = models.Endpoint(ip='192.85.1.3',
        #                        prefix='24',
        #                        gateway='192.85.1.1',
        #                        location='//169.254.0.3/1/3')

        multicast_endpoint = models.MulticastEndpoint(ip='225.0.0.1',
                                                      end_ip='225.0.0.10')
    else:
        source = models.Endpoint(ip='2001::101',
                                 prefix='64',
                                 gateway='2001::201',
                                 location='//169.254.0.3/1/1')

        sink = models.Endpoint(ip='2001::201',
                               prefix='64',
                               gateway='2001::101',
                               location='//169.254.0.3/1/3')

        # sink2 = models.Endpoint(ip='2001::301',
        #                        prefix='64',
        #                        gateway='2001::101',
        #                        location='//169.254.0.3/1/3')

        multicast_endpoint = models.MulticastEndpoint(ip='FF0A::1',
                                                      end_ip='FF0A::10')

    # Get playlists and add them tot he test
    protocol_playlist = get_multicast_protocol_playlist(source, sink, multicast_endpoint, flags, 100)
    # protocol_playlist.sinks.append(sink2)

    if dscp is not None:
        protocol_playlist = models.PlaylistDiffServCodePointDecorator(
            protocol_playlist)
        protocol_playlist.diffserv_code_point = dscp

    test.playlists.append(protocol_playlist)

    # Expand action list
    test.actionize(60)

    return test


def get_multicast_diff_subnet_protocols_test(flags=None, dscp=None, ipv6=None):
    if flags is None:
        flags = HTTP

    # Create test
    test = models.SimpleTest()

    # Creaet sink/source
    if not ipv6:
        source = models.Endpoint(ip='192.85.1.1',
                                 end_ip='192.85.1.5',
                                 prefix='24',
                                 gateway='192.85.1.10',
                                 location='//169.254.0.3/1/1')

        sink = models.Endpoint(ip='192.85.2.11',
                               end_ip='192.85.2.15',
                               prefix='24',
                               gateway='192.85.2.1',
                               location='//169.254.0.3/1/3')

        # sink2 = models.Endpoint(ip='192.85.1.3',
        #                        prefix='24',
        #                        gateway='192.85.1.1',
        #                        location='//169.254.0.3/1/3')

        multicast_endpoint = models.MulticastEndpoint(ip='225.0.0.1',
                                                      end_ip='225.0.0.10')
    else:
        source = models.Endpoint(ip='2001::101',
                                 end_ip='2001::111',
                                 prefix='64',
                                 gateway='2001::201',
                                 location='//169.254.0.3/1/1')

        sink = models.Endpoint(ip='2002::201',
                               end_ip='2002::211',
                               prefix='64',
                               gateway='2002::101',
                               location='//169.254.0.3/1/3')

        # sink2 = models.Endpoint(ip='2001::301',
        #                        prefix='64',
        #                        gateway='2001::101',
        #                        location='//169.254.0.3/1/3')

        multicast_endpoint = models.MulticastEndpoint(ip='FF0A::1',
                                                      end_ip='FF0A::10')

    # Get playlists and add them tot he test
    protocol_playlist = get_multicast_protocol_playlist(source, sink, multicast_endpoint, flags, 100)
    # protocol_playlist.sinks.append(sink2)

    if dscp is not None:
        protocol_playlist = models.PlaylistDiffServCodePointDecorator(
            protocol_playlist)
        protocol_playlist.diffserv_code_point = dscp

    test.playlists.append(protocol_playlist)

    # Expand action list
    test.actionize(60)

    return test


def get_multicast_same_subnet_protocols_test(flags=None, dscp=None, ipv6=None):
    if flags is None:
        flags = HTTP

    # Create test
    test = models.SimpleTest()

    # Creaet sink/source
    if not ipv6:
        source = models.Endpoint(ip='192.85.1.1',
                                 end_ip='192.85.1.5',
                                 prefix='24',
                                 gateway='192.85.1.10',
                                 location='//169.254.0.3/1/1')

        sink = models.Endpoint(ip='192.85.1.11',
                               end_ip='192.85.1.15',
                               prefix='24',
                               gateway='192.85.1.1',
                               location='//169.254.0.3/1/3')

        # sink2 = models.Endpoint(ip='192.85.1.3',
        #                        prefix='24',
        #                        gateway='192.85.1.1',
        #                        location='//169.254.0.3/1/3')

        multicast_endpoint = models.MulticastEndpoint(ip='225.0.0.1',
                                                      end_ip='225.0.0.10')
    else:
        source = models.Endpoint(ip='2001::101',
                                 end_ip= '2001::111',
                                 prefix='64',
                                 gateway='2001::201',
                                 location='//169.254.0.3/1/1')

        sink = models.Endpoint(ip='2001::201',
                               end_ip= '2001::211',
                               prefix='64',
                               gateway='2001::101',
                               location='//169.254.0.3/1/3')

        # sink2 = models.Endpoint(ip='2001::301',
        #                        prefix='64',
        #                        gateway='2001::101',
        #                        location='//169.254.0.3/1/3')

        multicast_endpoint = models.MulticastEndpoint(ip='FF0A::1',
                                                      end_ip='FF0A::10')

    # Get playlists and add them tot he test
    protocol_playlist = get_multicast_protocol_playlist(source, sink, multicast_endpoint, flags, 100)
    # protocol_playlist.sinks.append(sink2)

    if dscp is not None:
        protocol_playlist = models.PlaylistDiffServCodePointDecorator(
            protocol_playlist)
        protocol_playlist.diffserv_code_point = dscp

    test.playlists.append(protocol_playlist)

    # Expand action list
    test.actionize(60)

    return test


def get_protocols_scale_test(flags=None):
    if flags is None:
        flags = HTTP

    # Create test
    test = models.SimpleTest()

    # Creaet sink/source
    source = models.Endpoint(ip='192.85.1.1',
                             end_ip='192.85.1.10',
                             prefix='24',
                             gateway='192.85.1.101',
                             location='//169.254.0.3/1/1')

    sink = models.Endpoint(ip='192.85.1.101',
                           end_ip='192.85.1.120',
                           prefix='24',
                           gateway='192.85.1.1',
                           location='//169.254.0.3/1/3')

    # Get playlists and add them tot he test
    protocol_playlist = get_protocol_playlist(source, sink, flags, 100)
    test.playlists.append(protocol_playlist)

    # Expand action list
    test.actionize(60)

    return test


def get_playlist_test(playlists):
    # Create test
    test = models.SimpleTest()

    # Creaet sink/source
    source = models.Endpoint(ip='192.85.1.1',
                             prefix='24',
                             gateway='192.85.1.101',
                             location='//169.254.0.3/1/1')

    sink = models.Endpoint(ip='192.85.1.101',
                           prefix='24',
                           gateway='192.85.1.1',
                           location='//169.254.0.3/1/3')

    # Get playlists and add them to the test
    # XXX: limited to 8 users per playlist
    protocol_playlist = get_protocol_playlist(source, sink, PLAYLIST,
                                              4 * len(playlists), playlists)
    test.playlists.append(protocol_playlist)

    # Expand action list
    test.actionize(60)

    return test


def get_mixed_ip_mixed_playlist_test(dhcp=None):
    """
    Create a test with 4 playlists:
    * IPv4 with Frames traffic
    * IPv4 with Protocol traffic
    * IPv6 with Frames traffic
    * IPv6 with Protocol traffic

    Optionally use dhcp endpoints
    """

    test = models.SimpleTest()

    # Create sink/sources
    if not dhcp:
        source4 = models.Endpoint(ip='192.85.1.1',
                                  end_ip='192.85.1.50',
                                  prefix='24',
                                  gateway='192.85.1.101',
                                  location='//169.254.0.3/1/1')

        sink4 = models.Endpoint(ip='192.85.1.101',
                                end_ip='192.85.1.150',
                                prefix='24',
                                gateway='192.85.1.1',
                                location='//169.254.0.3/1/3')

        source6 = models.Endpoint(ip='2001::101',
                                  end_ip='2001::140',
                                  prefix='64',
                                  gateway='2001::201',
                                  location='//169.254.0.3/1/1')

        sink6 = models.Endpoint(ip='2001::201',
                                end_ip='2001::240',
                                prefix='64',
                                gateway='2001::101',
                                location='//169.254.0.3/1/3')
    else:
        source4 = models.Endpoint(use_dhcp=True,
                                  count=50,
                                  version=4,
                                  location='//169.254.0.3/1/1')
        sink4 = models.Endpoint(use_dhcp=True,
                                count=50,
                                version=4,
                                location='//169.254.0.3/1/3')
        source6 = models.Endpoint(use_dhcp=True,
                                  count=50,
                                  version=6,
                                  location='//169.254.0.3/1/1')
        sink6 = models.Endpoint(use_dhcp=True,
                                count=50,
                                version=6,
                                location='//169.254.0.3/1/3')

    # Now make some playlists
    test.playlists.append(
        get_frames_playlist(
            source4, sink4, load=100))
    test.playlists.append(
        get_frames_playlist(
            source6, sink6, load=100))

    test.playlists.append(
        get_protocol_playlist(
            source4, sink4, HTTP | VOICE | VIDEO, load=100))
    test.playlists.append(
        get_protocol_playlist(
            source6, sink6, HTTP | VOICE | VIDEO, load=100))

    test.actionize(60)

    return test


def get_frame_playlist_dhcp_test(use_multicast=False):
    """
    Create a test with 4 playlists:
    * IPv4 with Frames traffic
    * IPv4 with Protocol traffic
    * IPv6 with Frames traffic
    * IPv6 with Protocol traffic

    Optionally use dhcp endpoints
    """

    test = models.SimpleTest()

    # Create sink/sources
    source4 = models.Endpoint(use_dhcp=True,
                              count=50,
                              version=4,
                              location='//169.254.0.3/1/1')
    sink4 = models.Endpoint(use_dhcp=True,
                            count=50,
                            version=4,
                            location='//169.254.0.3/1/3')

    playlist = get_frames_playlist(
        source4, sink4, load=100)
    if use_multicast:
        playlist.multicast_endpoint = models.MulticastEndpoint(ip='225.0.0.1',
                                                               end_ip='225.0.0.10')

    test.playlists.append(playlist)

    test.actionize(60)

    return test


def get_protocol_playlist_dhcp_test(use_multicast=False):
    """
    Create a test with 4 playlists:
    * IPv4 with Frames traffic
    * IPv4 with Protocol traffic
    * IPv6 with Frames traffic
    * IPv6 with Protocol traffic

    Optionally use dhcp endpoints
    """

    test = models.SimpleTest()

    # Create sink/sources
    source4 = models.Endpoint(use_dhcp=True,
                              count=50,
                              version=4,
                              location='//169.254.0.3/1/1')
    sink4 = models.Endpoint(use_dhcp=True,
                            count=50,
                            version=4,
                            location='//169.254.0.3/1/3')

    playlist = get_protocol_playlist(
        source4, sink4, HTTP | VOICE | VIDEO, load=50)

    if use_multicast:
        playlist.multicast_endpoint = models.MulticastEndpoint(ip='225.0.0.1',
                                                               end_ip='225.0.0.10')

    playlist.load.value = 100

    test.playlists.append(playlist)

    test.actionize(60)

    return test


def flip_test_direction(test):
    for playlist in test.playlists:
        sources = list()
        sinks = list()

        # Remove original src/sinks and save them so we
        # can reverse them
        while len(playlist.sources):
            orig_source = playlist.sources.pop()
            sinks.append(orig_source)

        while len(playlist.sinks):
            orig_sink = playlist.sinks.pop()
            sources.append(orig_sink)

        # Sanity check
        assert len(playlist.sources) == 0
        assert len(playlist.sinks) == 0

        # Now, readd the endpoints to their new position
        for source in sources:
            playlist.sources.append(source)

        for sink in sinks:
            playlist.sinks.append(sink)

    return test
