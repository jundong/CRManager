import os
import re

from ixiacr.lib import IxiaLogger

ixiacrlogger = IxiaLogger(__name__)


# ##
# Utility functions / classes
# ##

def enum(*sequential, **named):
    enums = dict(zip(sequential, range(len(sequential))), **named)
    reverse = dict((value, key) for key, value in enums.iteritems())
    enums['reverse_mapping'] = reverse
    return type('Enum', (), enums)


def is_number(x):
    try:
        float(x)
        return True
    except ValueError:
        return False


def is_integer(x):
    return isinstance(x, (int, long))

def gramatically_correct_list_join(l):
    if not isinstance(l, list):
        try:
            l = list(l)
        except:
            raise TypeError('%s is not list like' % l)

    if not len(l):
        return ''
    elif len(l) == 1:
        return l[0]
    elif len(l) == 2:
        return ' and '.join(l)
    else:
        return (', and ').join([(', ').join(l[:-1]), l[-1]])


# ##
# Base classes
# ##

class BaseList(list):
    """
    Abstract instance of a type specific list
    """

    def __init__(self, items=None):
        if items:
            for item in items:
                if self._is_valid(item):
                    self.append(item)

    def append(self, value):
        if self._is_valid(value):
            list.append(self, value)

    def __setitem__(self, index, value):
        if self._is_valid(value):
            list.__setitem__(self, index, value)

    def _is_valid(self, item):
        raise NotImplementedError('You should implement this')


class BaseObject(object):
    """
    Generic object used for test modeling
    """

    def __init__(self, **kwargs):
        self.id = id(self)
        self.name = None

        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
            else:
                ixiacrlogger.debug('Unrecognized attribute in BaseObject engine '
                                 'model FIXME: %s, for %r' % (key, self))

    @property
    def version(self):
        return 1

    @property
    def is_valid(self):
        errors = list()
        self._do_validation(errors, self.__class__.__name__)

        if len(errors):
            return False
        else:
            return True

    def _do_validation(self, errors, prefix=None):
        pass

    def __repr__(self):
        attrs = dict()
        for attr in dir(self):
            if attr.startswith('_'):
                continue

            if not callable(getattr(self, attr)):
                attrs[attr] = getattr(self, attr)

        return '%s: %s' % (type(self), attrs)

    def __str__(self):
        if self.name:
            return self.name
        else:
            return type(self).__name__


class BaseTest(BaseObject):
    """
    Generic Test object
    """

    def __init__(self, **kwargs):
        self.enable_qos_results = False
        super(BaseTest, self).__init__(**kwargs)

    @property
    def errors(self):
        # Use do_validation to get current errors
        errors = list()
        self._do_validation(errors, 'Test')
        return errors

    def _do_validation(self, errors, prefix=None):
        prefix = '%s:%s' % (prefix, 'Test') if prefix else 'Test'


###
# Test Objects
###

class SimpleTest(BaseTest):
    def __init__(self, **kwargs):
        self.duration = 60
        super(SimpleTest, self).__init__(**kwargs)

    def actionize(self, duration):
        for playlist in self.playlists:
            # Empty any current actions
            while len(playlist.actions):
                playlist.actions.pop(0)