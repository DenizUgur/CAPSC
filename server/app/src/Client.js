import { useEffect, useRef } from "react";
import { MediaPlayer } from "dashjs";
import querystring from "query-string";

export default function Client() {
	const ref = useRef(null);

	useEffect(() => {
		window.experimentResults = {
			playerTime: null,
			playbackStarted: null,
			errors: [],
			playbackRateChanges: [],
			intervalMetrics: [],
			playbackEvents: [],
			qualityEvents: [],
		};
		const intervalMetricsResolution = 250;
		let intervalCounter = 0;
		let params = querystring.parse(window.location.search);

		window.isPlaying = 1;
		window.player = MediaPlayer().create();
		window.player.initialize(ref.current, params.mpd, false);
		window.lastWaiting = null;
		window.player.on(MediaPlayer.events.PLAYBACK_STARTED, function (e) {
			//console.log(e);
			window.isPlaying = 1;
			window.experimentResults = {
				...window.experimentResults,
				playbackStarted: new Date().getTime(),
				playerTime: e.startTime,
				playbackRateChanges: [
					{
						at: 0,
						event: window.player.getPlaybackRate(),
					},
				],
				qualityEvents: [
					...window.experimentResults.qualityEvents,
					{
						at: 0,
						bitrateDetail:
							window.player.getBitrateInfoListFor("video")[
								window.player.getQualityFor("video")
							],
					},
				],
			};
			window.networkConditions = null;
		});
		setInterval(function () {
			if (window.experimentResults) {
				window.experimentResults = {
					...window.experimentResults,
					intervalMetrics: [
						...window.experimentResults.intervalMetrics,
						{
							at:
								(intervalCounter * intervalMetricsResolution) /
								1000,
							liveLatency: window.player.getCurrentLiveLatency(),
							mediaBuffer: window.player.getBufferLength(),
							videoTime: window.player.duration(),
							latestEvent: window._globalLatestEvent,
							playbackRate: window.player.getPlaybackRate(),
							bitrate: window.networkConditions,
							isPlaying: window.isPlaying,
							predictedBW: Math.round(
								window.player.getAverageThroughput("video")
							),
						},
					],
				};

				intervalCounter++;
			}
		}, intervalMetricsResolution);

		window.player.on(MediaPlayer.events.PLAYBACK_WAITING, function (e) {
			window.isPlaying = 0;
		});

		window.player
			.getVideoElement()
			.addEventListener("timeupdate", function () {
				window.isPlaying = 1;
			});
		window.player.on(MediaPlayer.events.PLAYBACK_PLAYING, function (e) {
			//  console.log(e);
			window.isPlaying = 1;
		});

		window.player.on(
			MediaPlayer.events.PLAYBACK_RATE_CHANGED,
			function (e) {
				//  console.log("playbackrate change "+ e.playbackRate+ " " +window.player.getBufferLength());
				window.experimentResults = {
					...window.experimentResults,
					playbackRateChanges: [
						...window.experimentResults.playbackRateChanges,
						{
							at:
								(new Date().getTime() -
									window.experimentResults.playbackStarted) /
								1000,
							event: e.playbackRate,
						},
					],
				};
			}
		);

		window.player.on(MediaPlayer.events.ERROR, function (e) {
			//console.log(e);
			window.experimentResults = {
				...window.experimentResults,
				errors: [
					...window.experimentResults.errors,
					{
						at:
							(new Date().getTime() -
								window.experimentResults.playbackStarted) /
							1000,
						detail: e.error,
					},
				],
			};
		});

		window.player.on(
			MediaPlayer.events.QUALITY_CHANGE_RENDERED,
			function (e) {
				if (
					e.mediaType === "video" &&
					window.experimentResults.playbackStarted
				) {
					//console.log(e);
					window.experimentResults = {
						...window.experimentResults,
						qualityEvents: [
							...window.experimentResults.qualityEvents,
							{
								at:
									(new Date().getTime() -
										window.experimentResults
											.playbackStarted) /
									1000,
								bitrateDetail:
									window.player.getBitrateInfoListFor(
										"video"
									)[e.newQuality],
							},
						],
					};
				}
			}
		);

		window.player.on(MediaPlayer.events.CAN_PLAY, function (e) {
			//console.log(e);
			if (window.experimentResults.playbackStarted == null) {
				window.player.play();
			}
		});
		return () => {};
	}, []);

	return <video ref={ref} muted></video>;
}
