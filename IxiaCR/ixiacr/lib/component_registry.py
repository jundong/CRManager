from ixiacr.lib import IxiaLogger
ixiacrlogger = IxiaLogger(__name__)

registry = {}


def register_component(name, component):
    try:
        if name in registry:
            raise Exception(
                'A component with name "{0}" is already registered'.format(name)
            )
        else:
            registry[name] = component
    except Exception, e:
        ixiacrlogger.exception(e)
        pass


def lookup_component(name):
    try:
        if name not in registry:
            raise Exception(
                'A component with name "{0}" is not registered'.format(name)
            )
        else:
            return registry[name]
    except Exception, e:
        ixiacrlogger.exception(e)
        pass