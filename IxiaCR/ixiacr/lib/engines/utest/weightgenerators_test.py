#!/local/pythonenv/bin/python
import ixiacr.lib.engines.utils as utils

import unittest2 as unittest

class TestSequenceFunctions(unittest.TestCase):

    def test_weighted_load_generator(self):
        testData = [(0.01, [7,4,1], [0.005833, 0.003333, 0.000833]),
                    (0.1, [7,4,1], [0.058333, 0.033333, 0.008333]),
                    (1, [7,4,1], [0.583333, 0.333333, 0.083333]),
                    (10, [7,4,1], [5.833333, 3.333333, 0.833333]),
                    (100, [7,4,1], [58.333333, 33.333333, 8.333333]),
                    (1000, [7,4,1], [583.333333, 333.333333, 83.333333]),
                    (10000, [7,4,1], [5833.333333, 3333.333333, 833.333333]),
                    (500, [1,1], [250.000000, 250.000000]),
                    (777, [1], [777.000000]),
                    (100, [1,1,2,3,5], [8.333333, 8.333333, 16.666666, 25.000000, 41.666666]),
                    (253, [1,1,2,3], [36.142857, 36.142857, 72.285714, 108.428571])]

        for (load, weights, target) in testData:
            results = [x for x in utils.WeightedLoadGenerator(weights, load)]
            for (a,b) in zip(target, results):
                self.assertAlmostEqual(a,b,3)


    def test_weighted_simplest_form_generator(self):
        # XXX: This doesn't work quite as well as the reverse direction...  Stupid floats.
        testData = [([1,1], [250.000000, 250.000000]),
                    ([1], [777.000000]),
                    ([1,1,2,3], [36.142857, 36.142857, 72.285714, 108.428571]),
                    ([1,1,2], [25.0, 25.0, 50.0])]

        for (weights, loads) in testData:
            results = [x for x in utils.WeightedSimplestFormGenerator(loads)]
            for (a,b) in zip(weights, results):
                self.assertAlmostEqual(a,b,3)


if __name__ == "__main__":
    unittest.main()
