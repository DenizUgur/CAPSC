#!/bin/bash

#* Start GPAC
sudo gnome-terminal -t GPAC -- ./scripts/gpac.sh

#* Start Ingest
cd metadata-feeder/metadata
sudo gnome-terminal -t Metadata -- ./mvnw spring-boot:run
cd -

#* Start Server
sudo gnome-terminal -t Server -- ./scripts/server.sh