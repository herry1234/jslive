Purpose:
live streaming the video capture card to Browser.

Approaches tried:
-Wowza + ffmepg
 wowza 4.0, config...
 ffmepg
 avconv -re -f video4linux2 -i /dev/video0 -b:v 300k -c:v libx264 -g 15 -pix_fmt yuv420p -an -f flv rtmp://171.71.46.197:1935/live/myStream
 working, but it has 5 seconds delay.
 
-VLC streaming
not success.
-MEPG-DASH
not success.
gpac reports error while streaming. lacks of codec.  Maybe it's working well with webcam. but it has problem with capture card. 
-WebRTC
not sucess. Screen is black. 

-FFMPEG webm encoding + HTTP + video TAG.
It's pretty good to have video tag. 
workable.
3 seconds delay.


-jsmpeg+ws+ffmepg
ffmpeg
avconv -s 640x480 -f video4linux2 -i /dev/video0 -f mpeg1video -b 800k -r 30 http://127.0.0.1:8082/herry/640/480/
server node.js:
accept the mpeg1 data and send it out to client. 
client side:
using jsmpeg to decode the data from websocket.

It's basiclly no delay. <1s

-broadway (h264 livestreaming)
still on going. 
https://github.com/mbebenita/Broadway/issues/9
https://github.com/bkw/node-dronestream

 
