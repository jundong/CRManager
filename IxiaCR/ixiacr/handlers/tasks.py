from pyramid.i18n import TranslationStringFactory
from ixiacr.handlers import base
from ixiacr.lib import IxiaLogger
from pyramid_handlers import action
from celery.result import AsyncResult
from celery.task.control import inspect
from ixiacr.models import UIMessage
from json import loads

ixiacrlogger = IxiaLogger(__name__)
_ = TranslationStringFactory('messages')


def view_includes(config):
    config.add_handler('get_task_status', '/ixia/get_task_status',
                       'ixiacr.handlers.tasks:IxiaTaskHandler',
                       action='get_task_status')
    config.add_handler('get_tasks_scheduled', '/ixia/get_tasks_scheduled',
                       'ixiacr.handlers.tasks:IxiaTaskHandler',
                       action='get_tasks_scheduled')
    config.add_handler('get_tasks_active', '/ixia/get_tasks_active',
                       'ixiacr.handlers.tasks:IxiaTaskHandler',
                       action='get_tasks_active')


class IxiaTaskHandler(base.Handler):

    @action(renderer='json')
    def get_task_status(self):
        """Get a task status by ID and give back the result if the task has
        finished. If the task_id exists in UIMessages we grab and return
        the message as well.

        :param request.params: The POSTed data.
        :type request.params: Multidict
        :returns:  JSON Object
        :raises: Exception

        """
        try:
            task_id = self.request.params['task_id']

            res = AsyncResult(task_id)

            if res.ready():
                return AsyncResult(task_id).result
            else:
                ui_message = UIMessage.query.filter_by(name=task_id).first()
                if ui_message:
                    messages = [{'header':
                                     loads(ui_message.description)['message'],
                                 'content':
                                     loads(ui_message.description)['message'],
                                 'progress':
                                     loads(ui_message.description)['progress'],
                                 'is_error': False}]
                else:
                    messages = [{}]
                return {'status': 'running', 'messages': messages}

        except Exception, e:
            self.messages.append({
                'is_error': True,
                'header': 'Failed',
                'content': str(e)
            })
            return {'result': 'FAILURE', 'messages': self.messages}

    def get_celery_tasks(self, active=False):
        items = []
        try:
            i = inspect()
            info = i.active() if active else i.scheduled()
            if info:
                # iterate queues
                for i, queue in enumerate(info):
                    tasks = []
                    # iterate tasks in queues
                    for task in info.get(queue):
                        tasks.append(dict({"queue": queue,
                                           "name": task['name'],
                                           "id": task['id'],
                                           "args": task['args']}))
                    if tasks:
                        items.append(tasks)
            else:
                raise Exception('Unable to return task queue information')
        except Exception, e:
            self.messages.append({
                'is_error': True,
                'header': 'Failed',
                'content': str(e)
            })
            return {'result': 'FAILURE', 'messages': self.messages}
        finally:
            return {'result': 'SUCCESS', 'messages': items}

    @action(renderer='json')
    def get_tasks_active(self):
        return self.get_celery_tasks(active=True)

    @action(renderer='json')
    def get_tasks_scheduled(self):
        return self.get_celery_tasks()