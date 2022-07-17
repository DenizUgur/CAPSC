import { useEffect, useRef, useState } from "react";
import { MediaPlayer } from "dashjs";
import styles from "./Demo.module.css";

export default function Demo() {
	const ref = useRef(null);
	const [state, setState] = useState({
		rate: 0,
		latency: 0,
		buffer: 0,
		density: 0,
	});

	useEffect(() => {
		let player = MediaPlayer().create();
		player.initialize(ref.current, "/content/app.mpd", true);
		player.updateSettings({
			streaming: {
				lowLatencyEnabled: true,
				liveDelay: 3.0,
				liveCatchup: {
					mode: "liveCatchupModeLoLP",
					minDrift: 0.2,
					playbackRate: 0.3,
					respectVideoEvents: true,
				},
			},
		});

		player.on("playbackProgress", (e) => {
			setState({
				rate: player.getPlaybackRate(),
				latency: player.getCurrentLiveLatency(),
				buffer: player.getBufferLength(),
				density: window._globalLatestEvent
					? window._globalLatestEvent.density
					: 0,
			});
		});

		return () => {};
	}, []);

	return (
		<div className={styles.container}>
			<main className={styles.main}>
				<div className={styles.header}>
					<h1>
						Automated Adaptive Playback for Encoder-Adjudicated Live
						Sports
					</h1>
					<h2>
						Read the MIPR'22 paper{" "}
						<a
							href="https://doi.org/10.1145/3458305.3478437"
							target="_blank"
							rel="noopener noreferrer"
						>
							here
						</a>
					</h2>
				</div>
				<video
					id="myMainVideoPlayer"
					width="900px"
					ref={ref}
					controls
					muted
				></video>
				<div className={styles.metrics}>
					<div>
						<span>Latency (s)</span>
						<p
							style={{
								color:
									Math.abs(1 - state.latency / 3.0) < 0.3
										? "green"
										: "red",
							}}
						>
							{state.latency.toFixed(2)}
						</p>
					</div>
					<div>
						<span>Buffer (s)</span>
						<p
							style={{
								color: state.buffer > 2.0 ? "green" : "red",
							}}
						>
							{state.buffer.toFixed(2)}
						</p>
					</div>
					<div>
						<span>Playback Rate</span>
						<p
							style={{
								color: state.rate === 1 ? "green" : "red",
							}}
						>
							{state.rate.toFixed(2)}
						</p>
					</div>
					<div>
						<span>Density (0-2)</span>
						<p
							style={{
								color: state.density === 2 ? "green" : "red",
							}}
						>
							{state.density.toFixed(2)}
						</p>
					</div>
				</div>
			</main>
		</div>
	);
}
