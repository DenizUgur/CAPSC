#!/bin/bash
BASE=$(pwd)

# Start NGINX
nginx -s stop >/dev/null 2>&1
nginx -c $BASE/config/nginx.dev.conf

# Start React
BROWSER=none npm --prefix $BASE/server/app run start
