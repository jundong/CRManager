# -*- coding: utf-8 -*-
from pyramid.i18n import TranslationStringFactory, get_locale_name
from datetime import datetime, timedelta
from pyramid_handlers import action
from pyramid.httpexceptions import HTTPFound
from pyramid.security import forget
from pyramid.url import route_url

from ixiacr.models import *
from ixiacr.handlers import base
from ixiacr.lib.utils import get_global_vars
from ixiacr.lib import IxiaLogger

ixiacrlogger = IxiaLogger(__name__)

_ = TranslationStringFactory('messages')


def view_includes(config):
    config.add_handler('main', '/', 'ixiacr.handlers.core:IxiaCoreHandler',
                       action='index',
                       path_info=r'/(?!favicon\.ico|robots\.txt|w3c)')
    config.add_handler('manufacturing', '/manufacturing',
                       'ixiacr.handlers.core:IxiaCoreHandler',
                       action='manufacturing')
    config.add_handler('administration_tmpl', '/html/administration_tmpl',
                       'ixiacr.handlers.core:IxiaTemplateHandler',
                       action='administration_tmpl')
    config.add_handler('dashboard_tmpl', '/html/dashboard_tmpl',
                       'ixiacr.handlers.core:IxiaTemplateHandler',
                       action='dashboard_tmpl')    
    config.add_handler('helpcenter_tmpl', '/html/helpcenter_tmpl',
                       'ixiacr.handlers.core:IxiaTemplateHandler',
                       action='helpcenter_tmpl')
    config.add_handler('calendar_tmpl', '/html/calendar_tmpl',
                       'ixiacr.handlers.core:IxiaTemplateHandler',
                       action='calendar_tmpl')    
    config.add_handler('history_tmpl', '/html/history_tmpl',
                       'ixiacr.handlers.core:IxiaTemplateHandler',
                       action='history_tmpl')    
    config.add_handler('lightbox_tmpl', '/html/lightbox_tmpl',
                       'ixiacr.handlers.core:IxiaTemplateHandler',
                       action='lightbox_tmpl')
    config.add_handler('test_configuration_tmpl', '/html/test_configuration_tmpl',
                       'ixiacr.handlers.core:IxiaTemplateHandler',
                       action='test_configuration_tmpl')
    config.add_handler('test_documentation_tmpl', '/html/test_documentation_tmpl',
                       'ixiacr.handlers.core:IxiaTemplateHandler',
                       action='test_documentation_tmpl')
    config.add_handler('test_results_tmpl', '/html/test_results_tmpl',
                       'ixiacr.handlers.core:IxiaTemplateHandler',
                       action='test_results_tmpl')
    config.add_handler('test_tmpl', '/html/test_tmpl',
                       'ixiacr.handlers.core:IxiaTemplateHandler',
                       action='test_tmpl')

                                                                         
class IxiaCoreHandler(base.Handler):
    '''This is the main handler for the application template.
    We use AJAX with JSON to handle all most all of the data to the front-end.
    Most of which can be found in ixiacr/views/ixiacr_json.py

    '''
    @action(renderer='index.jinja2', permission='all_access')
    def index(self):

        # Get current authenticated user object.
        user = User.by_id(self.user_id)
        username = user.username
        full_name = user.full_name
        language = get_locale_name(self.request)

        session_expired = False
        if user.session_id and user.last_login:
            elapsed_time = datetime.now() - user.last_login
            if elapsed_time >= timedelta(minutes=31):
                session_expired = True

        if session_expired:
            login_url = route_url('logout', self.request)
            headers = forget(self.request)
            return HTTPFound(location=login_url, headers=headers)

        return {'username': username,
                'name': full_name,
                'language': language,
                'model': None,
                'global_vars': get_global_vars()}

    @action(renderer='manufacturing.jinja2', permission='all_access')
    def manufacturing(self):
        return {'name': 'Tomahawk'}


class IxiaTemplateHandler(base.Handler):
    '''This is the main template handler for all templates/html/ jinja2'd for
    internationalization use.
    All static hardcoded text will need to keyed and stored somewhere...

    '''
    @action(renderer='html/administration.tmpl.jinja2', permission='all_access')
    def administration_tmpl(self):
        return {}

    @action(renderer='html/dashboard.tmpl.jinja2', permission='all_access')
    def dashboard_tmpl(self):
        # devices = {}
        # for device in Device.query.all():
        #     devices[device.name] = device.host
        #
        # return {'devices': devices}
        return {}

    @action(renderer='html/helpcenter.tmpl.jinja2', permission='all_access')
    def helpcenter_tmpl(self):
        return {}

    @action(renderer='html/calendar.tmpl.jinja2', permission='all_access')
    def calendar_tmpl(self):
        return {}

    @action(renderer='html/history.tmpl.jinja2', permission='all_access')
    def history_tmpl(self):
        return {}

    @action(renderer='html/lightbox.tmpl.jinja2', permission='all_access')
    def lightbox_tmpl(self):
        return {}

    @action(renderer='html/test.configuration.tmpl.jinja2', permission='all_access')
    def test_configuration_tmpl(self):
        return {}

    @action(renderer='html/test.documentation.tmpl.jinja2', permission='all_access')
    def test_documentation_tmpl(self):
        return {}

    @action(renderer='html/test.results.tmpl.jinja2', permission='all_access')
    def test_results_tmpl(self):
        return {}

    @action(renderer='html/test.tmpl.jinja2', permission='all_access')
    def test_tmpl(self):
        return {}
