import logging
import logging.config
import logging.handlers
import ConfigParser
import sys


def Logger(name, **kwargs):
    return logging.getLogger(name)


def UiLogger(name, **kwargs):
    return logging.getLogger(name)


def get_ui_log_level():
    """ Return effective log level for cr.ui namespace """
    return logging.getLevelName(logging.getLogger('cr.ui').getEffectiveLevel())


# This will be executed once for each Python interpreter
########################################################
logger_initialized = False

def init_logger():
    global logger_initialized
    if logger_initialized:
        return

    logger_initialized = True

    config = ConfigParser.ConfigParser()

    # Filename, LogLevel, modules to override log level

    config.read('/home/judo/workspace/github/CRManager/CyberRange/logger.ini')
    level_str = config.get('cr', 'level')

    def get_log_level(level_str):
        if level_str[0].isdigit():
            log_level = int(level_str)
        else:
            log_level = logging.getLevelName(level_str)
        return log_level

    log_level = get_log_level(level_str)
    log_format = config.get('cr', 'format', raw=True)

    handler = logging.StreamHandler(sys.stdout)
    log_formatter = logging.Formatter(log_format)
    handler.setFormatter(log_formatter)

    root = logging.getLogger()
    root.setLevel(log_level)
    root.addHandler(handler)

    try:
        override_level = get_log_level(config.get('cr', 'override_level'))
        if override_level != log_level:
            overrides = config.options('overrides')
            for override in overrides:
                root.info('Overriding log level for logger={0} to level={1}'.
                           format(override, override_level))
                olog = logging.getLogger(override)
                olog.setLevel(override_level)
    except:
        pass
