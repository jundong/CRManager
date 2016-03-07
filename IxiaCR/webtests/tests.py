import unittest2 as unittest
import json
import time
from ixiacr.lib import IxiaLogger
import os
import urllib2

log = IxiaLogger(__name__)


def _login(ixiacrapp):
    return ixiacrapp.post('/login', {'username': 'admin', 'password': 'admin'})


def _logout(ixiacrapp):
    return ixiacrapp.post('/logout')


class FunctionalTestsBase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from pyramid.paster import get_app
        from webtest import TestApp
        app = get_app(os.path.join(os.getenv('IXIACR'), 'development.ini'))
        cls.ixiacrapp = TestApp(app, extra_environ=dict(REMOTE_USER='admin'))
        _login(cls.ixiacrapp)

    @classmethod
    def tearDownClass(cls):
        _logout(cls.ixiacrapp)


class NavigationTest(FunctionalTestsBase):
    def test_root(self):
        """
        Test login redirect for guest user.
        """
        _logout(self.ixiacrapp)
        res = self.ixiacrapp.get('/')
        self.assertTrue('303' in res.status)
        self.assertTrue('login' in res.location)

    def test_login(self):
        """
        Test the ability for a user to login to the system.
        """
        _logout(self.ixiacrapp)
        res = _login(self.ixiacrapp)
        self.assertFalse('Please check your login '
                         'credentials and try again.' in res.body,
                         'login failed')
        self.assertTrue('302' in res.status)
        _logout(self.ixiacrapp)

    def test_logout(self):
        """
        Test the ability for a user to logout of the system.
        """
        res = _logout(self.ixiacrapp)
        self.assertTrue('303' in res.status)
        self.assertTrue('login' in res.location)


class JSONTest(FunctionalTestsBase):
    """
    Test the JSON views and CRUD functionality for the application.
    """
    def test_get_ixiacr_tests(self):
        res = self.ixiacrapp.get('/spirent/get_ixiacr_tests.json')
        self.assertTrue('200' in res.status)

    def test_get_users(self):
        res = self.ixiacrapp.get('/spirent/get_users.json')
        self.assertTrue('200' in res.status)

    def test_get_global_settings(self):
        res = self.ixiacrapp.get('/spirent/get_global_settings.json')
        self.assertTrue('hostname' in res.json)


class WebAxonTestRunTest(FunctionalTestsBase):
    def test_run_test(self):
        def get_result_series(tid):
            _res = self.ixiacrapp.get('/spirent/get_result_series/'+tid+'/1')
            self.assertTrue('lastUpdated' in _res.json)
            return _res.json

        def get_istestready():
            _res = self.ixiacrapp.get('/spirent/get_istestready')
            self.assertTrue(_res.json['is_valid'])
            return _res.json

    def test_z_cancel_test(self):
        res = self.ixiacrapp.post('/spirent/cancel_test')
        self.assertTrue(res.json['result'] == 'SUCCESS')


class AdminTest(FunctionalTestsBase):
    """
    Test the various admin section's functionality.
    """
    def test_save_global_settings(self):
        pass

    def test_verify_password(self):
        pass

    def test_set_admin_password(self):
        pass

    def test_get_updates(self):
        pass

    def test_get_axon_logs(self):
        pass

