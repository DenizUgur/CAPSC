# Build OpenCV
FROM ubuntu:xenial AS ffmpeg-builder
ARG DEBIAN_FRONTEND=noninteractive

# Update apt cache
RUN apt-get update 

# Install dependencies
RUN apt-get --no-install-recommends -y remove ffmpeg x264 libx264-dev
RUN apt-get --no-install-recommends -y install libopencv-dev
RUN apt-get --no-install-recommends -y install build-essential checkinstall cmake pkg-config yasm
RUN apt-get --no-install-recommends -y install libtiff5-dev libjpeg-dev libjasper-dev
RUN apt-get --no-install-recommends -y install libavcodec-dev libavformat-dev libswscale-dev libdc1394-22-dev libxine2-dev libgstreamer0.10-dev libgstreamer-plugins-base0.10-dev libv4l-dev
RUN apt-get --no-install-recommends -y install python-dev python-numpy
RUN apt-get --no-install-recommends -y install libtbb-dev
RUN apt-get --no-install-recommends -y install libqt4-dev libgtk2.0-dev
RUN apt-get --no-install-recommends -y install libfaac-dev libmp3lame-dev libopencore-amrnb-dev libopencore-amrwb-dev libtheora-dev libvorbis-dev libxvidcore-dev
RUN apt-get --no-install-recommends -y install x264 v4l-utils ffmpeg
RUN apt-get --no-install-recommends -y install libgtk2.0-dev
RUN apt-get --no-install-recommends -y install ca-certificates git

# Downlaod OpenCV Source
RUN git clone --branch 2.4.9 --depth 1 https://github.com/opencv/opencv.git

# Compile OpenCV
RUN mkdir opencv/build
RUN cd opencv/build && \
    cmake -D CMAKE_BUILD_TYPE=RELEASE -D CMAKE_INSTALL_PREFIX=/usr/local -D WITH_TBB=ON .. && \
    make -j`nproc`

# Install OpenCV
RUN cd opencv/build && \
    make install && \
    sh -c 'echo "/usr/local/lib" > /etc/ld.so.conf.d/opencv.conf' && \
    ldconfig

# Build our custom FFmpeg
ENV PATH="/bin:$PATH"
ENV PKG_CONFIG_PATH="$BASE/build/lib/pkgconfig"

# Install dependencies
RUN apt-get --no-install-recommends -y install \
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

# Copy custom FFmpeg source
COPY ./FFmpeg/FFmpeg /FFmpeg

# Compile FFmpeg
RUN mkdir -p build
RUN cd FFmpeg && \
    ./configure \
    --prefix="/build" \
    --pkg-config-flags="--static" \
    --extra-cflags="-I/build/include" \
    --extra-ldflags="-L/build/lib" \
    --extra-libs="-lpthread -lm" \
    --ld="g++" \
    --bindir="/usr/local/bin" \
    --enable-gnutls \
    --enable-libass \
    --enable-libfreetype \
    --enable-libfontconfig \
    --enable-libvorbis \
    --enable-gpl \
    --enable-libx264 \
    --enable-libopencv \
    --enable-nonfree
RUN cd FFmpeg && make -j`nproc` && make install

RUN mkdir -p /libraries/usr/lib /libraries/lib
RUN ldd /usr/local/bin/ffmpeg | grep "/usr/lib" | awk 'NF == 4 { system("cp " $3 " /libraries/usr/lib") }'
RUN ldd /usr/local/bin/ffmpeg | grep -v "/usr/lib" | awk 'NF == 4 { system("cp " $3 " /libraries/lib") }'

# Prepare Node related stuff
FROM node:lts-slim AS node-builder

# Copy package descriptions
COPY ./dashjs/package*.json /dashjs/
COPY ./server/app/package*.json /server/app/

# Install dependencies
RUN npm --prefix /dashjs ci
RUN npm --prefix /server/app ci

# Copy source
COPY ./dashjs/. /dashjs/
COPY ./server/. /server/

# Link DASH.js globally
RUN cd /dashjs && npm link
RUN cd /server/app && npm link dashjs

# Build products
RUN npm --prefix /server/app run build
RUN npm i -g pkg
RUN cd /server && pkg -C GZip -t latest-linux-x64 gpac-dash.js

# Finalize the image
FROM ubuntu:xenial
EXPOSE 80

# Install Node.js & NGINX
RUN apt-get update && \
    apt-get install --no-install-recommends -y nginx figlet curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=ffmpeg-builder /libraries/usr/lib /usr/lib/x86_64-linux-gnu/
COPY --from=ffmpeg-builder /libraries/lib /lib/x86_64-linux-gnu/
COPY --from=ffmpeg-builder /usr/local/bin/ff* /usr/local/bin/

# Setup NGINX
COPY ./config/nginx.prod.conf /etc/nginx/nginx.conf

# Prepare Dash.JS & Live Stream Host
COPY --from=node-builder /server/gpac-dash /usr/local/bin/
COPY --from=node-builder /server/app/build /opt/server

# Copy network profiles
COPY ./simulator/config/profiles /opt/profiles

COPY ./scripts/entrypoint.sh /opt/entrypoint.sh
ENTRYPOINT [ "/opt/entrypoint.sh" ]