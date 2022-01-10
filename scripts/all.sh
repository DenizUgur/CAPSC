#!/bin/bash

#* Start GPAC
sudo gnome-terminal -t GPAC -- ./scripts/gpac.sh

#* Start Ingest
sudo gnome-terminal -t Ingest -- ./scripts/ingest.sh $1

#* Start Server
sudo gnome-terminal -t Server -- ./scripts/server.sh