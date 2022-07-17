#!/bin/bash
BASE=$(dirname "$0")
export NODE_ENV=development

cd $BASE/../server
forever ./gpac-dash.js -chunk-media-segments -cors $@