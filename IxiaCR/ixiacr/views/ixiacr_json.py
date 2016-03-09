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
from ixiacr.lib.utils import admin_helper
from ixiacr.lib import ixiacr_logger

ixiacrlogger = ixiacr_logger.IxiaLogger(__name__)

_ = TranslationStringFactory('messages')


# View Includes is called in the main application for mapping URLs to strings.
def view_includes(config):
    config.add_route('get_ixiacr_tests', '/ixia/get_ixiacr_tests.json')
    config.add_view(get_ixiacr_tests, route_name='get_ixiacr_tests',
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
    if not do_reload and 'global_settings' in request.session:
        return request.session['global_settings']

    items = {}

    # Get some utils for getting the global settings back to the UI
    global_start = time.time()
    ixiacrlogger.debug('Start: get_global_settings')
    try:
        config = Configs.by_id(1)
        return {'bps': config.bps,
                'atip': config.atip,
                'splunk': config.splunk,
                'kali': config.kali,
                'metasploit': config.metasploit,
                'ips': config.ips,
                'ngfw': config.ngfw,
                'dlp': config.dlp,
                'windows': config.windows}

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
    # JSON feed that is responsible for the ixiacr_tests.
    test_id = request.params.get('test_id', None)
    tests = IxiaTest.query.filter(IxiaTest.active=='true').order_by(IxiaTest.id.desc()).all()

    try:
        return tests

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
