#!/bin/bash
BASE=$(dirname $0)

NGINX_CONF=$(realpath $BASE/../config/nginx.dev.conf)

# Start NGINX
nginx -s stop >/dev/null 2>&1
nginx -c $NGINX_CONF

# Start React
BROWSER=none npm --prefix $BASE/../server/app run start
