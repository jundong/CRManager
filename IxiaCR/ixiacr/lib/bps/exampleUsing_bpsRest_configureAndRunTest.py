#Example using the bpsRest and statThread ixia python sample helper libraries
#Import test / configure / saveas & run/ get real time stats and export the report
from bpsRest import *
import statThread
import Queue,time, sys

statQueue = Queue.Queue()


bps = BPS('10.200.117.137', 'admin', 'admin')

# login
bps.login()

# Get portList
bps.runCustomCommand("/api/v1/bps/ports/operations/reserve","post",slot=1,portList=[0,1],group=11)

response = bps.getResponse()
if response:
   print "Operation = %s" %response["Operation"]
   print "response Code = %s" %response["responseCode"]
   print "Response Text = %s" %response["responseText"]


bps.uploadBPT(filePath=os.path.join(os.getcwd(),"simple_appsim.bpt"))

# Get & Path testing.
bps.runCustomCommand("/api/v1/bps/workingmodel","patch",template="simple_appsim")
response = bps.getResponse()
if response:
   print "Operation = %s" %response["Operation"]
   print "response Code = %s" %response["responseCode"]
   print "Response Text = %s" %response["responseText"]

# View the settings
bps.runCustomCommand("/api/v1/bps/workingmodel/settings","get")
response = bps.getResponse()
if response:
   print "Operation = %s" %response["Operation"]
   print "response Code = %s" %response["responseCode"]
   print "Response Text = %s" %response["responseText"]
   
   
bps.runCustomCommand("/api/v1/bps/workingmodel","patch",newParams={"componentId":"appsim_1","elementId":"delayStart","value":"00:00:10"})
response = bps.getResponse()
if response:
   print "Operation = %s" %response["Operation"]
   print "response Code = %s" %response["responseCode"]
   print "Response Text = %s" %response["responseText"]

bps.runCustomCommand("/api/v1/bps/workingmodel","patch",newParams={"componentId":"appsim_1","elementId":"rampDist","paramId":"steady","value":"00:00:30"})
response = bps.getResponse()
if response:
   print "Operation = %s" %response["Operation"]
   print "response Code = %s" %response["responseCode"]
   print "Response Text = %s" %response["responseText"]

bps.runCustomCommand("/api/v1/bps/workingmodel/operations/saveas","post",name="simpleAppSimFromREST",force=True)
response = bps.getResponse()
if response:
   print "Operation = %s" %response["Operation"]
   print "response Code = %s" %response["responseCode"]
   print "Response Text = %s" %response["responseText"]

#sys.exit()

statsObj = statThread.statThread("simpleAppSimFromREST",statQueue)
statsObj.kickStart(1)
statsObj.setDaemon(True)
statsObj.start()



bps.runCustomCommand("/api/v1/bps/tests/operations/start","post",modelname="simpleAppSimFromREST",group=11,neighborhood=None)
response = bps.getResponse()
if response and response["responseCode"] == 200:
   runId = response["responseText"].get('testid')
   print "Test Id = %s" %runId

while True:
      bps.runCustomCommand("/api/v1/bps/tests/operations/getRTS","post",runid=runId)
      response = bps.getResponse()
      if response and response["responseCode"] == 200:
         progress = response["responseText"].get('progress')
         rts = response["responseText"].get('rts')
         
         statQueue.put(rts)
         time.sleep(4)
         print "RTS == %s" %rts
         if progress == 100:
            print "Test done"
            statQueue.put("QUIT")
            break
      else:
         print "Coming out"


statsObj.join()
print "Exporting resport and test model. This will take a while...."
bps.exportTestReport(runId, "simpleAppSimFromREST.pdf", statsObj.getResultLocation())
bps.exportTestBPT("simpleAppSimFromREST", testId=runId,location=statsObj.getResultLocation())


bps.runCustomCommand("/api/v1/bps/ports/operations/unreserve","post","createResult",slot=2,portList=[0,1],group=11)
response = bps.getResponse()

# logging out
bps.logout()
