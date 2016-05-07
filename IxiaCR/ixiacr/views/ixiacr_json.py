import time
import json
from pyramid.i18n import (TranslationStringFactory,
                          get_locale_name)
from decimal import *

from sqlalchemy.exc import DBAPIError
from sqlalchemy.sql import or_

from pyramid.response import Response
from pyramid.view import view_config
from ixiacr.models import *
from ixiacr.lib.utils import (admin_helper, get_build_number)
from ixiacr.lib import ixiacr_logger

ixiacrlogger = ixiacr_logger.IxiaLogger(__name__)

_ = TranslationStringFactory('messages')


# View Includes is called in the main application for mapping URLs to strings.
def view_includes(config):
    config.add_route('get_ixiacr_tests', '/ixia/get_ixiacr_tests.json')
    config.add_view(get_ixiacr_tests, route_name='get_ixiacr_tests',
                    renderer='json', permission='all_access')
    config.add_route('get_recent_news', '/ixia/get_recent_news.json')
    config.add_view(get_recent_news, route_name='get_recent_news',
                    renderer='json', permission='all_access')
    config.add_route('get_users', '/ixia/get_users.json')
    config.add_view(get_users, route_name='get_users', renderer='json',
                    permission='all_access')
    config.add_route('get_global_settings',
                     '/ixia/get_global_settings.json')
    config.add_view(get_global_settings, route_name='get_global_settings',
                    renderer='json', permission='all_access')
    config.add_route('get_result_history', '/ixia/get_result_history.json')
    config.add_view(get_result_history, route_name='get_result_history',
                    renderer='json', permission='all_access')
    config.add_route('get_results', '/ixia/get_results.json/{result_id}')
    config.add_view(get_results, route_name='get_results', renderer='json',
                    permission='all_access')
    config.add_route('get_disk_info',
                     '/ixia/get_disk_info')
    config.add_view(get_disk_info, route_name='get_disk_info',
                    renderer='json', permission='all_access')
    config.add_route('get_portlets', '/ixia/get_portlets.json')
    config.add_view(get_portlets, route_name='get_portlets', renderer='json',
                    permission='all_access')
    config.add_route('get_devices', '/ixia/get_devices.json')
    config.add_view(get_devices, route_name='get_devices', renderer='json',
                    permission='all_access')


# Encode Python Decimals to JSON
class DecimalEncoder(json.JSONEncoder):
    def _iterencode(self, o, markers=None):
        if isinstance(o, Decimal):
            return (str(o) for o in [o])
        return super(DecimalEncoder, self)._iterencode(o, markers)


# JSON Output
@view_config(name='get_global_settings', renderer='json')
def get_global_settings(request):
    # JSON feed that is responsible for the local_chassis
    # network information in the administration area.

    do_reload = request.params.get('reload', 0)

    # Try cache first
    #if not do_reload and 'global_settings' in request.session:
    #    return request.session['global_settings']

    items = {}

    # Get some utils for getting the global settings back to the UI
    global_start = time.time()
    ixiacrlogger.debug('Start: get_global_settings')
    try:
        (result, obj, err) = admin_helper('get-network-config', {})
        network_config = obj

        items.update({'host': network_config['address'],
                      'netmask': network_config['netmask'],
                      'gateway': network_config['gateway'],
                      'hostname': network_config['hostname'],
                      'mac_address': ''})
        build_number = get_build_number()
        items.update(dict({'build_number': build_number or "Unknown"}))

        # Check for updates
        #updater = Updater(db)
        #available_updates, newest_build = updater.get_update_info()
        items['updates'] = {'available_updates': 'true', 'newest_build': '1.00.0002'}

        stop = time.time()

        ixiacrlogger.debug('End: get_global_settings completed at %.3f seconds' %
                         float(stop - global_start))

        request.session['global_settings'] = items
        return items

    except Exception, e:
        ixiacrlogger.exception('Exception: get_global_settings -- ' + format(e))
        return {"result": "FAILURE", "messages": [{"is_error": True,
                                                   "header": "Failed",
                                                   "content": "FAILED: {0}"
                                                   .format(e)}]}


@view_config(name='get_disk_info', renderer='json')
def get_disk_info(request):
    # JSON feed that is responsible for the disk info

    disk_info = {}

    # Get some utils for getting the global settings back to the UI
    ixiacrlogger.debug('Start: get_disk_info')
    try:
        (result, disk_info, err) = admin_helper('get-disk-info', {})
        return disk_info

    except Exception, e:
        ixiacrlogger.exception('Exception: get_disk_info -- ' + format(e))
        return {"result": "FAILURE", "messages": [{"is_error": True,
                                                   "header": "Failed",
                                                   "content": "FAILED: {0}"
                                                   .format(e)}]}


@view_config(name='get_display_messages', renderer='json')
def get_display_messages(request):
    lang = get_locale_name(request)

    # Try cache first
    if 'display_messages' in request.session:
        return request.session['display_messages']

    try:
        messages = map(lambda m: m.message.get_translation(lang),
                       TestMessage.query.filter_by(test_id=0).all())

        request.session['display_messages'] = messages

        return messages

    except DBAPIError, e:
        return Response("Error: DB Error: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)
    except Exception, e:
        return Response("Exception: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)


@view_config(name='get_result_history', renderer='json')
def get_result_history(request):
    lang = get_locale_name(request)
    # JSON feed that is responsible for getting the
    # result history used in the dashboard area.
    items = {
        'total_number': 0,
        'data': list()
    }
    result_id = request.params.get('result_id', None)
    results = []
    try:
        return items

    except DBAPIError, e:
        return Response("Error: DB Error: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)
    except Exception, e:
        return Response("Exception: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)


@view_config(name='get_ixiacr_tests', renderer='json')
def get_ixiacr_tests(request):
    lang = get_locale_name(request)
    # JSON feed that is responsible for the ixiacr_tests.
    test_id = request.params.get('test_id', None)

    tests = TestCases.query.filter(TestCases.active=='1').order_by(TestCases.id.desc()).all()
    items = []
    try:
        for test in tests:
            config = {
                "id": test.id,
                "name": test.name.get_translation(lang),
                "bpt_name": test.bpt_name,
                "type": test.type,
                "description": test.description.get_translation(lang),
                #"duration": test.duration,
                "topology_image": test.topology_image,
                "topology_description": test.topology_description.get_translation(lang),
                "attack_task": test.attack_task.get_translation(lang),
                "attack_steps": test.attack_steps.get_translation(lang),
                "attack_criteria": test.attack_criteria.get_translation(lang),
                "defense_task": test.defense_task.get_translation(lang),
                "defense_steps": test.defense_steps.get_translation(lang),
                "defense_criteria": test.defense_criteria.get_translation(lang),
                "traffic_direction": test.traffic_direction.get_translation(lang)
            }
            items.append(config)

        return items

    except DBAPIError, e:
        return Response("Error: DB Error: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)
    except Exception, e:
        return Response("Exception: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)


@view_config(name='get_recent_news', renderer='json')
def get_recent_news(request):
    lang = get_locale_name(request)

    items = []
    try:
        recent_news = RecentNews.query.filter(RecentNews.id >= 0).order_by(RecentNews.id).all()
        for news in recent_news:
            config = {
                "id": news.id,
                "title": news.title.get_translation(lang),
                "link": news.link,
                "description": news.description.get_translation(lang),
                "date": str(news.date)
            }
            items.append(config)

        return items

    except DBAPIError, e:
        return Response("Error: DB Error: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)
    except Exception, e:
        return Response("Exception: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)


@view_config(name='get_portlets', renderer='json')
def get_portlets(request):
    lang = get_locale_name(request)

    def portlet_model(p):
        return {
            'id': p.id,
            'name': p.name.get_translation(lang) if p.name else None,
            'content_type': p.content_type,
            'portlet_content': p.portlet_content.get_translation(
                lang) if p.portlet_content else None,
            'default_column': p.default_column,
            'div_id_name': p.div_id_name
        }

    try:
        return map(portlet_model, Portlet.query.all())

    except DBAPIError, e:
        return Response("Error: DB Error: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)
    except Exception, e:
        return Response("Exception: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)


@view_config(name='get_users', renderer='json')
def get_users(request):
    items = []

    try:
        for user in User.query.all():
            items.append(dict(user.todict()))
        return items

    except DBAPIError, e:
        return Response("Error: DB Error: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)
    except Exception, e:
        return Response("Exception: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)


@view_config(name='get_location_tags', renderer='json')
def get_location_tags(request):
    items = []

    try:
        for tag in db.execute("SELECT DISTINCT tag_val "
                              "FROM spirent_tags"
                              " WHERE tag_key='location'").fetchall():
            items.append(tag[0])
        return items

    except DBAPIError, e:
        return Response("Error: DB Error: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)
    except Exception, e:
        return Response("Exception: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)


@view_config(name='get_test_state', renderer='json')
def get_test_state(request):
    try:
        return None

    except DBAPIError, e:
        return Response("Error: DB Error: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)
    except Exception, e:
        return Response("Exception: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)


@view_config(name='get_result_series', renderer='json')
def get_result_series(request):
    """The result data as JSON returned from the database when running the
    test.  See the wiki page for the specifics.

    :param tab: The UI tab index selected.
    :type tab: Integer
    :param idx: The UI test result index.
    :type idx: Integer
    :returns: JSON The JSON result data.
    :raises: Exception

    """
    test_id = None
    try:
        return dict({'lastUpdated': '',
                     'percentage_complete': '',
                     'timeElapsed': '',
                     'EndOfStream': '',
                     'data': ''})

    except Exception, e:
        ex_msg = 'Failed to retrieve results: {0}'.format(e)
        ixiacrlogger.exception(ex_msg)
        ixiacrlogger.error('test_id={0}; request.session={1}'.format(test_id, str(request.session)))
        return {'message': ex_msg}


@view_config(name='request_final_table', renderer='json')
def request_final_table(request):
    try:
        return dict({'status': '',
                     'display_message': '',
                     'players': '',
                     'result_id': ''})

    except Exception, e:
        ixiacrlogger.exception('Failed in ixiacr_json get_results: {0}'.format(e))


@view_config(name='get_results', renderer='json')
def get_results(request):
    """This is the result history JSON feed.

        :param result_id: test_result.id (TestResult)

    """
    if 'result_id' in request.matchdict:
        result_id = request.matchdict['result_id']
    else:
        return {'response': 'Failed: No result_id in request.'}

    try:
        return {
            'result_sets': '',
            'detail_table': {
                'display_message': '',
                'players': ''
            }
        }

    except Exception, e:
        ex_msg = 'Failed in ixiacr_json get_results: {0}'.format(e)
        ixiacrlogger.exception(ex_msg)
        return {'response': ex_msg}


@view_config(name='get_devices', renderer='json')
def get_devices(request):
    # JSON feed for tracks
    devices = []

    try:
        for device in Device.query.all():
            devices.append({'name': device.name,
                      'description': device.description,
                      'device_type_id': device.device_type_id,
                      'host': device.host,
                      'link': device.link,
                      'username': device.username,
                      'password': device.password,
                      'active': device.active})

        return devices

    except DBAPIError, e:
        return Response("Error: DB Error: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)
    except Exception, e:
        return Response("Exception: {0}".format(e),
                        content_type='text/plain',
                        status_int=500)