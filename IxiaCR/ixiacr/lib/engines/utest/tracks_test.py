#!/local/pythonenv/bin/python

import binascii
import os

from ixiacr.lib.engines import models

import unittest2 as unittest


class TestSequenceFunctions(unittest.TestCase):

    def test_track_weight(self):
        # This all comes from a common class, so it doesn't matter which track
        # object we look at
        fft = models.FixedFrameLengthTrack()
        self.assertIsNotNone(fft)

        # Make sure positive weights are valid
        for x in [1, 10, 100, 1000, 10000]:
            fft.weight = x

        # Mishaps throw exceptions, check that
        for x in ['flame', 12.2, -7]:
            self.assertRaises(Exception, fft.set_weight, x)

    def test_frames_track(self):
        fft = models.FixedFrameLengthTrack()
        self.assertIsNotNone(fft)

        # Make sure we can only set positive integer values
        # between 64 and 16383
        for x in [72.1, 'flame', -12, 63, 16384]:
            fft.frame_length = x
            self.assertFalse(fft.is_valid, 'frame_length = %s' % x)

        # Make sure all of our standard sizes work
        for x in [64, 128, 256, 512, 1024, 1280, 1518, 4096, 8192, 16000]:
            fft.frame_length = x
            self.assertTrue(fft.is_valid, 'frame_length = %s' % x)

        # Check UDP src/dst ports
        self.assertEqual(fft.src_port, 3357)
        self.assertEqual(fft.dst_port, 7)

        for x in ['flame', 12.2]:
            self.assertRaises(TypeError, setattr, fft, 'src_port', x)
            self.assertRaises(TypeError, setattr, fft, 'dst_port', x)

        for x in [-7, 0, 71000]:
            self.assertRaises(ValueError, setattr, fft, 'src_port', x)
            self.assertRaises(ValueError, setattr, fft, 'dst_port', x)

    def test_random_frames_track(self):
        rft = models.RandomFrameLengthTrack()
        self.assertIsNotNone(rft)

        for x, y in [(72.1, 112),
                     ('234', '512'),
                     (-64, -1518),
                     (63, 16384)]:
            rft.frame_length_min = x
            rft.frame_length_max = y
            self.assertFalse(rft.is_valid,
                             'frame_length_min = %s, frame_length_max = %s'
                             % (x, y))

        # check a number of valid ranges, just for fun
        for x, y in [(64, 1518), (128, 256), (4096, 8192)]:
            rft.frame_length_min = x
            rft.frame_length_max = y
            self.assertTrue(rft.is_valid,
                            'frame_length_min = %s, frame_length_max = %s'
                            % (x, y))

    def test_http_protocol_track(self):
        hpt = models.HttpProtocolTrack()
        self.assertIsNotNone(hpt)

        self.assertTrue(hpt.is_valid)

        hpt.response_size_type = models.HttpProtocolTrack.ResponseSize.FIXED

        for x in [-1, 0, 'blah', False, str(100)]:
            hpt.response_size = x
            self.assertFalse(hpt.is_valid, 'response_size = %s' % x)

            hpt.response_size = 1000
            self.assertTrue(hpt.is_valid)

        hpt.response_size_type = models.HttpProtocolTrack.ResponseSize.RANDOM

        for (x, y) in [(-1, 100), (-50, -10), (str(10), str(100))]:
            hpt.response_size_min = x
            hpt.response_size_max = y
            self.assertFalse(hpt.is_valid,
                             'response_size_min = %s, response_size_max = %s'
                             % (x, y))

            hpt.response_size_min = 1
            hpt.response_size_max = 1000
            self.assertTrue(hpt.is_valid)

        hpt.response_delay_type = models.HttpProtocolTrack.ResponseDelay.FIXED

        for x in [-1, 'blah', str(100)]:
            hpt.response_delay = x
            self.assertFalse(hpt.is_valid, 'response_delay = %s' % x)

            hpt.response_delay = 1000
            self.assertTrue(hpt.is_valid)

        hpt.response_delay_type = models.HttpProtocolTrack.ResponseDelay.RANDOM

        for (x, y) in [(-1, 100), (-50, -10), (str(10), str(100))]:
            hpt.response_delay_min = x
            hpt.response_delay_max = y
            self.assertFalse(hpt.is_valid,
                             'response_delay_min = %s, response_delay_max = %s'
                             % (x, y))

            hpt.response_delay_min = 1
            hpt.response_delay_max = 1000
            self.assertTrue(hpt.is_valid)

        hpt.response_content = models.HttpProtocolTrack.ResponseContent.ASCII
        self.assertTrue(hpt.is_valid)

        hpt.reponse_content = models.HttpProtocolTrack.ResponseContent.BINARY
        self.assertTrue(hpt.is_valid)

        hpt.http_version = models.HttpProtocolTrack.Version.HTTP_1_0
        self.assertTrue(hpt.is_valid)

        hpt.http_version = models.HttpProtocolTrack.Version.HTTP_1_1
        self.assertTrue(hpt.is_valid)

    def test_ftp_protocol_track(self):
        fpt = models.FtpProtocolTrack()
        self.assertIsNotNone(fpt)

        self.assertTrue(fpt.is_valid)

        fpt.response_size_type = models.FtpProtocolTrack.ResponseSize.FIXED

        for x in [-1, 0, 'blah', False, str(100)]:
            fpt.response_size = x
            self.assertFalse(fpt.is_valid, 'response_size = %s' % x)

            fpt.response_size = 1000
            self.assertTrue(fpt.is_valid)

        fpt.response_size_type = models.FtpProtocolTrack.ResponseSize.RANDOM

        for (x, y) in [(-1, 100), (-50, -10), (str(10), str(100))]:
            fpt.response_size_min = x
            fpt.response_size_max = y
            self.assertFalse(fpt.is_valid,
                             'response_size_min = %s, response_size_max = %s'
                             % (x, y))

            fpt.response_size_min = 1
            fpt.response_size_max = 1000
            self.assertTrue(fpt.is_valid)

        fpt.response_delay_type = models.FtpProtocolTrack.ResponseDelay.FIXED

        for x in [-1, 'blah', str(100)]:
            fpt.response_delay = x
            self.assertFalse(fpt.is_valid, 'response_delay = %s' % x)

            fpt.response_delay = 1000
            self.assertTrue(fpt.is_valid)

        fpt.response_delay_type = models.FtpProtocolTrack.ResponseSize.RANDOM

        for (x, y) in [(-1, 100), (-50, -10), (str(10), str(100))]:
            fpt.response_delay_min = x
            fpt.response_delay_max = y
            self.assertFalse(fpt.is_valid,
                             'response_delay_min = %s, response_delay_max = %s'
                             % (x, y))

            fpt.response_delay_min = 1
            fpt.response_delay_max = 1000
            self.assertTrue(fpt.is_valid)

        fpt.response_content = models.FtpProtocolTrack.ResponseContent.ASCII
        self.assertTrue(fpt.is_valid)

        fpt.reponse_content = models.FtpProtocolTrack.ResponseContent.BINARY
        self.assertTrue(fpt.is_valid)

        fpt.action = models.FtpProtocolTrack.Action.PUT
        self.assertTrue(fpt.is_valid)

        fpt.action = models.FtpProtocolTrack.Action.GET
        self.assertTrue(fpt.is_valid)

        fpt.is_passive = False
        self.assertTrue(fpt.is_valid)

        fpt.is_passive = True
        self.assertTrue(fpt.is_valid)

    def test_raw_tcp_protocol_track(self):
        rpt = models.RawTcpProtocolTrack()
        self.assertIsNotNone(rpt)

        self.assertTrue(rpt.is_valid)

        rpt.response_size_type = models.RawTcpProtocolTrack.ResponseSize.FIXED

        for x in [-1, 0, 'blah', False, str(100)]:
            rpt.response_size = x
            self.assertFalse(rpt.is_valid, 'response_size = %s' % x)

            rpt.response_size = 1000
            self.assertTrue(rpt.is_valid)

        rpt.response_size_type = models.RawTcpProtocolTrack.ResponseSize.RANDOM

        for (x, y) in [(-1, 100), (-50, -10), (str(10), str(100))]:
            rpt.response_size_min = x
            rpt.response_size_max = y
            self.assertFalse(rpt.is_valid,
                             'response_size_min = %s, response_size_max = %s'
                             % (x, y))

            rpt.response_size_min = 1
            rpt.response_size_max = 1000
            self.assertTrue(rpt.is_valid)

        rpt.response_delay_type = models.RawTcpProtocolTrack.ResponseDelay.FIXED

        for x in [-1, 'blah', str(100)]:
            rpt.response_delay = x
            self.assertFalse(rpt.is_valid, 'response_delay = %s' % x)

            rpt.response_delay = 1000
            self.assertTrue(rpt.is_valid)

        rpt.response_delay_type = models.RawTcpProtocolTrack.ResponseSize.RANDOM

        for (x, y) in [(-1, 100), (-50, -10), (str(10), str(100))]:
            rpt.response_delay_min = x
            rpt.response_delay_max = y
            self.assertFalse(rpt.is_valid,
                             'response_delay_min = %s, response_delay_max = %s'
                             % (x, y))

            rpt.response_delay_min = 1
            rpt.response_delay_max = 1000
            self.assertTrue(rpt.is_valid)

        rpt.response_content = models.RawTcpProtocolTrack.ResponseContent.ASCII
        self.assertTrue(rpt.is_valid)

        rpt.reponse_content = models.RawTcpProtocolTrack.ResponseContent.BINARY
        self.assertTrue(rpt.is_valid)

        for x in [-1, 0, str(12)]:
            rpt.server_port = x
            self.assertFalse(rpt.is_valid, 'server_port = %s' % x)

            rpt.server_port = 3357
            self.assertTrue(rpt.is_valid)

        for x in range(1, 65536):
            rpt.server_port = x
            self.assertTrue(rpt.is_valid)

    def test_voice_protocol_track(self):
        vpt = models.VoiceProtocolTrack()
        self.assertIsNotNone(vpt)

        self.assertTrue(vpt.is_valid)

        # Check voice modes
        vpt.call_type = models.VoiceProtocolTrack.CallType.AUDIO
        self.assertTrue(vpt.is_valid)
        self.assertEqual(vpt.video_codec,
                         models.VoiceProtocolTrack.VideoCodec.NONE)

        # Make sure all codecs except AAC_LD are valid for audio
        for x in models.VoiceProtocolTrack.AudioCodec.reverse_mapping.keys():
            enum_val = x
            enum_name = models.VoiceProtocolTrack.AudioCodec.reverse_mapping[x]

            if x == models.VoiceProtocolTrack.AudioCodec.AAC_LD:
                continue

            vpt.audio_codec = getattr(
                models.VoiceProtocolTrack.AudioCodec, enum_name)
            self.assertEqual(vpt.audio_codec, x)

            self.assertTrue(vpt.is_valid)

        # For AUDIO_VIDEO, we can use most every audio codec.
        # Video codec should be H.264
        vpt.call_type = models.VoiceProtocolTrack.CallType.AUDIO_VIDEO
        self.assertTrue(vpt.is_valid)
        self.assertEqual(vpt.video_codec,
                         models.VoiceProtocolTrack.VideoCodec.H_264)

        # Make sure all codecs except AAC_LD are valid for audio
        for x in models.VoiceProtocolTrack.AudioCodec.reverse_mapping.keys():
            enum_val = x
            enum_name = models.VoiceProtocolTrack.AudioCodec.reverse_mapping[x]

            if x == models.VoiceProtocolTrack.AudioCodec.AAC_LD:
                continue

            vpt.audio_codec = getattr(
                models.VoiceProtocolTrack.AudioCodec, enum_name)
            self.assertEqual(vpt.audio_codec, x)

            self.assertTrue(vpt.is_valid)

        # For TELEPRESENCE, there should be only one kind of
        # aduio and video codec
        vpt.call_type = models.VoiceProtocolTrack.CallType.TELEPRESENCE
        self.assertEqual(vpt.audio_codec,
                         models.VoiceProtocolTrack.AudioCodec.AAC_LD)
        self.assertEqual(vpt.video_codec,
                         models.VoiceProtocolTrack.VideoCodec.H_264)

        # And we can't set audio_codec to any other value
        for x in models.VoiceProtocolTrack.AudioCodec.reverse_mapping.keys():
            enum_name = models.VoiceProtocolTrack.AudioCodec.reverse_mapping[x]

            if x == models.VoiceProtocolTrack.AudioCodec.AAC_LD:
                continue

            vpt.audio_codec = getattr(
                models.VoiceProtocolTrack.AudioCodec, enum_name)
            self.assertNotEqual(vpt.audio_codec, x)

    def create_tmp_file(self, ext):
        while True:
            # Generate some crazy name
            basename = '%s.%s' % (binascii.b2a_hex(os.urandom(15)), ext)
            filename = os.path.join('/tmp', basename)

            if os.path.exists(filename):
                continue  # Really?!?  Go pick another name...

            with open(filename, 'w') as f:
                f.write('This is a machine generated test file.')

            return filename

    def test_video_protocol_track(self):
        vpt = models.VideoProtocolTrack()
        self.assertIsNotNone(vpt)

        # Should be invalid without a video
        self.assertFalse(vpt.is_valid)

        # Create a couple of test files
        files = {}
        for ext in ['txt', 'mp4']:
            files[ext] = self.create_tmp_file(ext)

        vpt.video_file = files['mp4']
        self.assertTrue(vpt.is_valid)

        vpt.video_file = files['txt']
        self.assertFalse(vpt.is_valid)

        for key in files.keys():
            os.unlink(files[key])

    def test_playlist_track(self):
        ppt = models.PlaylistProtocolTrack()

        # Should be invalid without a playlist
        self.assertFalse(ppt.is_valid)

        ppt.playlist = 'System/Bittorrent/Bittorrent.xml'
        self.assertTrue(ppt.is_valid)

        ppt.playlist = 'Bittorrent'
        self.assertFalse(ppt.is_valid)


if __name__ == "__main__":
    unittest.main()
