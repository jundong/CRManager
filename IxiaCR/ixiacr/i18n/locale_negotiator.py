from pyramid.security import authenticated_userid
from ixiacr.models.core import User


def create_locale_negotiator(supported_languages, default_language):
    def locale_negotiator(request):
        """
        Custom locale negotiator implementation. Obtain language from
        the current user's settings. If the user hasn't set preferred language,
        language is obtained from the 'Accept-Language' header.
        :param request:
        :return:
        """
        user = User.by_id(authenticated_userid(request))
        if user is not None and user.language is not None:
            return user.language

        for language in request.accept_language:
            language = language.split('-')[0]
            if language in supported_languages:
                return language

        return default_language

    return locale_negotiator
