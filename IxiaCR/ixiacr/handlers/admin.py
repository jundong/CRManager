"""
.. module:: admin
   :synopsis: A module that encapsulates most of the administrative
   functionality for Ixia.


"""
import time

import transaction
from pyramid.i18n import TranslationStringFactory, get_locale_name
from sqlalchemy.exc import DBAPIError
from pyramid.security import authenticated_userid
from pyramid_handlers import action
from pyramid.response import Response

from ixiacr.handlers import base
from ixiacr.models import *
from ixiacr.tasks import (reset_db_task,
                              reboot_task,
                              shutdown_task)
from ixiacr.lib import IxiaLogger
from ixiacr.lib.utils import admin_helper
ixiacrlogger = IxiaLogger(__name__)

_ = TranslationStringFactory('messages')


def view_includes(config):
    # Admin handlers
    config.add_handler('verify_password', '/ixia/verify_password.json',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='verify_password')
    config.add_handler('add_user', '/ixia/add_user.json',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='add_user')
    config.add_handler('verify_user', '/ixia/verify_user.json',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='verify_user')
    config.add_handler('set_admin_password', '/ixia/set_admin_password',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='set_admin_password')
    config.add_handler('get_language', '/ixia/get_language',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='get_language')
    config.add_handler('set_language', '/ixia/set_language',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='set_language')
    config.add_handler('get_ixiacr_logs', '/ixia/get_ixiacr_logs',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='get_ixiacr_logs')
    config.add_handler('reboot_ixiacr', '/ixia/reboot_ixiacr',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='reboot_ixiacr')
    config.add_handler('shutdown_ixiacr', '/ixia/shutdown_ixiacr',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='shutdown_ixiacr')
    config.add_handler('reset_eula', '/ixia/reset_eula',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='reset_eula')
    config.add_handler('save_device', '/ixia/save_device',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='save_device')
    config.add_handler('save_port', '/ixia/save_port',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='save_port')
    config.add_handler('check_updates', '/ixia/check_updates',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='check_updates')
    config.add_handler('get_updates', '/ixia/upgrade_device',
                       'ixiacr.handlers.admin:IxiaAdminHandler',
                       action='get_updates')


class IxiaAdminHandler(base.Handler):
    """This is the class container holding the methods that perform the
    majority of the Create, Update and Delete functionality for the Ixia
    application.

    """
    @action(renderer='json')
    def reset_eula(self):
        """This space was left blank because Python is self-documenting.

        """
        self.messages = []
        ixiacrlogger.info('Entering: reset_eula')
        try:
            # Get all of the Eulas and delete 'em.
            for user in User.query.all():
                for eula in user.eulas:
                    user.eulas.remove(eula)

            transaction.commit()

            return Response(self.localizer.translate(
                _("User Eulas were successfully reset.")))

        except Exception, e:
            ixiacrlogger.exception('reset_eula: Exception. %s' % e)
            self.messages.append(dict(
                {'is_error': True, 'header': 'Failed', 'content': str(e)}))
            return {'result': 'FAILURE', 'messages': self.messages}

    @action(renderer='json')
    def verify_password(self):
        """Verify password

        """
        self.messages = []
        ixiacrlogger.info('Entering: verify_password')
        try:
            data = self.request.json_body
            u = User.by_id(authenticated_userid(self.request))

            if not u.validate_password(data['password']):
                ixiacrlogger.debug('Exiting: verify_password')
                return {"result": "FAILURE",
                        "messages": [{"header": "Failed",
                                      "content": self.localizer.translate(
                                          _("Passwords do not match."))}]}

            ixiacrlogger.debug('Exiting: verify_password')
            return {"result": "SUCCESS",
                    "messages": [{"header": "Success",
                                  "content": self.localizer.translate(
                                      _("Password matches input."))}]}

        except Exception, e:
            ixiacrlogger.exception('verify_password: Exception. %s' % e)
            self.messages.append({'is_error': True, 'header': 'Success',
                                  'content': self.localizer.translate(
                                      _('Failed in verify passwords.'))})
            return {'result': 'SUCCESS', 'messages': self.messages}

    @action(renderer='json')
    def set_admin_password(self):
        """Set admin password

        """
        ixiacrlogger.debug('Entering: set_admin_password')
        self.messages = []
        try:
            data = self.request.json_body
            su = User.by_id(authenticated_userid(self.request))
            su._set_password(data['password'])

            transaction.commit()
            err = None

            # do more here but for now just ...
            ixiacrlogger.debug('Exiting: set_admin_password')
            self.messages.append(
                {'is_error': False if err is None else True,
                 'header': 'Success' if err is None else 'Failed',
                 'content': self.localizer.translate(
                     _('Successfully saved test.') if err is None else
                     _('Failed to save admin password.'))})
            return {'result': 'SUCCESS', 'messages': self.messages}

        except Exception, e:
            ixiacrlogger.exception('set_admin_password: Exception. %s' % e)
            self.messages.append(dict(
                {'is_error': True, 'header': 'Failed', 'content': str(e)}))
            return {'result': 'FAILURE', 'messages': self.messages}

    @action(renderer='json')
    def add_user(self):
        """Set admin password

        """
        ixiacrlogger.debug('Entering: add_user')
        self.messages = []

        try:
            data = self.request.json_body
            auth_group = Group.query.filter_by(name='admin').first()

            # add them to the db session
            auth_user = User(username=data['username'], email=data['username'],
                      first_name=data['firstname'], last_name=data['lastname'], remote_addr=u'127.0.0.1')
            auth_user.groups.append(auth_group)
            auth_user._set_password(data['password'])
            db.add(auth_user)
            transaction.commit()

            # do more here but for now just ...
            ixiacrlogger.debug('Exiting: add_user')
            self.messages.append(
                {'is_error': False,
                 'header': 'Success',
                 'content': self.localizer.translate(
                     _('Successfully added user.'))})
            return {'result': 'SUCCESS', 'messages': self.messages}

        except Exception, e:
            ixiacrlogger.exception('add_user: Exception. %s' % e)
            self.messages.append(dict(
                {'is_error': True, 'header': 'Failed', 'content': str(e)}))
            return {'result': 'FAILURE', 'messages': self.messages}

    @action(renderer='json')
    def verify_user(self):
        """Verify password

        """
        self.messages = []
        ixiacrlogger.info('Entering: verify_user')
        try:
            data = self.request.json_body
            u = User.by_username(data['name'])

            if not u:
                ixiacrlogger.debug('Exiting: verify_user')
                return {"result": "FAILURE",
                        "messages": [{"header": "Failed",
                                      "content": self.localizer.translate(
                                          _("Duplicate User Name"))}]}

            ixiacrlogger.debug('Exiting: verify_user')
            return {"result": "SUCCESS",
                    "messages": [{"header": "Success",
                                  "content": self.localizer.translate(
                                      _("Username is valid."))}]}

        except Exception, e:
            ixiacrlogger.exception('verify_user: Exception. %s' % e)
            self.messages.append({'is_error': True, 'header': 'Success',
                                  'content': self.localizer.translate(
                                      _('Duplicate User Name'))})
            return {'result': 'SUCCESS', 'messages': self.messages}

    @action(renderer='json')
    def get_language(self):
        """Get language

        """
        ixiacrlogger.debug('Entering: get_language')
        self.messages = []
        try:
            ixiacrlogger.debug('Exiting: get_language')
            return {'result': 'SUCCESS',
                    'language': get_locale_name(self.request)}
        except Exception, e:
            ixiacrlogger.exception('get_language: Exception. %s' % e)
            self.messages.append(dict({'is_error': True,
                                       'header': 'Failed',
                                       'content': str(e)}))
            return {'result': 'FAILURE', 'messages': self.messages}

    @action(renderer='json')
    def set_language(self):
        """Set language

        """
        ixiacrlogger.debug('Entering: set_language')
        self.messages = []

        if 'display_messages' in self.request.session:
            # Bust cache
            del self.request.session['display_messages']

        try:
            data = self.request.json_body
            user = User.by_id(authenticated_userid(self.request))
            user.language = data['language']

            transaction.commit()

            ixiacrlogger.debug('Exiting: set_language')
            self.messages.append({'is_error': False,
                                  'header': 'Success',
                                  'content': self.localizer.translate(
                                      _('Successfully set language.'))})
            return {'result': 'SUCCESS',
                    'language': 'en',
                    'messages': self.messages}
        except Exception, e:
            transaction.abort()

            ixiacrlogger.exception('set_language: Exception. %s' % e)
            self.messages.append(dict({'is_error': True,
                                       'header': 'Failed',
                                       'content': str(e)}))
            return {'result': 'FAILURE', 'messages': self.messages}

    @action(renderer='json')
    def reset_factory(self):
        """Reset DB

        """
        ixiacrlogger.debug('Entering: reset_factory')
        self.messages = []
        try:
            res = reset_db_task.delay()
            ixiacrlogger.debug('Exitings: reset_factory')
            return {'task_id': res.task_id}
        except Exception, e:
            ixiacrlogger.exception('reset_factory: Exception. %s' % e)
            self.messages.append(dict(
                {'is_error': True, 'header': 'Failed', 'content': str(e)}))
            return {'result': 'FAILURE', 'messages': self.messages}

    @action(renderer='json')
    def reboot_ixiacr(self):
        """Reboot the entire system
        """
        ixiacrlogger.debug('Entering: reboot_ixiacr')
        try:
            res = reboot_task.delay()
            ixiacrlogger.debug('Exiting: reboot_ixiacr')
            return {'task_id': res.task_id}
        except Exception, e:
            ixiacrlogger.exception('reboot_ixiacr: Exception. %s' % e)
            self.messages.append(dict(
                {'is_error': True, 'header': 'Failed', 'content': str(e)}))
            return {'result': 'FAILURE', 'messages': self.messages}

    @action(renderer='json')
    def shutdown_ixiacr(self):
        """Shutdown the entire system
        """
        ixiacrlogger.debug('Entering: shutdown_ixiacr')
        try:
            # Delay 3 seconds to wait Logout Ixia
            time.sleep(3)
            res = shutdown_task.delay()
            return {'task_id': res.task_id}
        except Exception, e:
            ixiacrlogger.exception('shutdown_ixiacr: Exception. %s' % e)
            self.messages.append({'is_error': True, 'header': 'Failed',
                                       'content': str(e)})
            return {'result': 'FAILURE', 'messages': self.messages}
        finally:
            ixiacrlogger.debug('Exiting: shutdown_ixiacr')

    @action(renderer='json')
    def get_ixiacr_logs(self):
        """Generate a diagnostic bundle
        """
        ixiacrlogger.debug('Entering: IxiaAdminHandler.get_ixiacr_logs')
        self.messages = []
        try:
            (result, obj, err) = admin_helper('generate-diag-bundle',{})

            ixiacrlogger.debug('Exiting: IxiaAdminHandler.get_ixiacr_logs')
            return {'result': 'SUCCESS',
                    "messages": [{"is_error": False,
                                 "header": "Success",
                                 "content": obj}]}

        except Exception, e:
            ixiacrlogger.exception('IxiaAdminHandler.get_ixiacr_logs: '
                                 'Exception. %s' % e.message.encode('utf-8'))
            self.messages.append(dict({'is_error': True,
                                       'header': 'Failed',
                                       'content': e.message.encode('utf-8')}))
            return {'result': 'FAILURE', 'messages': self.messages}

    @action(renderer='json')
    def save_device(self):
        """Save device

        """
        self.messages = []
        self.items = []

        try:
            if 'devices' in self.request.session:
                # Bust cache
                del self.request.session['devices']

            data = self.request.json_body
            if 'id' in data:
                device = Device.query.filter_by(id=data['id']).first()
            else:
                device = Device.query.filter_by(name=data['name']).first()

            if device:
                device.host = data['host']
                device.link = data['link']
                db.add(device)
                db.flush()

            self.items.append({"id": device.id})

            if len(self.messages) == 0:
                self.messages.append({'is_error': False,
                                      'header': 'Success',
                                      'content': self.localizer.translate(
                                          _('Successfully saved device.'))})

            return {'result': 'SUCCESS', 'messages': self.messages,
                    'items': self.items}

        except KeyError, e:
            transaction.abort()
            self.messages.append(dict({'is_error': True,
                                       'header': 'Failed',
                                       'content': str(e)}))
            return {'result': 'FAILURE', 'messages': self.messages}
        except DBAPIError, e:
            transaction.abort()
            self.messages.append(dict({'is_error': True, 'header': 'Failed',
                                       'content': self.localizer.translate(
                                           _('Saving device failed. '
                                             'Perhaps this device already '
                                             'exists?'))}))
            return {'result': 'FAILURE', 'messages': self.messages}
        except Exception, e:
            transaction.abort()
            self.messages.append(dict({'is_error': True,
                                       'header': 'Failed',
                                       'content': str(e)}))
            return {'result': 'FAILURE', 'messages': self.messages}

    @action(renderer='json')
    def save_port(self):
        """Save device

        """
        self.messages = []
        id = None
        try:
            if 'ports' in self.request.session:
                # Bust cache
                del self.request.session['ports']

            data = self.request.json_body
            if 'id' in data:
                port = Port.query.filter_by(id=data['id']).first()
                if port:
                    port.slot = data['slot']
                    port.port0 = data['port0']
                    port.port1 = data['port1']
                    port.port2 = data['port2']
                    port.port3 = data['port3']
                    port.group = data['group']
                    port.selected = data['selected']
                    db.add(port)
                    db.flush()

                    id = port.id

            if len(self.messages) == 0:
                self.messages.append({'is_error': False,
                                      'header': 'Success',
                                      'content': self.localizer.translate(
                                          _('Successfully saved port.'))})

            return {'result': 'SUCCESS', 'messages': self.messages,
                    'id': id}

        except KeyError, e:
            transaction.abort()
            self.messages.append(dict({'is_error': True,
                                       'header': 'Failed',
                                       'content': str(e)}))
            return {'result': 'FAILURE', 'messages': self.messages}
        except DBAPIError, e:
            transaction.abort()
            self.messages.append(dict({'is_error': True, 'header': 'Failed',
                                       'content': self.localizer.translate(
                                           _('Saving port failed. '
                                             'Perhaps this device already '
                                             'exists?'))}))
            return {'result': 'FAILURE', 'messages': self.messages}
        except Exception, e:
            transaction.abort()
            self.messages.append(dict({'is_error': True,
                                       'header': 'Failed',
                                       'content': str(e)}))
            return {'result': 'FAILURE', 'messages': self.messages}

    @action(renderer='json')
    def check_updates(self):
        self.messages = []
        ixiacrlogger.debug('Entering: check_updates')
        try:
            #force_offline_check = True if self.request.params.get('offline', '1') == '1' else False

            #from ixiacr.lib.updater import Updater
            #updater = Updater(db)
            #available_updates, newest_build = updater.get_update_info()
            updates = {'available_updates': '1.00.0001', 'newest_build': '1.00.0005'}

            ixiacrlogger.debug('Exiting: check_updates')
            return {'result': 'SUCCESS', 'updates': updates}

        except Exception, e:
            ixiacrlogger.exception('check_updates: Exception. %s' % e)
            self.messages.append(dict(
                {'is_error': True, 'header': 'Failed', 'content': str(e)}))
            return {'result': 'FAILURE', 'messages': self.messages}

    @action(renderer='json')
    def get_updates(self):
        """This function gets Axon Updates.

        :returns:  JSON Object
        :raises: Exception

        """
        self.messages = []
        ixiacrlogger.debug('Entering: get_updates')
        try:
            ixiacrlogger.debug('Exiting: get_updates')
            return {'task_id': '1.1.1'}

        except Exception, e:
            ixiacrlogger.exception('get_updates: Exception. %s' % e)
            self.messages.append(dict(
                {'is_error': True, 'header': 'Failed', 'content': str(e)}))
            return {'result': 'FAILURE', 'messages': self.messages}


def is_blank(string):
    return string is None or len(string) == 0 or string.isspace()
