SOURCE=$(realpath $1)
GOP_SIZE=60
PRESET_P=ultrafast
V_SIZE=1280x720

START_OFFSET=180
DURATION=90

../FFmpeg/bin/ffmpeg -i $SOURCE \
     -ss $START_OFFSET \
     -c:v libx264 -keyint_min $GOP_SIZE -g $GOP_SIZE -pix_fmt yuv420p -r 30 \
     -t $DURATION \
     -map v:0 -s:0 $V_SIZE \
     -init_seg_name init\$RepresentationID\$.\$ext\$ -media_seg_name chunk\$RepresentationID\$-\$Number%05d\$.\$ext\$ \
     -adaptation_sets "id=0,streams=v" \
     -use_template 1 -use_timeline 0 \
     -frag_type every_frame \
     -seg_duration 10 \
     -preset ultrafast \
     -f dash videos/$2/video.mpd