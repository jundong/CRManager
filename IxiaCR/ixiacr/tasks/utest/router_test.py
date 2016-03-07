#!/local/pythonenv/bin/python
from ixiacr.tasks.router import IxiaTaskRouter

import unittest2 as unittest


class TestSequenceFunctions(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.router = IxiaTaskRouter()

    def test_sanity(self):
        self.assertIsNotNone(self.router)

    def test_default_routing(self):
        tasks = ['bogus']

        route = {'queue': 'ixiacr',
                 'routing_key': 'ixiacr'}

        for task in tasks:
            self.assertEqual(self.router.route_for_task(task),
                             route)

    def test_test_routing(self):
        tasks = ['create',
                 'validate',
                 'execute',
                 'destroy']

        route = {'queue': 'ixiacr',
                 'routing_key': 'engine.ixiacr'}

        for task in tasks:
            self.assertEqual(self.router.route_for_task(task),
                             route)
            self.assertEqual(self.router.route_for_task(
                'ixiacr.tasks.test.%s' % task),
                route)


if __name__ == "__main__":
    unittest.main()
