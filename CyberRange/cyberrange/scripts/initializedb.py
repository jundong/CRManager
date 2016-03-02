import os
import sys
import random
import transaction

from sqlalchemy import engine_from_config

from pyramid.paster import (
    get_appsettings,
    setup_logging,
    )

#from pyramid.scripts.common import parse_vars

from cyberrange.models.core import (
    DBSession,
    Base,
    GlobalConfigs
    )
from cyberrange.models.admin import (
    User,
    Group
    )

def usage(argv):
    cmd = os.path.basename(argv[0])
    print('usage: %s <config_uri> [var=value]\n'
          '(example: "%s development.ini")' % (cmd, cmd))
    sys.exit(1)


def main(argv=sys.argv):
    if len(argv) < 2:
        usage(argv)
    config_uri = argv[1]
    #options = parse_vars(argv[2:])
    setup_logging(config_uri)
    #settings = get_appsettings(config_uri, options=options)
    settings = get_appsettings(config_uri)
    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)
    Base.metadata.create_all(engine)
    with transaction.manager:
        # Create the groups for two types of users (for now)
        auth_group = Group(u'auth', u'Regular user account.')
        admin_group = Group(u'admin', u'Administrative user account.')

        # Add them to the db session
        DBSession.add(auth_group)
        DBSession.add(admin_group)
        transaction.commit()

        # Create the admin user so we can always access the system as admin.
        su = User(first_name=u'Ixia', last_name=u'User', username=u'admin',
                  email=u'admin@ixiacom.com', mobile=random.randint(2140000000, 2149999999))
        su._set_password('admin')
        su.groups.append(admin_group)
        DBSession.add(su)
        transaction.commit()

        # Configure global system parameters.
        config = GlobalConfigs(bps=u'192.168.0.132', metasploit=u'192.168.0.150', splunk=u'192.168.0.133',
                                ips=u'', ngfw=u'192.168.0.134', dlp=u'192.168.0.140',
                                windows=u'192.168.0.132', kali=u'192.168.0.170', atip=u'192.168.0.171', version=u'01.00.00')
        DBSession.add(config)
        transaction.commit()