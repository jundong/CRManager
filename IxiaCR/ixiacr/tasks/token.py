class TestToken(object):
    def __init__(self, *args, **kwargs):
        self.results = dict()
        self.result_packets = dict()
        self.result_type = dict()
        self.test = None
        self.validated = False
        self.expected_duration = None
        self.drop_results = False

        for k, v in kwargs.items():
            if hasattr(self, k):
                setattr(self, k, v)
