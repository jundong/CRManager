import StringIO
import csv
import re

import time
from json import loads

from collections import defaultdict
from pyramid.httpexceptions import HTTPNotFound
from pyramid.i18n import get_localizer, TranslationStringFactory

from ixiacr.lib import ixiacr_logger
from ixiacr.lib.utils import admin_helper
from itertools import izip_longest

ixiacrlogger = ixiacr_logger.IxiaLogger(__name__)

_ = TranslationStringFactory('messages')


def view_includes(config):
    config.add_route('printable_results', '/print')
    config.add_view(printable_results, route_name='printable_results',
                    renderer='test_results/results.jinja2')
    config.add_route('downloadable_results', '/csv')
    config.add_view(downloadable_results, route_name='downloadable_results')

def get_local_host_ip():
    (result, obj, err) = admin_helper('get-network-status', {})
    network_status = obj
    if result != 'SUCCESS':
        address = '169.254.0.3'
    else:
        address = network_status['ipv4']['address']
    return address

def render_results_as_csv(value, localizer):
    fout = StringIO.StringIO()
    writer = csv.writer(fout, dialect='excel')

    def write_row(row):
        writer.writerow([v.encode('utf-8') for v in row])

    # Header information block
    write_row(['IxiaCore Name:', value.get('device_name', 'Local Chassis')])
    write_row(['Test Date:', value['test_date']])
    write_row(['Test Name:', value['test'].name])
    write_row(['IxiaCore Build Number:', unicode(value['build_number'])])

    write_row([])

    return fout.getvalue()

def printable_results(request):
    test_result_id = extract_test_result_id(request)
    if test_result_id is None:
        return HTTPNotFound()

    test_date_utc_offset = extract_test_date_utc_offset(request)
    localizer = get_localizer(request)
    results = None

    return results


def downloadable_results(request):
    test_result_id = extract_test_result_id(request)
    if test_result_id is None:
        return HTTPNotFound()

    response = request.response

    return response


def extract_test_result_id(request):
    test_result_id = request.params.get('result-id', None)
    if test_result_id is None or not test_result_id.isdigit():
        return None

    return test_result_id


def extract_test_date_utc_offset(request):
    return request.params.get('offset', u'0')
