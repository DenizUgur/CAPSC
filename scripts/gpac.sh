#!/bin/bash
cd $(pwd)/development
nodemon $(pwd)/gpac-dash.js -chunk-media-segments -cors -log debug-max