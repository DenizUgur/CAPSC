#!/bin/bash
# Prepare environment
BASE=$(pwd)
export PATH="$BASE/bin:$PATH"
export PKG_CONFIG_PATH="/usr/local/opt/opencv@2/lib/pkgconfig:$BASE/build/lib/pkgconfig"

# Build FFmpeg
cd $BASE/FFmpeg

./configure \
    --prefix="$BASE/build" \
    --pkg-config-flags="--static" \
    --extra-cflags="-I$BASE/build/include -march=native" \
    --extra-ldflags="-L$BASE/build/lib" \
    --extra-libs="-lpthread -lm" \
    --ld="g++" \
    --bindir="$BASE/bin" \
    --enable-gnutls \
    --enable-libass \
    --enable-libfreetype \
    --enable-libfontconfig \
    --enable-libvorbis \
    --enable-gpl \
    --enable-libx264 \
    --enable-libopencv \
    --enable-nonfree

make -j8
make install
hash -r
