import React, { useEffect, useState, useRef } from "react";
import ReactPlayer from "react-player";
import "./App.css";

const MODES = ["PASS", "SHOOT", "THROW"];

function Mode(props) {
	const { title, keyState, trigger, video } = props;
	const [modeState, setModeState] = useState({
		start: null,
		end: null,
		isOnGoing: false,
	});

	useEffect(() => {
		if (video.current.getCurrentTime() !== null) {
			// eslint-disable-next-line eqeqeq
			if (keyState == trigger) {
				setModeState({
					start: video.current.getCurrentTime(),
					end: null,
					isOnGoing: true,
				});
			} else {
				setModeState({
					start: null,
					end: video.current.getCurrentTime().toFixed(2),
					isOnGoing: false,
				});
			}
		}
		return () => {};
	}, [keyState, trigger, video]);

	return (
		<table className={modeState.isOnGoing ? "ongoing" : ""}>
			<caption>
				{title} <b>{trigger}</b>
			</caption>
			<thead>
				<tr>
					<th>Key</th>
					<th>State</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>start</td>
					<td>
						<b>{modeState.start}</b>
					</td>
				</tr>
				<tr>
					<td>end</td>
					<td>
						<b>{modeState.end}</b>
					</td>
				</tr>
				<tr>
					<td>isOnGoing</td>
					<td>
						<b>{modeState.isOnGoing ? "yes" : "no"}</b>
					</td>
				</tr>
			</tbody>
		</table>
	);
}

function App() {
	const [keyState, setKeyState] = useState({ key: null, time: null });
	const videoRef = useRef(null);

	useEffect(() => {
		document.addEventListener("keydown", (e) => {
			setKeyState({ key: e.key, time: Date.now() });
		});
		return () => {};
	}, []);

	return (
		<div>
			<div className="video">
				<ReactPlayer
					url="/video.mp4"
					controls
					ref={videoRef}
					muted
					playing
				/>
			</div>
			<div className="modes">
				{MODES.map((e, i) => {
					return (
						<Mode
							key={e}
							title={e}
							keyState={keyState.key}
							trigger={i + 1}
							video={videoRef}
						/>
					);
				})}
			</div>
		</div>
	);
}

export default App;
