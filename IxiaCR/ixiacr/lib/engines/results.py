import cPickle
import collections
import pika

from ixiacr.lib import IxiaLogger
from ixiacr.lib.utils import enum

ixiacrlogger = IxiaLogger(__name__)


# ##
# Objects for reading/writing results over a queue
###

# Object for sending results across a queue
# At a minimum, every result should have this data to identify it
class ResultPacket(object):
    ResultType = enum('TestStart',
                      'TestStop',
                      'ResultSetStart',
                      'ResultSetStop')

    def __init__(self, *args, **kwargs):
        self.test_id = None
        self.seconds = None
        self.timestamp = None
        self.resulttype = None

        for k, v in kwargs.items():
            if hasattr(self, k):
                setattr(self, k, v)


class ResultChannelParams(object):
    HOST = 'localhost'
    QUEUE = 'results'
    EXCHANGE = 'results'
    KEY = 'results'

    @property
    def host(self):
        return self.HOST

    @property
    def queue(self):
        return self.QUEUE

    @property
    def exchange(self):
        return self.EXCHANGE

    @property
    def key(self):
        return self.KEY


class ResultWriter(object):
    def __init__(self):
        self.rcp = ResultChannelParams()
        cp = pika.ConnectionParameters(host=self.rcp.host)
        self.connection = pika.BlockingConnection(cp)
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue=self.rcp.queue,
                                   durable=False)
        return

    def __del__(self):
        self.connection.close()
        return

    def write(self, result):
        ixiacrlogger.debug('Publishing results: %s' % result)
        self.channel.basic_publish(exchange='',
                                   routing_key=self.rcp.key,
                                   body=cPickle.dumps(result))
        return


class ResultReader(object):
    def __init__(self):
        self.rcp = ResultChannelParams()
        cp = pika.ConnectionParameters(host=self.rcp.host)
        self.connection = pika.BlockingConnection(cp)
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue=self.rcp.queue,
                                   durable=False)
        ixiacrlogger.debug('ResultsReader initialized: connection = %s'
                         % self.connection)
        return

    def __del__(self):
        ixiacrlogger.debug('Closing connection = %s' % self.connection)
        self.connection.close()
        return

    def read(self, queue_callback):
        ixiacrlogger.debug('Waiting for data on queue %s' % self.rcp.queue)
        self.channel.basic_consume(queue_callback,
                                   queue=self.rcp.queue,
                                   no_ack=True)
        try:
            self.channel.start_consuming()
        except:
            ixiacrlogger.debug('Caught exception; cleaning up.')
            self.channel.stop_consuming()

        return


###
# Collection classes for storing results (for engines)
###
class ResultType(object):
    Gauge, Counter, Config = range(3)


class ResultCollection(object):
    """
    A collection of results managed by a specified strategy
    """

    def __init__(self, name, strategy=None, max_results=None):
        self.name = name

        if not max_results:
            max_results = 10

        if not strategy:
            raise UnboundLocalError('No result collection strategy specified')

        self._strategy = strategy(name=name, max_results=max_results)

        self._logger = None

    @property
    def logger(self):
        if not self._logger:
            self._logger = IxiaLogger(__name__)
        return self._logger

    def add(self, result):
        return self._strategy.add(result)

    def get_last(self):
        return self._strategy.get_last()

    def get_delta(self, interval=None):
        if not interval:
            interval = 2

        return self._strategy.get_delta(interval)


class ResultCollectionStrategy(object):
    """
    Base class for all result management strategies
    """

    def __init__(self, name, max_results=None):
        self.name = name

        if not max_results:
            self._max_results = 10
        else:
            self._max_results = max_results

        self._results = collections.deque(maxlen=self._max_results)

        self._logger = None

    @property
    def logger(self):
        if not self._logger:
            self._logger = IxiaLogger(__name__)
        return self._logger

    @property
    def max_result_count(self):
        return self._max_results

    def add(self, result):
        """
        Add a result to the collection
        """
        raise NotImplementedError()

    def get_last(self):
        """
        Get the last, aka the most current result
        """
        if self._results:
            return self._results[0]
        else:
            return 0

    def get_delta(self, interval):
        """
        Retreive the change in this result over the specified
        number of intervals
        """
        delta = 0

        if interval > self._max_results:
            raise IndexError('Interval %d is too big.  This collection '
                             'contains at most %d results'
                             % (interval, self._max_results))
        elif interval > len(self._results):
            self.logger.warn('Not enough results to provide delta '
                             'over interval = %d for %s'
                             % (interval, self.name))
        else:
            past_value = self._results[interval - 1]
            cur_value = self._results[0]
            delta = cur_value - past_value

        return delta

    def reset(self):
        """
        Dump all past results and start again
        """
        self._results = collections.deque(maxlen=self._max_results)