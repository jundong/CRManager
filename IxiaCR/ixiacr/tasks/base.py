from __future__ import absolute_import
from ixiacr.lib import IxiaLogger
from ixiacr.lib.utils import admin_helper

from celery import Task

ixiacrlogger = IxiaLogger(__name__)


__all__ = ['DBTask',
           'SystemTask']


class DBTask(Task):
    abstract = True

    def after_return(self, *args, **kwargs):
        print('Test Task returned: %r' % (self.request, ))

    def on_success(self, *args, **kwargs):
        print('Success: %r' % (self.request, ))

    def on_failure(self, *args, **kwargs):
        print "Failed!"

    def on_retry(self, *args, **kwargs):
        print('Retry: %r' % (self.request, ))


class SystemTask(Task):
    abstract = True

    def _failure_message(self, out=None):
        return {"status":"complete",
                "messages":[{"is_error": True,
                             "header": "Failure",
                             "content": out or "Failed..."}]}

    def restart(self, *args, **kwargs):
        '''Reboot Entire Ixia System

        '''
        err_msg = None
        try:
            (result,obj,err_msg) = admin_helper('restart-system',{})

            return {"status":"running","messages":[{"is_error": False,
                                                    "header": "System reboot in progress",
                                                    "content": obj or err_msg}]}
        except:
            return self._failure_message(err_msg)

    def shutdown(self, *args, **kwargs):
        '''Shutdown Entire Ixia System

        '''
        err_msg = None
        try:
            (result,obj,err_msg) = admin_helper('shutdown-system',{})

            return {"status":"running","messages":[{"is_error": False,
                                                    "header": "System shutdown in progress",
                                                    "content": obj or err_msg}]}
        except:
            return self._failure_message(err_msg)

    def after_return(self, status, retval, task_id, args, kwargs, einfo):
        ixiacrlogger.debug('Test Task returned: %s' % (self.request, ))

    def on_success(self, *args, **kwargs):
        ixiacrlogger.debug('Success: %s' % (self.request, ))

    def on_failure(self, *args, **kwargs):
        ixiacrlogger.debug('Failure: %s' % (self.request, ))

    def on_retry(self, *args, **kwargs):
        ixiacrlogger.debug('Retry: %r' % (self.request, ))


##
# Route Handlers
##

class IxiaTaskRouteHandler(object):

    def can_route(self, task, args=None, kwargs=None):
        raise NotImplementedError()

    def get_route(self, task, args=None, kwargs=None):
        raise NotImplementedError()
