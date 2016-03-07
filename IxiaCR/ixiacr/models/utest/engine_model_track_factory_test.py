#!/local/pythonenv/bin/python

import ixiacr.lib.engines.models as models
import ixiacr.models.track_utils as track_utils
from ixiacr.models import Track
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from zope.sqlalchemy import ZopeTransactionExtension
from paste.deploy import loadapp

import unittest2 as unittest

wsgi_app = loadapp('config:/local/web/Ixia/development.ini')

db = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
engine = create_engine('postgresql://ixia:ixia@127.0.0.1/ixia')
db.configure(bind=engine)


class TestSequenceFunctions(unittest.TestCase):

    FRAME_LENGTHS = [128,
                     256,
                     512,
                     1024,
                     1280,
                     1518,
                     2048,
                     4096,
                     8192]

    @classmethod
    def setUpClass(cls):
        cls.model_track_factory = track_utils.EngineModelTrackFactory()

    def setUp(self):
        assert self.model_track_factory is not None, 'No model track factory!'

    def test_simple_creation(self):
        testData = [('HTTP', models.HttpProtocolTrack),
                    ('FTP', models.FtpProtocolTrack),
                    ('Raw TCP', models.RawTcpProtocolTrack),
                    ('Voice Call', models.VoiceProtocolTrack),
                    ('Video Call', models.VoiceProtocolTrack),
                    ('Telepresence', models.VoiceProtocolTrack)]

        for (name, cls) in testData:
            db_track = Track.query.filter_by(name=name).first()
            self.assertIsNotNone(db_track,
                                 'Track does not exist for name %s' % name)
            test_json = {'name': name,
                         'track_properties': dict(),
                         'id': db_track.id}
            track = self.model_track_factory.make_model_track(test_json)
            self.assertEqual(type(track), cls,
                             'Incorrect track created for %s' % name)

    def test_dynamic_creation(self):
        testData = [('NFS V2 UDP', 'System/NFS/NFS_V2_UDP.xml'),
                    ('LDAP', 'System/LDAP/LDAP.xml'),
                    ('Attack: BusMail', 'System/base_threats/BusMail.xml')]

        for name, playlist in testData:
            db_track = Track.query.filter_by(name=name).first()
            self.assertIsNotNone(db_track,
                                 'Track does not exist for name %s' % name)
            test_json = {'name': name,
                         'track_properties': [{'name': 'Playlist',
                                               'value': 1}],
                         'id': db_track.id}
            track = self.model_track_factory.make_model_track(test_json)
            self.assertEqual(type(track),
                             models.PlaylistProtocolTrack,
                             'Incorrect track created for %s' % name)
            self.assertTrue(track.playlist.find(playlist) >= 0,
                            'Incorrect playlist assigned to track %s' % name)

    def test_fixed_frame_creation(self):
        """
        Verify that fixed frames can be created
        """
        testData = [('Frame: 128 Bytes',
                     models.FixedFrameLengthTrack,
                     128),
                    ('Frame: 1518 Bytes',
                     models.FixedFrameLengthTrack,
                     1518),
                    ('Frame: 8192 Bytes (Jumbo)',
                     models.FixedFrameLengthTrack,
                     8192)]

        for name, cls, size in testData:
            print 'name = %s' % name
            db_track = Track.query.filter_by(name=name).first()
            self.assertIsNotNone(db_track,
                                 'Track does not exist for name %s' % name)

            test_json = {'name': name,
                         'track_properties': [{'name': 'Frame Size',
                                               'value': 1},
                                              {'name': 'UDP Port',
                                               'value': 3}],
                         'id': db_track.id}
            track = self.model_track_factory.make_model_track(test_json)
            print track
            self.assertEqual(type(track), cls,
                             'Incorrect track created for %s' % name)
            self.assertEqual(track.avg_frame_length, size,
                             'Incorrect frame size for %s' % name)
            self.assertNotEqual(track.dst_port, 7,
                                'Incorrect dst port for %s' % name)

    def test_random_frame_creation(self):
        """
        Verify that random length frames can be created
        """
        testData = [('Frame: Random Bytes',
                    models.RandomFrameLengthTrack,
                    (128, 1518)),
                    ('Frame: Random Bytes',
                    models.RandomFrameLengthTrack,
                    (512, 8192))]

        for name, cls, (small, large) in testData:
            db_track = Track.query.filter_by(name=name).first()
            self.assertIsNotNone(db_track,
                                 'Track does not exist for name %s' % name)

            small_idx = self.FRAME_LENGTHS.index(small) + 1
            large_idx = self.FRAME_LENGTHS.index(large) + 1

            test_json = {'name': name,
                         'track_properties': [{'name': 'Minimum Frame Size',
                                               'value': small_idx},
                                              {'name': 'Maximum Frame Size',
                                               'value': large_idx},
                                              {'name': 'UDP Port',
                                               'value': 5}],
                         'id': db_track.id}

            track = self.model_track_factory.make_model_track(test_json)
            self.assertEqual(type(track), cls,
                             'Incorect track created for %s' % name)
            self.assertEqual(track.frame_length_min, small,
                             'Incorrect min frame length for %s' % name)
            self.assertEqual(track.frame_length_max, large,
                             'Incorrect max frame length for %s' % name)
            self.assertNotEqual(track.dst_port, 7,
                                'Incorrect dst port for %s' % name)


if __name__ == "__main__":
    unittest.main()
