from pyramid.i18n import TranslationStringFactory
from ixiacr.lib import ixiacr_logger

ixiacrlogger = ixiacr_logger.IxiaLogger(__name__)

_ = TranslationStringFactory('messages')


class Paginator():
    """Query paging
    """
    def __init__(self, page=None, page_size=None):
        self.page = 1 if page is None else int(page)
        self.page_size = 50 if page_size is None else int(page_size)

    @property
    def start(self):
        return (self.page - 1) * self.page_size

    @property
    def stop(self):
        return self.page * self.page_size


def create_series(label, points):
    return {"label": label, "points": points}
