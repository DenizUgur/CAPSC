#!/bin/bash
BASE=$(dirname "$0")
STREAM_NAME=$2
STREAM_OFFSET=$3
FFMPEG_BIN=$BASE/../FFmpeg/bin
FFMPEG=$FFMPEG_BIN/ffmpeg

SOURCE=$(realpath $1)
TARGET=$(realpath $BASE/../development/content/$STREAM_NAME)

if [ -z $STREAM_NAME ]; then
     STREAM_NAME=app
fi

if [ -z $STREAM_OFFSET ]; then
     STREAM_OFFSET=0
fi

rm -rf $TARGET && mkdir -p $TARGET

GOP_SIZE=50
PRESET=ultrafast
V_SIZE_1=960x540
V_SIZE_2=1280x720

$FFMPEG \
     -ss $STREAM_OFFSET \
     -stream_loop -1 -re -i $SOURCE \
     -c:v libx264 -keyint_min $GOP_SIZE -g $GOP_SIZE -pix_fmt yuv420p \
     -vf "sa=snooker:0" \
     -map v:0 -s:0 $V_SIZE_2 -b:v:0 500k \
     -init_seg_name init\$RepresentationID\$.\$ext\$ -media_seg_name chunk\$RepresentationID\$-\$Number%05d\$.\$ext\$ \
     -adaptation_sets "id=0,streams=v" \
     -use_template 1 -use_timeline 0 \
     -frag_type every_frame \
     -seg_duration 10 \
     -streaming 1 -ldash 1 -tune zerolatency \
     -preset $PRESET \
     -f dash $TARGET/$STREAM_NAME.mpd
