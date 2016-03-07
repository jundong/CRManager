#!/local/pythonenv/bin/python

import json
import os
import unittest2 as unittest

from ixiacr.views.latency_utils import LatencyUtils

class TestSequenceFunctions(unittest.TestCase):

    FRAMES_RESULT = 'frames_result.txt'
    HTTP_RESULT = 'http_result.txt'

    @classmethod
    def setUpClass(cls):
        cls.frames_result = None
        cls.http_result = None


        filename = os.path.join(os.path.dirname(__file__), cls.FRAMES_RESULT)
        with open(filename, 'r') as f:
            cls.frames_result = json.loads(f.read())

        filename = os.path.join(os.path.dirname(__file__), cls.HTTP_RESULT)
        with open(filename, 'r') as f:
            cls.http_result = json.loads(f.read())


    def setUp(self):
        assert self.frames_result is not None, 'No frames result found'
        assert self.http_result is not None, 'No http result found'

    def test_eot_result_has_latency(self):
        self.assertTrue(LatencyUtils.eot_result_has_latency(self.frames_result))
        self.assertFalse(LatencyUtils.eot_result_has_latency(self.http_result))

    def test_get_latency_cells_from_result(self):
        self.assertEqual(3, len(LatencyUtils._get_latency_cells_from_result(self.frames_result)))
        self.assertEqual(0, len(LatencyUtils._get_latency_cells_from_result(self.http_result)))

    def test_update_eot_latency_alerts_clean(self):
        offset = 0.001
        updated_result = LatencyUtils.update_eot_latency_alerts(self.frames_result, offset)

        # Check for alert keys in updated_resutl
        self.assertTrue('timing_accuracy' in updated_result)
        self.assertTrue('has_time_sync_alert' in updated_result)
        self.assertEqual(updated_result['timing_accuracy'], offset)
        self.assertFalse(updated_result['has_time_sync_alert'])

        # Check the updated latency resutls and check for latency alert keys
        latency_cells = LatencyUtils._get_latency_cells_from_result(updated_result)
        for cell in latency_cells:
            self.assertTrue('has_accuracy_alert' in cell)
            self.assertFalse(cell['has_accuracy_alert'])
            self.assertTrue('accuracy_message' in cell)
            self.assertIsNone(cell['accuracy_message'])

    def test_update_eot_latency_alerts_dirty(self):
        offset = 1.0
        updated_result = LatencyUtils.update_eot_latency_alerts(self.frames_result, offset)

        # Check for alert keys in updated_resutl
        self.assertTrue('timing_accuracy' in updated_result)
        self.assertTrue('has_time_sync_alert' in updated_result)
        self.assertEqual(updated_result['timing_accuracy'], offset)
        self.assertTrue(updated_result['has_time_sync_alert'])

        # Check the updated latency resutls and check for latency alert keys
        latency_cells = LatencyUtils._get_latency_cells_from_result(updated_result)
        for cell in latency_cells:
            self.assertTrue('has_accuracy_alert' in cell)
            self.assertTrue(cell['has_accuracy_alert'])
            self.assertTrue('accuracy_message' in cell)
            self.assertIsNotNone(cell['accuracy_message'])
            print cell['accuracy_message']

if __name__ == "__main__":
    unittest.main()
