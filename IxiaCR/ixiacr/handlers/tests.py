import cPickle
import time

from json import loads, dumps

from pyramid.i18n import TranslationStringFactory
import transaction
from pyramid_handlers import action
from celery.result import AsyncResult
from celery.contrib.abortable import AbortableAsyncResult

from ixiacr.handlers import base
from ixiacr.models.core import (TestCases, TestResult)
from ixiacr.lib import IxiaLogger
from ixiacr.lib.bps.bpsTest import aTestBpt

from ixiacr.tasks.utils import get_task_from_chain
from ixiacr.lib.session_key_value import SessionKeyValueStore
from ixiacr.models import db
from ixiacr.lib import component_registry

ixiacrlogger = IxiaLogger(__name__)

_ = TranslationStringFactory('messages')


def view_includes(config):
    config.add_handler('config_test', '/ixia/config_test',
                       'ixiacr.handlers.tests:IxiaTestHandler',
                       action='config_test')
    config.add_handler('run_test', '/ixia/run_test',
                       'ixiacr.handlers.tests:IxiaTestHandler',
                       action='run_test')
    config.add_handler('get_istestready', '/ixia/get_istestready',
                       'ixiacr.handlers.tests:IxiaTestHandler',
                       action='get_istestready')
    config.add_handler('cancel_test', '/ixia/cancel_test',
                       'ixiacr.handlers.tests:IxiaTestHandler',
                       action='cancel_test')
    config.add_handler('debug', '/ixia/debug',
                       'ixiacr.handlers.tests:IxiaTestHandler',
                       action='debug')


def check_result_chain(result):
    '''Check a celery result chain.  Return true if all results succeed.
    Return false if tasks are still running.  Throw exception if any tasks
    fail.

    '''
    resultCount = 0
    successCount = 0

    curResult = result
    while curResult is not None:
        resultCount += 1

        if curResult.ready():
            # Check for failure
            if curResult.status in ['FAILURE', 'REVOKED']:
                if isinstance(curResult.result, Exception):
                    # Pass on existing exception
                    raise curResult.result
                else:
                    # Raise a new one
                    raise RuntimeError(curResult.result)
            elif curResult.status == 'SUCCESS':
                successCount += 1

        # Get next result in the chain
        curResult = curResult.parent

    if resultCount == successCount:
        return True
    else:
        return False


def get_tasks_from_results(result):
    """
    Given a result chain, generate an ordered list of tasks
    """
    tasks = list()
    while result:
        tasks.append({'id': result.id,
                      'backend': result.backend,
                      'task_name': result.task_name,
                      'app': result.app,
                      'parent': result.parent})
        result = result.parent
    return list(reversed(tasks))  # return a list, not an iterator


def get_results_from_tasks(tasks):
    """
    Generate a result chain from a list of tasks.  The tasks should be
    in order, e.g. parent --> child --> grandchild, etc.
    """
    result = None
    for task in tasks:
        result = AsyncResult(**task)
    return result


def is_valid_config(user_id, config, errors, session):
    """ Determine if a test config passes test validation. Blocks while waiting for task to complete.
    """
    try:
        config.save_ixiacr_test(user_id)

        ixiacrlogger.debug('Creating test validation chain; for temporary ixiacr_test_id={0}'.format(
            config.ixiacr_test_id))
        test = config.make_test()
    except Exception, e:
        ixiacrlogger.exception('Exception: is_valid_config: {0}'.format(str(e)))
        errors.append(str(e))
        return False

    return True

class IxiaTestHandler(base.Handler):
    '''The main handler for the testing. This will be broken off into a more
    modular test-specific package at some point.

    '''
    messages = []
    _config_factory = None

    @property
    def config_factory(self):
        if 'config_factory' not in self.session:
            self.session['config_factory'] = None
        return self.session['config_factory']

    @action(renderer='json')
    def save_ixiacr_test(self):
        '''Save a user UI configured test JSON object.

        '''
        try:
            data = self.request.json_body

            config = self.config_factory.get_config(data, self.user_id)
            config.save_ixiacr_test(self.user_id)
            self.session['ixiacr_test_id'] = config.ixiacr_test_id

            messages = [{
                'is_error': False,
                'header': 'User Test Saved',
                'content': self.localizer.translate(_(
                    'Successfully saved Test: ${name}.'), mapping={'name': config.name})
            }]

            return self.success(messages)
        except KeyError, e:
            transaction.abort()
            self.messages.append(dict({'header': 'Failed', 'content': str(e)}))
            return self.fail(self.messages)

        except Exception, e:
            transaction.abort()
            self.messages.append(dict({'header': 'Failed', 'content': str(e)}))
            return self.fail(self.messages)

    @action(renderer='json')
    def config_test(self):
        '''Set the data for the current test.

        '''
        ixiacrlogger.debug('Entering: config_test')
        try:
            return True

        except Exception, e:
            ixiacrlogger.exception('Exception in config_test: {0}'.format(e))
            self.messages.append({'header': 'Failed', 'content': str(e)})
            return self.fail(self.messages)
        finally:
            ixiacrlogger.debug('Exiting: config_test')

    @action(renderer='json')
    def run_test(self):
        '''
        Call BPS RestfulApi to run test
        '''
        ixiacr_test_id = None
        messages = list()

        try:
            data = self.request.json_body
            aTestBpt.runURTest()

        except Exception, e:
            msg = ('run_test: ixiacr_test_id={0}; e={1}'
                   .format(ixiacr_test_id, str(e)))
            ixiacrlogger.exception(msg)

            msg_header, msg_content = str(e)

            messages.append({
                'header': self.localizer.translate(_(msg_header)),
                'content': self.localizer.translate(_(msg_content)),
                'is_error': True})
        finally:
            return {'is_ready': True,
                    'is_valid': True,
                    'items': [],
                    'messages': messages}

    @action(renderer='json')
    def check_for_conflicts_with_upcoming(self):
        """ Check local and remotes for conflict
        """
        schedule_manager = component_registry.lookup_component(
                'schedule_manager')

        data = self.request.json_body
        duration = data['duration']

        return self.run_test()

    @action(renderer='json')
    def get_istestready(self):
        '''
        Check the test task chain for it's current status, wrap it in a
        json blob, and return it.
        Do this until the task chain gets to the 'execute' task, at which
        point the test 'is ready'...
        '''
        messages = list()
        is_ready = is_valid = False
        result = None

        def get_header(result):
            header_by_task = {
                'ixiacr.tasks.reservations.create': 'Reserving Test Resources',
                'ixiacr.tasks.test.create': 'Creating Test Configuration',
                'ixiacr.tasks.test.validate': 'Validating Test Configuration'}

            task_name = result.task_name
            if task_name in header_by_task:
                return self.localizer.translate(_(header_by_task[task_name]))

            return '{0} needs a header'.format(task_name)

        def get_content(result):
            state = result.result
            if isinstance(state, dict) and 'message' in state:
                raw_msg = self.localizer.translate(_(state['message']))
                if 'format_kwargs' in state:
                    msg = raw_msg.format(**state['format_kwargs'])
                else:
                    msg = raw_msg
            else:
                msg = str()
            return msg

        def prognosticate_test_success(sct):
            # XXX: This info is pulled back out of the database in
            # ixiacr.views.ixiacr_json.request_final_table at the end
            # of the test.
            try:
                pass
            except:
                raise

        try:
            kv_store = SessionKeyValueStore(db, self.session._session().id)
            validate_task_ids = kv_store.get_value('validate_task_ids')

            if validate_task_ids is not None:
                is_valid = True
                messages.append({
                    'header': '',
                    'content': '',
                    'is_error': False})
            else:
                is_valid = True
                is_ready = False
                header = self.localizer.translate(_('Missing'))
                content = self.localizer.translate(
                    _('No test currently configured'))

                ixiacrlogger.error('get_istestready: {0}'.format(content))

                messages.append({
                    'header': header,
                    'content': content,
                    'is_error': True})

        # Lots of possible exceptions here, and like Pokemon
        # we gotta catch 'em all!
        except Exception, e:
            ixiacrlogger.exception('get_istestready: {0}'.format(e))
            messages.append({
                'header': 'Failed',
                'content': str(e),
                'is_error': True
            })

        finally:
            try:
                pass
            except:
                pass  # ignore errors here
            finally:
                return {'is_ready': is_ready,
                        'is_valid': is_valid,
                        'task_id': result.task_id if result else None,
                        'messages': messages}

    @action(renderer='json')
    def cancel_test(self):
        '''Cancel the test.  Will abort a currently running test task

        '''
        try:
            ixiacrlogger.debug('cancel_test: self.session = %s' % self.session)

            kv_store = SessionKeyValueStore(db, self.session._session().id)
            test_task_id = kv_store.get_value('test_task_id')

            if test_task_id is not None:
                result = AbortableAsyncResult(test_task_id)

                if not result:
                    raise RuntimeError('No task to abort!')

                # If the test is currently executing, notify it that it should abort, and
                # wait for confirmation that it has aborted
                wait_count = 30
                while result.status == 'EXECUTING' and wait_count > 0:
                    ixiacrlogger.debug('cancel_test: aborting task %s' % result.id)
                    result.abort()
                    wait_count -= 1
                    time.sleep(1)

                # Wait for the test to react...
                while result.status == 'ABORTED' and wait_count > 0:
                    ixiacrlogger.debug('cancel_test: task %s is aborting...' %
                                     result.id)
                    wait_count -= 1
                    time.sleep(1)

                # Wait for the task engine to cleanly stop
                while result.status == 'STOPPING' and wait_count > 0:
                    ixiacrlogger.debug('IxiaMainHandler.cancel_test: '
                                     'task %s is stopping...' % result.id)
                    wait_count -= 1
                    time.sleep(1)

                # We've either exhausted our wait or successfully aborted.
                # Let the caller know.
                if result.status == 'SUCCESS':
                    ixiacrlogger.debug('cancel_test: task %s has completed' %
                                     result.id)
                    return self.success()
                else:
                    ixiacrlogger.error('cancel_test: unable to abort task %s' %
                                     result.id)
                    return self.fail()

            else:
                raise RuntimeError('missing \'test_task_id\' in session data')

        except KeyError as e:
            ixiacrlogger.exception('%s' % e)
            return self.success()
        except Exception as e:
            ixiacrlogger.exception('%s' % e)
            return self.fail()
        finally:
            pass


def is_test_running():
    """ Determine if a test is currently running by looking at the relevent tasks.
    """
    from ixiacr.tasks.utils import is_any_task_running
    return is_any_task_running(['bps.test'], [
        'ixiacr.tasks.test.create',
        'ixiacr.tasks.test.validate',
        'ixiacr.tasks.test.execute'
    ])


def run_test(ixiacr_test_id):
    try:
        ixiacrlogger.debug('run_test: creating ConfigFactory')
        config_factory = None

        ixiacrlogger.debug('run_test: loading IxiaTest; ixiacr_test_id={0}'.format(ixiacr_test_id))
        ixiacr_test = TestCases.query.filter_by(id=ixiacr_test_id).one()

        ixiacrlogger.debug('run_test: ixiacr_test_id={0} loaded; getting config'.format(ixiacr_test_id))
        test_case_config = config_factory.get_config(
            loads(ixiacr_test.config_json),
            ixiacr_test.created_by)
        test_case_config.ixiacr_test_id = ixiacr_test_id
        test_case_config.config_json['id'] = ixiacr_test_id

        if is_test_running():
            test_case_config.make_result()
            raise Exception(_('Test already running'))

        ixiacrlogger.debug('run_test: starting ixiacr_test_id={0} task chain'.format(ixiacr_test_id))
        result = None

        ixiacrlogger.debug('run_test: started ixiacr_test_id={0} task chain; task_id={1}'.format(
            ixiacr_test_id, result.task_id))

        test_result = get_task_from_chain(result, 'ixiacr.tasks.test.execute')

        while True:
            ixiacrlogger.debug('run_test: polling ixiacr_test_id={0} task chain; test task_id={1}'.format(
                ixiacr_test_id, test_result.task_id))

            time.sleep(5)
            if check_result_chain(test_result):
                ixiacrlogger.debug('run_test: ixiacr_test_id={0} task chain completed; test task_id={1}'.format(
                    ixiacr_test_id, test_result.task_id))
                break

    except Exception as e:
        ixiacrlogger.exception('run_test: exception handling ixiacr_test_id={0}'.format(ixiacr_test_id))

        try:
            test_result = TestResult.query.filter(TestResult.ixiacr_test_id == ixiacr_test_id).one()
            test_result.end_result = 'error'
            test_result.error_reason = str(e)
            transaction.commit()
        except Exception as dbe:
            ixiacrlogger.exception(dbe)
