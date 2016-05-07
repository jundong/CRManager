from hashlib import sha1
from datetime import datetime
import os
from sqlalchemy import ForeignKey, Column
from sqlalchemy.orm.collections import attribute_mapped_collection
from sqlalchemy.types import (Integer, DateTime, Boolean, Unicode,
                              UnicodeText, LargeBinary)
from sqlalchemy.orm import relationship
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from zope.sqlalchemy import ZopeTransactionExtension
from pyramid.security import Allow, Everyone, Authenticated, ALL_PERMISSIONS

from ixiacr.lib import IxiaLogger

ixiacrlogger = IxiaLogger(__name__)
db = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))

pad = lambda s: s + (16 - len(s) % 16) * chr(16 - len(s) % 16)
unpad = lambda s: s[0:-ord(s[-1])]


def has_group(userid, request):
    return map(lambda g: g.name, User.by_id(userid).groups)


class CommonBase(object):
    """Base class for DB objects for holding convenience methods, attributes,
    serializer/encoders or...

    """
    query = db.query_property()

    def _commafy(self, d):
        s = '%0.2f' % d
        a,b = s.split('.')
        l = []

        while len(a) > 3:
            l.insert(0,a[-3:])
            a = a[0:-3]
        if a:
            l.insert(0,a)
        return ','.join(l)

    @classmethod
    def all(cls):
        return cls.query.all()

    @classmethod
    def first(cls):
        return cls.query.first()

    def todict(self):
        """
        JSON PG Date object serializer, and whatever else is
        needed for convenience...
        """
        def convert_datetime(val):
            return val.strftime("%Y-%m-%d %H:%M:%S")

        d = {}
        for c in self.__table__.columns:
            if isinstance(c.type, DateTime):
                value = convert_datetime(getattr(self, c.name))
            else:
                value = getattr(self, c.name)
            d[c.name] = value
        return d

    def iterfunc(self):
        """Returns an iterable that supports .next()
        so we can do dict(cls_instance)
        """
        return self.todict()


class IxiaACLFactory(object):
    """This is the Access Control List class for the models. It gets setup in
    the root_factory in the main app and handled in request/response process.

    """
    __acl__ = [(Allow, Everyone, (ALL_PERMISSIONS, 'everybody')),
               (Allow, 'auth', ('entry', ALL_PERMISSIONS, Authenticated)),
               (Allow, 'admin', ('entry', 'all_access',
                                 ALL_PERMISSIONS, Authenticated)),
               (Allow, 'superuser', ('superuser', 'entry', 'all_access',
                                     ALL_PERMISSIONS, Authenticated))
    ]

    def __init__(self, request):
        pass


Base = declarative_base(cls=CommonBase)
metadata = Base.metadata

from mappings import group_permissions


class Eula(Base):
    """ End User-level Agreements
    """
    __tablename__ = 'eulas'

    id = Column(Integer, autoincrement=True, primary_key=True)
    name_id = Column(Integer, ForeignKey('translatable_strings.id'))
    build = Column(Integer, default=0)
    heading_id = Column(Integer, ForeignKey('translatable_strings.id'))
    content_id = Column(Integer, ForeignKey('translatable_strings.id'))
    issued = Column(DateTime, default=datetime.now)

    name = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==Eula.name_id')
    heading = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==Eula.heading_id')
    content = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==Eula.content_id')

    def __unicode__(self):
        return self.name


class Group(Base):
    """
    Groups for the ACL, but will eventually have permissions tied to them.
    """
    __tablename__ = 'groups'

    id = Column(Integer, autoincrement=True, primary_key=True)
    name = Column(Unicode(64), unique=True, nullable=False)
    description_id = Column(Integer, ForeignKey('translatable_strings.id'))
    created_date = Column(DateTime, default=datetime.now())

    description = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==Group.description_id')

    @property
    def permissions(self):
        perms = []
        for perm in self.permissions:
            perms.append(perm.name)
        return perms

    def __init__(self, name, description=None, date=None):
        self.name = name
        self.description = description or name
        self.created_date = datetime.now()

    def __repr__(self):
        return '<Group: name=%s>' % self.name

    def __unicode__(self):
        return self.name


class Permission(Base):
    """Permissions for groups that will eventually become part of this
    application and handled via decorators.

    """
    __tablename__ = 'permissions'

    id = Column(Integer, autoincrement=True, primary_key=True)
    name = Column(Unicode(32), default=u'Unknown')
    description = Column(Unicode(255), default=u'Unknown')

    groups = relationship("Group", secondary=group_permissions,
                          backref='permissions')

    def __unicode__(self):
        return self.name

    def __init__(self, name, description=None):
        self.name = name
        self.description = description or name

    def __repr__(self):
        return '%s' % self.name


class DeviceType(Base):
    """
    Loose coupling to the devices
    """
    __tablename__ = 'device_types'

    id = Column(Integer, autoincrement=True, primary_key=True)
    name_id = Column(Integer, ForeignKey('translatable_strings.id'))
    description_id = Column(Integer, ForeignKey('translatable_strings.id'))

    name = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==DeviceType.name_id')
    description = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==DeviceType.description_id')

    def __unicode__(self):
        return self.name


class Device(Base):
    """Devices are in Cyber Range system

    """
    __tablename__ = 'devices'

    id = Column(Integer, autoincrement=True, primary_key=True)
    device_type_id = Column(Integer, ForeignKey('device_types.id',
                                                onupdate="CASCADE",
                                                ondelete="CASCADE"))
    name = Column(Unicode(64), unique=True, nullable=True)
    description = Column(UnicodeText, nullable=True)
    host = Column(Unicode(64), nullable=False, unique=False)
    link = Column(Unicode(256), nullable=False, unique=True)
    username = Column(Unicode(64), nullable=False, unique=False)
    password = Column(Unicode(64), nullable=False, unique=False)
    active = Column(Boolean, default=True)

    @property
    def type(self):
        return self.type

    def __unicode__(self):
        return self.name


class DeviceHistory(Base):
    """Device history

    """
    __tablename__ = 'device_history'

    id = Column(Integer, autoincrement=True, primary_key=True)
    device_type_id = Column(Integer, ForeignKey('device_types.id',
                                                onupdate="CASCADE",
                                                ondelete="CASCADE"))
    name = Column(Unicode(64), nullable=True)
    description = Column(UnicodeText, nullable=True)
    host = Column(Unicode(64), nullable=True)
    created = Column(DateTime, default=datetime.now)
    device_id = Column(Integer, ForeignKey('devices.id',
                                           onupdate="CASCADE",
                                           ondelete="CASCADE"))

    def __unicode__(self):
        return self.name


class Portlet(Base):
    """
    But the class name is so descriptive.
    """
    __tablename__ = 'portlets'

    PORTLET_TYPES = (
        (1, u'HTML'),
        (2, u'RSS'),
        (3, u'Atom'),
        (4, u'JavaScript'),
        (5, u'Twitter'),
    )

    id = Column(Integer, autoincrement=True, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id', onupdate="CASCADE",
                                         ondelete="CASCADE"))
    name_id = Column(Integer, ForeignKey('translatable_strings.id'))
    portlet_content_id = Column(Integer, ForeignKey('translatable_strings.id'))

    name = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==Portlet.name_id')
    content_type = Column(Integer)
    portlet_content = relationship('TranslatableString',
                                   primaryjoin='TranslatableString.id==Portlet.portlet_content_id')
    default_column = Column(Unicode(64), nullable=True)
    div_id_name = Column(Unicode(64), nullable=True)

    def __unicode__(self):
        return self.name


class TestResult(Base):
    """ Ixia test result table

    """
    __tablename__='test_results'

    id = Column(Integer, autoincrement=True, primary_key=True)
    created_by = Column(Integer, ForeignKey('users.id',
                                            onupdate="CASCADE",
                                            ondelete="CASCADE"))
    created = Column(DateTime, default=datetime.now)
    run_id = Column(Unicode(255), nullable=True)
    test_id = Column(Integer, ForeignKey('test_cases.id',
                                              onupdate="CASCADE",
                                              ondelete="CASCADE"))
    progress = Column(Integer, default=0)
    result_path = Column(Unicode(255), nullable=True)
    #IDLE, RUNNING, STOPPED, ABORTED, FINISHED
    end_result = Column(Unicode(16), nullable=True, default=u'RUNNING')
    error_reason = Column(UnicodeText, nullable=True)


class RecentNews(Base):
    """ Ixia test result table

    """
    __tablename__='recent_news'

    id = Column(Integer, autoincrement=True, primary_key=True)
    title_id = Column(Integer, ForeignKey('translatable_strings.id'))
    description_id = Column(Integer, ForeignKey('translatable_strings.id'))

    title = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==RecentNews.title_id')
    description = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==RecentNews.description_id')
    link = Column(UnicodeText, nullable=True)
    date = Column(DateTime, default=datetime.now())
    # 0 - Recommendation, 1 - Hot, 2 - Common, 3 - Out Of Date
    priority = Column(Integer, default=1)


class User(Base):
    """User DB model

    """
    __tablename__ = 'users'

    id = Column(Integer, autoincrement=True, primary_key=True)
    username = Column(Unicode(128), unique=True, nullable=False)
    first_name = Column(Unicode(128), nullable=True, default='')
    last_name = Column(Unicode(128), nullable=True, default='')
    password = Column(Unicode(255), nullable=False)
    active = Column(Boolean, default=True)
    email = Column(Unicode(128), nullable=True)
    show_intro = Column(Boolean, default=True)
    session_id = Column(Unicode(255), nullable=True)
    remote_addr = Column(Unicode(15), nullable=True)
    last_login = Column(DateTime, default=datetime.now)
    language = Column(Unicode(2), nullable=True)

    groups = relationship(Group, secondary='user_groups')

    @classmethod
    def by_id(cls, id):
        return User.query.filter(User.id == id).first()

    @classmethod
    def by_username(cls, username):
        return User.query.filter(User.username == username).first()

    @property
    def full_name(self):
        if self.first_name or self.last_name:
            return str(self.first_name) + " " + str(self.last_name)
        return self.username

    @property
    def permissions(self):
        for g in self.groups:
            perms = g.permissions
        return perms

    def _set_password(self, password):
        hashed_password = password

        if isinstance(password, unicode):
            password_8bit = password.encode('UTF-8')
        else:
            password_8bit = password

        salt = sha1()
        salt.update(os.urandom(60))
        hash = sha1()
        hash.update(password_8bit + salt.hexdigest())
        hashed_password = salt.hexdigest() + hash.hexdigest()

        if not isinstance(hashed_password, unicode):
            hashed_password = hashed_password.decode('UTF-8')

        self.password = hashed_password

    def validate_password(self, password):
        hashed_pass = sha1()
        hashed_pass.update(password + self.password[:40])
        return self.password[40:] == hashed_pass.hexdigest()

    def update_session(self, session_id=None, remote_addr=None):
        self.session_id = session_id
        self.remote_addr = remote_addr
        self.last_login = datetime.now()

    def __repr__(self):
        return "<User({0},{1},{2},{3},{4},{5},{6},{7},{8},{9},{10}>" \
            .format(self.id, self.first_name, self.last_name, self.username, self.password, self.active,
                    self.email, self.show_intro, self.session_id, self.remote_addr, self.last_login)


class UIMessage(Base):
    """ UI mesages, error codes etc. """
    __tablename__ = 'ui_messages'

    id = Column(Integer, autoincrement=True, primary_key=True)
    name = Column(Unicode(255), nullable=True)
    description = Column(UnicodeText, nullable=True)
    message_type_id = Column(Integer)

    def __unicode__(self):
        return self.name


class TestMessage(Base):
    """ Test messages. Displayed while running tests, random tips, and
     suggestions.

     """
    __tablename__ = 'test_messages'

    id = Column(Integer, autoincrement=True, primary_key=True)
    test_id = Column(Integer)
    message_id = Column(Integer, ForeignKey('translatable_strings.id'))
    status = Column(UnicodeText, nullable=True)

    message = relationship('TranslatableString',
                    primaryjoin='TranslatableString.id==TestMessage.message_id')

    def __unicode__(self):
        return self.name

    @classmethod
    def get_random(cls):
        return cls.query.filter_by(test_id=0, ).first()


class TestCases(Base):
    """
    User created test
    """
    __tablename__ = 'test_cases'

    id = Column(Integer, autoincrement=True, primary_key=True)
    type = Column(Unicode(64), nullable=False)
    name_id = Column(Integer, ForeignKey('translatable_strings.id'))
    topology_description_id = Column(Integer, ForeignKey('translatable_strings.id'))
    description_id = Column(Integer, ForeignKey('translatable_strings.id'))
    attack_task_id = Column(Integer, ForeignKey('translatable_strings.id'))
    attack_steps_id = Column(Integer, ForeignKey('translatable_strings.id'))
    attack_criteria_id = Column(Integer, ForeignKey('translatable_strings.id'))
    defense_task_id = Column(Integer, ForeignKey('translatable_strings.id'))
    defense_steps_id = Column(Integer, ForeignKey('translatable_strings.id'))
    defense_criteria_id = Column(Integer, ForeignKey('translatable_strings.id'))
    traffic_direction_id = Column(Integer, ForeignKey('translatable_strings.id'))

    created_by = Column(Integer, ForeignKey('users.id',
                                            onupdate="CASCADE",
                                            ondelete="CASCADE"), default=1)
    created = Column(DateTime, default=datetime.now)
    #Scenario topology image name
    topology_image = Column(Unicode(128), nullable=True)
    #Scenario name
    name = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==TestCases.name_id')
    bpt_name = Column(UnicodeText, nullable=False);
    #Scenario topology description
    topology_description = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==TestCases.topology_description_id')
    #Scenario description
    description = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==TestCases.description_id')
    attack_task = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==TestCases.attack_task_id')
    attack_steps = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==TestCases.attack_steps_id')
    attack_criteria = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==TestCases.attack_criteria_id')
    defense_task = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==TestCases.defense_task_id')
    defense_steps = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==TestCases.defense_steps_id')
    defense_criteria = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==TestCases.defense_criteria_id')
    traffic_direction = relationship('TranslatableString',
                        primaryjoin='TranslatableString.id==TestCases.traffic_direction_id')

    active = Column(Boolean, default=True)

    def __unicode__(self):
        return self.name


class TranslatableString(Base):
    __tablename__ = 'translatable_strings'

    id = Column(Integer, primary_key=True)
    translations = relationship('Translation',
                                collection_class=attribute_mapped_collection(
                                    'language'),
                                cascade='all, delete-orphan')

    def set_translation(self, language, translation):
        self.translations[language] = Translation(language, translation)

    def get_translation(self, language):
        return self.translations[language].value

    def __repr__(self):
        return '<Translation: id={0}>'.format(self.id)


class Translation(Base):
    __tablename__ = 'translations'

    string_id = Column(Integer,
                       ForeignKey('translatable_strings.id'),
                       primary_key=True,
                       index=True)
    language = Column(Unicode(2), primary_key=True)
    value = Column(Unicode)

    def __init__(self, language, value):
        self.language = language
        self.value = value

    def __repr__(self):
        return '<Translation: string_id={0}, language={1}>'.format(
            self.string_id,
            self.language)


if __name__ == "__main__":
    pass