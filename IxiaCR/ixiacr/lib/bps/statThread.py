import os
import Queue, threading, time, re

class statThread(threading.Thread):
      def __init__(self,runId,statQueue):
          self.runId = runId
          self.resultDir = None
          self.toRun = False
          self.statQueue = statQueue
          self.headers = []
          self.statValues = {}
          self.csvFileName = None
          threading.Thread.__init__(self)
          
      def getResultLocation(self):
          return self.resultDir
      
      def kickStart(self,value=1):
          if value == 1:
             self.createResultDir()
             
          self.toRun = value
      
      def run(self):
          while self.toRun == 1:
               stats = self.statQueue.get()
               if stats == "QUIT":
                  self.toRun = 0
                  continue
               if stats == "The test is in preExecuting state. The stats will appear shortly.":
                  time.sleep(2)
                  continue
               try:
                  self.parseAndStoreGroups(stats)
               except:
                   pass
          
          print "Exiting...."
      
      def parseAndStoreGroups(self,stats):
          groupDetailStats = {}
          groupDetailStats = stats
          self.newHeaders = []
          self.statValues = {}
          
          for grps in groupDetailStats.keys():
              if grps == 'l7Stats':
                self.parseAndStoreL7(groupDetailStats[grps])
              elif grps in ["iface", "resource", "clientStats"]:
                self.parseAndStoreInterfaceAndResourse(groupDetailStats[grps]) 
              else:   
                self.parseAndStore(groupDetailStats[grps])
          
          self._alignHeaders()
      
      
      def parseAndStoreL7(self,stats):

          
          #print "stst = " 
          #print stats
          
          for lns in stats.split("\n"):
              #print "lns == %s" %lns   
              matchGrRTS = re.search("RTS:([a-z,A-Z,0-9,\[,\],\.,%,\ ,\=,\',:,_]+)", lns.strip())
              matchGrProgress = re.search("Progress:([a-z,A-Z,0-9,\[,\],\.,%,\ ]+)", lns.strip())
              
              if matchGrRTS:
                 matchGrValues = re.search("values=([a-z,A-Z,0-9,\[,\],\.,%,\ ,\=,\',:,_]+)", matchGrRTS.group(1).strip())
                 if matchGrValues:
                    actualStats = matchGrValues.group(1).strip()[1:-1]
                 else:
                    actualStats = ""
                 #print "actualStats = %s" %actualStats
                 matchGrT = re.search("time=([0-9,\.,\ ]+)", matchGrRTS.group(1).strip())
                 timeStat = "time"
                 timeValue = ""
                 if matchGrT:
                    timeValue = matchGrT.group(1).strip()
                    timeValue = float(timeValue)
                 
                 if timeStat not in self.headers:
                    self.newHeaders.append(str(timeStat))
                    
                 self.statValues[timeStat] = str(timeValue)
                 
                 headerPrefix = ""
                 for statNameValue in actualStats.split(","):
                     
                     headerPrefix = ""
                     matchGrP = re.match("protocol:([a-z,A-Z,0-9,\[,\]]+)", statNameValue.strip())
                     matchGrS = re.search("stats:([a-z,A-Z,0-9,\[,\],=,\.,',\ ]+)", statNameValue.strip())
                     if matchGrP:
                        headerPrefix = matchGrP.group(1)[1:-1]
                     if matchGrS:
                        statsToStore = matchGrS.group(1)[1:-1].split()
                        for statNameValuePair in statsToStore:
                            statsName,statsValue = statNameValuePair.split("=")
                            statsName = "%s::%s" %(headerPrefix,statsName)
                            #print "statName,statValue = %s, %s" %(statsName,statsValue)
                            if statsName not in self.headers:
                               self.newHeaders.append(str(statsName))
                            try:   
                               self.statValues[statsName] = float(statsValue[1:-1])
                            except:
                               self.statValues[statsName] = str(statsValue)
              elif matchGrProgress:
                 #print "within else == %s" %lns
                 if "Progress" not in self.headers:
                    self.newHeaders.append("Progress")
                 self.statValues["Progress"] =  matchGrProgress.group(1)  
      
      def parseAndStoreInterfaceAndResourse(self,stats):
          #print "stst = " 
          #print stats
          
          for lns in stats.split("\n"):
              #print "lns == %s" %lns 
              matchGrRTS = re.search("RTS:([a-z,A-Z,0-9,\[,\],\.,%,\ ,\=,\',:,_]+)", lns.strip())
              matchGrProgress = re.search("Progress:([a-z,A-Z,0-9,\[,\],\.]+)", lns.strip())
              
              if matchGrRTS:
                 matchGrValues = re.search("values=([a-z,A-Z,0-9,\[,\],\.,%,\ ,\=,\',:,_]+)", matchGrRTS.group(1).strip())
                 if matchGrValues:
                    actualStats = matchGrValues.group(1).strip()[1:-1]
                 else:
                    actualStats = ""
                 #print "actualStats = %s" %actualStats
                 matchGrT = re.search("time=([0-9,\.]+)", matchGrRTS.group(1).strip())
                 timeStat = "time"
                 timeValue = "N/A"
                 if matchGrT:
                    timeValue = matchGrT.group(1).strip()
                    timeValue = float(timeValue)
                 
                 if timeStat not in self.headers:
                    self.newHeaders.append(str(timeStat))
                    
                 self.statValues[timeStat] = str(timeValue)
                 indexCount = 0
                 for npStats in actualStats.split(","):
                     for statNameValue in npStats.split():
			 statName,statValue = statNameValue.split("=")
			 statName = "np%s::%s" %(indexCount,statName)
			 #print "statName,statValue = %s, %s" %(statName,statValue)
			 statValue = float(statValue[1:-1])
			 if statName not in self.headers:
			    self.newHeaders.append(str(statName))
			 try:   
			    self.statValues[statName] = float(statValue)
			 except:
			    self.statValues[statName] = str(statValue)
		     indexCount = indexCount + 1	    
              elif matchGrProgress:
                 #print "within else == %s" %lns
		 if "Progress" not in self.headers:
		    self.newHeaders.append("Progress")
                 self.statValues["Progress"] =  matchGrProgress.group(1)  

         
      
      def parseAndStore(self,stats):
          
          #print "stst = " 
          #print stats
          
          for lns in stats.split("\n"):
              #print "lns == %s" %lns 
              matchGrRTS = re.search("RTS:([a-z,A-Z,0-9,\[,\],\.,%,\ ,\=,\',:,_]+)", lns.strip())
              matchGrProgress = re.search("Progress:([a-z,A-Z,0-9,\[,\],\.]+)", lns.strip())
              
              if matchGrRTS:
                 matchGrValues = re.search("values=([a-z,A-Z,0-9,\[,\],\.,%,\ ,\=,\',:,_]+)", matchGrRTS.group(1).strip())
                 if matchGrValues:
                    actualStats = matchGrValues.group(1).strip()[1:-1]
                 else:
                    actualStats = ""
                 #print "actualStats = %s" %actualStats
                 matchGrT = re.search("time=([0-9,\.]+)", matchGrRTS.group(1).strip())
                 timeStat = "time"
                 timeValue = "N/A"
                 if matchGrT:
                    timeValue = matchGrT.group(1).strip()
                    timeValue = float(timeValue)
                 
                 if timeStat not in self.headers:
                    self.newHeaders.append(str(timeStat))
                    
                 self.statValues[timeStat] = str(timeValue)
                 
                 for statNameValue in actualStats.split():
                     statName,statValue = statNameValue.split("=")
                     #print "statName,statValue = %s, %s" %(statName,statValue)
                     statValue = float(statValue[1:-1])
                     if statName not in self.headers:
                        self.newHeaders.append(str(statName))
                     try:   
                        self.statValues[statName] = float(statValue)
                     except:
                        self.statValues[statName] = str(statValue)
              elif matchGrProgress:
                 #print "within else == %s" %lns
		 if "Progress" not in self.headers:
		    self.newHeaders.append("Progress")
                 self.statValues["Progress"] =  matchGrProgress.group(1)  
          
          
             
                 
      
      def _alignHeaders(self):
          
          if len(self.headers) == 0:
             self.headers = self.newHeaders[:]
             self._dumpStats(header=1)
             return
          
          if len(self.newHeaders) == 0:
             self._dumpStats()
             return
          
          os.rename(self.csvFileName,
                    os.path.join(self.resultDir,"temp.csv"))
          fp = open(os.path.join(self.resultDir,"temp.csv"),"r")
          fd = open(self.csvFileName,"w+")
          self.headers.extend(self.newHeaders)
          hdrStr = ",".join(self.headers)
          fd.write(hdrStr)
          fd.write("\n")
          
          fdump = open(os.path.join(self.resultDir,"logs.txt"),"a+")
          
          lineNum = 0
          for line in fp:
              line = line.strip()
              if len(line) == 0:
                 continue
              if lineNum == 0:
                 lineNum = lineNum + 1
                 continue
              
              
              lineStr = line
              fdump.write("Before Modification-> %s" %lineStr)
              fdump.write("\n")
              fdump.write("New Headers = %s" %self.newHeaders)
              fdump.write("\n")
              fdump.write("Old Headers = %s" %self.headers)
	      fdump.write("\n")
              
              for nwHdr in self.newHeaders:
                  lineStr = lineStr + ",0"
              
              fdump.write("After Modification-> %s" %lineStr)
              fdump.write("\n")
              fd.write(lineStr)
              fd.write("\n")
          
          fd.close()
          fp.close()
          fdump.close()
          os.remove(os.path.join(self.resultDir,"temp.csv"))
          self._dumpStats()
          
      
      def _dumpStats(self,header=0):
          
          #print "header = %s" %self.headers
          fp = open(self.csvFileName,"a+")
          if header == 1:
             headerStr = ",".join(self.headers)
             fp.write(headerStr)
             fp.write("\n")
          
          statStr = []
          for hdr in self.headers:
              statStr.append(self.statValues[hdr])
          
          statStr = ",".join([str(v) for v in statStr])
          fp.write(statStr)
          fp.write("\n")
          fp.close()

      
      def createResultDir(self):
          self.resultDir = os.path.join(os.getenv('IXIACR'),"data/results","%s_%s" %(self.runId,time.strftime("%a%d%b%Y%H%M%S")))
          os.makedirs(self.resultDir)
          self.csvFileName = os.path.join(self.resultDir, "Results.csv")
          fd = open(os.path.join(self.resultDir, "Results.csv"), "w+")
          fd.close()
          