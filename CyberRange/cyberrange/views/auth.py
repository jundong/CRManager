from pyramid.response import Response

from cyberrange.scripts import logger
from pyramid.httpexceptions import HTTPFound
from pyramid.security import (
    remember,
    forget,
    )

from pyramid.view import (
    view_config,
    view_defaults
    )

from cyberrange.scripts.security import USERS

from sqlalchemy.exc import DBAPIError

crlog = logger.Logger(__name__)

def view_includes(config):
    config.add_route('login', '/login')
    config.add_route('logout', '/logout')

@view_defaults(renderer='cyberrange:templates/login.jinja2')
class AuthViews:
    def __init__(self, request):
        self.request = request
        self.logged_in = request.authenticated_userid

    @view_config(route_name='login', renderer='cyberrange:templates/login.jinja2')
    def login(self):
        request = self.request
        login_url = request.route_url('login')
        referrer = request.url
        if referrer == login_url:
            referrer = '/'  # never use login form itself as came_from
        came_from = request.params.get('came_from', referrer)
        message = ''
        login = ''
        password = ''
        if 'form.submitted' in request.params:
            login = request.params['login']
            password = request.params['password']
            if USERS.get(login) == password:
                headers = remember(request, login)
                return HTTPFound(location=came_from,
                                 headers=headers)
            message = 'Failed login'

        return dict(
            name='Login',
            message=message,
            url=request.application_url + '/login',
            came_from=came_from,
            login=login,
            password=password,
        )

    @view_config(route_name='logout')
    def logout(self):
        request = self.request
        headers = forget(request)
        url = request.route_url('home')

        return HTTPFound(location=url,
                         headers=headers)