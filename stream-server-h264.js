var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    child_process = require("child_process");
var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"
};

var STREAM_PORT = process.argv[3] || 8082,
    WEBSOCKET_PORT = process.argv[4] || 8084;

//There is limitation on the size. The client canvas size is 640x480. it should be no more than
var width = 640,
    height = 480;

// Websocket Server
var socketServer = new(require('ws').Server)({
    port: WEBSOCKET_PORT,
});
var ffmpeg = child_process.spawn("avconv", [
"-re",
"-s", width + "x" + height, // size must be matched with Header sent to client.
"-f", "video4linux2",
"-i", "/dev/video0",
"-profile:v","baseline",
"-c:v", "libx264",
"-b", "800K",
"-r", "24",
"-f", "h264",
"-" // Output to STDOUT
]);
ffmpeg.on("error", function(e) {
    console.log("ffmepg error " + e);
});
ffmpeg.stderr.on("data", function(data) {
    console.log("ffmepg stderr error " + data);
});

ffmpeg.stdout.on('data', function(data) {
    socketServer.broadcast(data, {
        binary: true
    });
})
socketServer.on('connection', function(socket) {
    console.log('New WebSocket Connection (' + socketServer.clients.length + ' total)');
    socket.on('close', function(code, message) {
        console.log('Disconnected WebSocket (' + socketServer.clients.length + ' total)');
    });

});

socketServer.broadcast = function(data, opts) {
    // console.log("broadcasting");
    for (var i in this.clients) {
        this.clients[i].send(data, opts);
    }
};

var streamServer = require('http').createServer(function(req, res) {

    var uri = url.parse(req.url).pathname;
    if(uri === "/") uri = "/h264.html";
    console.log("URI " + uri);
    var filename = path.join(process.cwd(), uri);
    console.log("filename " + filename);
    fs.exists(filename, function(exists) {
        if (!exists) {
            console.log("file not exists: " + filename);
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.write('404 Not Found\n');
            res.end();
            return;
        }
        var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
        res.writeHead(200, {
            'Content-Type': mimeType
        });

        var fileStream = fs.createReadStream(filename);
        fileStream.pipe(res);
    });
}).listen(STREAM_PORT);

console.log('Listening for server on http://127.0.0.1:' + STREAM_PORT + "/");
console.log('Awaiting WebSocket connections on ws://127.0.0.1:' + WEBSOCKET_PORT + '/');
