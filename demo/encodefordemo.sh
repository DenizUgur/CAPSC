SOURCE=$(readlink -m $1)
GOP_SIZE=60
PRESET_P=ultrafast
V_SIZE_1=960x540
V_SIZE_2=416x234
V_SIZE_3=640x360
V_SIZE_4=768x432
V_SIZE_5=1280x720
V_SIZE_6=1920x1080

ffmpeg -i bcn-short.mp4 \
     -c:v libx264 -keyint_min $GOP_SIZE -g $GOP_SIZE -pix_fmt yuv420p \
     -map v:0 -s:0 $V_SIZE_3 -b:v:0 500k \
     -init_seg_name init\$RepresentationID\$.\$ext\$ -media_seg_name chunk\$RepresentationID\$-\$Number%05d\$.\$ext\$ \
     -adaptation_sets "id=0,streams=v" \
     -use_template 1 -use_timeline 0 \
     -frag_type every_frame \
     -seg_duration 10 \
     -preset ultrafast \
     -f dash videos/bcn-short/video.mpd