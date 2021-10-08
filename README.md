# Content-Aware Playback Speed Control for Low-Latency Live Streaming of Sports

[![DOI:10.1145/3458305.3478437](https://zenodo.org/badge/DOI/10.1145/3458305.3478437.svg)](https://doi.org/10.1145/3458305.3478437)


## Abstract

There are two main factors that determine the viewer experience during the live streaming of sports content: latency and stalls. Latency should be low and stalls should not occur. Yet, these two factors work against each other and it is not trivial to strike the best trade-off between them. One of the best tools we have today to manage this trade-off is the adaptive playback speed control. This tool allows the streaming client to slow down the playback when there is a risk of stalling and increase the playback when there is no risk of stalling but the live latency is higher than desired. While adaptive playback generally works well, the artifacts due to the changes in the playback speed should preferably be unnoticeable to the viewers. However, this mostly depends on the portion of the audio/video content subject to the playback speed change. In this paper, we advance the state-of-the-art by developing a content-aware playback speed control (CAPSC) algorithm and demonstrate a number of examples showing its significance. We make the running code available and provide a demo page hoping that it will be a useful tool for the developers and content providers.

## Table of Contents

- `demo/` contains the source code for our [demo page](http://streaming.university/demo/mmsys21-capsc/)
- `densifier/` contains an example web page for creating event density files for metadata-feeder to use.
- `development/` contains the development environment. It is needed by the simulator and provides example code for several metrics. This directory also contains GPAC-Dash server that streams chunks to the client.
- `metadata-feeder/` contains the Java server that feeds CAPSC the event densities.
- `scripts/` contains some scripts to start development environment
- `simulator/` contains the utilities needed to benchmark CAPSC

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
