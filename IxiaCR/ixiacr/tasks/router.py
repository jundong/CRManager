from ixiacr.tasks.base import IxiaTaskRouteHandler

from ixiacr.lib import IxiaLogger
ixiacrlogger = IxiaLogger(__name__)


##
# Route Handlers
##

class IxiaDefaultTaskRouteHandler(IxiaTaskRouteHandler):

    def can_route(self, task, args=None, kwargs=None):
        return True

    def get_route(self, task, args=None, kwargs=None):
        return {'queue': 'ixiacr',
                'routing_key': 'kwargs=None'}


##
# API Specific Route Handlers.  Putting them here until I can reorganize the
# tasks structure
##

class IxiaTestTaskRouteHandler(IxiaTaskRouteHandler):

    test_tasks = ['create',
                  'validate',
                  'execute',
                  'destroy']

    def can_route(self, task, args=None, kwargs=None):
        return (task in self.test_tasks or
                task.startswith('ixiacr.tasks.test'))

    def get_route(self, task, args=None, kwargs=None):
        return {'queue': 'ixiacr',
                'routing_key': 'engine.ixiacr'}

##
# Task Router
##

class IxiaTaskRouter(object):

    route_handlers = [IxiaTestTaskRouteHandler,
                      IxiaDefaultTaskRouteHandler]  # Keep default route
                                                    # in last place

    def __init__(self):
        self._handlers = list()
        for handler in self.route_handlers:
            self._handlers.append(handler())

    def _get_route(self, task, args=None, kwargs=None):
        """
        Walk our list of route handlers and try to find one that can handle
        the given task.  When we find a route handler, get it's route
        """
        route = None

        for handler in self._handlers:
            if handler.can_route(task, args, kwargs):
                route = handler.get_route(task, args, kwargs)
                break

        return route

    def route_for_task(self, task, args=None, kwargs=None):
        ixiacrlogger.debug('task = %s' % task)
        route = self._get_route(task, args, kwargs)
        ixiacrlogger.debug('routed %s to %s queue' %
                         (task, route['queue']))

        return route
