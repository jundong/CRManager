import os
import time
from pyramid.httpexceptions import HTTPNotFound
from pyramid.response import FileResponse


def view_includes(config):
    """
    Registers handlers.
    """
    config.add_route("download", "/ixia/download/{uid}")
    config.add_view(download, route_name="download", permission="all_access")


def download(request):
    """
    Handler serving download requests.
    """
    uid = request.matchdict["uid"]
    filename = get_file_for_download(request, uid)
    if filename is None:
        return HTTPNotFound()

    response = FileResponse(filename, request)
    response.content_disposition = "attachment;filename=\"{0}\"".format(
        os.path.basename(filename))

    return response


def add_file_for_download(request, filename):
    """
    Registers the given file in the list of files available for download and
    returns the download link. The link contains UID of the download instead of
    the filesystem path. This mechanism prevents malicious users from
    downloading an arbitrary file. The UID is valid during the web session
    lifetime only.
    """
    uid = generate_uid()
    request.session[get_attribute_name(uid)] = filename

    return request.route_path("download", uid=uid)


def get_file_for_download(request, uid):
    """
    Returns the filename corresponding to the given UID. If the UID is not valid
    None is returned.
    """
    attribute_name = get_attribute_name(uid)
    if attribute_name not in request.session:
        return None

    return request.session[attribute_name]


def get_attribute_name(uid):
    """
    Returns session attribute name by the given UID.
    """
    return "download_" + uid


def generate_uid():
    """
    Generates UID for a download.
    """
    return str(int(time.time()))

