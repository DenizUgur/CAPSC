#!/bin/bash
BASE=$(dirname "$0")
FFMPEG_BIN=$BASE/../FFmpeg/bin
FFMPEG=$FFMPEG_BIN/ffmpeg

SOURCE=$(readlink -m $1)
TARGET=$(readlink -m $BASE/../development/content/$2)

rm -rf $TARGET && mkdir -p $TARGET
GOP_SIZE=60
PRESET_P=ultrafast
V_SIZE_1=960x540
V_SIZE_2=416x234
V_SIZE_3=640x360
V_SIZE_4=768x432
V_SIZE_5=1280x720
V_SIZE_6=1920x1080
$FFMPEG \
     -flags2 +export_mvs \
     -stream_loop -1 -i $SOURCE \
     -vf "settb=AVTB,setpts='trunc(PTS/1K)*1K+st(1,trunc(RTCTIME/1K))-1K*trunc(ld(1)/1K)',drawtext=fontsize=30:fontcolor=white:text='%{localtime}.%{eif\:1M*t-1K*trunc(t*1K)\:d}'" \
     -c:v libx264 -keyint_min $GOP_SIZE -g $GOP_SIZE -pix_fmt yuv420p \
     -map v:0 -s:0 $V_SIZE_1 -b:v:0 1.5M -maxrate:0 1.6M -bufsize:0 2M \
     -map v:0 -s:1 $V_SIZE_3 -b:v:1 500k -maxrate:1 550k -bufsize:2 700k \
     -map v:0 -s:2 $V_SIZE_4 -b:v:2 1M -maxrate:2 1M -bufsize:3 1.2M \
     -init_seg_name init\$RepresentationID\$.\$ext\$ -media_seg_name chunk\$RepresentationID\$-\$Number%05d\$.\$ext\$ \
     -adaptation_sets "id=0,streams=v" \
     -use_template 1 -use_timeline 0 \
     -frag_type every_frame \
     -seg_duration 10 \
     -write_prft 1 \
     -utc_timing_url "http://time.akamai.com/?iso" \
     -streaming 1 -ldash 1 -tune zerolatency \
     -preset ultrafast \
     -f dash $TARGET/$2.mpd
