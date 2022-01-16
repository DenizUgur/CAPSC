#!/bin/bash
BASE=$(dirname "$0")
# Start NGINX
nginx -c $BASE/../config/nginx.conf -s stop >> /dev/null
nginx -c $BASE/../config/nginx.conf

# Start Next.js
echo http://localhost/tv
npm --prefix $BASE/../development/app run dev
