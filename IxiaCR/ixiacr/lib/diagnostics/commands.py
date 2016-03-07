import logging

ixiacrlogger = logging.getLogger(__name__)

COMMANDS = {}

def register_command(name):
    def wrap(klass):
        COMMANDS[name] = klass
        return klass
    return wrap


@register_command(name='commands.logging.set_log_level')
class SetLogLevelCommand(object):
    def __call__(self, data):
        levelname = data['level'].upper()
        levels = {'FATAL': 50, 'CRITICAL': 50, 'ERROR': 40, 'WARNING': 30, 'WARN': 30, 'INFO': 20, 'DEBUG': 10, 'NOTSET': 0}
        level = levels[levelname]

        if 'name' in data:
            logger = logging.getLogger(data['name'])
        else:
            logger = logging.getLogger()

        ixiacrlogger.debug('Changing logger name=%s level from %d [%s] to %d [%s]' % (logger.name,
            logger.level, logging.getLevelName(logger.level), level, levelname))

        logger.setLevel(level)





