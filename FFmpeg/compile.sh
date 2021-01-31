#!/bin/bash
# Prepare environment
BASE=$(pwd)

# Build FFmpeg
cd $BASE/FFmpeg

./configure \
    --prefix="$BASE/build" \
    --pkg-config-flags="--static" \
    --extra-cflags="-I$BASE/build/include" \
    --extra-ldflags="-L$BASE/build/lib" \
    --extra-libs="-lpthread -lm" \
    --bindir="$BASE/bin" \
    --enable-gnutls \
    --enable-libass \
    --enable-libfreetype \
    --enable-libvorbis \
    --enable-gpl \
    --enable-libx264 \
    --enable-nonfree

make -j8
make install
hash -r
