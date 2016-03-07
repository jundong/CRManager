var crypto = require('crypto');
var fs = require('fs');
var http = require("http");
var https = require("https");
var url = require("url");

var port = 1337;
var httpsPort = 444;

var privateKey = fs.readFileSync('privatekey.pem').toString();
var certificate = fs.readFileSync('certificate.pem').toString();

//var credentials = crypto.createCredentials({key: privateKey, cert: certificate});
var httpsOptions = {
  key: privateKey,
  cert: certificate
};

function start(route, handle) {
  function onRequest(request, response) {
    var postData = "";

    var pathname = url.parse(request.url).pathname;
    var queryString = url.parse(request.url).query;

    // console.log("Request for " + pathname + " received.");

    request.setEncoding("utf8");

    request.addListener("data", function(postDataChunk) {
      postData += postDataChunk;
      console.log("Received POST data chunk '"+
      postDataChunk + "'.");
    });

    request.addListener("end", function() {
      route(handle, pathname, response, queryString, postData);
    });
  }

  http.createServer(onRequest).listen(port);
  console.log("Server has started on 127.0.0.1:" + port + ".");
  https.createServer(httpsOptions, onRequest).listen(httpsPort);
  console.log("Server has started on 127.0.0.1:" + httpsPort + ".");
}

exports.start = start;