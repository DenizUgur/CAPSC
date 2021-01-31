#!/bin/bash
$(pwd)/FFmpeg/bin/ffmpeg \
     -flags2 +export_mvs \
     -stream_loop -1 -re -i $1 \
     -c:v libx264 \
     -use_template 1 -use_timeline 0 \
     -frag_type every_frame \
     -seg_duration 8 \
     -streaming 1 -ldash 1 -tune zerolatency \
     -remove_at_exit 1 \
     -f dash content/app.mpd
