#!/local/pythonenv/bin/python

import unittest2 as unittest

from ixiacr.lib.engines.results import (ResultCollection,
                                      GaugeResultCollectionStrategy,
                                      CounterResultCollectionStrategy)


class TestSequenceFunctions(unittest.TestCase):

    def test_null_strategy_creation(self):
        self.assertRaises(UnboundLocalError,
                          ResultCollection,
                          ('TestResult', None))

    def test_gauge_strategy_creation(self):
        rc = ResultCollection(name='TestResult',
                              strategy=GaugeResultCollectionStrategy)
        self.assertIsNotNone(rc)

    def test_gauge_strategy_add_and_get(self):
        rc = ResultCollection(name='TestResult',
                              strategy=GaugeResultCollectionStrategy)

        for i in range(100):
            self.assertTrue(rc.add(i))
            self.assertEqual(rc.get_last(), i)

    def test_gauge_strategy_add_and_get_interval(self):
        rc = ResultCollection(name='TestResult',
                              strategy=GaugeResultCollectionStrategy,
                              max_results=5)

        for i in range(5):
            self.assertTrue(rc.add(i))

        for i in range(5, 1, -1):
            self.assertEqual(rc.get_delta(i), i-1)

    def test_gauge_strategy_max_result_limit(self):
        rc = ResultCollection(name='TestResult',
                              strategy=GaugeResultCollectionStrategy,
                              max_results=2)

        self.assertTrue(rc.add(1))
        self.assertTrue(rc.add(2))

        delta = rc.get_delta(2)
        self.assertEqual(delta, 1)

        self.assertRaises(IndexError, rc.get_delta, 3)

    def test_counter_strategy_creation(self):
        rc = ResultCollection(name='TestResult',
                              strategy=CounterResultCollectionStrategy)
        self.assertIsNotNone(rc)

    def test_counter_strategy_add_and_get_increasing(self):
        rc = ResultCollection(name='TestResult',
                              strategy=CounterResultCollectionStrategy)

        for i in range(100):
            self.assertTrue(rc.add(i))
            self.assertEqual(rc.get_last(), i)

        # Add fails because 10 < 99
        self.assertFalse(rc.add(10))

    def test_counter_strategy_add_and_get_decreasing(self):
        rc = ResultCollection(name='TestResult',
                              strategy=CounterResultCollectionStrategy)

        for i in range(100, 1, -1):
            self.assertTrue(rc.add(i))
            self.assertEqual(rc.get_last(), i)

        # Add fails because 110 > 100
        self.assertFalse(rc.add(110))

    def test_counter_strategy_add_and_get_delta_increasing(self):
        rc = ResultCollection(name='TestResult',
                              strategy=CounterResultCollectionStrategy)

        for i in range(100, 1000, 100):
            self.assertTrue(rc.add(i))
            if i != 100:
                self.assertEqual(rc.get_delta(), 100)

    def test_counter_strategy_add_and_get_delta_decreasing(self):
        rc = ResultCollection(name='TestResult',
                              strategy=CounterResultCollectionStrategy)

        for i in range(1000, 100, -100):
            self.assertTrue(rc.add(i))
            if i != 1000:
                self.assertEqual(rc.get_delta(), -100)


if __name__ == "__main__":
    unittest.main()
