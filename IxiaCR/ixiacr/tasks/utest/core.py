import re
import time

from ixiacr.lib.engines.stc.utest.core import TestCenterBllTestCase


class CreateTaskBllTestCase(TestCenterBllTestCase):

    def setUp(self):
        pass

    def tearDown(self):
        self.do_bll_clean_up()

    def do_bll_clean_up(self):
        # Clean up the BLL as best we can
        online = False
        try:
            project = self.stc.get('system1', 'children-project')

            # 1. Release any attached ports
            for port in self.stc.get(project, 'children-port').split():
                if self.stc.get(port, 'Online').lower() == 'true':
                    location = self.stc.get(port, 'Location')
                    self.stc.release(location)
                    online = True

            # 2. Disconnect from any connected chassis
            psm = self.stc.get('system1', 'children-physicalchassismanager')
            for chassis in self.stc.get(psm,
                                        'children-physicalchassis').split():
                hostname = self.stc.get(chassis, 'Hostname')
                if self.stc.get(chassis, 'IsConnected').lower() == 'true':
                    self.stc.disconnect(hostname)

                self.stc.delete(chassis)

            # 3. Delete all sequencer commands
            sequencer = self.stc.get('system1', 'children-sequencer')

            # Remove proper commands
            cmds = list()
            for childCmd in self.stc.get(sequencer,
                                         'children-command').split():
                cmds.append(childCmd)

            # Remove cleanup commands
            cleanupCmd = self.stc.get(sequencer, 'CleanupCommand')
            for childCmd in self.stc.get(cleanupCmd,
                                         'children-command').split():
                cmds.append(childCmd)

            args = {'CommandList': cmds,
                    'DoDestroy': 'TRUE'}
            self.stc.perform('SequencerRemoveCommand', **args)

            # 4. Delete the current project
            self.stc.delete(project)

            # If we release ports in this method, we have to wait for ports
            # rebooting process finished, so that we can use them in next test
            if online:
                time.sleep(120)

        except RuntimeError:
            pass

    def port_by_location(self, location):
        project = self.stc.get('system1', 'children-project')
        handle = None
        for port in self.stc.get(project, 'children-port').split():
            if self.stc.get(port, 'Location') == location:
                handle = port

        return handle

    def create_ports(self, test):
        project = self.stc.get('system1', 'children-project')
        for playlist in test.playlists:
            for source in playlist.sources:
                port = self.port_by_location(source.location)
                if port is None:
                    args = {'under': project,
                            'Location': source.location}
                    self.stc.create('Port', **args)

            for sink in playlist.sinks:
                port = self.port_by_location(sink.location)
                if port is None:
                    args = {'under': project,
                            'Location': sink.location}
                    self.stc.create('Port', **args)

    def apply(self):
        """
        Call the BLL apply function.  This triggers internal BLL validation
        """
        self.stc.apply()

    def get_bll_count(self, handlename):
        """
        Walk the BLL and count the number of objects that match 'handlename'
        """
        nodes = list()
        nodes.append('system1')
        count = 0
        matches = list()

        while len(nodes) > 0:
            curNode = nodes.pop(0)
            for child in self.stc.get(curNode, 'children').split():
                nodes.append(child)
            if re.match(r"%s[0-9]+" % handlename, curNode) is not None:
                matches.append(curNode)
                count += 1

        return count

    def get_streamblock_load(self):
        """ Walk the BLL and add up the total streamblock load """
        load = 0.0
        loadUnit = None

        for lp in self.stc.get('project1',
                               'children-streamblockloadprofile').split():
            if loadUnit is None:
                loadUnit = self.stc.get(lp, 'LoadUnit')
            else:
                self.assertEqual(
                    loadUnit, self.stc.get(lp, 'LoadUnit'),
                    'LoadUnit on %s not not match previous units' % lp)

            load += float(self.stc.get(lp, 'Load'))

        return load

    def get_bll_configs(self, handlename):
        """
        Walk the BLL and count the number of objects that match 'handlename'
        """
        nodes = list()
        nodes.append('system1')
        configs = list()

        while len(nodes) > 0:
            curNode = nodes.pop(0)
            for child in self.stc.get(curNode, 'children').split():
                nodes.append(child)
            if re.match(r"%s[0-9]+" % handlename, curNode) is not None:
                configs.append(curNode)

        return configs
