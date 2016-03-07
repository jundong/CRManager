from datetime import timedelta
from kombu import Exchange, Queue

CELERY_RESULT_BACKEND = "database"
CELERY_RESULT_DBURI = "db+sqlite:///cyberrange.sqlite"

BROKER_TRANSPORT_OPTIONS = {'visibility_timeout': 3600}
BROKER_URL = "sqla+sqlite:///cyberrange.sqlite"

CELERY_ROUTES = ('ixiacr.tasks.router.IxiaTaskRouter', )

CELERY_RESULT_PERSISTENT = False
CELERY_DEFAULT_DELIVERY_MODE = 'transient'

# Define our exchanges
default_exchange = Exchange('ixiacr', type='direct', durable=False)
engine_exchange = Exchange('engine', type='direct', durable=False)

CELERY_QUEUES = (
    Queue('ixiacr', default_exchange, routing_key='ixiacr', durable=False)
)

CELERY_DEFAULT_QUEUE = 'ixiacr'
CELERY_DEFAULT_EXCHANGE = 'ixiacr'
CELERY_DEFAULT_ROUTING_KEY = 'ixiacr'

CELERYBEAT_SCHEDULE = {
}

CELERY_TIMEZONE = 'UTC'

CELERYD_LOG_FORMAT = (
    '[%(asctime)s %(levelname)s %(name)s - %(threadName)s] %(message)s')

CELERYD_PREFETCH_MULTIPLIER = 1  # disable prefetching
