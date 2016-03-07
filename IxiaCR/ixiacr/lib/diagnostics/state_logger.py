import time
import logging

from collections import namedtuple
from ixiacr.lib.utils import is_dict_equal


class StateLogger(object):
    """ Logger that supports logging state objects (dict's) only if they have
        changed or if a specified timeout period has expired.

        A key is used to store the dict object and last time the object was
        written to the log output.

        If the object matches exactly the content of the last logged output,
        then the message is not written to the log output, unless the timeout
        has expired.
    """
    def __init__(self, name, timeout=60, logger=None):
        """ Initializer

        :param name: Name of logger -- passed when creating logger instance
        :param timeout: How long in seconds to suppress logging of duplicates
        :param logger: None or optional logger instance to use
        """
        if logger:
            self._log = logger
        else:
            self._log = logging.getLogger(name)
        self._state = {}
        self._timeout = timeout
        self._TrackObject = namedtuple('TrackObject', ['obj', 'last_logged'])

    def _create_msg(self, level, key, obj):
        if not self._log.isEnabledFor(level):
            return False

        if isinstance(obj, dict):
            if key in self._state:
                if is_dict_equal(self._state[key].obj, obj) and \
                    (time.time() - self._state[key].last_logged) < self._timeout:
                    return False

            self._state[key] = self._TrackObject(obj, time.time())
        return True

    def debug_state(self, key, obj, msg):
        """ Conditional log a DEBUG message based on obj content

        :param key: Key used to identify the object
        :param obj: Python dict to compare to last logged dict
        :param msg: String to write to logger if obj has changed
        """
        if self._create_msg(logging.DEBUG, key, obj):
            self._log.debug(msg)

    def info_state(self, key, obj, msg):
        if self._create_msg(logging.INFO, key, obj):
            self._log.info(msg, None)

    def warn_state(self, key, obj, msg):
        if self._create_msg(logging.WARN, key, obj):
            self._log.warn(msg, None)

    def error_state(self, key, obj, msg):
        if self._create_msg(logging.ERROR, key, obj):
            self._log.error(msg, None)

    def fatal_state(self, key, obj, msg):
        if self._create_msg(logging.FATAL, key, obj):
            self._log.fatal(msg, ())

    def debug(self, msg, *args, **kwargs):
        self._log.debug(msg, *args, **kwargs)

    def info(self, msg, *args, **kwargs):
        self._log.info(msg, *args, **kwargs)

    def warning(self, msg, *args, **kwargs):
        self._log.warning(msg, *args, **kwargs)

    warn = warning

    def error(self, msg, *args, **kwargs):
        self._log.error(msg, *args, **kwargs)

    def exception(self, msg, *args):
        self._log.exception(msg, *args)

    def critical(self, msg, *args, **kwargs):
        self._log.debug(msg, *args, **kwargs)

    fatal = critical


