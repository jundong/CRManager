#!/usr/bin/env python
import cPickle
import time
import transaction

from ixiacr.lib.engines import results
from ixiacr.lib.engines.results import ResultPacket
from ixiacr.models import db
from ixiacr.lib import IxiaLogger, init_ixiacr_logger

from sqlalchemy import create_engine


class ResultsConsumer(object):

    RESULT_SYNC_TRIGGERS = [
        ResultPacket.ResultType.TestStop,
        ResultPacket.ResultType.ResultSetStop
    ]

    def __init__(self):
        db.configure(bind=create_engine(
            'sqlite:///%(here)s/cyberrange.sqlite'))

        self.rr = results.ResultReader()

        self.log = IxiaLogger(__name__)

        self.log.debug('ResultsConsumer: initialized')

        self._test_result_id = None
        self._test_config_obj = None

        self._results = list()

    @property
    def current_config(self):
        return None

    def _sync_results(self):
        '''
        Process all of the accumulated results in one swell foop.
        '''
        config = self.current_config

        start = time.time()

        with transaction.manager:
            sp = transaction.savepoint()
            for count, result in enumerate(self._results):
                if not config.test.process_result_transactionless(
                        config, result.__dict__, config.result_id, db):
                    self.log.error('ResultsConsumer: Processing failed for {0}. '
                                   'Rolling back to last savepoint.'.format(result))
                    sp.rollback()
                    break

        stop = time.time()

        fargs = {
            'count': count,
            'time': stop - start,
            'avg': (stop - start) / float(count) if count > 0 else 0
        }
        self.log.debug('ResultsConsumer: Processed {count} results in {time:.3f} seconds '
                       '({avg:.3f} seconds/result)'.format(**fargs))

        self._results = list()

    def process_result(self, ch, method, properties, body):
        '''
        The result data consumer callback that processes results into the data
        object being passed in from the task consumer.
        '''
        try:
            result = cPickle.loads(body)
            assert result, 'Unable to unpickle result object'

            self._results.append(result)

            if result.resulttype in self.RESULT_SYNC_TRIGGERS:
                self._sync_results()

            return True

        except Exception as e:
            self.log.exception('ResultsConsumer: {0}'.format(e))
            return False

    def run(self):
        self.rr.read(self.process_result)


if __name__ == '__main__':
    try:
        init_ixiacr_logger()
        rc = ResultsConsumer()
        rc.run()
    except Exception as e:
        print str(e)
