# Content-Aware Playback Speed Control for Low-Latency Live Streaming of Sports

[![DOI:10.1145/3458305.3478437](https://zenodo.org/badge/DOI/10.1145/3458305.3478437.svg)](https://doi.org/10.1145/3458305.3478437)


## Abstract

There are two main factors that determine the viewer experience during the live streaming of sports content: latency and stalls. Latency should be low and stalls should not occur. Yet, these two factors work against each other and it is not trivial to strike the best trade-off between them. One of the best tools we have today to manage this trade-off is the adaptive playback speed control. This tool allows the streaming client to slow down the playback when there is a risk of stalling and increase the playback when there is no risk of stalling but the live latency is higher than desired. While adaptive playback generally works well, the artifacts due to the changes in the playback speed should preferably be unnoticeable to the viewers. However, this mostly depends on the portion of the audio/video content subject to the playback speed change. In this paper, we advance the state-of-the-art by developing a content-aware playback speed control (CAPSC) algorithm and demonstrate a number of examples showing its significance. We make the running code available and provide a demo page hoping that it will be a useful tool for the developers and content providers.

## Table of Contents

- `demo/` contains the source code for our [demo page](http://streaming.university/demo/mmsys21-capsc/)
- `server/` contains the web server. It is needed by the simulator and provides example code for several metrics. This directory also contains GPAC-Dash server that streams chunks to the client.
- `scripts/` contains some scripts to start development environment
- `simulator/` contains the utilities needed to benchmark CAPSC

## Demo

We have included a docker image for you to test our system live.

If you want to build the image yourself, execute the following:

```bash
docker build -t capsc .
```

To run the image, execute the following:

```bash
docker run -p 80:80 \ # web server will be accesible on port 80
	   --rm \ # remove the container after it is stopped
	   -it \ # Interactive mode. Needed for Ctrl^C to work.
	   -v "$PWD:/home" \ # You need to map a location to be able to use your video files
	   -w "/home" \ # If you want to use your own video files
	   --name capsc-demo \ # Optional: If you want to name the container
	   ghcr.io/denizugur/capsc \ # Chanege it to `capsc` if you built the image yourself
	   --help # Shows the usage instructions for the demo
```

## Citation

```
@inproceedings{10.1145/3458305.3478437,
	author = {Aladag, Omer F. and Ugur, Deniz and Akcay, Mehmet N. and Begen, Ali C.},
	title = {Content-Aware Playback Speed Control for Low-Latency Live Streaming of Sports},
	year = {2021},
	isbn = {9781450384346},
	publisher = {Association for Computing Machinery},
	address = {New York, NY, USA},
	url = {https://doi.org/10.1145/3458305.3478437},
	doi = {10.1145/3458305.3478437},
	booktitle = {Proceedings of the 12th ACM Multimedia Systems Conference},
	pages = {344–349},
	numpages = {6},
	keywords = {low latency, CMAF, adaptive streaming, playback speed control, DASH, ABR, HLS, Adaptive playback},
	location = {Istanbul, Turkey},
	series = {MMSys '21}
}
```
