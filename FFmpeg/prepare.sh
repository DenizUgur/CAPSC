#!/bin/bash
# Get necessary packages
sudo apt-get update -qq
sudo apt-get -y install \
    autoconf \
    automake \
    build-essential \
    cmake \
    git-core \
    libx264-dev \
    libopencv-dev \
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

# Build FFmpeg
./compile.sh
