#!/bin/bash
# Start NGINX
sudo nginx -c $(pwd)/config/nginx.conf -s stop >> /dev/null
sudo nginx -c $(pwd)/config/nginx.conf

# Start Next.js
echo http://localhost/tv
npm --prefix $(pwd)/development/app run start
