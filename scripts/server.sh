#!/bin/bash
# Start NGINX
nginx -c $(pwd)/config/nginx.conf -s stop >> /dev/null
nginx -c $(pwd)/config/nginx.conf

# Start Next.js
echo http://localhost/tv
npm --prefix $(pwd)/development/app run dev
