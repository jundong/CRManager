import datetime
import transaction

from ixiacr.models.utils import SessionKeyValue
from sqlalchemy.sql import and_, or_
from sqlalchemy.orm.exc import NoResultFound
from ixiacr.lib import IxiaLogger

ixiacrlogger = IxiaLogger(__name__)


class SessionKeyValueStore(object):
    """ Simplifies access to key/value pairs tied to a web session.
    """

    def __init__(self, db, session_id):
        """
        :param db: database session
        :param session_id: session_id tied to user web session
        """
        self.db = db
        self.session_id = session_id

    def get_value(self, key, max_age_secs=None):
        """ Return the value of a key

        :param key: key name
        :param max_age_secs: maximum age in seconds of value
        :returns: None if not found or age expired; should only throw on unexpected error
        """
        terms = [SessionKeyValue.session_id == self.session_id, SessionKeyValue.name == key]
        try:
            ixiacrlogger.debug('kv_store: session_id={0} checking for key={1}'.format(
                self.session_id, key))

            session_key_value = self.db.query(SessionKeyValue).filter(and_(*terms)).one()
            age_secs = (datetime.datetime.now() - session_key_value.timestamp).seconds

            expired = None if not max_age_secs else age_secs > max_age_secs
            ixiacrlogger.debug('kv_store: found value; key={0}; age={1}; expired={2}'.format(
                key, age_secs, expired))

            return session_key_value.value if not expired else None

        except NoResultFound:
            pass

        return None

    def set_value(self, key, new_value):
        """ Sets a key to a new value

        :param key: key name
        :param new_value: new value
        """
        try:
            terms = [SessionKeyValue.session_id == self.session_id, SessionKeyValue.name == key]
            kv = self.db.query(SessionKeyValue).filter(and_(*terms)).one()
        except:
            kv = SessionKeyValue()
            kv.session_id = self.session_id
            kv.name = key
            self.db.add(kv)

        kv.value = new_value
        kv.timestamp = datetime.datetime.now()

        self.db.flush()

        ixiacrlogger.debug('kv_store: session_id={0} set key={1}; value={2}'.format(
            self.session_id, key, new_value))

    def remove_value(self, key):
        """ Remove a single key/value if its been loaded

        :param key: key name
        """
        try:
            terms = [SessionKeyValue.session_id == self.session_id, SessionKeyValue.name == key]
            self.db.query(SessionKeyValue).filter(and_(*terms)).delete()
            self.db.flush()
        except Exception as e:
            ixiacrlogger.exception(e)
            raise

    def remove_all(self):
        """ Remove all key/values for the current session or any sessions older
        """

        date_threshold = datetime.datetime.now() - datetime.timedelta(days=7)

        terms = [or_(SessionKeyValue.session_id == self.session_id,
                    (SessionKeyValue.timestamp < date_threshold))]
        try:
            ixiacrlogger.debug('kv_store: session_id={0} removing all key-values and anything older than={1}'.format(
                self.session_id, str(date_threshold)))

            num_rows = self.db.query(SessionKeyValue).filter(or_(*terms)).delete()
            self.db.flush()

            ixiacrlogger.debug('kv_store: removed {0} rows'.format(num_rows))

        except Exception as e:
            ixiacrlogger.exception(e)
            raise
