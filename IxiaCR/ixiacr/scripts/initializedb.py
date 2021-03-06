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
from ixiacr.lib.bps.bpsRest import BPS

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
        su = User(first_name=u'Ixia', last_name=u'User', username=u'admin@ixiacom.com',
                  email=u'admin@ixiacom.com', remote_addr=u'127.0.0.1')
        su._set_password('admin')
        su.groups.append(admin_group)
        db.add(su)
        transaction.commit()

        # Create some generic static device types
        db.add(DeviceType(name=translatable_string(_(u'localhost')),
                          description=translatable_string(_(u'Our local Axon chassis.'))))
        transaction.commit()

        devices = [
            {'name': u'BPS',
             'description': u'BPS',
             'device_type_id': u'1',
             'host': u'192.168.0.132',
             'link': u'http://192.168.0.132',
             'username': u'admin',
             'password': u'admin'},
            {'name': u'ATIP',
             'description': u'ATIP',
             'device_type_id': u'2',
             'host': u'192.168.0.170',
             'link': u'http://192.168.0.170/atie',
             'username': u'',
             'password': u''},
            {'name': u'IPS',
             'description': u'IPS',
             'device_type_id': u'3',
             'host': u'192.168.0.106',
             'link': u'https://192.168.0.106',
             'username': u'',
             'password': u''},
            {'name': u'NGFW',
             'description': u'NGFW',
             'device_type_id': u'4',
             'host': u'192.168.0.134',
             'link': u'https://192.168.0.134',
             'username': u'',
             'password': u''},
            {'name': u'DLP',
             'description': u'DLP',
             'device_type_id': u'5',
             'host': u'192.168.0.140',
             'link': u'https://192.168.0.140',
             'username': u'',
             'password': u''},
            {'name': u'Splunk',
             'description': u'Splunk',
             'device_type_id': u'6',
             'host': u'192.168.0.133',
             'link': u'http://192.168.0.133:8000/en-US/app/launcher/home',
             'username': u'',
             'password': u''},
            {'name': u'AttackTarget',
             'description': u'AttackTarget',
             'device_type_id': u'7',
             'host': u'192.168.0.150',
             'link': u'ssh://192.168.0.150',
             'username': u'',
             'password': u''},
            {'name': u'Kali',
             'description': u'Kali',
             'device_type_id': u'8',
             'host': u'192.168.0.170',
             'link': u'ssh://192.168.0.170',
             'username': u'',
             'password': u''},
            {'name': u'Windows',
             'description': u'Windows',
             'device_type_id': u'9',
             'host': u'192.168.1.103',
             'link': u'ssh://192.168.1.103',
             'username': u'',
             'password': u''}
        ]

        for device in devices:
            db.add(Device(name=device['name'],
                description=device['description'],
                device_type_id=device['device_type_id'],
                host=device['host'],
                link=device['link'],
                username=device['username'],
                password=device['password']))
            transaction.commit()

        try:
            device = Device.query.filter_by(name=u'BPS').first()
            bps = BPS(device.host, device.username, device.password)
            bps.login()
            ports = bps.getPortsStatus()
            for port in ports:
                db.add(Port(device_id=device.id,
                    slot=port['slot'],
                    port=port['port'],
                    group=1,
                    reserved=port['reserved'],
                    selected=False))
                transaction.commit()
        except Exception:
            ports = [
                {
                    'device_id': u'1',
                    'slot': u'0',
                    'port': u'0',
                    'group': u'1',
                    'reserved': False,
                    'selected': False
                },
                {
                    'device_id': u'1',
                    'slot': u'0',
                    'port': u'1',
                    'group': u'1',
                    'reserved': False,
                    'selected': False
                },
                {
                    'device_id': u'1',
                    'slot': u'0',
                    'port': u'2',
                    'group': u'1',
                    'reserved': False,
                    'selected': False
                },
                {
                    'device_id': u'1',
                    'slot': u'0',
                    'port': u'3',
                    'group': u'1',
                    'reserved': False,
                    'selected': False
                },
                {
                    'device_id': u'1',
                    'slot': u'1',
                    'port': u'0',
                    'group': u'1',
                    'reserved': False,
                    'selected': False
                },
                {
                    'device_id': u'1',
                    'slot': u'1',
                    'port': u'1',
                    'group': u'1',
                    'reserved': False,
                    'selected': False
                },
                {
                    'device_id': u'1',
                    'slot': u'1',
                    'port': u'2',
                    'group': u'1',
                    'reserved': False,
                    'selected': False
                },
                {
                    'device_id': u'1',
                    'slot': u'1',
                    'port': u'3',
                    'group': u'1',
                    'reserved': False,
                    'selected': False
                }
            ]

            for port in ports:
                db.add(Port(device_id=port['device_id'],
                    slot=port['slot'],
                    port=port['port'],
                    group=port['group'],
                    reserved=port['reserved'],
                    selected=port['selected']))
                transaction.commit()

        cases = [
            # {
            #     'name': translatable_string(_(u'Enterprise Traffic Track')),
            #     'type': u'ENTERPRISE',
            #     'description': translatable_string(_(u'cr_test_template.enterprise_traffic_track.description')),
            #     'topology_image': u'static/images/enterprise_traffic_track.jpg',
            #     'topology_description': translatable_string(_(u'cr_test_template.enterprise_traffic_track.topology_description')),
            #     'attack_task': translatable_string(_(u'cr_test_template.enterprise_traffic_track.attack_task')),
            #     'attack_steps': translatable_string(_(u'cr_test_template.enterprise_traffic_track.attack_steps')),
            #     'attack_criteria': translatable_string(_(u'cr_test_template.enterprise_traffic_track.attack_criteria')),
            #     'defense_task': translatable_string(_(u'cr_test_template.enterprise_traffic_track.defense_task')),
            #     'defense_steps': translatable_string(_(u'cr_test_template.enterprise_traffic_track.defense_steps')),
            #     'defense_criteria': translatable_string(_(u'cr_test_template.enterprise_traffic_track.defense_criteria')),
            #     'traffic_direction': translatable_string(_(u'cr_test_template.enterprise_traffic_track.traffic_direction'))
            # },
            # {
            #     'name': translatable_string(_(u'Using Vulnerability Scanning Tool')),
            #     'type': u'HOST',
            #     'description': translatable_string(_(u'cr_test_template.host_vulnerablity_scanning_tool.description')),
            #     'topology_image': u'static/images/host_vulnerablity_scanning_tool.jpg',
            #     'topology_description': translatable_string(_(u'cr_test_template.host_vulnerablity_scanning_tool.topology_description')),
            #     'attack_task': translatable_string(_(u'cr_test_template.host_vulnerablity_scanning_tool.attack_task')),
            #     'attack_steps': translatable_string(_(u'cr_test_template.host_vulnerablity_scanning_tool.attack_steps')),
            #     'attack_criteria': translatable_string(_(u'cr_test_template.host_vulnerablity_scanning_tool.attack_criteria')),
            #     'defense_task': translatable_string(_(u'cr_test_template.host_vulnerablity_scanning_tool.defense_task')),
            #     'defense_steps': translatable_string(_(u'cr_test_template.host_vulnerablity_scanning_tool.defense_steps')),
            #     'defense_criteria': translatable_string(_(u'cr_test_template.host_vulnerablity_scanning_tool.defense_criteria')),
            #     'traffic_direction': translatable_string(_(u'cr_test_template.host_vulnerablity_scanning_tool.traffic_direction'))
            # },
            {
                'name': translatable_string(_(u'Mixture Application Traffic Analyze')),
                'bpt_name': 'CR-Exercise1.bpt',
                'type': u'ENTERPRISE',
                'description': translatable_string(_(u'cr_test_template.enterprise_application_traffic_analyze.description')),
                'topology_image': u'static/images/enterprise_application_traffic_analyze.jpg',
                'topology_description': translatable_string(_(u'cr_test_template.enterprise_application_traffic_analyze.topology_description')),
                'attack_task': translatable_string(_(u'cr_test_template.enterprise_application_traffic_analyze.attack_task')),
                'attack_steps': translatable_string(_(u'cr_test_template.enterprise_application_traffic_analyze.attack_steps')),
                'attack_criteria': translatable_string(_(u'cr_test_template.enterprise_application_traffic_analyze.attack_criteria')),
                'defense_task': translatable_string(_(u'cr_test_template.enterprise_application_traffic_analyze.defense_task')),
                'defense_steps': translatable_string(_(u'cr_test_template.enterprise_application_traffic_analyze.defense_steps')),
                'defense_criteria': translatable_string(_(u'cr_test_template.enterprise_application_traffic_analyze.defense_criteria')),
                'traffic_direction': translatable_string(_(u'cr_test_template.enterprise_application_traffic_analyze.traffic_direction'))
            },
            {
                'name': translatable_string(_(u'DDoS Attack Analyze')),
                'bpt_name': 'CR-Exercise2.bpt',
                'type': u'ENTERPRISE',
                'description': translatable_string(_(u'cr_test_template.enterprise_ddos_attack_analyze.description')),
                'topology_image': u'static/images/enterprise_ddos_attack_analyze.jpg',
                'topology_description': translatable_string(_(u'cr_test_template.enterprise_ddos_attack_analyze.topology_description')),
                'attack_task': translatable_string(_(u'cr_test_template.enterprise_ddos_attack_analyze.attack_task')),
                'attack_steps': translatable_string(_(u'cr_test_template.enterprise_ddos_attack_analyze.attack_steps')),
                'attack_criteria': translatable_string(_(u'cr_test_template.enterprise_ddos_attack_analyze.attack_criteria')),
                'defense_task': translatable_string(_(u'cr_test_template.enterprise_ddos_attack_analyze.defense_task')),
                'defense_steps': translatable_string(_(u'cr_test_template.enterprise_ddos_attack_analyze.defense_steps')),
                'defense_criteria': translatable_string(_(u'cr_test_template.enterprise_ddos_attack_analyze.defense_criteria')),
                'traffic_direction': translatable_string(_(u'cr_test_template.enterprise_ddos_attack_analyze.traffic_direction'))
            },
            {
                'name': translatable_string(_(u'APT Attack Analyze')),
                'bpt_name': 'Exercise3/CR_Exercise3-1_Basic_Benchmark.bpt,Exercise3/CR_Exercise3-2_Spam_Download.bpt,Exercise3/CR_Exercise3-3_Mal_URL_Access.bpt,Exercise3/CR_Exercise3-3_URL_Clicks.bpt,Exercise3/CR_Exercise3-4_Compromise_Adobe.bpt,Exercise3/CR_Exercise3-4_Compromise_Microsoft_ph2.bpt,Exercise3/CR_Exercise3-5_Botmaster_Callback.bpt,Exercise3/CR_Exercise3-6_CXO_Data_Loss.bpt',
                'type': u'ENTERPRISE',
                'description': translatable_string(_(u'cr_test_template.enterprise_apt_attack_analyze.description')),
                'topology_image': u'static/images/enterprise_apt_attack_analyze.jpg',
                'topology_description': translatable_string(_(u'cr_test_template.enterprise_apt_attack_analyze.topology_description')),
                'attack_task': translatable_string(_(u'cr_test_template.enterprise_apt_attack_analyze.attack_task')),
                'attack_steps': translatable_string(_(u'cr_test_template.enterprise_apt_attack_analyze.attack_steps')),
                'attack_criteria': translatable_string(_(u'cr_test_template.enterprise_apt_attack_analyze.attack_criteria')),
                'defense_task': translatable_string(_(u'cr_test_template.enterprise_apt_attack_analyze.defense_task')),
                'defense_steps': translatable_string(_(u'cr_test_template.enterprise_apt_attack_analyze.defense_steps')),
                'defense_criteria': translatable_string(_(u'cr_test_template.enterprise_apt_attack_analyze.defense_criteria')),
                'traffic_direction': translatable_string(_(u'cr_test_template.enterprise_apt_attack_analyze.traffic_direction'))
            }
        ]

        for case in cases:
            db.add(TestCases(name=case['name'],
                type=case['type'],
                bpt_name=case['bpt_name'],
                description=case['description'],
                topology_image=case['topology_image'],
                topology_description=case['topology_description'],
                attack_task=case['attack_task'],
                attack_steps=case['attack_steps'],
                attack_criteria=case['attack_criteria'],
                defense_task=case['defense_task'],
                defense_steps=case['defense_steps'],
                traffic_direction=case['traffic_direction'],
                defense_criteria=case['defense_criteria']))
            transaction.commit()

        recent_news = [
            {
                'title': translatable_string(_(u'Introduce CYBER RANGE')),
                'description': translatable_string(_(u'recent_news_introduce.description')),
                'link': u'http://www.ixiacom.com',
                'date': datetime.now()
            },
            {
                'title': translatable_string(_(u'How to use CYBER RANGE')),
                'description': translatable_string(_(u'recent_news_use.description')),
                'link': u'http://www.ixiacom.com',
                'date': datetime.now()
            }
        ]

        for news in recent_news:
            db.add(RecentNews(title=news['title'],
                description=news['description'],
                link=news['link'],
                date=news['date']))
            transaction.commit()

        db.add(TestMessage(test_id=0,
                           message=translatable_string(_(u'All tests can be run using either IPv4 packets or IPv6 packets. Just input your addresses in the appropriate format.')),
                           status=u'Result'))
        transaction.commit()

        db.add(Portlet(name=translatable_string(_(u'Welcome')), content_type=1, portlet_content=translatable_string(_(u'portlet.welcome.content')), default_column=u'.l-portlet-column', div_id_name=u'welcome'))
        db.add(Portlet(name=translatable_string(_(u'Recent News')), content_type=4, portlet_content=translatable_string(_(u'portlet.recent_news.content')), default_column=u'.l-portlet-column', div_id_name=u'recent-news-template'))
        db.add(Portlet(name=translatable_string(_(u'Enterprise Security Cases')), content_type=4, portlet_content=translatable_string(_(u'portlet.enterprise_security_cases.content')), default_column=u'.r-portlet-column', div_id_name=u'enterprise-security-cases-template'))
        db.add(Portlet(name=translatable_string(_(u'Host Security Cases')), content_type=4, portlet_content=translatable_string(_(u'portlet.host_security_cases.content')), default_column=u'.r-portlet-column', div_id_name=u'host-security-cases-template'))
        transaction.commit()

        db.add(IxiaVersion(version=unicode(ixiacr_version),
                   build=u'1.00.0001',
                   last_updated=datetime.now()))
        transaction.commit()

if __name__ == "__main__":
    pass