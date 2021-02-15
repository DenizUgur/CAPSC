#!/bin/bash
rm -rf development/content/*

$(pwd)/FFmpeg/bin/ffmpeg \
     -flags2 +export_mvs \
     -stream_loop -1 -re -i $1 \
     -c:v libx264 \
     -use_template 1 -use_timeline 0 \
     -frag_type every_frame \
     -seg_duration 10 \
     -write_prft 1 \
     -utc_timing_url "http://time.akamai.com/?iso" \
     -streaming 1 -ldash 1 -tune zerolatency \
     -preset ultrafast \
     -f dash development/content/app.mpd
