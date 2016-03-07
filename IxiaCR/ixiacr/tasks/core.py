from __future__ import absolute_import

from ixiacr.tasks import token
from ixiacr.lib import IxiaLogger
from ixiacr.lib.engines import results

from celery import current_task, Task
from celery.contrib.abortable import AbortableTask, AbortableAsyncResult

ixiacrlogger = IxiaLogger(__name__)

def _(msg):
    '''
    Stub for translation method - ensures strings are extracted
    '''
    return msg


class IxiaTask(Task):
    abstract = True
    _log = None

    def __del__(self):
        pass

    def initialize(self):
        pass

    @property
    def log(self):
        if self._log is None:
            self._log = IxiaLogger(__name__)
        return self._log

    def on_success(self, retval, task_id, args, kwargs):
        # Always apply after successful calls... Not sure if this helps, but
        # definitely shouldn't hurt
        self.do_bll_apply('on_success [task_id = %s]' % task_id)

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        pass

    def update_state(self, task_id=None, state=None, meta=None):
        """
        Update task state.
        The celery version of this function doesn't always work, so fix it
        :keyword task_id: Id of the task to update, defaults to the
                          id of the current task
        :keyword state: New state (string)
        :keyword meta: State metadata (dict)
        """
        if task_id is None:
            task_id = current_task.request.id
        self.backend.store_result(task_id, meta, state)

    def update_state_message(self, message=None, format_kwargs=None,
                             state=None):
        if state is None:
            state = 'RUNNING'  # non standard celery state

        if isinstance(format_kwargs, dict):
            msg = message.format(**format_kwargs)
        else:
            msg = message

        request = current_task.request
        if hasattr(request, 'task'):
            task = getattr(request, 'task')
        else:
            task = 'Unknown task'

        self.log.info('{0}: {1} (state = {2})'.format(task, msg, state))

        meta = {'message': message}
        if format_kwargs:
            meta.update({'format_kwargs': format_kwargs})

        self.update_state(state=state, meta=meta)


class IxiaTestTask(IxiaTask):
    abstract = True
    _result_writer = None

    @property
    def ResultWriter(self):
        if self._result_writer is None:
            self._result_writer = results.ResultWriter()
        return self._result_writer

    def on_failure(self, exc, task_id, args, kwargs):
        pass


class IxiaAbortableTestTask(IxiaTestTask, AbortableTask):
    abstract = True

    # This is needed to work around a bug in our version of Celery that does
    # not pass the task_name parameter.
    @classmethod
    def AsyncResult(cls, task_id):
        """Returns the accompanying AbortableAsyncResult instance."""
        return AbortableAsyncResult(task_id, backend=cls.backend,
                                    task_name=cls.name)

    def on_failure(self, exc, task_id, args, kwargs):
        try:
            pass
        except:
            pass

        finally:
            super(IxiaAbortableTestTask, self).on_failure(
                exc, task_id, args, kwargs)


class IxiaDestroy(IxiaAbortableTestTask):
    abstract = True

    def on_success(self, retval, task_id, args, kwargs):
        super(IxiaDestroy, self).on_success(retval, task_id, args, kwargs)


class IxiaCreateTestTask(IxiaTestTask):
    abstract = True
    ENFORCE_SFPGA_TX_LIMIT = False
    SFPGA_HIGH_SPEED_THRESHOLD = 1000  # Set the threshold for toggling config
                                       # options to maximize performance on
                                       # SFPGA platforms (Mbps)
    MAXIMUM_DHCP_CLIENTS_PER_PORT = 512 # Set the maximum DHCP clients per port

    def validate(self, test):
        # Make sure we actually have a test
        assert test is not None, 'Missing test object'
        pass

    def setup(self, test):
        '''Perform any necessary prep work to run test on real hardware'''
        pass

    def create(self, test, save_as=None, offline=None, drop_results=None):
        '''Convert lib.engine.model test object into BLL configuration'''
        self.validate(test)

        testtoken = token.TestToken(test=test)
        if drop_results:
            testtoken.drop_results = True

        # Perform any chassis hardware setup if we're running with
        # real hardware
        if not offline:
            self.setup(test)

        # Finished!
        return testtoken
