import os
import yaml

from ixiacr.lib import IxiaLogger
from ixiacr.lib.config.db_resolver import DBOptionResolver

ixiacrlogger = IxiaLogger(__name__)

def get_global_config_options(db_sess=None):
    global CONFIG_OPTIONS
    if CONFIG_OPTIONS:
        return CONFIG_OPTIONS

    ixiacrlogger.debug('get_global_config_options')
    config_defaults = ConfigDefaults(os.path.join(os.getenv('IXIACR'), 'ixiacr.yaml'))

    if not db_sess:
        from ixiacr.models.core import db
        db_sess = db

    resolver = DBOptionResolver(db_sess)

    from ixiacr.lib.config import ConfigOptions

    CONFIG_OPTIONS = ConfigOptions(config_defaults, resolver)
    return CONFIG_OPTIONS


class ConfigDefaults(object):
    """ Wrapper around persistent default values
    """
    def __init__(self, filename):
        with open(filename, 'r') as f:
            ixiacrlogger.info('Reading config defaults from filename={0}'.format(filename))
            self._defaults = yaml.load(f)

    def get_item(self, key):
        return self._defaults['ixiacr'][key]










