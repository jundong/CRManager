"""
.. module:: utils
   :synopsis: A module that provides reusable system functions for Ixia.
"""
import os
import time
import json
from json import loads, dumps
from itertools import chain
import socket
import fcntl
import struct
import array
import string
import random
import subprocess
import datetime
import transaction
from ixiacr.models import (IxiaVersion, UIMessage)
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from zope.sqlalchemy import ZopeTransactionExtension
from ixiacr.lib import IxiaLogger

log = IxiaLogger(__name__)

pad = lambda s: s + (16 - len(s) % 16) * chr(16 - len(s) % 16)
unpad = lambda s: s[0:-ord(s[-1])]


def enum(*sequential, **named):
    enums = dict(zip(sequential, range(len(sequential))), **named)
    reverse = dict((value, key) for key, value in enums.iteritems())
    enums['reverse_mapping'] = reverse
    return type('Enum', (), enums)


def get_ip(iface='eth0'):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sockfd = sock.fileno()
    SIOCGIFADDR = 0x8915

    ifreq = struct.pack('16sH14s', iface, socket.AF_INET, '\x00'*14)
    try:
        res = fcntl.ioctl(sockfd, SIOCGIFADDR, ifreq)
    except:
        return None
    ip = struct.unpack('16sH2x4s8x', res)[2]
    return socket.inet_ntoa(ip)

def local_interfaces():
    max_possible = 128  # arbitrary. raise if needed.
    bytes = max_possible * 32
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    names = array.array('B', '\0' * bytes)
    outbytes = struct.unpack('iL', fcntl.ioctl(
        s.fileno(),
        0x8912,  # SIOCGIFCONF
        struct.pack('iL', bytes, names.buffer_info()[0])
    ))[0]
    namestr = names.tostring()
    return [namestr[i:i+32].split('\0', 1)[0] for i in range(0, outbytes, 32)]


def fix_date(t):
    if not t:
        return "Unknown"
    return t.strftime("%m/%d/%Y %I:%M:%S %p")


def convert(number):
    if not number:
        return '0 Bytes'
    assert 0 < number < 1 << 110, 'number out of range'
    ordered = reversed(tuple(format_bytes(partition_number(number, 1 << 10))))
    cleaned = ', '.join(item for item in ordered if item[0] != '0')
    return cleaned

def is_dict_equal(a, b):
    """ Return True if two dicts are equal. Includes nested dicts.
    """
    a_keys = sorted(a.keys())
    b_keys = sorted(b.keys())

    if a_keys != b_keys:
        return False

    for key in a_keys:
        v1, v2 = a[key], b[key]

        if isinstance(v1, list):
            if not isinstance(v2, list) or len(v1) != len(v2):
                return False

            for i1, i2 in zip(v1, v2):
                if i1 != i2:
                    return False

        elif isinstance(v1, dict):
            if not isinstance(v2, dict):
                return False

            result = is_dict_equal(v1, v2)
            if not result:
                return False

        else:
            if v1 != v2:
                return False

    return True

def partition_number(number, base):
    div, mod = divmod(number, base)
    yield mod
    while div:
        div, mod = divmod(div, base)
        yield mod


def format_bytes(parts):
    for power, number in enumerate(parts):
        yield '{0}'.format(number)


def format_suffix(power, number):
    PREFIX = ' k m g tera peta exa zetta yotta bronto geop'.split(' ')
    return (PREFIX[power] + 'byte').capitalize() + \
           ('s' if number != 1 else '')


def is_iter_obj(obj):
    itr = iter(obj)
    try:
        item = itr.next()
    except:
        return None
    return chain((item,), itr)


def random_id(size=6, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for x in range(size))


def get_build_number():
    try:
        return IxiaVersion.first().build
    except Exception, e:
        log.warn('get_build_number from db: Exception. %s' % e)
        pass

    return "Unknown"


def update_ixiacr_version_build_number():
    try:
        # cr = IxiaVersion.first()
        # cr.build = get_build_number_from_file()
        # transaction.commit()
        pass
    except Exception, e:
        log.exception('update_ixiacr_version_build_number: Exception. %s' % e)
        return "Unknown"


def is_pingable(url):
    try:
        (out, err) = timeout_command('ping -c 1 %s' % url, 1)
        if err:
            log.error('is_pingable: subprocess err. %s' % err)
            raise Exception(err)
        else:
            return True
    except Exception, e:
        log.exception('is_pingable: Exception. %s' % e)
        return False


def timeout_command(command, timeout):
    """call shell-command and either return its output or kill it
    if it doesn't normally exit within timeout seconds and return None"""
    import os
    import signal

    cmd = command.split(" ")
    start = datetime.datetime.now()
    process = subprocess.Popen(cmd,
                               stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)

    while process.poll() is None:
        time.sleep(0.1)
        now = datetime.datetime.now()
        if (now - start).seconds > timeout:
            os.kill(process.pid, signal.SIGKILL)
            os.waitpid(-1, os.WNOHANG)
            return None

    return process.stdout.read(), process.stderr.read()


def admin_helper(command, data, task_name=False, debug_raw=False):
    '''Call admin helper and return the result status, object, and any error
    status, command is expected to be a helper name in /local/admin and
    data should be dictionary object.

    :param command: The name of the admin_helper to call.
    :type command: String
    :param data: Object with the options to pass to the admin_helper.
    :type data: JSON
    :param task_name: Used to determine if admin_helper is tasked.
    :type task_name: String
    :returns: JSON--Admin Result object.
    :raises: Exception

    '''
    log.debug('admin_helper(%s): starting' % command)
    start = time.time()

    try:
        if data:
            sp = subprocess.Popen([os.path.join(os.getenv('IXIACR'), 'admin/') + command],
                                  shell=False,
                                  stdin=subprocess.PIPE,
                                  stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE)
        else:
            sp = subprocess.Popen([os.path.join(os.getenv('IXIACR'), 'admin/') + command, '-d'],
                                  shell=False,
                                  stdin=None,
                                  stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE)

        if task_name:
            db_sess = scoped_session(
                sessionmaker(extension=ZopeTransactionExtension()))
            db_sess.configure(
                bind=create_engine(
                    'sqlite:///%(here)s/cyberrange.sqlite'))

            progress = 0
            message = ""

            if data:
                sp.stdin.write(dumps(data))
                sp.stdin.close()

            while sp.poll() is None:
                output = loads(sp.stderr.readline())
                if 'progress' in output:
                    progress = int(output['progress'])
                if 'message' in output:
                    message = output['message']
                if output:
                    ui_message = db_sess.query(UIMessage).first()
                    if not ui_message:
                        ui_message = UIMessage()
                        db_sess.add(ui_message)
                    ui_message.name = task_name
                    ui_message.description = dumps(
                        {'progress': progress, 'message': message})
                    transaction.commit()
                else:
                    db_sess.query(UIMessage).delete()
                    transaction.commit()
            out = sp.stdout.read()
            err = sp.stderr.read()
            obj = loads(out)
        else:
            (out, err) = sp.communicate(dumps(data) if data else None)
            obj = loads(out)

        stop = time.time()
        log.debug('admin_helper({0}): completed in {1:.3f} seconds'
                  .format(command, float(stop - start)))
        msg = obj.get('message', err)
        if msg is None:
            msg = 'Unknown'
        if debug_raw:
            return obj.get('result', 'FAILURE'), obj.get('object', {}), msg, {'out': out, 'err': err}
        return obj.get('result', 'FAILURE'), obj.get('object', {}), msg
    except Exception, e:
        stop = time.time()
        log.exception('admin_helper({0}): exception {1} after {2:.3f} seconds'
                      .format(command, e, float(stop - start)))
        if debug_raw:
            return {}, {}, e, {'out': out, 'err': err}
        return {}, {}, e


class IxiaEncoder(json.JSONEncoder):
    '''This class is for encoding objects to JSON.  Specifically,
    it is used for datetime objects from PostgreSQL.

    '''
    def default(self, obj):
        '''The default method for the encoding JSON objects with datetime
        types.

        :param obj: The object to encode.
        :type obj: object
        :returns:  object
        :raises: Exception

        '''
        try:
            if isinstance(obj, datetime.date):
                return obj.ctime()
            elif isinstance(obj, datetime.time):
                return obj.isoformat()
            return json.JSONEncoder.default(self, obj)
        except Exception, e:
            raise


def generate_file_object(filename, path, expand=False, show_all=False):

    log.info('Entering: generate_file_object')
    def dir_modification_date(obj):
        ''' If we add directories later, we will have to use an encoder.'''
        log.info('Entering: dir_modification_date')
        try:
            mt = os.path.getmtime(obj)
            return json.dumps(datetime.datetime.utcfromtimestamp(mt), cls=IxiaEncoder)
        except Exception, e:
            log.exception('dir_modification_date: Exception. %s' % e)
            raise

    def format_suffix(power, number):
        log.info('Entering: format_suffix')
        PREFIX = ' k m g tera peta exa zetta yotta bronto geop'.split(' ')
        return (PREFIX[power] + 'byte').capitalize() + ('s' if number != 1 else '')

    def commafy(size):
        s = '%0.2f' % size
        a,b = s.split('.')
        l = []

        while len(a) > 3:
            l.insert(0,a[-3:])
            a = a[0:-3]
        if a:
            l.insert(0,a)
        return ','.join(l)

    def modification_date(filename):
        ''' All we need for individual files '''
        log.info('Entering: modification_date')
        return time.strftime('%m/%d/%Y %I:%M:%S %p',
                             time.localtime(os.path.getmtime(filename)))

    try:
        obj = {}
        obj['name'] = filename
        obj['parent_dir'] = path
        obj['path'] = os.path.join(path, filename)
        obj['directory'] = os.path.isdir(obj['path'])
        size = os.path.getsize(obj['path'])
        obj['size'] =  commafy(size) + ' ' +format_suffix(0, size)
        obj['modified'] = str(modification_date(obj['path'])).strip('\'')

        children = []
        if os.path.isdir(obj['path']):
            for o in os.listdir(obj['path']):
                if os.path.isdir(os.path.join(obj['path'], o)):
                    full_path = os.path.join(obj['path'], o)
                    path_arr = full_path.split('/')
                    pts = path_arr[len(path_arr)-1]
                    children.append(generate_file_object(pts, obj['path']))
                else:
                    children.append(o)
        obj['children'] = children

    except Exception,e:
        log.exception('modification_date: Exception. %s' % e)
        raise

    log.info('Exiting: modification_date')
    return obj


def get_global_vars():
    features = []

    return {'build_number': '',
            'ui_log_level': '',
            'features': ''}

class IxiaJsonLoader(object):

    def __init__(self, json_file):
        self.json_file = os.path.join(os.path.dirname(__file__), json_file)

    def __call__(self):
        with open(self.json_file, 'r') as f:
            return json.loads(f.read())
