from datetime import datetime, timedelta
from pyramid.i18n import TranslationStringFactory

import transaction
from pyramid.httpexceptions import HTTPFound
from pyramid.security import remember, forget, NO_PERMISSION_REQUIRED
from pyramid.url import route_url
from pyramid_handlers import action
from sqlalchemy import asc

import ixiacr.handlers.base as base
from ixiacr.models import *
from ixiacr.lib import IxiaLogger
from ixiacr.lib.session_key_value import SessionKeyValueStore
from ixiacr.lib.utils import get_global_vars

# auth
ixiacrlogger = IxiaLogger(__name__)

_ = TranslationStringFactory('messages')


def view_includes(config):
    # Auth handlers
    config.add_handler('login', '/login', 'ixiacr.handlers.auth:AuthHandler', action='login',
                       permission=NO_PERMISSION_REQUIRED)
    config.add_handler('logout', '/logout', 'ixiacr.handlers.auth:AuthHandler', action='logout')


class AuthHandler(base.Handler):
    @action(renderer='login.jinja2')
    def login(self):
        # basic auth/login for the  application
        ixiacrlogger.debug('Entering: login')
        session = self.request.session
        remote_addr = self.request.headers.get('Remote-Eu', '127.0.0.1')
        username = self.request.params.get('username', None)
        password = self.request.params.get('password', None)
        remember_me = self.request.params.get('remember_me', None)
        invoke_override = self.request.params.get('override_user', None)
        message = ''
        cred_message = _('Please check your login credentials and try again.')
        error_message = _('User "${user}" is currently logged in from host address: "${address}" '
                          'Please wait, or override this user to continue.')
        try:
            if username and password:
                user = User.by_username(username)
                if user and user.validate_password(password):
                    headers = remember(self.request, user.id)
                    elapsed_time = datetime.now() - user.last_login
                    another_user_logged_in = (
                        user.session_id and
                        elapsed_time < timedelta(minutes=31) and
                        user.remote_addr != remote_addr)

                    if another_user_logged_in:
                        if not invoke_override:
                            ixiacrlogger.warn("Someone is already logged in, "
                                             "so sending back to login.")
                            message = self.localizer.translate(
                                error_message, mapping={'user': user.username,
                                                        'address': user.remote_addr})
                            return {'username': username, 'password': password,
                                    'message': message, 'invoke_override': True,
                                    'global_vars': get_global_vars()}
                        else:
                            ixiacrlogger.warn('User invoking override to login; '
                                            'user={0}; remote_addr={1}'.format(
                                            user.username, user.remote_addr))

                    if remember_me:
                        session['username'] = username
                        session['password'] = password
                        session.save()

                    cookie = headers[0][1]
                    user.update_session(cookie[cookie.index('=') + 1:cookie.index('!')], remote_addr)

                    transaction.commit()

                    return HTTPFound(location='/', headers=headers)

            if self.request.method == 'POST':
                if username and invoke_override:
                    user = User.by_username(username)
                    cm = self.localizer.translate(cred_message)
                    em = self.localizer.translate(
                        error_message, mapping={'user': user.username,'address': user.remote_addr})
                    message = cm + "<br><br>" + em
                else:
                    message = self.localizer.translate(cred_message)

            return {'username': username,
                    'password': password,
                    'message': message,
                    'invoke_override': invoke_override,
                    'global_vars': get_global_vars()}
        except Exception, e:
            ixiacrlogger.exception("Exception: {0}".format(str(e)))
        finally:
            ixiacrlogger.debug('Exiting: login')

    def logout(self):
        try:
            if self.user_id:
                user = User.by_id(self.user_id)
                user.update_session()

                transaction.commit()

                kv_store = SessionKeyValueStore(db, self.session._session().id)
                kv_store.remove_all()
                transaction.commit()

            self.session.invalidate()
            self.session.delete()

        except Exception, e:
            ixiacrlogger.exception('Excepted: {0}'.format(str(e)))
            transaction.abort()
        finally:
            ixiacrlogger.debug('Exiting: logout')
            headers = forget(self.request)
            login_url = route_url('login', self.request)
            return HTTPFound(location=login_url, headers=headers)
