from hashlib import sha1
from datetime import datetime
from json import loads, dumps

import os
from sqlalchemy.types import (Integer, DateTime, Boolean, Unicode)
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from zope.sqlalchemy import ZopeTransactionExtension
from pyramid.security import Allow, Everyone, Authenticated, ALL_PERMISSIONS
from cyberrange.scripts import logger
from sqlalchemy import (
    Column,
    Integer,
    Text,
    )

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()
metadata = Base.metadata

crlog = logger.Logger(__name__)


class GlobalConfigs(Base):
    """
    System global configuration
    """
    __tablename__ = 'configs'

    id = Column(Integer, autoincrement=True, primary_key=True)
    bps = Column(Unicode(15), unique=True, nullable=False)
    atip = Column(Unicode(15), unique=True, nullable=True)
    splunk = Column(Unicode(15), unique=True, nullable=True)
    kali = Column(Unicode(15), unique=True, nullable=True)
    metasploit = Column(Unicode(15), unique=True, nullable=True)
    ips = Column(Unicode(15), unique=True, nullable=True)
    ngfw = Column(Unicode(15), unique=True, nullable=True)
    dlp = Column(Unicode(15), unique=True, nullable=True)
    windows = Column(Unicode(15), unique=True, nullable=True)
    version = Column(Unicode(8), nullable=True)

    @classmethod
    def by_id(cls, id):
        return DBSession.query(GlobalConfigs).filter_by(id=id).first()

    def __repr__(self):
        return "<User({0},{1},{2},{3},{4},{5},{6},{7},{8},{9},{10})>" \
            .format(self.id, self.bps, self.atip,
                    self.splunk, self.kali, self.metasploit,
                    self.ips, self.ngfw,
                    self.dlp, self.windos,
                    self.version)


class TestCases(Base):
    """
    Test cases
    """
    __tablename__ = 'test_cases'

    id = Column(Integer, autoincrement=True, primary_key=True)


class CRACLFactory(object):
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