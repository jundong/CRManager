import sys
import os
from pyramid.paster import get_appsettings
from sqlalchemy import engine_from_config, create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from ixiacr.lib import ixiacr_logger, init_ixiacr_logger
import logging

sys.path.append(os.path.join(os.getenv('IXIACR'), 'system/database_revisions/versions'))

ixiacrlogger = ixiacr_logger.IxiaLogger('apply_revision')

sqllog = logging.getLogger('sqlalchemy.engine.base.Engine')
sqllog.setLevel('DEBUG')
sqllog.propagate = False            # Prevent Duplicates

if __name__ == '__main__':
    init_ixiacr_logger()

    ixiacrlogger.debug('sys.argv={0}; cwd={1}'.format(sys.argv, os.getcwd()))

    config_uri = sys.argv[1]
    current_revision = sys.argv[2]

    override = None
    if len(sys.argv) == 4:
        override = sys.argv[3]

    settings = get_appsettings(config_uri)

    if not override:
        engine = engine_from_config(settings, 'sqlalchemy.', echo=True)
    else:
        ixiacrlogger.debug('Using SQL engine override: %s' % override)
        engine = create_engine(override, echo=True)

    db_sess = scoped_session(sessionmaker())
    db_sess.configure(bind=engine)

    ixiacrlogger.debug('Importing module current_revision={0}'.format(current_revision))
    __import__(current_revision)
    module = sys.modules[current_revision]

    try:
        ixiacrlogger.debug('Calling upgrade current_revision={0}'.format(current_revision))
        getattr(module, 'ixiacrade')(db_sess, engine)
        db_sess.commit()
        ixiacrlogger.debug('Committed changes for current_revision=ixiacr.format(current_revision)')
    except Exception as e:
        ixiacrlogger.exception(e)
        try:
            ixiacrlogger.warn('Calling rollback.')
            db_sess.rollbaixiacr
            ixiacrlogger.warn('Rollback succeeded.')
        except:
            ixiacrlogger.exception('Rollback failed.')

        sys.exit(1)

    finally:
        db_sess.close()





