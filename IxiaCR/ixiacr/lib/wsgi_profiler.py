import time

class RequestProfiler(object):
    """Profiles requests and times them.

    Extends with environ['RequestProfiler'] which can be used to supply custom counters.
    Profile data can be viewed in /_RequestProfiler

    How to use::

        app = RequestProfiler(app, custom_cols=['db_used', 'memcache_used'])

    Using environ to log the number of database connections made::

        environ['RequestProfiler']['db_used'] += 1
    """

    static_exts = ['.js', '.css', '.gif', '.jpg', '.jpeg', '.png']

    def __init__(self, app, profile_static=False, max_log=30000, custom_cols=[]):
        self.app = app
        self.profile_static = profile_static
        self.max_log = max_log

        self.current_logged = 0
        self.path_data = {}
        self.custom_cols = custom_cols

    def __call__(self, environ, start_response):
        path_info = environ.get('PATH_INFO', '')

        if path_info.find('/_RequestProfiler') == 0:
            return self._display_info(environ, start_response)

        #Determine if we should log
        do_log = True
        if not self.profile_static:
            for ext in self.static_exts:
                if ext in path_info:
                    do_log = False

        if self.current_logged > self.max_log:
            do_log = False

        if do_log:
            self.current_logged += 1

            time_start = time.time()
            path_data = self._create_path_data(path_info)
            environ['RequestProfiler'] = path_data.data

            def log_start_response(status, headers, exc_info=None):
                time_elapsed = time.time() - time_start
                path_data.log_time(time_elapsed)
                return start_response(status, headers, exc_info)

            return self.app(environ, log_start_response)
        else:
            return self.app(environ, start_response)


    #--- Private ----------------------------------------------
    def _create_path_data(self, path_info):
        if not path_info in self.path_data:
            obj = self.path_data[path_info] = PathData(path_info, self.custom_cols)
        return self.path_data.get(path_info)

    def _display_info(self, environ, start_response):
        headers = [('Content-Type', 'text/html')]
        start_response('200 OK', headers)

        sort_after = 'total_time'
        q_string = environ['QUERY_STRING']
        if 'sort=' in q_string:
            sort_after = q_string.split('=')[1]

        lines = []
        lines.append('<p>Sorting after: <b>%s</b></p>' % sort_after)
        lines.append('<table border="1">')

        create_link = lambda col: '<a href="/_RequestProfiler?sort=%s">%s</a>' % (col, col)

        cols = ['total_time', 'hits', 'avg_time']
        cols.extend(self.custom_cols)

        lines.append('<tr>')
        lines.append('<th>Path</th>')
        for default in cols:
            lines.append('<th>%s</th>' % create_link(default))

        lines.append('</tr>')

        sorted_items = self._sort_items(self.path_data.values(), sort_after)

        i = 0
        for obj in sorted_items:
            lines.append('<tr>')

            lines.append('<td>%s</td>' % obj.path_info)
            for col in cols:
                lines.append('<th>%s</th>' % obj.get_data(col))

            lines.append('</tr>')

            if i > 200:
                break
            i += 1

        lines.append('</table>')

        return [HTML % '\n'.join(lines)]

    def _sort_items(self, items, col='avg_time'):
        vals = [(-i.get_data(col), i) for i in items]
        return (i[1] for i in sorted(vals))


class PathData(object):
    """Holds data about a path"""

    def __init__(self, path_info, custom_cols):
        self.path_info = path_info
        self.data = {
            'avg_time': 0,
            'hits': 0
        }

        self.custom_cols = custom_cols
        for col in self.custom_cols:
            self.data[col] = 0

    def log_time(self, time_elapsed):
        self.data['avg_time'] += time_elapsed
        self.data['hits'] += 1

    def get_data(self, col='avg_time'):
        d = self.data

        if col == 'hits':
            return d['hits']

        if col == 'total_time':
            avg = float( d['avg_time'] / d['hits'])
            return avg * d['hits']

        return float( d[col] / d['hits'])


#--- Templates ----------------------------------------------
HTML = """<html>
<head>
<title>RequestProfiler stats</title>
<style>
body, table, th, td {
    text-align: left;
    font-family: sans-serif;
}
th {
    padding-right: 7px;
}

a {
    color: blue;
}
</style>
</head>
<body>
</body>
%s
</html>"""

