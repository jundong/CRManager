import unittest
import transaction

from pyramid import testing

from cyberrange.models.core import DBSession

class TestViews(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()

    def test_home(self):
        from cyberrange.views.views import home

        request = testing.DummyRequest()
        response = home(request)
        self.assertEqual('Home View', response['home'])

    def test_sample(self):
        from cyberrange.views.views import sample

        request = testing.DummyRequest()
        response = sample(request)
        self.assertEqual('Cyber Range', response['project'])


# class TestViewFunctions(unittest.TestCase):
#     def setUp(self):
#         from cyberrange import main
#         config = {'__file__': '/home/judo/workspace/github/CRManager/CyberRange/development.ini', 'here': '/home/judo/workspace/github/CRManager/CyberRange'}
#         setting = {'pyramid.includes': '\npyramid_debugtoolbar\npyramid_tm', 'sqlalchemy.url': 'sqlite:////home/judo/workspace/github/CRManager/CyberRange/CyberRange.sqlite', 'pyramid.debug_authorization': 'false', 'pyramid.default_locale_name': 'en', 'pyramid.reload_templates': 'true', 'pyramid.debug_notfound': 'false', 'pyramid.debug_routematch': 'false'}
#         app = main(setting)
#         from webtest import TestApp
#
#         self.testapp = TestApp(app)
#
#     def test_home(self):
#         res = self.testapp.get('/', status=200)
#         self.assertIn(b'<h1>Hi Home View', res.body)
#
#     def test_sample(self):
#         res = self.testapp.get('/', status=200)
#         self.assertIn(b'<h1>Hi Home View', res.body)


class TestMyView(unittest.TestCase):
    def setUp(self):
        self.config = testing.setUp()
        from sqlalchemy import create_engine
        self.engine = create_engine('sqlite://')
        DBSession.configure(bind=self.engine)

    def tearDown(self):
        DBSession.remove()
        testing.tearDown()

    def test_passing_view(self):
        from cyberrange.models.models import (
            Base,
            MyModel,
            )
        Base.metadata.create_all(self.engine)
        with transaction.manager:
            model = MyModel(name='one', value=55)
            DBSession.add(model)

        from cyberrange.views.views import my_view
        request = testing.DummyRequest()
        info = my_view(request)
        self.assertEqual(info['one'].name, 'one')
        self.assertEqual(info['project'], 'CyberRange')

    def test_failing_view(self):
        from cyberrange.views.views import my_view
        request = testing.DummyRequest()
        info = my_view(request)
        self.assertEqual(info.status_int, 500)

