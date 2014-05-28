var fs = require('fs'),
    url = require('url'),
    path = require('path'),
    child_process = require("child_process");
    var width = 640,
        height = 480;
    var ffmpeg = child_process.spawn("avconv", [
    "-re",
    "-s", width + "x" + height, // size must be matched with Header sent to client.
    "-f", "video4linux2",
    "-i", "/dev/video0",
    "-r", "24",
    "-b","800k",
    // "-c:v","copy",
     "-f", "image2pipe",
    "-" // Output to STDOUT
    ]);
    ffmpeg.on("error", function(e) {
        console.log("ffmepg error " + e);
    });
    ffmpeg.stderr.on("data", function(data) {
        console.log("ffmepg stderr error " + data);
    });
    var filenumber = 0;
    ffmpeg.stdout.on('data', function(data) {
      filenumber ++;
      var f = fs.writeFileSync("output_" + filenumber + ".jpg", data);
    })
//ffmpeg -s 640x480 -f video4linux2 -i /dev/video0  -r 25 -c:v copy -f matroska - | ffplay -
