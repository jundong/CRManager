from gettext import GNUTranslations
import sys
from datetime import datetime

import os
import transaction
import logging
from logging.handlers import RotatingFileHandler
from sqlalchemy import engine_from_config
from pyramid.paster import get_appsettings

from ixiacr.models import *
from ixiacr.lib import IxiaLogger

LOGGING_FILENAME = os.path.join(os.getenv('IXIACR'), 'logs/ixiacr_initialize_db.log')
LOGGING_MAX_BYTES = 10485760
LOGGING_MAX_FILES = 5

ixiacrlogger = IxiaLogger(__name__)
ixiacr_version = 'r0001'

locale_dir = os.path.join(os.getenv('IXIACR'), 'ixiacr/locale')


def usage(argv):
    cmd = os.path.basename(argv[0])
    print('usage: %s <config_uri>\n'
          '(example: "%s development.ini")' % (cmd, cmd))
    sys.exit(1)

def setup_init_logging():
    """ Configure the root logger for logging to a backup log file.
    """
    rootLogger = logging.getLogger()
    rootLogger.setLevel(logging.DEBUG)
    fh = RotatingFileHandler(LOGGING_FILENAME, maxBytes=LOGGING_MAX_BYTES, backupCount=LOGGING_MAX_FILES)
    fh.setFormatter(logging.Formatter('[%(asctime)s %(levelname)s %(name)s - %(threadName)s] %(message)s'))
    rootLogger.addHandler(fh)


def main(argv=sys.argv):
    if len(argv) != 2:
        usage(argv)
    try:
        cmd = argv[1]
        import_db(cmd)

    except Exception as e:
        ixiacrlogger.exception(e)
        raise


def create_translations_registry(locale_dir, domain):
    result = []
    for lang_dir in os.listdir(locale_dir):
        mo_file_path = os.path.join(locale_dir, lang_dir, 'LC_MESSAGES',
                                    domain + '.mo')
        if os.path.exists(mo_file_path):
            with open(mo_file_path, 'rb') as mo_file:
                result.append(
                    (lang_dir, GNUTranslations(mo_file)))

    return result


def create_translatable_string_factory(translations_registry):
    def translatable_string_factory(message_id):
        result = TranslatableString()
        for lang, tr in translations_registry:
            result.set_translation(lang, tr.ugettext(message_id))

        return result

    return translatable_string_factory


def _(message):
    return message


def import_db(cmd):
    config_uri = cmd
    setup_init_logging()
    settings = get_appsettings(config_uri)
    engine = engine_from_config(settings, 'sqlalchemy.')
    db.configure(bind=engine)
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)

    translatable_string = create_translatable_string_factory(
        create_translations_registry(locale_dir, 'messages'))

    with transaction.manager:
        # Create the groups for two types of users (for now)
        auth_group = Group(u'auth', translatable_string(_(u'Regular user account.')))
        admin_group = Group(u'admin', translatable_string(_(u'Administrative user account.')))

        # add them to the db session
        db.add(auth_group)
        db.add(admin_group)
        transaction.commit()

        # Create the admin user so we can always access the system as admin.
        su = User(first_name=u'Ixia', last_name=u'User', username=u'admin',
                  email=u'admin@ixiacom.com', remote_addr=u'127.0.0.1')
        su._set_password('admin')
        su.groups.append(admin_group)
        db.add(su)
        transaction.commit()

        # Make a fake EULA for testing...
        db.add(Eula(name=translatable_string(_(u'License Update....')),
                    build=u"1.00.0001",
                    heading=translatable_string(_(u'This is the heading for the new Eula please check the checkbox.')),
                    content=translatable_string(_(u'eula_version_1'))))
        transaction.commit()

        # Create some generic static device types
        db.add(DeviceType(name=translatable_string(_(u'localhost')),
                          description=translatable_string(_(u'Our local Axon chassis.'))))
        transaction.commit()

        db.add(TestMessage(test_id=0,
                           message=translatable_string(_(u'All tests can be run using either IPv4 packets or IPv6 packets. Just input your endpoint addresses in the appropriate format.')),
                           status=u'Result'))
        transaction.commit()

        db.add(Portlet(name=translatable_string(_(u'Welcome')), content_type=1, portlet_content=translatable_string(_(u'portlet.welcome.content')), default_column=u'.l-portlet-column', div_id_name=u'welcome'))
        db.add(Portlet(name=translatable_string(_(u'Recent Results')), content_type=4, portlet_content=translatable_string(_(u'portlet.recent_results.content')), default_column=u'.l-portlet-column', div_id_name=u'recent-tests-template'))
        db.add(Portlet(name=translatable_string(_(u'Favorite Tests')), content_type=4, portlet_content=translatable_string(_(u'portlet.favorite_tests.content')), default_column=u'.r-portlet-column', div_id_name=u'favorite-tests-template'))
        db.add(Portlet(name=translatable_string(_(u'Test Library')), content_type=4, portlet_content=translatable_string(_(u'portlet.test_library.content')), default_column=u'.r-portlet-column', div_id_name=u'all-tests-template'))
        transaction.commit()

        # Configure global system parameters.
        config = Configs(bps=u'192.168.100.132', metasploit=u'192.168.0.150', splunk=u'192.168.0.133',
                                ips=u'', ngfw=u'192.168.0.134', dlp=u'192.168.0.140',
                                windows=u'192.168.0.132', kali=u'192.168.0.170', atip=u'192.168.0.171')
        db.add(config)
        transaction.commit()

        db.add(IxiaVersion(version=unicode(ixiacr_version),
                   build=u'1.00.0001',
                   last_updated=datetime.now()))
        transaction.commit()

if __name__ == "__main__":
    pass