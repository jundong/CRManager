from ixiacr.lib.engines.results import ResultPacket

from ixiacr.lib import IxiaLogger

from ixiacr.tasks import core
from ixiacr.tasks.celery import IxiaCelery

ixiacrlogger = IxiaLogger(__name__)

def _(msg):
    '''
    Stub for translation method - ensures strings are extracted
    '''
    return msg

###
# Celery Test API
###


# Basic create command
@IxiaCelery.task(base=core.IxiaCreateTestTask)
def create(self, test, save_as=None, offline=None, drop_results=None):
    return create.create(test, save_as, offline, drop_results)


@IxiaCelery.task(base=core.IxiaCreateTestTask)
def validate(token):
    """
    Verify that the Test is in a proper state to start
    a test.  If it isn't, then raise an exception.
    """
    return token


@IxiaCelery.task(base=core.IxiaAbortableTestTask)
def execute(token):
    RESULT_LOOP_POLL_PERIOD = 1  # in seconds
    assert token.validated, 'Cannot execute unvalidated test'

    execute.ResultWriter.write(
        ResultPacket(test_id=token.test.id,
                     resulttype=ResultPacket.ResultType.TestStart))

    # While sequencer is running, poll results and send them out
    while execute.SequencerManager.is_running:
        pass

    return token


@IxiaCelery.task(base=core.IxiaDestroy)
def destroy(token=None):
    return None


@IxiaCelery.task(base=core.IxiaAbortableTestTask)
def reset():
    return None
