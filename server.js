var express = require('express')
  , http = require('http')
  , path = require('path')
  , child_process = require("child_process")
var app = express();

// Server settings
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.errorHandler());

// View start page
app.get('/',function(req,res){
    res.render("video"); // Render basic HTML5 video player for /video.webm
});

// Serve the video
app.get('/video.webm',function(req,res,next){

    // Start demo "simulation"
    // var glxgears = child_process.spawn("glxgears",[]);

    // Wait for glxgears to start properly
    setTimeout(function(){

        // Use xwininfo to get the glxgears window position
        var cmd = "xwininfo -root -tree";
        child_process.exec(cmd,function(err,stdout,stderr){
            if(err) 
            {   console.log("exec xwininfo");
                return next(err);
            };

            // Get the X11 window size and position
            var lines = stdout.toString().split("\n");
            var width = 300;
            var height = 300;
            var top = 55;
            var left = 52;
            for(var i=0; i<lines.length; i++){
                if(lines[i].match(/gears/)){
                    // Got something like:
                    // 0x5000002 "glxgears": ()  300x300+0+0  +328+89
                    var r = /(\d+)x(\d+)\+(\d+)\+(\d+)\s+\+(\d+)\+(\d+)/;
                    var m = lines[i].match(r);
                    width = m[1];
                    height = m[2];
                    top = m[5];
                    left = m[6];
                    break;
                }
            }

            // Write header
            res.writeHead(200, {
              'Content-Type': 'video/webm'
            });

            // Start ffmpeg
            
             var ffmpeg = child_process.spawn("ffmpeg",[
                "-f","video4linux2",          // Grab screen
                "-i","/dev/video0",
                "-r","30",              // Framerate
                "-s","400x300",   // Capture size
                "-g","0",                // All frames are i-frames
                "-me_method","zero",     // Motion algorithms off
                "-flags2","fast",
                "-vcodec","libvpx",      // vp8 encoding
                "-f","webm",             // File format
                "-"                      // Output to STDOUT
            ]);
            // var ffmpeg = child_process.spawn("ffmpeg",[
            //     "-re",                   // Real time mode
            //     "-f","x11grab",          // Grab screen
            //     "-r","60",              // Framerate
            //     "-s",width+"x"+height,   // Capture size
            //     "-i",":0+"+top+","+left, // Capture offset
            //     "-g","0",                // All frames are i-frames
            //     "-me_method","zero",     // Motion algorithms off
            //     "-flags2","fast",
            //     "-vcodec","libvpx",      // vp8 encoding
            //     "-f","webm",             // File format
            //     "-"                      // Output to STDOUT
            // ]);
            ffmpeg.on("error",function(e) {
                console.log("ffmepg error " + e);
            });
            ffmpeg.stderr.on("data",function(data) {
                console.log("ffmepg stderr error " + data);
            });
            /*
            
            var ffmpeg_try3 = child_process.spawn("avconv",[
                //"-deadline","realtime", 
                "-s","640x480",   // Capture size
                "-f","video4linux2",
                "-i","/dev/video0",
                "-f","mpeg1video", 
                "-i",":0+"+top+","+left, // Capture offse
                "-b","800k",
                "-r",30,
                "-"                      // Output to STDOUT
            ]);
            */
            //
            //avconv -f x11grab -s 1024x768 -r 24 -i 0:0 -deadline realtime -b 5000000 -minrate 200000 -maxrate 40000000 recording-filename-000.webm
            //avconv -s 640x480 -f video4linux2 -i /dev/video0 -f mpeg1video -b 800k -r 30 http://127.0.0.1:8082/herry/640/480/
            // Pipe the video output to the client response
            ffmpeg.stdout.pipe(res);

            // Kill the subprocesses when client disconnects
            res.on("close",function(){
                // glxgears.kill();
                ffmpeg.kill();
            })
        });
    },500);
});

// Start server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});