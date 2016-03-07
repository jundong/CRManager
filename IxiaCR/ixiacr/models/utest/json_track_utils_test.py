#!/local/pythonenv/bin/python

import ixiacr.models.track_utils as track_utils

import unittest2 as unittest


class TestSequenceFunctions(unittest.TestCase):

    def test_static_json_load(self):
        # Just check to make sure this loads tracks and doesn't throw errors
        tracks = track_utils.JsonTrackUtils.get_all_static_tracks()
        self.assertTrue(tracks, 'No tracks loaded')

    def test_dynamic_json_load(self):
        # Just check to make sure this loads
        # some dynamic tracks and doesn't throw errors
        tracks = track_utils.JsonTrackUtils.get_all_dynamic_playlist_tracks()
        for track in tracks:
            print track
        self.assertTrue(tracks, 'No dynamic tracks loaded')
        tracks_verbose = track_utils.JsonTrackUtils.get_playlists(
            track_utils.JsonTrackUtils.DYNAMIC_PLAYLISTS,
            True
        )
        self.assertTrue('firmware_version' in tracks_verbose)
        self.assertTrue(
            tracks_verbose['firmware_version'].replace(".", "").isdigit()
        )

if __name__ == "__main__":
    unittest.main()
