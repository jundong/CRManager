from pyramid.i18n import get_localizer
from pyramid.security import authenticated_userid

class Handler(object):
    __autoexpose__ = None

    def __init__(self, request):
        self.request = request
        self.localizer = get_localizer(request)
        self.session = self.request.session
        self.user_id = authenticated_userid(request)
        self.messages = []
        c = self.request.tmpl_context

    def success(self, messages=None, additional=None):
        messages = messages or []
        additional = additional or {}

        return self.result('SUCCESS', messages, additional)

    def fail(self, messages=[], additional=None):
        messages = messages or []
        additional = additional or {}

        return self.result('FAILURE', messages, additional)

    def result(self, state, messages, additional):
        return dict({'result': state, 'messages': messages}, **additional)