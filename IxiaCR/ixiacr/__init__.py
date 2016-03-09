import pyramid_xmlrpc
import xmlrpclib
import os
import re
import sys
import time

from sqlalchemy import engine_from_config
from pyramid.config import Configurator
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.authentication import AuthTktAuthenticationPolicy as RemoteUserAuthenticationPolicy
from pyramid.security import Authenticated
from pyramid_beaker import session_factory_from_settings

from ixiacr.lib.wsgi_profiler import RequestProfiler
from ixiacr.models import *
from ixiacr.lib import IxiaLogger, init_ixiacr_logger
from ixiacr.lib.component_registry import register_component

ixiacrlogger = IxiaLogger(__name__)

# Venusian < 1.0a7 has a bug which prevents the ignore option in
# the config.scan below from actually working.  This fixes it.
# DO NOT REMOVE this unless you know what you're doing
import venusian
from ixiacr.patches import venusian_patch
from ixiacr.i18n.locale_negotiator import create_locale_negotiator

venusian.walk_packages = venusian_patch.walk_packages

PROJECT_PATH = os.path.abspath(os.path.dirname(__file__))
STC_LOGS_PATH = PROJECT_PATH+'/logs/'

def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    is_pserve = sys.argv[0] in [os.path.join(os.getenv('VENV'), 'bin/pserve'),
                                os.path.join(os.getenv('VENV'), 'bin/nosetests')]

    init_ixiacr_logger()

    # Query debugging fluff....
    def before_cursor_execute(conn, cursor, statement,
                            parameters, context, executemany):
        context._query_start_time = time.time()
        ixiacrlogger.debug("Start Query - statement: %s" % statement)
        ixiacrlogger.debug("Start Query - parameters: %s" % parameters)

    def after_cursor_execute(conn, cursor, statement,
                            parameters, context, executemany):
        total = time.time() - context._query_start_time
        ixiacrlogger.debug("Query Complete!")
        ixiacrlogger.debug("Total Time: %f" % total)


    engine = engine_from_config(settings, 'sqlalchemy.')

    #Uncomment if you would like to debug sql statements in pserve log...
    #event.listen(engine, "before_cursor_execute", before_cursor_execute)
    #event.listen(engine, "after_cursor_execute", after_cursor_execute)

    db.configure(bind=engine)

    if is_pserve:
        # Sessions
        session_factory = session_factory_from_settings(settings)
        # set_cache_regions_from_settings(settings)

        # Configure our authorization policy
        authentication = RemoteUserAuthenticationPolicy(
            '!@#$%12345@345@34523$%@#$%@#$2$%@3$%2#523452345',
            callback=has_group)
        authorization= ACLAuthorizationPolicy()

        settings = dict(settings)
        settings.setdefault('jinja2.i18n.domain', 'messages')

        # Create the Pyramid Configurator.
        config = Configurator(settings=settings, session_factory=session_factory,
            root_factory='ixiacr.models.IxiaACLFactory',
            authentication_policy=authentication,
            authorization_policy=authorization)

        # Secure by default all views/handlers
        # Comment this line out to return to the old behavior of all API being unauthenticated
        # config.set_default_permission(Authenticated)

        if 'debug' in settings and settings['debug'].lower() != 'false':
            config.include('pyramid_debugtoolbar')

        # Static views and handlers
        config.include('pyramid_handlers')
        config.include('pyramid_jinja2')
        config.include("pyramid_beaker")
        config.add_static_view('static', 'static')
        config.add_jinja2_search_path("ixiacr:templates")

        config.add_translation_dirs("ixiacr:locale/")
        config._set_locale_negotiator(create_locale_negotiator(['en'], 'en'))

        # The core app views
        config.include('ixiacr.handlers.core.view_includes')

        # The Ixia test views
        config.include('ixiacr.handlers.tests.view_includes')

        # The Ixia test views
        config.include('ixiacr.handlers.tasks.view_includes')

        # The login/auth handlers
        config.include('ixiacr.handlers.auth.view_includes')

        # The admin handlers
        config.include('ixiacr.handlers.admin.view_includes')

        # The utility handlers
        config.include('ixiacr.handlers.utils.view_includes')

        # JSON api functions
        config.include('ixiacr.views.ixiacr_json.view_includes')

        # STATIC Test result ReST
        config.include('ixiacr.views.results.view_includes')

        # Load everything, except things matched by ignore
        # We *MUST* have the ignore here, otherwise mock objects from the
        # unit test get loaded and screw everything up
        # There is no reason to load these scripts either.
        config.scan(ignore=[re.compile('utest$').search,
                            'ixiacr.scripts'])

        patch_pyramid_xmlrpc()

    else:
        config = Configurator()

    # Toggle this expression to enable the profiler.
    # Profile results are available at https://<ip>/_RequestProfiler
    if True:
        return config.make_wsgi_app()
    else:
        return RequestProfiler(config.make_wsgi_app(),
                               custom_cols=['db_sel', 'db_update',
                                            'memc_get', 'memc_set', 'memc_del'])

def patch_pyramid_xmlrpc():
    def xmlrpc_marshal(data):
        """ Marshal a Python data structure into an XML document suitable
        for use as an XML-RPC response and return the document.  If
        ``data`` is an ``xmlrpclib.Fault`` instance, it will be marshalled
        into a suitable XML-RPC fault response."""
        if isinstance(data, xmlrpclib.Fault):
            return xmlrpclib.dumps(data, allow_none=True)
        else:
            return xmlrpclib.dumps((data,), methodresponse=True,
                                   allow_none=True)

    pyramid_xmlrpc.xmlrpc_marshal = xmlrpc_marshal
