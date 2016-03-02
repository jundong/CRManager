from pyramid.response import Response
from pyramid.view import (view_config, view_defaults)

from cyberrange.scripts import logger
from cyberrange.models.core import GlobalConfigs
from sqlalchemy.exc import DBAPIError

logger = logger.Logger(__name__)


def view_includes(config):
    config.add_route('home', '/')


@view_defaults(renderer='cyberrange:templates/index.jinja2')
class HomeViews:
    def __init__(self, request):
        self.request = request
        self.logged_in = request.authenticated_userid

    @view_config(route_name='home', renderer='cyberrange:templates/index.jinja2')
    def home(request):
        config = GlobalConfigs.by_id(1)
        return {'bps': config.bps,
                'atip': config.atip,
                'splunk': config.splunk,
                'kali': config.kali,
                'metasploit': config.metasploit,
                'ips': config.ips,
                'ngfw': config.ngfw,
                'dlp': config.dlp,
                'windows': config.windows}


conn_err_msg = """\
Pyramid is having a problem using your SQL database.  The problem
might be caused by one of the following things:

1.  You may need to run the "initialize_CyberRange_db" script
    to initialize your database tables.  Check your virtual
    environment's "bin" directory for this script and try to run it.

2.  Your database server may not be running.  Check that the
    database server referred to by the "sqlalchemy.url" setting in
    your "development.ini" file is running.

After you fix the problem, please restart the Pyramid application to
try it again.
"""

