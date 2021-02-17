#!/bin/bash
cd $(pwd)/development
forever $(pwd)/gpac-dash.js -chunk-media-segments -cors