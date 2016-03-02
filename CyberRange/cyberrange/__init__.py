from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.config import Configurator
from sqlalchemy import engine_from_config

from cyberrange.scripts.security import groupfinder

from cyberrange.models.core import (
    DBSession,
    Base,
    )


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)
    Base.metadata.bind = engine

    config = Configurator(settings=settings,
                          root_factory='cyberrange.models.core.CRACLFactory')

    config.include('pyramid_chameleon')
    config.include('pyramid_jinja2')

    # Security policies
    authn_policy = AuthTktAuthenticationPolicy(
        settings['cyberrange.secret'], callback=groupfinder,
        hashalg='sha512')
    authz_policy = ACLAuthorizationPolicy()
    config.set_authentication_policy(authn_policy)
    config.set_authorization_policy(authz_policy)

    config.add_static_view('static', 'static', cache_max_age=3600)
    config.include('cyberrange.views.home.view_includes')
    config.include('cyberrange.views.auth.view_includes')

    config.scan('cyberrange.views')

    return config.make_wsgi_app()
