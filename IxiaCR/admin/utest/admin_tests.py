#!/local/pythonenv/bin/python
import sys
import os
import unittest2 as unittest
from nose.plugins.skip import SkipTest

sys.path.insert(0, os.getenv("IXIACR"))
from ixiacr.lib.utils import admin_helper


class TestSequenceFunctions(unittest.TestCase):

    def setUp(self):
        pass

    def tearDown(self):
        pass

    def get_raw(self):
        return '\nerr: {0}\nout: {1}'.format(self.debug['err'],
                                             self.debug['out'])

    def _admin_helper(self, helper, json):
        return admin_helper(helper, json, debug_raw=True)

    def _assertEssential(self):
        self.assertTrue(self.result == 'SUCCESS', self.get_raw())
        self.assertTrue(self.obj is not None, self.get_raw())

    def _assertRequiredElementsInObject(self, obj=None):
        for item in (self.required_nested if obj else self.required):
            self.assertTrue(item in (obj if obj else self.obj),
                            'JSON string not found: {0} \n'
                            'RAW admin helper ouput:\n'
                            .format(item)+self.get_raw())

    def _assertTrue(self, assertion):
        self.assertTrue(assertion, self.get_raw())

    def test_license_bundle_admin_helpers(self):
        BUNDLE = '/tmp/axon.lic'
        if not os.path.exists(BUNDLE):
            raise SkipTest('No bundle found to install...')
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('uninstall-license-bundle', {})
        self._assertEssential()

        kwargs = {'file': BUNDLE,
                  'keepfile': 1,
                  'force': 1}

        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('install-license-bundle', kwargs)
        self._assertEssential()

    def test_generate_diag_bundle(self):
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('generate-diag-bundle', {})
        self._assertEssential()
        self._assertTrue(os.path.exists('/local/web/data'+self.obj['url']))

    def test_get_chassis_build(self):
        self.required = ['build']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-chassis-build', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()

    def test_get_chassis_id(self):
        self.required = ['id']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-chassis-id', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()

    def test_get_dns_config(self):
        self.required = ['search',
                         'servers']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-dns-config', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()

    def test_set_dns_config(self):
        self.required = ['search',
                         'servers']
        (result, obj, err, debug) = self._admin_helper('get-dns-config', {})
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('set-dns-config', obj)
        self._assertEssential()
        self._assertRequiredElementsInObject()
        self._assertTrue(obj == self.obj)

    def test_get_network_config(self):
        self.required = ['hostname']
        self.required_nested = ['netmask',
                                'address',
                                'gateway',
                                'mode']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-network-config', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()
        self._assertRequiredElementsInObject(self.obj['ipv4'])

    def test_set_network_config(self):
        self.required = ['hostname']
        self.required_nested = ['netmask',
                                'address',
                                'gateway',
                                'mode']
        (result, obj, err, debug) = self._admin_helper('get-network-config', {})
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('set-network-config', obj)
        self._assertEssential()
        self._assertRequiredElementsInObject()
        self._assertRequiredElementsInObject(self.obj['ipv4'])
        self._assertTrue(obj == self.obj)

    def test_get_network_status(self):
        self.required = ['ether',
                         'hostname']
        self.required_nested = ['netmask',
                                'address',
                                'gateway']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-network-status', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()
        self._assertRequiredElementsInObject(self.obj['ipv4'])

    def test_get_ntp_config(self):
        self.required = ['servers']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-ntp-config', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()

    def test_set_ntp_config(self):
        self.required = ['servers']
        (result, obj, err, debug) = self._admin_helper('get-ntp-config', {})
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('set-ntp-config', obj)
        self._assertEssential()
        self._assertRequiredElementsInObject()
        self._assertTrue(obj == self.obj)

    def test_get_ntp_remote(self):
        SERVER = '127.0.0.1'
        self.required = ['offset',
                         'server']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-ntp-remote', {'server': SERVER})
        self._assertEssential()
        self._assertRequiredElementsInObject()
        self._assertTrue(self.obj['server'] == SERVER)

    def test_get_ntp_status(self):
        self.required = ['peer',
                         'poll',
                         'offset',
                         'stratum']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-ntp-status', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()

    def test_get_stc_bll(self):
        self.required = ['path',
                         'version',
                         'rpm']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-stc-bll', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()

    def test_get_stc_firmware(self):
        self.required = ['version']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-stc-firmware', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()

    def test_get_stc_license(self):
        self.required = ['license']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-stc-license', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()

    @unittest.skipUnless(is_aonic(), 'No AONIC present')
    def test_get_stc_tsntp(self):
        self.required = ['ppm',
                         'offset']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-stc-tsntp', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()

    def test_get_system_data(self):
        self.required = ['uptime',
                         'chassis_install_time',
                         'chassis_memory', 'timestamp',
                         'rpms',
                         'hostname',
                         'chassis_id',
                         'build',
                         'chassis_cpu',
                         'chassis_lspci',
                         'chassis_serial_number',
                         'chassis_build_info']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-system-data', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()

    def test_get_wifi_config(self):
        self.required = ['key',
                         'mode',
                         'channel',
                         'ssid']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('get-wifi-config', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()

    def test_set_wifi_config(self):
        (result, obj, err, debug) =\
            self._admin_helper('get-wifi-config', {})
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('set-wifi-config', obj)
        self._assertEssential()

    def test_list_axon_backups(self):
        self.required = ['backups']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('list-axon-backups', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()

    def test_list_updates(self):
        self.required = ['packages']
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('list-updates', {})
        self._assertEssential()
        self._assertRequiredElementsInObject()

    def test_phone_home(self):
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('phone-home', {})
        self._assertEssential()

    # Deprecated?
    """def test_reset_stc(self):
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('reset-stc', {})
        self._assertEssential()"""

    def test_restart_bll(self):
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('restart-bll', {})
        self._assertEssential()

    def test_restart_stc(self):
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('restart-stc', {})
        self._assertEssential()

    def test_restart_network(self):
        (self.result, self.obj, self.err, self.debug) =\
            self._admin_helper('restart-network', {})
        self._assertEssential()

if __name__ == '__main__':
    suite = unittest.TestLoader().loadTestsFromTestCase(TestSequenceFunctions)
    result = unittest.TextTestRunner(verbosity=2).run(suite)

    fail_count = len(result.failures)
    err_count = len(result.errors)
    if fail_count or err_count:
        print ('What do you mean "Invalid Parameters"?! '
               '9,000 gigs of RAM and it can\'t answer a simple question!! '
               'This test run generated {0} failure{1} and {2} error{3}.'
               .format(fail_count, '' if fail_count == 1 else 's',
                       err_count, '' if err_count == 1 else 's'))
    else:
        print 'Once again, the trousers of evil are yanked ' \
              'down by the mocking hands of justice!'
