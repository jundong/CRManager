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

ipstr = '10.200.117.137'
username = 'admin'
password =  'admin'

session = requests.Session()
session.mount('https://', MyAdapter())

url = 'https://' + ipstr + '/api/v1/auth/session'
jheaders = {'content-type': 'application/json'}
jdata = json.dumps({'username':username, 'password':password})

r = session.post(url, data=jdata, headers=jheaders, verify=False)
if(r.status_code == 200):
    print 'Login successful. Welcome ' + username
else:
    print r.content

#start upload of BPT here
filePath = 'new_appsim.bpt'
fileName = basename(filePath)
filePath = os.path.join(os.getcwd(),filePath)
files = {'file': (fileName, open(filePath, 'rb'), 'application/xml', {'Expires': '1000'})}
jdata = {'force': True}
#filePath.replace("\\","/")
    
url = 'https://' + ipstr +'/api/v1/bps/upload/'
#do not input content-type in this case
r = session.post(url, files=files, data=jdata, verify=False)
if(r.status_code == 200):
    print 'Success: ', r.content
else:
    print 'Error: ', r.status_code ,r.reason,  r.content
