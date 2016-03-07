import sys
import cPickle
import itertools
import transaction

from json import loads, dumps
from datetime import datetime

from ixiacr.models import *
from ixiacr import models as ixiacr_models
from ixiacr.lib.engines import models as engine_models
from ixiacr.lib import IxiaLogger
from ixiacr.lib.utils import admin_helper

ixiacrlogger = IxiaLogger(__name__)

DEFAULT_PLAYER_TYPE = 'unicast'


class ConfigFactory(object):
    """
    Simple factory object for retreiving TestCaseConfig objects
    """

    def __init__(self):
        self.id = id(self)
        ixiacrlogger.debug('Instantiating ConfigFactory object (id=%d)'
                         % self.id)

    def get_config(self, config_json, user_id):
        config = TestCaseConfig(config_json, user_id)
        ixiacrlogger.debug('ConfigFactory (%d) created new TestCaseConfig'
                         % self.id)
        return config


class TestCaseConfig(object):
    """
    This object is the base of all test cases.  It's responsible for
    turning json data from the frontent into a lib.engines.model
    heirarchy suitable for the backend.
    """

    _config_json = None
    _config_object = None
    _test_id = None
    _build_number = None

    @property
    def _test_id(self):
        '''Test ID for the currently configured test.'''
        if not self._test_id:
            try:
                self._test_id = 1
            except:
                return -1
        return self._axon_test_id

    @_test_id.setter
    def _test_id(self, value):
        self._test_id = value

    @_test_id.deleter
    def _test_id(self):
        del self._test_id

    @property
    def config_json(self):
        return self._config_json

    def __init__(self, config_json, user_id):
        self._config_json = config_json
        self.user_id = user_id

        try:
            if 'name' in config_json:
                self.name = config_json['name']
            if 'id' in config_json:
                self.id = config_json['id']
            if 'user_id' in config_json:
                self.user_id = config_json['user_id']
            if 'description' in config_json:
                self.description = config_json['description']
            else:
                self.description = 'Unknown Test'

            self.playlist_ids = config_json['playlist_ids']
            self.recommended_track_ids = config_json['recommended_track_ids']
            self.datapoint_ids = config_json['datapoint_ids']
            self.categories = config_json['categories']
            self.tags = config_json['tags']
            self.traffic_players = []
            self.devices = []
            self.locations = []
            self.playlists = []
            self.test = None
            self.result_id = None
            self.test_started = None
            self.test_second = 0
            self.last_complete_update = datetime.now()
            self.result_map = {}

            if 'is_dirty' in config_json:
                self.is_dirty = True
            else:
                self.is_dirty = False
        except Exception, e:
            ixiacrlogger.exception('Excepted: ixiacr.testcases.config.ConfigFactory.__init__: %s' % e)

    def make_result(self, is_existing=False):
        '''Make a result object to pass to the test engine. Should only
        be called when the test is about to actually run.

        '''
        try:
            pass
        except Exception, e:
            ixiacrlogger.exception('Exception: make_result: %s' % e)
            return None

    def make_test(self):
        '''Create a test object suitable for the test model API and task
        engine.
        '''
        try:
            return None
        except Exception, e:
            ixiacrlogger.exception("Exception: make_test: %s" % e)
            raise
