import time
from datetime import datetime
from pyramid.i18n import TranslationStringFactory
import transaction
from pyramid_handlers import action
from celery.result import AsyncResult
from celery.contrib.abortable import AbortableAsyncResult

from ixiacr.handlers import base
from ixiacr.lib import IxiaLogger
from ixiacr.lib.bps.bpsTest import aTestBpt

from ixiacr.lib.session_key_value import SessionKeyValueStore
from ixiacr.lib import component_registry
from ixiacr.models import *

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
    sessions = {}

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

    def updateTestResults(self, test_result_id, **kwargs):
        if test_result_id:
            tcr = TestResult.query.filter_by(id=test_result_id).first()
            if tcr:
                for key, value in kwargs.items():
                    if key == 'result_path':
                        tcr.result_path = value
                    elif key == 'end_result':
                        tcr.end_result = value
                    elif key == 'run_id':
                        tcr.run_id = value
                    elif key == 'progress':
                        tcr.progress = value

                db.add(tcr)
                transaction.commit()

    @action(renderer='json')
    def run_test(self):
        '''
        Call BPS RestfulApi to run test
        '''
        messages = list()
        result_id = None
        success = True
        start_date = datetime.now()
        try:
            data = self.request.json_body
            tcr = TestResult(created_by=1,
                test_id=data['id'],
                progress=0,
                created=start_date,
                end_result='RUNNING')
            db.add(tcr)
            transaction.commit()

            tcr = TestResult.query.filter_by(created=start_date).first()
            if tcr:
                result_id = tcr.id

            bpsFiles = data['bpt_name'].split(',')
            bpsTest = aTestBpt(data['host'], data['username'], data['password'], '0', '0,1', '12', forceful='true', test_id=data['id'], created_by=1, test_result_id=result_id)
            self.sessions.update({data['id']: bpsTest})
            bpsTest.runURTest(bpsFiles[0])

        except Exception, e:
            success = False
            msg = ('run_test: ixiacr_test_id={0}; e={1}'
                   .format(data['id'], str(e)))
            ixiacrlogger.exception(msg)

            self.updateTestResults(result_id, end_result='ERROR', error_reason=str(e))

            msg_header, msg_content = str(e)

            messages.append({
                'header': self.localizer.translate(_(msg_header)),
                'content': self.localizer.translate(_(msg_content)),
                'is_error': True})
        finally:
            if success:
                self.updateTestResults(result_id, end_result='FINISHED')
            else:
                self.updateTestResults(result_id, end_result='ERROR')

            return {'is_ready': True,
                    'is_valid': success,
                    'items': [],
                    'test_result_id': result_id,
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
        success = True
        try:
            ixiacrlogger.debug('cancel_test: self.session = %s' % self.session)
            data = self.request.json_body
            test_id = data['id']
            test_result_id = data['test_result_id']

            bpsTest = self.sessions.pop(test_id)
            bpsTest.stopTest()

            self.updateTestResults(test_result_id, end_result='STOPPED')

        except KeyError as e:
            success = False
            self.updateTestResults(test_result_id, end_result='ERROR', error_reason=str(e))

            ixiacrlogger.exception('%s' % e)
            return self.success()
        except Exception as e:
            success = False
            self.updateTestResults(test_result_id, end_result='ERROR', error_reason=str(e))

            ixiacrlogger.exception('%s' % e)
            return self.fail()
        finally:
            if success:
                self.updateTestResults(test_result_id, end_result='STOPPED')
            else:
                self.updateTestResults(test_result_id, end_result='ERROR')

    @action(renderer='json')
    def download_reports(self):
        '''Cancel the test.  Will abort a currently running test task

        '''
        try:
            pass
            # size = os.path.getsize(Path + dFile)
            # response = Response(content_type='application/force-download', content_disposition='attachment; filename=' + dFile)
            # response.app_iter = open(Path + dFile, 'rb')
            # response.content_length = size
        except Exception as e:
            pass
        finally:
            pass


def is_test_running():
    """ Determine if a test is currently running by looking at the relevent tasks.
    """
    pass
