from bpsRest import *
import statThread
import Queue,time, sys
from optparse import OptionParser

from ixiacr.lib import IxiaLogger
import transaction
from ixiacr.models import *

ixiacrlogger = IxiaLogger(__name__)

class usingWebApi(object):
    def __init__(self, scIP, user, passwd):
        self.url="https://" + scIP + "/api"
        self.connectObj=BPS(scIP, user, passwd)
        self.connectObj._getapiKey()

    def jsonDump(self, inputDict):
        print "inputDict : ", inputDict
        return json.dumps(inputDict)

    def exeCustomCommand(self,url,operation,*args, **kwargs):
        try:
            self.connectObj.runCustomCommand(url,operation,*args,**kwargs)
            response = self.connectObj.getResponse()
        except:
            print "Got exception" 
    
    def VMList(self):
        print "\nExistVMList ::"
        try:
            existVMList= self.connectObj.runCustomCommand("/api/v1/admin/vmdeployment/controller", "get")
            print existVMList
        except Exception as e:
            print e

    def getEmptySlots(self):
        print "\ngetEmptySlots ::"
        try:         
            self.connectObj.runCustomCommand("/api/v1/admin/vmdeployment/controller/emptySlots", "get")
            getEmptySlots = self.connectObj.getResponse()
            print getEmptySlots
            emptySlots = []
            for item in getEmptySlots['responseText']:
                emptySlots.append(item['slotId'])
            return emptySlots    
        except Exception as e:
            print e     
            return None
    
    # def checkProposedSlotValues(self, checkSlot_dict):
    #     print "\ncheckProposedSlotValues ::"
    #     try:
    #         checkSlotList = []
    #         checkSlotList.append(checkSlot_dict)
    #         checkProposedSlotValues = self.connectObj.httpPost("admin/vmdeployment/controller/validateProposedSlotValues", WebObject(checkSlotList))
    #         print checkProposedSlotValues
    #     except Exception as e:
    #         print e

    def validateProposedSlotValues(self):
        print "\nValidateProposedSlotValues ::"
        try:
            validateProposedSlotValues = self.connectObj.httpGet("%s/api/v1/admin/vmdeployment/controller/validateProposedSlotValues" %(self.url))
            print validateProposedSlotValues
        except Exception as e:
            print e
        
    def validatedSlotValues(self):
        print "\nValidatedSlotValues ::"
        try:
            validatedSlotValues = self.connectObj.httpGet("%s/api/v1/admin/vmdeployment/controller/validatedSlotValues" %(self.url))
            print validatedSlotValues
        except Exception as e:
            print e   
           
    # def unassignSlotsFromController(self, unassignedSlotDict):
    #     print "\nUnassignSlotsFromController ::"
    #     try:
    #         unassignedSlotList = []
    #         unassignedSlotList.append(unassignedSlotDict)
    #         unassignSlotsFromController = self.connectObj.httpPost("admin/vmdeployment/controller/unassignSlotsFromController", WebObject(unassignedSlotList))
    #         print unassignSlotsFromController
    #     except Exception as e:
    #         print e
    #
    # def assignSlotsToController(self, assignedSlotDict):
    #     print "\nAssignSlotsToController ::"
    #     try:
    #         assignedSlotLis = []
    #         assignedSlotLis.append(assignedSlotDict)
    #         assignSlotsToController = self.connectObj.httpPost("admin/vmdeployment/controller/assignSlotsToController", WebObject(assignedSlotLis))
    #         print assignSlotsToController
    #     except Exception as e:
    #         print e
    #
    # def createNetworkObject(self,nicNum,testNet):
    #     #print "got nic number %s", nicNum
    #     nicNum=int(nicNum)
    #     nicObjList=[]
    #     nic=1
    #     while nic <= nicNum:
    #             adptName= "Network Adapter " + str(nic)
    #             netObject=WebObject(adapter = adptName,network=testNet)
    #             nicObjList.append(netObject)
    #             nic=nic+1
    #     return(nicObjList)

    def queryIPDefaultSettings(self):
        print "\nqueryIPDefaultSettings ::"
        try:
            validateProposedSlotValues = self.connectObj.httpGet("%s/api/v1/admin/vmdeployment/controller/queryIPDefaultSettings" %(self.url))
            print validateProposedSlotValues
        except Exception as e:
            print e
    
    def getVmSlots(self,emptySlots):
        vmSlots = range(1,13)
        for slId in emptySlots:
            del vmSlots[vmSlots.index(slId)]
        
        return vmSlots
    
    # def VEDeployment(self, hy_dict, vmName, mgmNet, testNet, staticNetworkDictList):
    #     print "\nVEDeployment ::"
    #     try:
    #         hvObj = WebObject(hy_dict)
    #         print "going to connect Hypervisor "
    #         self.connectObj.httpPost("admin/vmdeployment/hypervisor",hvObj)
    #         print "Connected successfully to Hypervisor......"
    #         dsObj=self.connectObj.httpPost("admin/vmdeployment/hypervisor/datastores",hvObj)
    #         dsList=json.loads(dsObj)
    #         print "dsList : %s" %(dsList)
    #         datastore=dsList[0]["name"]
    #         print "dataStore : %s" %(datastore)
    #
    #         nicObjList=self.createNetworkObject(2,testNet)
    #         print "nicObjList : %s" %(nicObjList)
    #
    #         #NetworkConfigurationObjList = []
    #         #NetworkConfigurationObjList.append(staticNetworkDict)
    #         createObj=WebObject(hostInfo=hvObj,defaultVmName= vmName,vmNo=2,datastore=datastore,mngmNetwork=mgmNet,testNetworks=nicObjList, ipConfigs=WebObject(staticNetworkDictList))
    #
    #         placeJobs = self.connectObj.httpPost("admin/vmdeployment/operation",createObj)
    #         print "placeJobs : " ,placeJobs
    #         VEDeployment = self.connectObj.httpPost("admin/vmdeployment/operation/create")
    #         print "VEDeployment :",VEDeployment
    #
    #     except Exception as e:
    #         print e


class aTestBpt(object):

    def __init__(self, ip, user, passw, slot, portList, group, **kwargs):
        self.ip = ip
        self.user = user
        self.passw = passw
        self.statQueue = Queue.Queue()
        self.portList = portList[:]
        self.group = group
        self.slot = slot
        self.bps = BPS(self.ip, self.user, self.passw)
        self.bps.login()
        self.forceful = 'false'
        self.test_id = 1
        self.created_by = 1
        self.test_result_id = None

        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

        if not self.bps.getResponse()["responseCode"] == 200:
            print "Login Unsuccessful"
            return None

    def logout(self):
         
        # logging out
        self.bps.logout()
      
    def networkOperations(self,method,operation=None,**opts):
        
        if operation:
            URL = "/api/v1/bps/network/operations/%s" %operation
        else:
            URL = "/api/v1/bps/network"
           
        self.bps.runCustomCommand(URL,method,**opts)
        response = self.bps.getResponse()
        if response:
            print "Operation = %s" %response["Operation"]
            print "response Code = %s" %response["responseCode"]
            print "Response Text = %s" %response["responseText"]
      
    def initLabAndModify(self,typeLab,template, nameLab, typeParams, opts, operation=None):
        
        self.bps.runCustomCommand("/api/v1/bps/%s/" %typeLab,"patch",template=template)
        response = self.bps.getResponse()
        if response:
           print "Operation = %s" %response["Operation"]
           print "response Code = %s" %response["responseCode"]
           print "Response Text = %s" %response["responseText"]
    
        self.bps.runCustomCommand("/api/v1/bps/%s/" %typeLab,"get")
        response = self.bps.getResponse()
        if response:
            print "Operation = %s" %response["Operation"]
            print "response Code = %s" %response["responseCode"]
            print "Response Text = %s" %response["responseText"]
        
        if operation == None:
            for kys in opts:
                optionDict = {}
                if len(kys.split("=")) > 2:
                   optionDict['elementId'] = kys.split("=")[0]
                   optionDict['paramId'] = kys.split("=")[1]
                   optionDict['value'] = kys.split("=")[2]
                else:
                   optionDict['elementId'] = kys.split("=")[0]
                   optionDict['value'] = kys.split("=")[1]

                expr = {}
                expr[typeParams] = optionDict
                self.bps.runCustomCommand("/api/v1/bps/%s/" %typeLab,"patch",**expr)
                response = self.bps.getResponse()
                if response:
                   print "Operation = %s" %response["Operation"]
                   print "response Code = %s" %response["responseCode"]
                   print "Response Text = %s" %response["responseText"]

        else:
            optionDict = {}
            for kys in opts:
                optionDict[kys.split("=")[0]] = kys.split("=")[1]
                self.bps.runCustomCommand("/api/v1/bps/%s/operations/%s" %(typeLab,operation),"post",**optionDict)
                response = self.bps.getResponse()
                if response:
                    print "Operation = %s" %response["Operation"]
                    print "response Code = %s" %response["responseCode"]
                    print "Response Text = %s" %response["responseText"]
        
        self.bps.runCustomCommand("/api/v1/bps/%s/operations/saveas" %typeLab,"post",name=nameLab,force='true')
        response = self.bps.getResponse()
        if response:
            print "Operation = %s" %response["Operation"]
            print "response Code = %s" %response["responseCode"]
            print "Response Text = %s" %response["responseText"]

        self.bps.runCustomCommand("/api/v1/bps/%s/" %typeLab,"get")
        response = self.bps.getResponse()
        if response:
           print "Operation = %s" %response["Operation"]
           print "response Code = %s" %response["responseCode"]
           print "Response Text = %s" %response["responseText"]
    
    def runLab(self,bptName):
        self.bps.runCustomCommand("/api/v1/bps/ports/operations/reserve","post",slot=self.slot,portList=self.portList,group=self.group, force=self.forceful)
        response = self.bps.getResponse()
        if response:
           print "Operation = %s" %response["Operation"]
           print "response Code = %s" %response["responseCode"]
           print "Response Text = %s" %response["responseText"]
        
        if not response["responseCode"] == 200:
           print "Port reservation unsuccessful"
           return -1
        
        self.statsObj = statThread.statThread(os.path.splitext(os.path.basename(bptName))[0],self.statQueue)
        self.statsObj.kickStart(1)
        self.statsObj.setDaemon(True)
        self.statsObj.start()
        
        self.bps.runCustomCommand("/api/v1/bps/tests/operations/start","post",modelname=os.path.splitext(os.path.basename(bptName))[0],group=self.group,neighborhood=None)
        response = self.bps.getResponse()
        if response and response["responseCode"] == 200:
           runId = response["responseText"].get('testid')
           print "Test Id = %s" %runId

        
        while True:
              groupDetailStats = {}
              for groupStats in ['summary','iface','l4Stats','sslStats','ipsecStats','l7Stats','clientStats','attackStats','gtp','resource']:
                  self.bps.runCustomCommand("/api/v1/bps/tests/operations/getRTS","post",runid=runId,statsGroup=groupStats) 
                  response = self.bps.getResponse()
                  if response and response["responseCode"] == 200:
                       progress = response["responseText"].get('progress')
                       rts = response["responseText"].get('rts')
                       groupDetailStats[groupStats] = rts
                     
                       print "RTS == %s" %rts
                     
                  else:
                    print "Coming out"
              
              self.statQueue.put(groupDetailStats)
              
              if progress == 100:
                 print "Test done"
                 self.statQueue.put("QUIT")
                 break
              time.sleep(2)  

        self.statsObj.join()
        self.bps.exportTestReport(runId, "%s.pdf" %os.path.splitext(os.path.basename(bptName))[0], self.statsObj.getResultLocation())
        self.bps.exportTestBPT(os.path.basename(bptName), testId=runId,location=self.statsObj.getResultLocation())

        self.bps.runCustomCommand("/api/v1/bps/ports/operations/unreserve","post","createResult",slot=self.slot,portList=self.portList,group=self.group)
        response = self.bps.getResponse()

    def uploadAndShowParams(self,bptName):
        self.bps.runCustomCommand("/api/v1/bps/upload","post","uploadBpt",filePath=bptName,force='true')
        response = self.bps.getResponse()
        if response:
            print "Operation = %s" %response["Operation"]
            print "response Code = %s" %response["responseCode"]
            print "Response Text = %s" %response["responseText"]
        
        if not response["responseCode"] == 200:
            print "Bpt upload unsuccessful"
            return -1
        
        # Get & Patch testing.
        self.bps.runCustomCommand("/api/v1/bps/workingmodel","patch",template=os.path.splitext(os.path.basename(bptName))[0])
        response = self.bps.getResponse()
        if response:
            print "Operation = %s" %response["Operation"]
            print "response Code = %s" %response["responseCode"]
            print "Response Text = %s" %response["responseText"]

        # View the settings
        self.bps.runCustomCommand("/api/v1/bps/workingmodel/settings","get")
        response = self.bps.getResponse()
        if response:
            print "Operation = %s" %response["Operation"]
            print "response Code = %s" %response["responseCode"]
            print "Response Text = %s" %response["responseText"]

    def runTheTest(self,bptName,**opts):
        self.bps.runCustomCommand("/api/v1/bps/ports/operations/reserve","post",slot=self.slot,portList=self.portList,group=self.group, force=self.forceful)
        
        response = self.bps.getResponse()
        if response:
           print "Operation = %s" %response["Operation"]
           print "response Code = %s" %response["responseCode"]
           print "Response Text = %s" %response["responseText"]
        
        if not response["responseCode"] == 200:
           print "Port reservation unsuccessful"
           return -1
           
        
        self.bps.runCustomCommand("/api/v1/bps/upload","post","uploadBpt",filePath=bptName,force='true')
        response = self.bps.getResponse()
        if response:
           print "Operation = %s" %response["Operation"]
           print "response Code = %s" %response["responseCode"]
           print "Response Text = %s" %response["responseText"]
        
        if not response["responseCode"] == 200:
           print "Bpt upload unsuccessful"
           return -1
        
        
        # Get & Patch testing.
        self.bps.runCustomCommand("/api/v1/bps/workingmodel","patch",template=os.path.splitext(os.path.basename(bptName))[0])
        response = self.bps.getResponse()
        if response:
           print "Operation = %s" %response["Operation"]
           print "response Code = %s" %response["responseCode"]
           print "Response Text = %s" %response["responseText"]

        # View the settings
        self.bps.runCustomCommand("/api/v1/bps/workingmodel/settings","get")
        response = self.bps.getResponse()
        if response:
           print "Operation = %s" %response["Operation"]
           print "response Code = %s" %response["responseCode"]
           print "Response Text = %s" %response["responseText"]

        
        if len(opts.keys()) > 0:
           self.bps.runCustomCommand("/api/v1/bps/workingmodel","patch",newParams=opts)
           response = self.bps.getResponse()
           if response:
              print "Operation = %s" %response["Operation"]
              print "response Code = %s" %response["responseCode"]
              print "Response Text = %s" %response["responseText"]

        
           self.bps.runCustomCommand("/api/v1/bps/workingmodel/operations/save","post")
           response = self.bps.getResponse()
           if response:
              print "Operation = %s" %response["Operation"]
              print "response Code = %s" %response["responseCode"]
              print "Response Text = %s" %response["responseText"]

        #self.bps.runCustomCommand("/api/v1/bps/workingmodel","patch",newParams={"componentId":"appsim_1","elementId":"rampDist","paramId":"steady","value":"24:01:10"})
        #response = self.bps.getResponse()
        #if response:
        #   print "Operation = %s" %response["Operation"]
        #   print "response Code = %s" %response["responseCode"]
        #   print "Response Text = %s" %response["responseText"]

        #self.bps.runCustomCommand("/api/v1/bps/workingmodel/operations/save","post")
        #response = self.bps.getResponse()
        #if response:
        #   print "Operation = %s" %response["Operation"]
        #   print "response Code = %s" %response["responseCode"]
        #   print "Response Text = %s" %response["responseText"]

        self.statsObj = statThread.statThread(os.path.splitext(os.path.basename(bptName))[0],self.statQueue)
        self.statsObj.kickStart(1)
        self.statsObj.setDaemon(True)
        self.statsObj.start()

        self.bps.runCustomCommand("/api/v1/bps/tests/operations/start","post",modelname=os.path.splitext(os.path.basename(bptName))[0],group=self.group,neighborhood=None)
        response = self.bps.getResponse()
        if response and response["responseCode"] == 200:
            runId = response["responseText"].get('testid')
            print "Test Id = %s" %runId
            tcr = TestResult.query.filter_by(id=self.test_result_id).first()
            if not tcr:
                tcr.run_id=runId
                tcr.end_result='RUNNING'
                db.add(tcr)
                transaction.commit()

        progress = 0
        while True:
            groupDetailStats = {}
            for groupStats in ['summary','iface','l4Stats','sslStats','ipsecStats','l7Stats','clientStats','attackStats','gtp','resource']:
                self.bps.runCustomCommand("/api/v1/bps/tests/operations/getRTS","post",runid=runId,statsGroup=groupStats)
                response = self.bps.getResponse()
                if response and response["responseCode"] == 200:
                    progress = response["responseText"].get('progress')
                    rts = response["responseText"].get('rts')
                    groupDetailStats[groupStats] = rts

                    print "RTS == %s" %rts

                else:
                    print "Coming out"

            self.statQueue.put(groupDetailStats)

            tcr = TestResult.query.filter_by(id=self.test_result_id).first()
            if tcr:
                tcr.progress = progress
                db.add(tcr)
                transaction.commit()

            if progress == 100:
                print "Test done"
                tcr = TestResult.query.filter_by(id=self.test_result_id).first()
                if tcr:
                    tcr.progress = progress
                    tcr.end_result = 'FINISHED'
                    db.add(tcr)
                    transaction.commit()

                self.statQueue.put("QUIT")
                break
            time.sleep(2)

        self.statsObj.join()
        self.bps.exportTestReport(runId, "%s.pdf" %os.path.splitext(os.path.basename(bptName))[0], self.statsObj.getResultLocation())
        self.bps.exportTestBPT(os.path.basename(bptName), testId=runId,location=self.statsObj.getResultLocation())

        self.bps.runCustomCommand("/api/v1/bps/ports/operations/unreserve","post","createResult",slot=self.slot,portList=self.portList,group=self.group)
        response = self.bps.getResponse()

        tcr = TestResult.query.filter_by(id=self.test_result_id).first()
        if tcr:
            tcr.result_path = self.statsObj.getResultLocation()
            db.add(tcr)
            transaction.commit()

    def runURTest(self,bptName):
        bptName = os.path.join(os.getenv('IXIACR'), 'ixiacr/lib/bps/bpt', bptName)
        #optionsDict = {"componentId":"appsim_1","elementId":"delayStart","value":"00:00:10"}
        #optionsDict = {"componentId":"appsim_1","elementId":"rampDist","paramId":"steady","value":"00:12:10","elementId":"delayStart","value":"00:00:10"}
        self.uploadAndShowParams(bptName)
        self.runTheTest(bptName)
        self.logout()


if __name__ == "__main__":
   
   parser = OptionParser("user -RFC, -Law, -Sess, -LTE, -Net, -Multi", "")
   parser.add_option('--RFC', dest="RFC", type=int)
   parser.add_option('--Law', dest="Law", type=int)
   parser.add_option('--Sess', dest="Sess", type=int)
   parser.add_option('--LTE', dest="LTE", type=int)
   parser.add_option('--Net', dest="Net", type=int)
   parser.add_option('--Multi', dest="Multi", type=int)
   parser.add_option('--UR', dest="UR", type=int)
   parser.add_option('--SCIP', dest="SCIP", type=str)
   parser.add_option('--User', dest="User", type=str, default="admin")
   parser.add_option('--Passwd', dest="Passwd", type=str, default="admin")
   parser.add_option('--group', dest="group", type=str, default="12")
   parser.add_option('--slot', dest="slot", type=str)
   parser.add_option('--ports', dest="ports", type=str)
   parser.add_option('--force', dest="force", type=str)
   parser.add_option('--bptName', dest="bptName", type=str)


   # Try to find an empty slot
   (options,args) = parser.parse_args()
   print "option = %s, args = %s" %(options, args)
   print "ports are %s" %options.ports.split(",")

   test = aTestBpt(options.SCIP,options.User, options.Passwd, options.slot, options.ports.split(",") ,options.group, options.force)

   if options.RFC==1:
      test.initLabAndModify('rfc2544test','RFC2544',"RFC_new3",'rfc2544Params',['maxPossible=false','overallLoad=2000','seriesType=step',
                                'frameSizeStart=128','frameSizeEnd=1024','frameSizeInterval=2','neighborhood=BreakingPoint Switching'])
      test.initLabAndModify('rfc2544test','RFC2544',"RFC_new4",'rfc2544Params',['maxPossible=false','overallLoad=1000','seriesType=random',
                                'frameSizeMin=128','frameSizeMax=1024','neighborhood=BreakingPoint Switching'])
      test.runLab("RFC_new3")
      time.sleep(10)
      test.runLab("RFC_new4")

      sys.exit()
   elif options.Law == 1:
      test.initLabAndModify('lawfulinterceptlabtest',"Lawful Intercept Test","Law1","lawfulInterceptlabParams",['dataRate=100','concurrentFlows=1000',
                           'duration=00:10:00','flowsPerSecond=100','target1_active=true','target1_fieldType=phone','target1_numEntries=11',
                           'target1_intervalType=quantity','target1_quantityinterval=200'])
      test.initLabAndModify('lawfulinterceptlabtest',"Lawful Intercept Test","Law2","lawfulInterceptlabParams",['dataRate=100','concurrentFlows=1000',
                           'duration=00:10:00','flowsPerSecond=100','target1_active=true','target1_fieldType=taxid','target1_taxIdType=ein','target1_numEntries=11',
                           'target1_intervalType=quantity','target1_quantityinterval=200','target2_active=true','target2_fieldType=taxid','target2_taxIdType=ssn','target2_numEntries=11',
                           'target2_intervalType=quantity','target2_quantityinterval=200','target3_active=true','target3_fieldType=creditcard','target3_creditcardType=discover','target3_numEntries=11',
                           'target3_intervalType=quantity','target3_quantityinterval=200'])
      test.runLab("Law1")
      test.runLab("Law2")
      sys.exit()
   elif options.Sess == 1:
      test.initLabAndModify('sessionlabtest',"Session Lab","SS1","sessionlabParams",['test_type=layer4','data_type=http','pkts_per_session=40','source_port_min=2049',
                              'source_port_max=65535','destination_port_min=1','destination_port_max=1024','test_mode=maxSustainedRate','min_rate=10','max_rate=5000',
                              'min_concurrent=1000000','retry_quantum=250','retries=3','aging_time=0','steadyBehavior=cycle','reset_connections_between_tests=true',
                              'unlimited_data_rate=false','data_rate=5000','step_rate=10','step_rate_type=percent','test_duration=00:01:00','step_duration_applied=periteration',
                              'dut=BreakingPoint Default','neighborhood=BreakingPoint Switching'])

      test.initLabAndModify('sessionlabtest',"Session Lab","SS2","sessionlabParams",['test_type=appsim','data_type=zeroes','pkts_per_session=40','source_port_min=2049',
                              'source_port_max=65535','destination_port_min=1','destination_port_max=1024','test_mode=maxSustainedRate','min_rate=10','max_rate=5000',
                              'min_concurrent=1000000','retry_quantum=250','retries=3','aging_time=0','steadyBehavior=cycle','reset_connections_between_tests=true',
                              'unlimited_data_rate=false','data_rate=5000','step_rate=10','step_rate_type=percent','test_duration=00:01:00','step_duration_applied=periteration',
                              'dut=BreakingPoint Default','neighborhood=BreakingPoint Switching'])
      test.runLab("SS1")
      test.runLab("SS2")
      sys.exit()
   elif options.LTE == 1:
      test.initLabAndModify('ltelabtest',"Breakingpoint LTE Lab","LTE1","lteLabParams",['appProfile=appsim FTP'])
      test.initLabAndModify('ltelabtest',"Breakingpoint LTE Lab","LTE1","lteLabParams",['mme_ip=11.11.1.1'],"addmme")
      test.runLab("LTE1")
      sys.exit()
   elif options.Net==1:
      test.networkOperations("post",operation = "retrieve",name="L2_arka")
      test.networkOperations("get")
      test.networkOperations("post",operation='modify',componentId='Static Hosts i2_default',elementId='ip_address',value='1.4.2.2')
      test.networkOperations("post",operation='saveas',name="L2_arka",force='true')
      test.networkOperations("get")
      sys.exit()
   elif options.Multi==1:
      test.initLabAndModify('multicasttest',"multi_test","Multi1","multicastParams",['network=medium'])
      test.initLabAndModify('multicasttest',"multi_test","Multi1","sourceParams",['source_0=ipAddress=10.2.1.2','source_0=multicastAddress=224.0.0.1','source_0=rate=1000'])
      sys.exit()
   elif options.UR == 1:
      bptName = os.path.join(os.getcwd(),options.bptName)
      #optionsDict = {"componentId":"appsim_1","elementId":"delayStart","value":"00:00:10"}
      #optionsDict = {"componentId":"appsim_1","elementId":"rampDist","paramId":"steady","value":"00:12:10","elementId":"delayStart","value":"00:00:10"}
      test.uploadAndShowParams(bptName)
      test.runTheTest(bptName,componentId="appsim_1",elementId="rampDist",paramId="steady",value="00:00:10")
      test.logout()