#!/bin/bash

#* Kill previous sessions
pkill screen

#* Start GPAC
screen -d -m -S gpac scripts/gpac.sh

#* Start Ingest
screen -d -m -S ingest scripts/ingest-single.sh video.mp4 app

#* Start Server
screen -d -m -S server scripts/server.sh