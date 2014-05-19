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
// if (process.argv.length < 3) {
//     console.log('Usage: \n' + 'node stream-server.js <secret> [<stream-port> <websocket-port>]');
//     process.exit();
// }

var STREAM_SECRET = process.argv[2],
    STREAM_PORT = process.argv[3] || 8082,
    WEBSOCKET_PORT = process.argv[4] || 8084,
    STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

//There is limitation on the size. The client canvas size is 640x480. it should be no more than
var width = 640,
    height = 480;

// Websocket Server
var socketServer = new(require('ws').Server)({
    port: WEBSOCKET_PORT
});
var ffmpeg = child_process.spawn("ffmpeg", [
"-f", "video4linux2", 
"-s", width + "x" + height, // size must be matched with Header sent to client. 
"-i", "/dev/video0", 
"-f", "mpeg1video", 
"-b", "800K", 
"-r", "30", 
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
    // Send magic bytes and video size to the newly connected socket
    // struct { char magic[4]; unsigned short width, height;}
    var streamHeader = new Buffer(8);
    streamHeader.write(STREAM_MAGIC_BYTES);
    streamHeader.writeUInt16BE(width, 4);
    streamHeader.writeUInt16BE(height, 6);
    socket.send(streamHeader, {
        binary: true
    });

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
    if(uri === "/") uri = "/index.html";
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

// HTTP Server to accept incomming MPEG Stream
// var streamServer = require('http').createServer( function(request, response) {
// 	var params = request.url.substr(1).split('/');
// 	width = (params[1] || 320)|0;
// 	height = (params[2] || 240)|0;

// 	if( params[0] == STREAM_SECRET ) {
// 		console.log(
// 			'Stream Connected: ' + request.socket.remoteAddress + 
// 			':' + request.socket.remotePort + ' size: ' + width + 'x' + height
// 		);
// 		request.on('data', function(data){
// 			socketServer.broadcast(data, {binary:true});
// 		});
// 	}
// 	else {
// 		console.log(
// 			'Failed Stream Connection: '+ request.socket.remoteAddress + 
// 			request.socket.remotePort + ' - wrong secret.'
// 		);
// 		response.end();
// 	}
// }).listen(STREAM_PORT);

console.log('Listening for MPEG Stream on http://127.0.0.1:' + STREAM_PORT + '/<secret>/<width>/<height>');
console.log('Awaiting WebSocket connections on ws://127.0.0.1:' + WEBSOCKET_PORT + '/');
