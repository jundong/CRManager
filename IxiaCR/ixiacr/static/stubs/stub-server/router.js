var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');

var mimeTypes = {
    '.html': 'text/html',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.css': 'text/css',
    '.ico': 'image/vnd.microsoft.icon',
    '.appcache': 'text/cache-manifest',
    '.htc': 'text/x-component'
};

function route(handle, pathname, response, queryString, postData) {
  // console.log('About to route a request for ' + pathname);
  // console.log(handle[pathname]);

  if (typeof handle[pathname] === 'function') {
    handle[pathname](response, queryString, postData, pathname);
    return;
  } 

  if (pathname.slice(0, 26) == '/spirent/get_result_series'
      && typeof handle['/spirent/get_result_series'] === 'function') {
    handle['/spirent/get_result_series'](response, queryString, postData);
    return;
  }

  if (pathname.slice(0, 20) == '/spirent/get_results'
      && typeof handle['/spirent/get_results'] === 'function') {
    handle['/spirent/get_results'](response, queryString, postData);
    return;
  }

  if (pathname.slice(0, 27) == '/spirent/get_result_history'
      && typeof handle['/spirent/get_result_history'] === 'function') {
    handle['/spirent/get_result_history'](response, queryString, postData);
    return;
  }

  if (pathname.slice(0, 11) == '/get-report'
      && typeof handle['/get-report'] === 'function') {
    handle['/get-report'](response, queryString, postData);
    return;
  }

  if (pathname.slice(0, 24) == '/spirent/get-report-data'
      && typeof handle['/spirent/get-report-data'] === 'function') {
    handle['/spirent/get-report-data'](response, queryString, postData);
    return;
  }

  if (pathname.slice(0, 9) == '/spirent/') {
    pathname = pathname.replace('/spirent/', '/stubs/');
    // console.log(pathname);
  }

  pathname = pathname.replace(/%20/g, ' ');
  // console.log('Current directory: ' + process.cwd());
  var filename = path.join(process.cwd(), '/../..', pathname);
  // console.log('Requested file: ' + filename);

  fs.exists(filename, function (exists) {
    if (!exists) {

      console.log('Requested file & could not find: ' + filename);
      return404(pathname, response);

      return;
    }

    var fileExtension = path.extname(filename);
    //console.log('File extension: ' + fileExtension);
	
    if (!(fileExtension in mimeTypes)) {
      console.log('Requested file & do not support mimeType/fileExtension: ' + fileExtension 
        + ' for file: ' + filename);
      return404(pathname, response);

      return;
    }

    var mimeType = mimeTypes[fileExtension];
    // console.log('MimeType: ' + mimeType);

    response.writeHead(200, {'Content-Type': mimeType});

    //console.log('Serving ' + pathname);
    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(response);
  });
}

function return404(pathname, response) {
	console.log('No request handler or file found for ' + pathname);
	response.writeHead(404, {'Content-Type': 'text/html'});
	
	var filename = path.join(process.cwd(), '/../../error.html');

    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(response);
}

exports.route = route;