import logging
import logging.config
import logging.handlers
import ConfigParser
import sys
import os
#from diagnostics import CommandDispatcher


def IxiaLogger(name, **kwargs):
    return logging.getLogger(name)


def UiLogger(name, **kwargs):
    return logging.getLogger(name)


def get_ui_log_level():
    """ Return effective log level for ixiacr.ui namespace """
    return logging.getLevelName(logging.getLogger('ixiacr.ui').getEffectiveLevel())


# This will be executed once for each Python interpreter
########################################################
ixiacr_logger_initialized = False

def init_ixiacr_logger():
    global ixiacr_logger_initialized
    if ixiacr_logger_initialized:
        return

    ixiacr_logger_initialized = True

    config = ConfigParser.ConfigParser()

    # Filename, LogLevel, modules to override log level

    config.read(os.path.join(os.getenv('IXIACR'), 'ixiacrlogger.ini'))
    level_str = config.get('ixiacr', 'level')

    def get_log_level(level_str):
        if level_str[0].isdigit():
            log_level = int(level_str)
        else:
            log_level = logging.getLevelName(level_str)
        return log_level

    log_level = get_log_level(level_str)
    log_format = config.get('ixiacr', 'format', raw=True)

    handler = logging.StreamHandler(sys.stdout)
    log_formatter = logging.Formatter(log_format)
    handler.setFormatter(log_formatter)

    root = logging.getLogger()
    root.setLevel(log_level)
    root.addHandler(handler)

    try:
        override_level = get_log_level(config.get('ixiacr', 'override_level'))
        if override_level != log_level:
            overrides = config.options('overrides')
            for override in overrides:
                root.info('Overriding log level for logger={0} to level={1}'.
                           format(override, override_level))
                olog = logging.getLogger(override)
                olog.setLevel(override_level)
    except:
        pass

    #commands = CommandDispatcher()
    #commands.start_listening()

if __name__ == "__main__":
    pass