import transaction

from ixiacr.lib import IxiaLogger
from ixiacr.lib.utils import enum
from ixiacr.lib.engines.models import BaseTest
from ixiacr.lib.engines.results import ResultPacket

log = IxiaLogger(__name__)

TEST_TYPE = enum("BPS", "ATIP")


# Internal?
class EngineTestModel(BaseTest):
    actionlist = []
    test_results = None
    config = None

    def __init__(self, **kwargs):
        super(EngineTestModel, self).__init__(**kwargs)


class IxiaCRTestCase(object):
    _name = None
    _test = None
    _map_table = None
    _result_map = None
    _results = None
    test_type = None
    test_model = None
    db = None

    # Set the mandatory and defaults.
    def __init__(self, config_json, test_results, **kwargs):
        self.config_json = config_json
        self.test_results = test_results

        for k, v in kwargs.items():
            setattr(self, k, v)

    @property
    def test(self):
        '''Engine Test Model - The test itself.
        '''
        return self._test

    @property
    def factory_data_model(self):
        '''
        Factory Result is the db table that holds the results for a
        given type of test. e.g. BPS, ATIP etc.

        '''
        return self.test_type

    @property
    def name(self):
        return self._name \
            if self._name is not None else 'Unknown'

    @property
    def description(self):
        return self._description \
            if self._description is not None else 'Unknown'

    @property
    def author(self):
        return self._author \
            if self._author is not None else 'Unknown'

    @property
    def author_email(self):
        return self._author_email \
            if self._author_email is not None else 'Unknown'

    @property
    def build_number(self):
        return self._build_number \
            if self._build_number is not None else 'Unknown'

    @property
    def duration(self):
        raise NotImplementedError(
            'Your test must return a duration for the UI in seconds')

    def get_user_data_model(self):
        return self._user_data_model

    def set_user_data_model(self, value):
        self._user_data_model = value

    def del_user_data_model(self):
        del self._user_data_model

    user_data_model = property(
        get_user_data_model,
        set_user_data_model,
        del_user_data_model,
        ("Test DB Model - If defined, I am the test data "
         "structure the test results will be stored when "
         "the test runs."))

    def get_results(self):
        return self._results

    def set_results(self, value):
        self._results = value

    def del_results(self):
        del self._results

    test_results = property(get_results,
                            set_results,
                            del_results,
                            "Results - I am the Results for the test.")

    @classmethod
    def process_result(cls, config, results, result_id, db):
        if cls.process_result_transactionless(config, results, result_id, db):
            transaction.commit()
        else:
            transaction.abort()

        return

    @classmethod
    def process_result_transactionless(cls, config, results, result_id, db):
        try:
            resulttype = results.get('resulttype', None)
            if resulttype == ResultPacket.ResultType.TestStart:
                config.test.process_test_start(config, results, result_id, db)
            elif resulttype == ResultPacket.ResultType.TestStop:
                config.test.process_test_stop(config, results, result_id, db)
            elif resulttype in ResultPacket.ResultType.reverse_mapping:
                pass  # it's a result type we don't care about
            else:
                log.warn('process_result: unexpected resulttype={0}'.
                         format(resulttype))

            return True

        except Exception, e:
            log.exception(
                'Exception in ixiacr.testcases.base.process_result: {0}'.
                format(e))
            return False

    @classmethod
    def preprocess_hook(cls, results):
        '''
        Override this method to have your data processed prior to calling
        the insert_data method on your db model.
        '''
        return results

    @classmethod
    def postprocess_hook(cls, fail=False):
        '''
        Override this method to have your data processed prior to calling
        the insert_data method on your db model.

        '''
        return fail

    @classmethod
    def process_factory_result(cls,
                               factory_data_model,
                               result_id,
                               results,
                               db,
                               user_data_model=None):
        '''Mandatory for every test case...

        '''
        assert factory_data_model is not None, (
            'No test type given in test case.')

        # Needs to have current result db session attached...
        if not factory_data_model.insert_result(
                result_id, results, db):
            raise Exception("Failed in process_factory_result.")

        if user_data_model:
            if not hasattr(user_data_model, 'insert_result'):
                raise NotImplementedError("You need to implement an "
                                          "insert_result method in your "
                                          "data model.  Please read the API "
                                          "documentation for details.")

            return cls.process_user_result(factory_data_model,
                                           result_id, results, db,
                                           user_data_model=None)

        return True

    @classmethod
    def process_user_result(cls, factory_data_model, track_id, result_id,
                            tpr_id, results, db, user_data_model=None):
        '''Called when there is a user test db model defined.

        '''
        return True

    def process_test_start(self, config, results, result_id, db):
        """ Called at the start of a test """
        pass

    def process_test_stop(self, config, results, result_id, db):
        """ Called at the end of a test """
        pass

    def validate(self, config_json):
        """
        AxonTestCase implementation can use this to perform validation
        of configuration, before the test model is created.
        :returns: None otherwise raises Exception with validation error
        """
        pass

    def configure_test(self, test, config_json):
        """
        Override this method if you need to set toplevel test attributes in
        your test
        """
        pass

    def add_actions(self, test, config_json):
        raise NotImplementedError(
            'Please implement this method to add actionlists for '
            'your test model')
