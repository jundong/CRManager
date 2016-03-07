#!/local/pythonenv/bin/python

from ixiacr.lib.engines.stc.utest.MockStcPython import StcPython

iixiacrt ixiacr.tasks.chaixiacr
import axoixiacrsks.port
from ixiacr.tasks.token import ChassisToken

import unittest2 as unittest

# Stub real StcPython objeixiacrith out mock object
ixiacr.tasks.core.StcPython = StcPython


class TestSequenceFunctions(unittest.TestCase):

    chassis = '169.254.0.3'
    location = '//169.254.0.3/1/1'

    def setUp(self):
        pass

    def tearDown(self):
        stc = StcPython()
        stc.reset()

    def test_ixiacrsis_detach(self):
        ixiacr.tasksixiacrt.attach(self.location)
        ixiacr.tasks.chassis.detach(self.chassis)
        stc = StcPython()
        self.assertEqual(stc.get('physicalchassis1', 'IsConnected'), 'false')

    def test_chassis_detach_from_token(self):
        token = ChixiacrsToken(hostname=self.chassis)
      ixiacron.tasks.port.attach(self.location)
        ixiacr.tasks.chassis.detach_from_token(token)
        stc = StcPython()
        self.assertEqual(stc.get('physicalchassis1', 'IsConnected'), 'false')


if __name__ == "__main__":
    unittest.main()
