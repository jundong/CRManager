import logging

ixiacrlogger = logging.getLogger(__name__)

class OptionResolver(object):
    """ Interface for resolving option values used by ConfigOptions class
    """
    def get_value(self, category, name):
        raise NotImplementedError()

    def set_value(self, category, name, new_value, defaults):
        raise NotImplementedError()

    def unset_value(self, category, name):
        raise NotImplementedError()


class ConfigOptions(object):
    """ Interface to options
    """
    def __init__(self, defaults, resolver):
        """ Initializer

        :param defaults: where to lookup default values
        :param resolver: OptionResolved implementation where to lookup defined values
        """
        self._defaults = defaults
        self._resolver = resolver

        self.options = {}
        obj = self.get_object('options')
        for category, values in obj.items():
            cat_options = {}
            for option in values:
                cat_options[option['name']] = {
                    'default': option['default'],
                    'type': option['type'],
                    'desc': option.get('desc', '')
                }
            self.options[category] = cat_options
        ixiacrlogger.info(self.options)

    def get_object(self, name):
        """ Return raw value from defaults dictionary.
        """
        return self._defaults.get_item(name)

    def _internal_get_option_value(self, category, name):
        """ Get the value of an option or the value from the defaults file.

        :param category: category name of managed option; ex: 'system' | 'features'
        :param name: name of the option
        :return: tuple - (value, is_default)
                is_default can be used to determine if the value was not overridden

        :raises: Exception if the option is not known. an entry in the defaults file
            is needed so the option is manageable through the helpers
        """
        value = None
        is_default = False
        try:
            value = self._resolver.get_value(category, name)
        except Exception as e:
            is_default = True
            value = self.options[category][name]['default']
            ixiacrlogger.debug('Found option {0} returning value {1}'.format(name, value))

        if value:
            data_type = self.options[category][name]['type']
            assert data_type in ['str', 'bool', 'int']

            if data_type == 'bool' and not isinstance(value, bool):
                value = True if value[0].upper() == 'T' else False
            elif data_type == 'int' and not isinstance(value, int):
                value = int(value)

        return value, is_default

    def get_option_value(self, category, name):
        """ Get the value of an option or the value from the defaults file.

        :param category: category name of managed option; ex: 'system' | 'features'
        :param name: name of the option
        :return: value from database or default or exception
        :raises: Exception if the option is not known. an entry in the defaults file
            is needed so the option is manageable through the helpers
        """
        value, is_default = self._internal_get_option_value(category, name)
        return value


    def get_all_defaults(self):
        """ Return everything under 'options' in the ixiacr.yaml file.
        """
        return self.options

    def get_defaults_by_category(self, category):
        """ Return meta-data about the available options in the specified category
        """
        return self.options[category]

    def get_options_with_current_values(self, category=None):
        """ Return options for all or specified category. Can also be used to retrieve the default
            value and current value and a flag to indicate if the current value is overridden.

            :param category: Category to include in result or None to get all categories
            :returns: List of categories containing options
        """
        defaults = self.get_all_defaults()

        options = []
        for cat_key, cat_val in defaults.items():
            if category and cat_key != category:
                continue

            for opt_key, opt_val in cat_val.items():
                opt_value, is_default = self._internal_get_option_value(cat_key, opt_key)

                options.append({
                    'category': cat_key,
                    'name': opt_key,
                    'default': opt_val['default'],
                    'type': opt_val['type'],
                    'desc': opt_val['desc'],
                    'value': opt_value,
                    'is_default': is_default
                })

        return options

    def set_option_value(self, category, name, value):
        """ Override default value and store in backend.
        """
        defaults = self.options[category][name]
        self._resolver.set_value(category, name, value, defaults)

    def unset_option_value(self, category, name):
        """ Remove the override from the backend so the default value can be inherited
        """
        self._resolver.unset_value(category, name)
