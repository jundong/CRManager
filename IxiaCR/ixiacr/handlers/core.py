# -*- coding: utf-8 -*-
from pyramid.i18n import TranslationStringFactory, get_locale_name
from datetime import datetime, timedelta
from pyramid_handlers import action
from pyramid.view import view_config
from pyramid.httpexceptions import HTTPFound
from pyramid.security import remember
from pyramid.security import forget
from pyramid.url import route_url

from ixiacr.models import *
from ixiacr.handlers import base
import transaction
from sqlalchemy import desc,asc
from ixiacr.lib.utils import get_global_vars
from ixiacr.lib import IxiaLogger

ixiacrlogger = IxiaLogger(__name__)

_ = TranslationStringFactory('messages')


def view_includes(config):
    config.add_handler('eula', '/eula',
                       'ixiacr.handlers.core:IxiaCoreHandler',
                       action='eula')
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

        if 'eula_accepted' in self.request.params:
            if self.request.params.get('eula_accepted') == 'true':
                #  They accepted
                latest_eula = Eula.query.order_by(asc(Eula.id)).first()
                # Add it to the session object
                user.eulas.append(latest_eula)
                # Append it to the current DB session
                db.add(user)
                # Commit the transaction
                transaction.commit()
            else:
                # Or just ixiacrlogger them out because this is weird
                # and should not ever happen...
                headers = forget(self.request)
                login_url = route_url('login', self.request, _scheme='https')
                return HTTPFound(location=login_url, headers=headers)
        else:
            # Get the current EULA
            latest_eula = Eula.query.order_by(asc(Eula.id)).first()
            # Now check to see if they have accepted it
            accepted_eula = Eula.query.join(user_eulas).\
                filter_by(user_id=user.id,
                          eula_id=latest_eula.id).\
                order_by(asc(Eula.id)).first()

            session_expired = False
            if user.session_id and user.last_login:
                elapsed_time = datetime.now() - user.last_login
                if elapsed_time >= timedelta(minutes=31):
                    session_expired = True

            if (latest_eula is not None and accepted_eula is None) or session_expired:
                login_url = route_url('logout', self.request, _scheme='https')
                headers = forget(self.request)
                return HTTPFound(location=login_url, headers=headers)

        model = None
        res = ChassisUtils.get_local_allocation_data()
        device_model_map = {
            "174a:0401": "10F-HP",
            "174a:0301": "10F-HP",
            "8086:150e": "1C",
            "174a:0901": "1C",
            "8086:10fb": "110CF"
        }
        if 'result' in res:
            id = res['result']['device_pci_id']
            model = device_model_map[id]

        return {'username': username,
                'name': full_name,
                'language': language,
                'model': model,
                'global_vars': get_global_vars()}

    @action(renderer='eula.jinja2', permission='all_access')
    def eula(self):
        lang = get_locale_name(self.request)
        latest_eula = Eula.query.order_by(asc(Eula.id)).first()
        return {'eula_content': latest_eula.content.get_translation(lang)}

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
