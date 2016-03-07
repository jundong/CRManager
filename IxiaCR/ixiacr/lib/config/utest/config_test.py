#!/local/pythonenv/bin/python
import unittest2 as unittest

from ixiacr.lib.config.defaults import ConfigDefaults
from ixiacr.lib.config.options import ConfigOptions, OptionResolver
from collections import defaultdict

class MockConfigResolver(OptionResolver):
    def __init__(self):
        self.storage = defaultdict(dict)

    def get_value(self, category, name):
        return self.storage[category][name]

    def set_value(self, category, name, new_value, defaults):
        self.storage[category][name] = new_value

    def unset_value(self, category, name):
        del self.storage[category][name]

class TestConfigOptions(unittest.TestCase):
    def setUp(self):
        self.config_defaults = ConfigDefaults(os.path.join(os.getenv('IXIACR'), 'lib/config/utest/options.yaml'))
        self.resolver = MockConfigResolver()
        self.config_options = ConfigOptions(self.config_defaults, self.resolver)

    def tearDown(self):
        pass

    def testDefaults(self):
        value = self.config_options.get_option_value('system', 'string-option-null-default')
        self.assertIsNone(value)

        value = self.config_options.get_option_value('system', 'string-option-non-null-default')
        self.assertEqual(value, 'default value multiple words')

        value = self.config_options.get_option_value('system', 'int-option-non-null-default')
        self.assertIsInstance(value, int)
        self.assertEqual(value, 999991)

        value = self.config_options.get_option_value('features', 'feature-flag1')
        self.assertIsInstance(value, bool)
        self.assertEqual(value, False)

        value = self.config_options.get_option_value('features', 'feature-flag2')
        self.assertIsInstance(value, bool)
        self.assertEqual(value, True)


    def testOverrides(self):
        value = self.config_options.get_option_value('system', 'string-option-null-default')
        self.assertIsNone(value)

        self.config_options.set_option_value('system', 'string-option-null-default', 'New Value')

        value = self.config_options.get_option_value('system', 'string-option-null-default')
        self.assertEqual(value, 'New Value')

        # Reverting back to default value
        self.config_options.unset_option_value('system', 'string-option-null-default')
        value = self.config_options.get_option_value('system', 'string-option-null-default')
        self.assertIsNone(value)

    def testErrorCases(self):
        with self.assertRaises(Exception) as context:
            value = self.config_options.get_option_value('system-bad', 'string-option-null-default')

        with self.assertRaises(Exception) as context:
            value = self.config_options.get_option_value('system', 'bad-option-name')

    def testRawValue(self):
        flowmon_dict = self.config_options.get_object('flowmon')
        self.assertEquals(flowmon_dict['default_send_packets'], 4096)

    def testMetadata(self):
        # Override a few default value
        self.config_options.set_option_value('system', 'string-option-null-default', 'New Value')
        self.config_options.set_option_value('features', 'feature-flag2', False)

        current_values = self.config_options.get_options_with_current_values()
        dict_values = {}
        for value in current_values:
            dict_values[value['name']] = value

        self.assertEqual(dict_values['string-option-null-default']['category'], 'system')
        self.assertEqual(dict_values['string-option-null-default']['value'], 'New Value')
        self.assertEqual(dict_values['string-option-null-default']['type'], 'str')
        self.assertEqual(dict_values['string-option-null-default']['default'], None)
        self.assertEqual(dict_values['string-option-null-default']['is_default'], False)
        self.assertEqual(dict_values['string-option-null-default']['desc'], 'description of string-option-null-default')

        self.assertEqual(dict_values['feature-flag1']['category'], 'features')
        self.assertEqual(dict_values['feature-flag1']['value'], False)
        self.assertEqual(dict_values['feature-flag1']['type'], 'bool')
        self.assertEqual(dict_values['feature-flag1']['default'], False)
        self.assertEqual(dict_values['feature-flag1']['is_default'], True)
        self.assertEqual(dict_values['feature-flag1']['desc'], 'description of feature-flag1')

        self.assertEqual(dict_values['feature-flag2']['category'], 'features')
        self.assertEqual(dict_values['feature-flag2']['value'], False)
        self.assertEqual(dict_values['feature-flag2']['type'], 'bool')
        self.assertEqual(dict_values['feature-flag2']['default'], True)
        self.assertEqual(dict_values['feature-flag2']['is_default'], False)
        self.assertEqual(dict_values['feature-flag2']['desc'], 'description of feature-flag2')


if __name__ == "__main__":
    unittest.main()
