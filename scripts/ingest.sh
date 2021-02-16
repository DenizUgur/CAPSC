#!/bin/bash
BASE=$(dirname "$0")
FFMPEG_BIN=$BASE/../FFmpeg/bin
FFMPEG=$FFMPEG_BIN/ffmpeg

SOURCE=$(readlink -m $1)
TARGET=$(readlink -m $BASE/../development/content/$2)

rm -rf $TARGET && mkdir -p $TARGET

$FFMPEG \
     -flags2 +export_mvs \
     -stream_loop -1 -re -i $SOURCE \
     -vf "settb=AVTB,setpts='trunc(PTS/1K)*1K+st(1,trunc(RTCTIME/1K))-1K*trunc(ld(1)/1K)',drawtext=fontsize=30:fontcolor=white:text='%{localtime}.%{eif\:1M*t-1K*trunc(t*1K)\:d}'" \
     -c:v libx264 \
     -use_template 1 -use_timeline 0 \
     -frag_type every_frame \
     -seg_duration 10 \
     -write_prft 1 \
     -utc_timing_url "http://time.akamai.com/?iso" \
     -streaming 1 -ldash 1 -tune zerolatency \
     -preset ultrafast \
     -f dash $TARGET/$2.mpd
