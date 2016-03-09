from datetime import datetime
from core import Column, Base, Integer, DateTime, Unicode, UnicodeText, Boolean, ForeignKey


class IxiaVersion(Base):
    __tablename__ = 'ixiacr_version'

    id = Column(Integer, autoincrement=True, primary_key=True)
    version = Column(Unicode(32), nullable=False)
    build = Column(Unicode(32), nullable=True)
    last_updated = Column(DateTime, default=datetime.now)


class JSBWCompute(Base):
    """ Ixia test result notes """
    __tablename__='js_bw_compute'

    id = Column(Integer, autoincrement=True, primary_key=True)
    js = Column(UnicodeText, nullable=True)


class Update(Base):
    __tablename__ = 'updates'

    STATES = ['AVAILABLE', 'DOWNLOADING', 'READY', 'APPLIED', 'OUTDATED']

    id = Column(Integer, autoincrement=True, primary_key=True)

    latest_build = Column(Unicode(32), nullable=False)
    available_updates = Column(Integer)
    state = Column(Unicode(32), nullable=False)
    offline = Column(Boolean, nullable=False)

    details = Column(UnicodeText, nullable=True)
    download_started = Column(DateTime, nullable=True)
    download_finished = Column(DateTime, nullable=True)
    applied_date = Column(DateTime, nullable=True)


class ConfigOption(Base):
    __tablename__ = 'options'

    id = Column(Integer, autoincrement=True, primary_key=True)

    category = Column(Unicode(64), nullable=False)
    data_type = Column(Unicode(16), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)

    name = Column(UnicodeText)
    value = Column(UnicodeText)


class SessionKeyValue(Base):
    __tablename__ = 'session_key_values'

    session_id = Column(Unicode(64), primary_key=True)
    name = Column(Unicode(64), primary_key=True)
    value = Column(UnicodeText)
    timestamp = Column(DateTime, nullable=False)
