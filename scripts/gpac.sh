#!/bin/bash
BASE=$(dirname "$0")
cd $BASE/../development
forever ./gpac-dash.js -chunk-media-segments -cors