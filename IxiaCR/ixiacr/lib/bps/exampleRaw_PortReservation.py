# import requests
# import json
# import re
# import time
# import os
# requests.packages.urllib3.disable_warnings()
#
# ipstr = '10.210.100.30'
# username = 'admin'
# password =  'admin'
#
# session = requests.Session()
#
# url = 'https://' + ipstr + '/api/v1/auth/session'
# jheaders = {'content-type': 'application/json'}
# jdata = json.dumps({'username':username, 'password':password})
#
# r = session.post(url, data=jdata, headers=jheaders, verify=False)
# if(r.status_code == 200):
#     print 'Login successful. Welcome ' + username
# else:
#     print r.content
#
# url = 'https://' + ipstr +'/api/v1/bps/ports/'
# r = session.get(url)
# if(r.status_code == 200):
#     status = r.json()['portReservationState']
#     p = re.compile('\[slot=\d+,port=\d+\]=\d+')
#     pl = p.findall(status)
#
#     m = re.match('\[slot=(\d+),port=(\d+)\]=(\d+)', pl[0])
#     ml = m.groups()
#
#     p = re.compile('\[slot=\d+,port=\d+\]=\d+:\[reserved=\S+,number=\d+\]')
#     pl = p.findall(status)
#
#     m = re.match('\[slot=(\d+),port=(\d+)\]=\d+:\[reserved=(\S+),number=(\d+)\]', pl[0])
#     ml = m.groups()
# else:
#     print r.content
#
# # url = 'https://' + ipstr + '/api/v1/auth/session'
# # r = session.delete(url)
# # if(r.status_code == 204):
# #     print 'Log Out successful. Good Bye ' + username
# # else:
# #     print r.content