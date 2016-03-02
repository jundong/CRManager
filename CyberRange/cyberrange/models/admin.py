from hashlib import sha1
from datetime import datetime
from json import loads, dumps

import os
from sqlalchemy.types import (Integer, DateTime, Boolean, Unicode,
                              UnicodeText, LargeBinary)
from sqlalchemy.orm import relationship
from cyberrange.scripts import logger
from core import (Base, DBSession)

from sqlalchemy import (
    Column,
    Integer,
    Text,
    )


from mappings import group_permissions

crlog = logger.Logger(__name__)


class Group(Base):
    """Groups for the ACL, but will eventually have permissions tied to them.

    """
    __tablename__ = 'groups'

    id = Column(Integer, autoincrement=True, primary_key=True)
    name = Column(Unicode(64), unique=True, nullable=False)
    created_date = Column(DateTime, default=datetime.now())
    description = Column(Text, default="")

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


class User(Base):
    """User DB model

    """
    __tablename__ = 'users'

    id = Column(Integer, autoincrement=True, primary_key=True)
    username = Column(Unicode(128), unique=True, nullable=False)
    first_name = Column(Unicode(128), nullable=True)
    last_name = Column(Unicode(128), nullable=True)
    password = Column(Unicode(255), nullable=False)
    active = Column(Boolean, default=True)
    email = Column(Unicode(128), nullable=True)
    mobile = Column(Unicode(64), nullable=True)
    session_id = Column(Unicode(255), nullable=True)
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

    def update_session(self, session_id=None):
        self.session_id = session_id
        self.last_login = datetime.now()

    def __repr__(self):
        return "<User({0},{1},{2},{3},{4},{5},{6},{7},{8},{9},{10},{11}," \
               "{12})>" \
            .format(self.id, self.first_name, self.last_name,
                    self.username, self.password, self.active,
                    self.email, self.notification_type_id,
                    self.mobile, self.session_id,
                    self.last_login)


