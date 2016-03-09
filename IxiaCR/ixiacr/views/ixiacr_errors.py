from pyramid.response import Response
from pyramid.httpexceptions import HTTPSeeOther
from pyramid.security import NO_PERMISSION_REQUIRED
from pyramid.view import view_config
from pyramid.url import route_url
from ixiacr.lib import ixiacr_logger

ixiacrlogger = ixiacr_logger.IxiaLogger(__name__)

def view_includes(config):
    config.add_view(notfound)
    config.add_view(forbidden)

@view_config(renderer='ixiacr:templates/error_page.jinja2',
             context='pyramid.httpexceptions.HTTPNotFound', permission=NO_PERMISSION_REQUIRED)
@view_config(renderer='ixiacr:templates/error_page.jinja2',
             context='pyramid.httpexceptions.HTTPInternalServerError', permission=NO_PERMISSION_REQUIRED)
def notfound(self, request):
    ixiacrlogger.debug('Entering: ixia_errors.notfound')
    request.response.status = self.status
    ds="-"*19 #Dashes
    ixiacrlogger.error('ixia_errors.notfound:\
        \n{0} Request {1}\n {2}\
        \n{3} Url     {4}\n {5}\
        \n{6} Status  {7}\n {8}'.format(ds, ds, request,
                                        ds, ds, request.url,
                                        ds, ds, self.status))
    ixiacrlogger.debug('Exiting: ixia_errors.notfound')
    return {'code': self.code, 'title': self.title,
            'message': self.explanation, 'url': request.host}

@view_config(renderer='ixiacr:templates/login.jinja2',
             context='pyramid.httpexceptions.HTTPForbidden', permission=NO_PERMISSION_REQUIRED)
def forbidden(self, request):
    ixiacrlogger.warn('Forbidden request; url={0}'.format(request.url))
    return HTTPSeeOther(route_url('login', request))