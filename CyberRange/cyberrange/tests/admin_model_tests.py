import unittest
import transaction

from pyramid import testing

from cyberrange.models.core import (DBSession, Base)
from cyberrange.models.admin import (User, Group)

class AdminModelTest(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        from sqlalchemy import create_engine
        self.engine = create_engine('sqlite://')
        DBSession.configure(bind=self.engine)

    def tearDown(self):
        DBSession.remove()
        testing.tearDown()

    def test_by_username(self):
        Base.metadata.create_all(self.engine)
        with transaction.manager:
            user = User.by_username('admin')
            self.assertEqual(user.name, 'admin')
            self.assertEqual(user.password, 'admin')