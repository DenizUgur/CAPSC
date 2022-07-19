#!/bin/bash
POSITIONAL_ARGS=()

while [[ $# -gt 0 ]]; do
    case $1 in
    -i | --input)
        INPUT_FILE="$2"
        shift # past argument
        shift # past value
        ;;
    -n | --network-profile)
        NETWORK_PROFILE="-use-network-profile $2"
        shift # past argument
        shift # past value
        ;;
    -v | --visualization)
        VISUALIZATION=YES
        shift # past argument
        ;;
    -h | --help)
        echo "Usage: ./entrypoint.sh [-i | --input <input-file>] [-n | --network-profile cascade|lte|twitch] [-v | --visualization]"
        exit 0
        ;;
    -* | --*)
        echo "Unknown option $1"
        exit 1
        ;;
    *)
        POSITIONAL_ARGS+=("$1") # save positional arg
        shift                   # past argument
        ;;
    esac
done

set -- "${POSITIONAL_ARGS[@]}" # restore positional parameters

if [ -z $INPUT_FILE ]; then
    echo "No input file specified"
    exit 1
fi

if [ -z $VISUALIZATION ]; then
    VISUALIZATION=0
else
    VISUALIZATION=3
fi

# Start NGINX
nginx

# Start GPAC
cd /opt
(gpac-dash -chunk-media-segments -cors $NETWORK_PROFILE &) 1>/dev/null

# Check if GPAC is running
sleep 1
curl -s http://localhost:8000/status | grep -q "OK"

if [ $? -ne 0 ]; then
    echo "GPAC failed to launch, check your arguments"
    exit 1
fi

# Show banner
figlet "A-CAPSC Demonstration"
echo "============================================================"
echo
echo "Please give us a moment to start up..."
echo "Streaming to: http://localhost/"

# Start DASH Stream
SOURCE=$(realpath /home/$INPUT_FILE)
TARGET=$(realpath /opt/content/)

mkdir -p $TARGET

GOP_SIZE=60
PRESET=ultrafast
V_SIZE=1280x720

ffmpeg \
    -stream_loop -1 -re -i $SOURCE \
    -c:v libx264 -keyint_min $GOP_SIZE -g $GOP_SIZE -pix_fmt yuv420p -r 30 \
    -vf "sa=snooker:$VISUALIZATION" \
    -map v:0 -s:0 $V_SIZE \
    -init_seg_name init\$RepresentationID\$.\$ext\$ -media_seg_name chunk\$RepresentationID\$-\$Number%05d\$.\$ext\$ \
    -adaptation_sets "id=0,streams=v" \
    -use_template 1 -use_timeline 0 \
    -frag_type every_frame \
    -seg_duration 10 \
    -streaming 1 -ldash 1 -tune zerolatency \
    -preset $PRESET \
    -f dash $TARGET/app.mpd >/dev/null 2>&1
