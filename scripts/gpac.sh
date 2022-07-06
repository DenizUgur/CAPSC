#!/bin/bash
BASE=$(dirname "$0")
cd $BASE/../server
forever ./gpac-dash.js -chunk-media-segments -cors