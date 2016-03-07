#!/local/pythonenv/bin/python
import subprocess
import argparse
import os
import glob
import time
import unittest2 as unittest

from nose import loader, run
from nose.config import Config
from nose.plugins.skip import Skip
from nose.plugins import PluginManager

UNIT_TEST_BACKUP_DIR = '/tmp/unit-test-backup'
UNIT_TEST_TASK_ID = 'bbb-bbbbb-bbbbbb-bbbbbbb'


class TestIxiaUnitTests(object):

    @classmethod
    def setup_class(cls):
        print 'Setting up TestIxiaUnitTests'
        supervisorctl('stop')
        subprocess.call(['sudo', os.path.join(os.getenv('IXIACR'), 'launch-reset-db.sh')])
        supervisorctl('start')

    @classmethod
    def teardown_class(cls):
        pass

    def setup(self):
        pass

    def teardown(self):
        pass

    def run_sandboxed(self, test):
        proc = subprocess.Popen(['sudo',
                                 os.path.join(os.getenv('VENV'), 'bin/python'),
                                 '{0}'.format(test)],
                                stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT)

        while proc.poll() is None:
            output = proc.stdout.readline()
            if output:
                print output,  # drop 1 of 2 trailing newlines
            else:
                time.sleep(0.1)
                continue

        if proc.returncode != 0:
            raise RuntimeError('{0} failed!'.format(test))

    def test_sandboxed_unit_tests(self):
        # If you need to skip a test, add it to the black list
        black_list = []

        for dirpath, dirnames, filenames in os.walk('/'):
                    if "utest" in dirpath:
                        tests = glob.glob('{0}/*test.py'.format(dirpath))
                        for test in tests:
                            if test.split('/')[-1] not in black_list:
                                yield self.run_sandboxed, test


class TestIxiaFunctionalTests(object):

    @classmethod
    def setup_class(cls):
        print 'Setting up TestIxiaFunctionalTests'
        supervisorctl('stop')
        subprocess.call(['sudo', 'rm', '-rf', '/local/web/Ixia/data/'])
        subprocess.call(['sudo', os.path.join(os.getenv('IXIACR'), 'launch-reset-db.sh')])
        supervisorctl('start')

    @classmethod
    def teardown_class(cls):
        pass

    def setup(self):
        pass

    def teardown(self):
        pass

    def run_individual(self, test):
        config = Config(plugins=PluginManager(plugins=[Skip()]))
        l = loader.TestLoader(workingDir=os.path.join(os.getenv('IXIACR')), config=config)
        suite = l.loadTestsFromName(test)

        assert run(suite=suite)

    # Requires rewrite disabling for now...
    def test_web_tests(self):
        tests = [os.path.join(os.getenv('IXIACR'), 'webtests/tests.py:NavigationTest'),
                 os.path.join(os.getenv('IXIACR'), 'webtests/tests.py:JSONTest'),
                 os.path.join(os.getenv('IXIACR'), 'webtests/tests.py:WebIxiaTestRunTest'),
                 os.path.join(os.getenv('IXIACR'), 'webtests/tests.py:AdminTest')]

        for test in tests:
            yield self.run_individual, test

    # z in def name assures this runs last as this restarts stc, this used
    # to cause numerous issues with webtests tanking as stc may not have been
    # up yet.
    # tldr: ain't nobody got time for that...
    def test_z_admin_helpers(self):
        test = os.path.join(os.getenv('IXIACR'), 'admin/utest/admin_tests.py')

        config = Config(plugins=PluginManager(plugins=[Skip()]))
        l = loader.TestLoader(workingDir=os.getenv('VENV'), config=config)
        suite = l.loadTestsFromName(test)

        assert run(suite=suite)


def supervisorctl(do):
    print '{0}ing services...'.format('stopp' if do == 'stop' else do)
    subprocess.call(['sudo', 'supervisorctl', do, 'all'])


def set_log_level(level):
    import ConfigParser

    config = ConfigParser.ConfigParser()
    config.read(os.path.join(os.getenv('IXIACR'), 'ixiacrlogger.ini'))
    config.set('ixiacr', 'level', level)
    with open(os.path.join(os.getenv('IXIACR'), 'ixiacrlogger.ini'), 'wb') as configfile:
        config.write(configfile)


if __name__ == '__main__':
    # XXX: required for unit tests to run via jenkins, but imposes
    # silly path issues for normal users... Need to investigate.
    abspath = os.path.abspath(__file__)
    dname = os.path.dirname(abspath)
    os.chdir(dname)

    parser = argparse.ArgumentParser()
    parser.add_argument("type",
                        nargs="?",
                        help="run unit tests only,")
    args = parser.parse_args()

    set_log_level(10)

    nose_cmd = [
        os.path.join(os.getenv('VENV'), 'bin/nosetests'),
        '-s', # Output to stdout
        '-v', # Run nose in verbose mode
        #'-x', # Stop at first failure
        '--with-xunit', # Enable xunit output
        '--xunit-file=/tmp/nosetests.xml', # Enable xunit output
        # '--with-yanc', # Color output - install with /local/pythonenv/bin/easy_install yanc
        # '--with-progressive', # Immediate callbacks, progress bar, etc - install with /local/pythonenv/bin/easy_install nose-progressive
    ]

    def append_engine_tests():
        nose_cmd.append(
            '{0}:TestIxiaUnitTests'.format(os.path.abspath(__file__))
        )

    def append_functional_tests():
        nose_cmd.append(
            '{0}:TestIxiaFunctionalTests'.format(os.path.abspath(__file__))
        )

    if args.type == 'engine':
        print 'args.engine'
        append_engine_tests()

    elif args.type == 'functional':
        print 'args.functional'
        append_functional_tests()

    else:
        print 'default'
        append_engine_tests()
        append_functional_tests()

    try:
        subprocess.check_call(nose_cmd)
    except subprocess.CalledProcessError:
        pass
