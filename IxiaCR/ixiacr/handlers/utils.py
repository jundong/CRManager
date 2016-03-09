import time
from json import loads, dumps
import urllib2
import urllib
import httplib
import os
import transaction


from pyramid_handlers import action
from pyramid.security import authenticated_userid

from ixiacr.handlers import base
from ixiacr.lib import IxiaLogger, UiLogger
from ixiacr.lib.utils import (admin_helper,
                            generate_file_object)
from ixiacr.models.core import (db, User)
from pyramid.security import NO_PERMISSION_REQUIRED

ixiacrlogger = IxiaLogger(__name__)
uilogger = UiLogger('UiLogger')

LOCAL_CHASSIS_IP = '169.254.0.3'
LOCALHOST = '127.0.0.1'


def view_includes(config):
    # Main (Tests etc.) handler
    config.add_handler('get_images',
                       '/ixia/get_images',
                       'ixiacr.handlers.utils:IxiaUtilHandler',
                       action='get_images',
                       permission=NO_PERMISSION_REQUIRED)
    config.add_handler('log_js',
                       '/ixia/log_js.json',
                       'ixiacr.handlers.utils:IxiaUtilHandler',
                       action='log_js')
    config.add_handler('update_user_timestamp',
                       '/ixia/update_user_timestamp',
                       'ixiacr.handlers.utils:IxiaUtilHandler',
                       action='update_user_timestamp',
                       permission=NO_PERMISSION_REQUIRED)


class IxiaUtilHandler(base.Handler):
    '''Utilities etc.

    '''
    @action(renderer='json')
    def get_images(self):
        path = os.path.join(os.getenv('IXIACR'), 'ixiacr/static/images')
        files = []

        try:
            for i in os.listdir(path):
                files.append(generate_file_object(i, path))

            return {'files': files}

        except Exception, e:
            ixiacrlogger.exception('IxiaUtilHandler: get_images: %s' % e)
            return {'result': 'FAILURE: %s' % e}

    @action(renderer='json')
    def log_js(self):
        """Log client side errors to server

        """
        self.messages = []
        ixiacrlogger.debug('Entering: log_js')

        try:
            data = self.request.json_body
            type = data['type'] if 'type' in data else 'Undefined'
            method = type.lower()
            try:
                method = getattr(uilogger, method)
            except AttributeError, e:
                # Trying to log an error with unsupported type, default to error
                method = uilogger.error

            message = data['message'] + ' ' if 'message' in data else ''
            method(message + dumps(data, indent=4))

            return {'result': 'SUCCESS'}

        except Exception, e:
            ixiacrlogger.exception('%s' % e)

            return {'result': 'FAILURE: %s' % e}
        finally:
            ixiacrlogger.debug('Exiting: log_js')

    @action(renderer='json')
    def update_user_timestamp(self):
        ixiacrlogger.debug('Entering: update_user_timestamp')
        #ixiacrlogger.info(str(self.request.cookies))
        #ixiacrlogger.info(str(self.request.cookies.get('auth_tkt')))
        self.messages = []
        ixiacrlogger.debug(str(self.request.cookies.get('auth_tkt').split('!')[0]))
        try:
            user = User.by_id(self.user_id)
            if user:
                if user.session_id != self.request.cookies.get('auth_tkt').split('!')[0]:
                    #return HTTPSeeOther(route_url('logout', self.request))
                    return {'result': 'FAILURE'}
                else:
                    user.update_session(user.session_id, user.remote_addr)
                    return {'result': 'SUCCESS'}
        except Exception, e:
            ixiacrlogger.exception('IxiaUtilHandler: update_user_timestamp: %s' % e)
            self.messages.append({'header': 'Failed', 'content': str(e)})
            return {'result': 'FAILURE', 'messages': self.messages}
        finally:
            ixiacrlogger.debug('Exiting: update_user_timestamp')