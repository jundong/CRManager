import requests
import json
import time
import os
requests.packages.urllib3.disable_warnings()

ipstr = '10.200.117.236'
username = 'admin'
password =  'admin'

session = requests.Session()

url = 'https://' + ipstr + '/api/v1/auth/session'
jheaders = {'content-type': 'application/json'}
jdata = json.dumps({'username':username, 'password':password})

r = session.post(url, data=jdata, headers=jheaders, verify=False)
if(r.status_code == 200):
    print 'Login successful. Welcome ' + username
else:
    print r.content
    
url = 'https://' + ipstr +'/api/v1/bps/ports/'
r = session.get(url)
if(r.status_code == 200):
    print 'Port Status: ', r.json()['portReservationState']
else:
    print r.content

url = 'https://' + ipstr + '/api/v1/auth/session'    
r = session.delete(url)
if(r.status_code == 204):
    print 'Log Out successful. Good Bye ' + username
else:
    print r.content