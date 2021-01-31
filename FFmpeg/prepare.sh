#!/bin/bash
# Prepare environment
BASE=$(pwd)
PATH="$BASE/bin:$PATH"
PKG_CONFIG_PATH="$BASE/build/lib/pkgconfig"

# Get necessary packages
sudo apt-get update -qq
sudo apt-get -y install \
    autoconf \
    automake \
    build-essential \
    cmake \
    git-core \
    libass-dev \
    libfreetype6-dev \
    libgnutls28-dev \
    libsdl2-dev \
    libtool \
    libva-dev \
    libvdpau-dev \
    libvorbis-dev \
    libxcb1-dev \
    libxcb-shm0-dev \
    libxcb-xfixes0-dev \
    libunistring-dev \
    pkg-config \
    texinfo \
    wget \
    yasm \
    libx264-dev \
    zlib1g-dev

# Prepare folders
mkdir -p ./build ./bin

# Build x264
cd $BASE/x264

./configure --prefix="$BASE/build" --bindir="$BASE/bin" --enable-static --enable-pic --disable-asm

make
make install

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
