from sqlalchemy.sql import and_
import transaction

from ixiacr.lib.config.options import OptionResolver
from ixiacr.models import ConfigOption

import logging

ixiacrlogger = logging.getLogger(__name__)

class DBOptionResolver(OptionResolver):
    """ Resolve option values by looking up in a table in the database.
    """
    def __init__(self, db):
        self.db = db

    def get_value(self, category, name):

        terms = [ConfigOption.category == category,
                 ConfigOption.name == name]

        ixiacrlogger.debug('Create db sesssion')
        sess = self.db()
        ixiacrlogger.debug('Querying for category={0} and name={1}'.format(category, name))
        option = sess.query(ConfigOption).filter(and_(*terms)).one()
        ixiacrlogger.debug('transaction commit')
        value = option.value
        transaction.commit()
        ixiacrlogger.debug('returning value={0}'.format(value))
        return value

    def set_value(self, category, name, new_value, defaults):
        terms = [ConfigOption.category == category,
                 ConfigOption.name == name]

        ixiacrlogger.debug('Create db sesssion')
        sess = self.db()
        ixiacrlogger.debug('Querying for category={0} and name={1}'.format(category, name))
        try:
            option = sess.query(ConfigOption).filter(and_(*terms)).one()
            option.value = str(new_value)
        except Exception as e:
            option = ConfigOption()
            option.category = category
            option.data_type = defaults['type']
            option.name = name
            option.value = str(new_value)
            sess.add(option)

        ixiacrlogger.debug('transaction commit')
        transaction.commit()

    def unset_value(self, category, name):
        terms = [ConfigOption.category == category,
                 ConfigOption.name == name]

        ixiacrlogger.debug('Create db sesssion')
        sess = self.db()
        ixiacrlogger.debug('Querying for category={0} and name={1}'.format(category, name))
        option = sess.query(ConfigOption).filter(and_(*terms)).one()
        sess.delete(option)
        ixiacrlogger.debug('transaction commit')
        transaction.commit()

    def remove_all(self):
        sess = self.db()
        sess.query(ConfigOption).delete()
