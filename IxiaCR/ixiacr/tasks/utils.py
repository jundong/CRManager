from __future__ import absolute_import

import socket
import celery.states
import celery.worker.state

from ixiacr.lib.utils import admin_helper
from ixiacr.tasks.router import IxiaTaskRouter
from ixiacr.tasks.celery import IxiaCelery
from celery.task.control import inspect
from ixiacr.lib import IxiaLogger

ixiacrlogger = IxiaLogger(__name__)


def queue_task_if_possible(task):
    """
    Check celery queue status for task.  If the queue is available, send
    the task to the queue, otherwise run the task in the current context
    """

    def do_queue_task_if_possible(*args, **kwargs):
        # Get the queue for our task
        queue = IxiaTaskRouter().route_for_task(task.name)['routing_key']
        inspector = IxiaCelery.control.inspect()

        # Check to see if we have a queue
        have_available_queue = False
        stats = None

        try:
            stats = inspector.stats()
        except socket.error:
            # Unable to connect to our backend to collect stats,
            # so we definitely don't have any queues...
            pass

        if stats:
            for worker in stats.keys():
                if worker.startswith(queue):
                    # We do; check to see if it's available
                    if 'max-concurrency' in stats[worker]['pool']:
                        num_workers = stats[worker]['pool']['max-concurrency']
                    else:
                        num_workers = 0  # threading module doesn't give
                        # us this info
                    queue_is_free = (len(inspector.active()[worker]) == 0)

                    if queue_is_free or num_workers > 1:
                        have_available_queue = True

        # Now run the task
        if have_available_queue:
            return task.delay(*args, **kwargs).get()
        else:
            return task(*args, **kwargs)

    return do_queue_task_if_possible


def get_worker_task_count(name=None):
    """
    Count the number of tasks in the current worker that match 'name'.
    If name is blank, return the total number of tasks in the worker
    """
    ntasks = 0
    for request in celery.worker.state.active_requests:
        if name is None or request.task_name.find(name) >= 0:
            ntasks += 1

    return ntasks


@IxiaCelery.task
def queue_admin_helper(command, data):
    """
    Run admin helper in task queue
    """
    return admin_helper(command, data)


def get_task_running_count(task):
    """ Determine number of running tasks matching task name

        :param task: celery Task object or Name of task string

        :returns: number of instances running
    """
    inspector = inspect()
    active = inspector.active()

    if isinstance(task, basestring):
        task_name = task
    else:
        task_name = task.name

    found = 0
    for host_tasks in active.values():
        for cur_task in host_tasks:
            ixiacrlogger.debug('Found running task: {0}'.
                             format(cur_task['name']))
            if cur_task['name'] == task_name:
                found += 1

    ixiacrlogger.debug('Found {0} matching tasks running for task name={1}'.
                     format(found, task_name))
    return found


def is_task_already_running(task):
    """ Determine if an instance of task is already running more than
    once by checking the name of active tasks

        Intended to be called from within an executing task.

        :param task: celery Task object

        :returns: True if the task is running more than 1 instance
                  False if one or zero instances are running
    """
    found = get_task_running_count(task)
    return True if found > 1 else False


# ##
# various tasks to check the status of celery task chains
###

def task_chain_is_running(result):
    """
    Check a celery result chain.  Return true if any tasks in the chain
    are still running; false otherwise.
    """
    customCount = readyCount = unreadyCount = failureCount = 0

    curResult = result
    while curResult is not None:
        status = curResult.status

        if status in celery.states.UNREADY_STATES:
            unreadyCount += 1
        elif status in celery.states.PROPAGATE_STATES:
            failureCount += 1
        elif status in celery.states.READY_STATES:
            readyCount += 1
        elif status not in celery.states.ALL_STATES:
            customCount += 1

        # Get next result in the chain
        curResult = curResult.parent

    # We consider a chain running if
    # 1) there are no failures
    # 2) At least one task has a result
    # 3) and 1 or more tasks are ready to run OR we have a
    #    task in a custom state
    return (failureCount == 0 and
            readyCount > 0 and
            (unreadyCount > 0 or customCount > 0))


def task_chain_has_passed(result):
    """
    Check a celery result chain.  Return true if all tasks have succeeded;
    false otherwise
    """
    resultCount = 0
    successCount = 0

    curResult = result
    while curResult is not None:
        resultCount += 1

        if curResult.ready() and curResult.status == 'SUCCESS':
            successCount += 1

        # Get next result in the chain
        curResult = curResult.parent

    return (resultCount == successCount)


def task_chain_has_failed(result):
    """
    Check a celery result chain.  Return true if any tasks have failed.
    Return false otherwise.
    """
    failureCount = 0

    curResult = result
    while curResult is not None:
        if curResult.ready():
            # Check for failure
            if curResult.status in celery.states.PROPAGATE_STATES:
                failureCount += 1

        # Get next result in the chain
        curResult = curResult.parent

    return (failureCount > 0)


def get_running_task_result(result):
    """
    Return the result object that corresponds to the currenly running
    task in the result chain
    """
    curResult = result
    readyResult = pendingResult = customResult = None

    while curResult is not None:
        status = curResult.status
        if status in celery.states.READY_STATES:
            readyResult = curResult
        elif status not in celery.states.ALL_STATES:
            customResult = curResult
        elif status in celery.states.UNREADY_STATES:
            pendingResult = curResult

        # Get next result in the chain
        curResult = curResult.parent

    return (customResult or pendingResult or readyResult)


def get_task_from_chain(last_task, task_name):
    """ Return a task by name from a task chain

     :param last_task: where to start walking the chain by parent
     :param task_name: name of task we are searching for

     :returns: Task object matching task_name or exception
    """
    ixiacrlogger.debug('checking chain for task_name={0}'.format(task_name))
    cur_task = last_task
    while cur_task:
        if cur_task.task_name == task_name:
            ixiacrlogger.debug(
                'Located task_name={0} in task_chain; '
                'task_id={1}; last_task.task_id={2}'.format(
                    task_name, cur_task.task_id, last_task.task_id))

            return cur_task

        cur_task = cur_task.parent

    raise Exception('Could not locate task_name={0} in task_chain; '
                    'last_task.task_id={1}'.format(
        task_name, last_task.task_id))


def dump_task_chain_status(result):
    """
    Log all tasks and status contained in result
    """
    curResult = result
    ixiacrlogger.debug('TASK CHAIN DUMP: BEGIN')
    while curResult is not None:
        msg = ('{0} ({1}): state = {2}, result = {3}'.format(
            curResult.task_name, curResult.task_id,
            curResult.state, curResult.result))
        ixiacrlogger.debug(msg)

        curResult = curResult.parent

    ixiacrlogger.debug('TASK_CHAIN_DUMP: END')


def is_any_task_running(queue_names, task_names):
    """ Determine if any of the task names in the provided list are running

        :param task_names: Names of tasks

        :returns: True if task running
    """
    inspector = inspect(queue_names)

    active = inspector.active()
    if active:
        for host_tasks in active.values():
            for cur_task in host_tasks:
                if 'name' in cur_task and cur_task['name'] in task_names:
                    return True

    return False
