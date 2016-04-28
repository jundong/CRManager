import requests
import json
import time
import os
from os.path import basename
from os.path import join

requests.packages.urllib3.disable_warnings()
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.poolmanager import PoolManager
import ssl
class MyAdapter(HTTPAdapter):
    def init_poolmanager(self, connections, maxsize, block=False):
        self.poolmanager = PoolManager(num_pools=connections,
                                       maxsize=maxsize,
                                       block=block,
                                       ssl_version=ssl.PROTOCOL_TLSv1)

class BPS(object):
    def __init__(self, ipstr, username, password):
        self.ipstr = ipstr
        self.username = username
        self.password = password
        self.session = requests.Session()
        self.session.mount('https://', MyAdapter())
        self.resultDir = None
        self.operationResponses = {}
        self.index = 0
        self.apiKey = None
        
    def getResponse(self):
        
        if len(self.operationResponses.keys()) > 0:
            self.index = self.index - 1
            return self.operationResponses[self.index]
        else:
            return None
    
    def _addToResponse(self, opCode, response):
        self.operationResponses[self.index] = {}
        self.operationResponses[self.index]["Operation"] =  opCode
        self.operationResponses[self.index]["responseCode"] =  response.status_code
        try:
            self.operationResponses[self.index]["responseText"] =  json.loads(response.text)
        except:
            self.operationResponses[self.index]["responseText"] = ""
        self.index = self.index + 1
        
    def _getapiKey(self):
        self.runCustomCommand("/api/v1/auth/session","post",username=self.username,password=self.password)
        response = self.getResponse()
        #print response
        if response['responseCode'] == 200:
            print "Login success"
            self.runCustomCommand("/api/v1/auth/session/key","get")
            response = self.getResponse()
            print response
            self.apiKey = response['responseText']['apiKey']
            print response
        return
    
    def login(self):
        print "Doing login"
        service = 'https://' + self.ipstr + "/api/v1/auth/session"
        jheaders = {'content-type': 'application/json'}
        
        print "service = %s" %service
        
        jdata = json.dumps({'username':self.username, 'password':self.password})
        
        r = self.session.post(service, data=jdata, headers=jheaders, verify=False)
        print "Did the login"
        print r
        self._addToResponse("login",r)
                
        if(r.status_code == 200):
            print 'Login successful. Welcome ' + self.username
        if(r.status_code == 500):
            print 'Invalid Credentials. Please try again'
            r.raise_for_status
        elif(r.status_code == 0):
            print 'Please allow BPS in your browser'
            r.raise_for_status
        else:
            r.raise_for_status
    
    def logout(self):
        service = 'https://' + self.ipstr + '/api/v1/auth/session'
        r = self.session.delete(service, verify=False)
        
        
        self._addToResponse("logout",r)
        
        if(r.status_code == 204):
            print 'User logout successful'

    def runCustomCommand(self,url,methodName,*args,**opts):
        service = "https://%s%s" %(self.ipstr,url)
        print "service = %s" %service
        print "args = %s, method = %s" %(len(args), methodName)
        print args
        
        if self.apiKey:
            jheaders = {'content-type': 'application/json', 'X-Api-Key': "%s" %self.apiKey}
        else:
            jheaders = {'content-type': 'application/json'}
        
        responses = None
        if len(args) > 0 and args[0] == "uploadBpt":
            files = {'file': (os.path.basename(opts['filePath']), open(opts['filePath'], 'rb'), 'application/xml', {'Expires': '1000'})}
            #print files
            jdata = {'force': opts['force']}
            cmdToExec = "responses = self.session.%s(service,files=files,data=jdata,verify=False)" %(methodName)
            try:
                print "cmd = %s" %cmdToExec
                exec cmdToExec
                self._addToResponse(methodName,responses)
            except:   
                print "Some issue"
                raise
        else:
            if opts == None or len(opts.keys()) == 0:
                cmdToExec = "responses = self.session.%s(service,headers=jheaders,verify=False)" %(methodName)
            else:
                jdata = json.dumps(opts)
                print "Jdata = %s" %jdata
                cmdToExec = "responses = self.session.%s(service,data=jdata,headers=jheaders,verify=False)" %(methodName)
            try:
                print "command = %s" %cmdToExec
                exec cmdToExec
                print "Response = %s" %responses.status_code
                print "Text is : %s" %responses.text
                self._addToResponse(methodName,responses)
            except:
                print "Some Exception"
                raise
        

    def stopTest(self):
        print 'Currently running tests:'
        self.runningTestInfo()
        testid = raw_input('Enter the complete testid to cancel the running test: ')
        service = 'https://' + self.ipstr + '/api/v1/bps/tests/operations/stop'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'testid':testid})
        r = self.session.post(service, data=jdata, headers=jheaders, verify=False)
        if(r.status_code == 200):
            print 'Test: [' + testid + '] has been successfully stopped.'
        else:
            print 'Some error occurred while cancelling the running test: [' + testid + ']'
    
    def getTestResult(self, runid):
        service = 'https://' + self.ipstr + '/api/v1/bps/tests/operations/result'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'runid':runid})
        r = self.session.post(service, data=jdata, headers=jheaders, verify=False)
        if(r.status_code == 200):
            print json.loads(r.text).get('result')

    # testmodel model implementation
    def getWorkingTestmodel(self):
        service  = 'https://' + self.ipstr + '/api/v1/bps/workingmodel'
        jheaders = {'content-type': 'application/json'}
        r = self.session.get(service, headers=jheaders, verify=False)
        if(r.status_code == 200):
            print r.text
    def setWorkingTestmodel(self, template):
        service  = 'https://' + self.ipstr + '/api/v1/bps/workingmodel/operations/retrieve'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'template':template})
        r = self.session.post(service, data=jdata, headers=jheaders, verify=False)
        if(r.status_code == 200):
            print json.loads(r.text).get('result')
    def saveWorkingTestmodel(self, name, force):
        service  = 'https://' + self.ipstr + '/api/v1/bps/workingmodel/operations/save'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'name':name, 'force':force})
        r = self.session.post(service, data=jdata, headers=jheaders, verify=False)
        if(r.status_code == 200):
            print 'The working model has been successfully saved with the name: [' + json.loads(r.text).get('name') + ']'
    def modifyWorkingTestModelNeighborhood(self, neighborhood):
        service  = 'https://' + self.ipstr + '/api/v1/bps/workingmodel/operations/modifymodelneighborhood'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'neighborhood':neighborhood})
        r = self.session.post(service, data=jdata, headers=jheaders, verify=False)
        if(r.status_code == 200):
            print json.loads(r.text).get('result')
    def modifyWorkingTestModelTimeline(self, id=None, up=None, upBehavior=None, down=None, downBehavior=None, steady=None, steadyBehavior=None, obey_retry=None, duration=None, stepduration=None, stepdurationunits=None, stepdurationtype=None, steprate=None, stepratetimeunit=None, stepdurationSS=None, durationTime=None, durationFrames=None):
        service  = 'https://' + self.ipstr + '/api/v1/bps/workingmodel/operations/modifyworkingtimeline'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'id':id, 'up':up, 'upBehavior':upBehavior, 'down':down, 'downBehavior':downBehavior, 'steady':steady, 'steadyBehavior':steadyBehavior, 'obey_retry':obey_retry, 'duration':duration, 'stepduration':stepduration, 'stepdurationunits':stepdurationunits, 'stepdurationtype':stepdurationtype, 'steprate':steprate, 'stepratetimeunit':stepratetimeunit, 'stepdurationSS':stepdurationSS, 'durationTime':durationTime, 'durationFrames':durationFrames})
        r = self.session.post(service, data=jdata, headers=jheaders, verify=False)
        if(r.status_code == 200):
            print json.loads(r.text).get('result')


    # Component modification
    def setNormalTest(self, NN_name=None):
        service  = 'https://' + self.ipstr + '/api/v1/bps/workingmodel'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'template':NN_name})
        print jdata
        r = self.session.patch(service, data=jdata, headers=jheaders, verify=False)
        print "For set working model %s" %r
       #print "For set working model jeson object %s" %(r.json())
             
    def viewNormalTest(self):
        service  = 'https://' + self.ipstr + '/api/v1/bps/workingmodel/settings'
        jheaders = {'content-type': 'application/json'}
        #jdata = json.dumps({'name':NN_name})
        #print jdata
        r = self.session.get(service)
        #print r.status_code
        print "For view working model %s" %r
        #print "For retrive Network jeson object %s" %(r.json())
     
    def modifyNormalTest(self, componentId, elementId, paramId, Value):
        service  = 'https://' + self.ipstr + '/api/v1/bps/workingmodel'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'newParams':{'componentId':componentId, 'elementId':elementId, 'paramId':paramId, 'value':Value}})
        print jdata
        r = self.session.patch(service, data=jdata, headers=jheaders, verify=False)
        print "For modify working model %s" %r
        #print "For modify working model jeson object %s" %(r.json())
         
    def saveNormalTest(self, name_, force):
        service  = 'https://' + self.ipstr + '/api/v1/bps/workingmodel/operations/save'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'name':name_, 'force': force})
        print jdata
        r = self.session.post(service, data=jdata, headers=jheaders, verify=False)
        print "For save working model %s" %r
        print "For save working model jeson object %s" %(r.json())
        

    #Multicast Lab test
    def setMulticast(self, template):
        service  = 'https://' + self.ipstr + '/api/v1/bps/multicasttest/'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'template':template})
        print jdata
        r = self.session.patch(service, data=jdata, headers=jheaders, verify=False)
        print "For set template %s" %r
           
   
    def viewMulticast(self):
        service  = 'https://' + self.ipstr + '/api/v1/bps/multicasttest/'
        jheaders = {'content-type': 'application/json'}
        #jdata = json.dumps({'name':NN_name})
        #print jdata
        r = self.session.get(service)
        print "For view template %s" %r    
                       
              
    def modifyMulticast(self, elementId, paramId, Value):
        service  = 'https://' + self.ipstr + '/api/v1/bps/multicasttest/'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'multicastNewParams':{'elementId':elementId, 'paramId':paramId, 'value':Value}})
        print jdata
        r = self.session.patch(service, data=jdata, headers=jheaders, verify=False)
        print "For modify template %s" %r
        #print "For modify template jeson object %s" %(r.json())
        
    def addSource(self, type_, ipAddress, multicastAddress, Rate):
        service  = 'https://' + self.ipstr + '/api/v1/bps/multicasttest/operations/add'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'type':type_, 'ipAddress':ipAddress, 'multicastAddress':multicastAddress, 'Rate':Rate})
        print jdata
        r = self.session.post(service, data=jdata, headers=jheaders, verify=False)
        print "For Add source %s" %r
        print "For Add source jeson object %s" %(r.json())
         
    def deleteSource(self, elementId):
        service  = 'https://' + self.ipstr + '/api/v1/bps/multicasttest/operations/delete'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'elementId':elementId})
        print jdata
        r = self.session.post(service, data=jdata, headers=jheaders, verify=False)
        print "For Delete source %s" %r
        print "For Delete source jeson object %s" %(r.json())
           
    def saveMulticast(self, name):
        service  = 'https://' + self.ipstr + '/api/v1/bps/multicasttest/operations/saveas'
        jheaders = {'content-type': 'application/json'}
        jdata = json.dumps({'name':name})
        print jdata
        r = self.session.post(service, data=jdata, headers=jheaders, verify=False)
        print "For save template %s" %r
        #print "For save template jeson object %s" %(r.json())

    # importing bpt model
    def uploadBPT(self, filePath):
        service = 'https://' + self.ipstr + '/api/v1/bps/upload'
        fileName = basename(filePath)
        force = 'true'
        jdata = {'force':force}
        files = {'file': (fileName, open(filePath, 'rb'), 'application/xml', {'Expires': '1000'})}
        r = self.session.post(service, files=files, data=jdata, verify=False)
        print r.status_code
        if(r.status_code == 200):
            print 'The bpt was uploaded and saved with name: [' + json.loads(r.text).get('result') + ']'
            return json.loads(r.text).get('result')
        else:
            print "Failed to load BPT"
            return

    # exporting implementation
    def exportTestReport(self, testId, reportName, location):
        reportFormat = reportName.split('.')[1].lower()
        service = 'https://' + self.ipstr + '/api/v1/bps/export/report/' + testId + '/' + reportFormat
        print 'Please wait while your report is being downloaded. You will be informed once the download is complete'
        r = self.session.get(service, verify=False, stream=True)
        with open(join(location,reportName), 'wb') as fd:
            for chunk in r.iter_content(chunk_size=1024):
                fd.write(chunk)
        fd.close()
        r.close()
        if(r.status_code == 200):
            print 'Your report for the testid: [' + testId + '] has been successfully downloaded'
            
    def exportTestBPT(self, bptName, testId=None, testName=None, location='.//'):
        bptName = bptName + '.bpt'
        if (testId is not None) and (testName is None):
            service = 'https://' + self.ipstr + '/api/v1/bps/export/bpt/testid/' + testId
            print 'Please wait while your bpt is being downloaded. You will be informed once the download is complete'
            r = self.session.get(service, verify=False, stream=True)
            with open(join(location,bptName), 'wb') as fd:
                for chunk in r.iter_content(chunk_size=1024):
                    fd.write(chunk)
            fd.close()
            r.close()
            if(r.status_code == 200):
                print 'Your bpt having the testid: [' + testId + '] has been successfully downloaded'
        elif (testId is None) and (testName is not None):
            service = 'https://' + self.ipstr + '/api/v1/bps/export/bpt/testname/' + testName
            print 'Please wait while your bpt is being downloaded. You will be informed once the download is complete'
            r = self.session.get(service, verify=False, stream=True)
            with open(join(location,bptName), 'wb') as fd:
                for chunk in r.iter_content(chunk_size=1024):
                    fd.write(chunk)
            fd.close()
            r.close()
            if(r.status_code == 200):
                print 'Your bpt for the test: [' + testName + '] has been successfully downloaded'
        else :
            print 'Wrong usage. You can only use of the two methods to export the test model.'

    def exportTestsCsv(self, csvName, location='.//'):
        csvName = csvName + '.csv'
        service = 'https://' + self.ipstr + '/api/v1/bps/export/tests'
        print 'Please wait while your csv is being downloaded. You will be informed once the download is complete'
        r = self.session.get(service, verify=False, stream=True)
        with open(join(location,csvName), 'wb') as fd:
            for chunk in r.iter_content(chunk_size=1024):
                fd.write(chunk)
        fd.close()
        r.close()
        if(r.status_code == 200):
            print 'Your csv having the test details has been successfully downloaded'
        
