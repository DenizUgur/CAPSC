/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState, useRef } from "react";
import ReactPlayer from "react-player";
import "./App.css";

const MODES = [
	"ATTACKPASS",
	"DEFANSEPASS",
	"SHOOT",
	"THROWIN",
	"GOAL",
	"CORNER",
	"OFFSIDE",
	"FAUL",
];

function App() {
	const [keyState, setKeyState] = useState({
		key: null,
		time: null,
	});
	const [time, setTime] = useState({ now: 0, duration: 0 });
	const [log, setLog] = useState([]);
	const videoRef = useRef(null);

	const download = (data, filename, type) => {
		let csvData=""
		data.forEach(mode => {
			console.log(mode.start);
			csvData=csvData+Math.round((mode.start) * 100) / 100+","+Math.round(1000*(mode.end-mode.start))+","+mode.mode+"\n";
		});
		var file = new Blob([csvData], { type: type });
		if (window.navigator.msSaveOrOpenBlob)
			// IE10+
			window.navigator.msSaveOrOpenBlob(file, filename);
		else {
			// Others
			var a = document.createElement("a"),
				url = URL.createObjectURL(file);
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			setTimeout(function () {
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
			}, 0);
		}
	};

	const handleKeyDown = (e) => {
		console.log(e);
		setKeyState({ key: e.key, time: Date.now() });
	};

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		window.setInterval(() => {
			setTime({
				now: videoRef.current.getCurrentTime(),
				duration: videoRef.current.getDuration(),
			});
		}, 200);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	const updateLog = (log, mode) => {
		let playerTime = videoRef.current.getCurrentTime().toFixed(3);
		if (
			log.length > 0 &&
			log[log.length - 1].mode === mode &&
			log[log.length - 1].end === null
		) {
			let newLog = Object.assign([], log);
			newLog[newLog.length - 1] = {
				...newLog[newLog.length - 1],
				end: playerTime,
			};
			return newLog;
		}
		if (log.length > 0 && log[log.length - 1].start === playerTime) {
			let newLog = Object.assign([], log);
			newLog[newLog.length - 1] = { ...newLog[newLog.length - 1], mode };
			return newLog;
		}
		if (
			log.length > 0 &&
			log[log.length - 1].mode !== mode &&
			log[log.length - 1].end === null
		) {
			let newLog = Object.assign([], log);
			newLog[newLog.length - 1] = {
				...newLog[newLog.length - 1],
				end: playerTime,
			};
			newLog.push({
				mode,
				start: playerTime,
				end: null,
			});
			return newLog;
		}
		return [
			...log,
			{
				mode,
				start: playerTime,
				end: null,
			},
		];
	};

	useEffect(() => {
		let player = videoRef.current.getInternalPlayer();
		switch (keyState.key) {
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
				setLog((log) =>
					updateLog(log, MODES[parseInt(keyState.key) - 1])
				);
				break;
			case " ":
				if (player.paused) player.play();
				else player.pause();
				break;
			case "x":
				setLog((log) => log.slice(0, log.length - 1));
				break;
			case "ArrowLeft":
				player.currentTime = log[log.length - 1].start;
				setTimeout(() => player.pause(), 100);
				break;
			default:
				break;
		}
		return () => {};
	}, [keyState]);

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
			<button
				onClick={() =>
					download(
						log,
						"log.csv",
						"text/csv"
					)
				}
			>
				Export
			</button>
			<div className="time">
				Current Time: <b>{time.now.toFixed(2)}</b> /{" "}
				{time.duration.toFixed(2)}
			</div>
			<div className="desc">
				{MODES.map((e, i) => (
					<div key={e}>
						<b>{i + 1}</b> - <i>{e}</i>
					</div>
				))}
			</div>
			{log.length > 0 && (
				<div className="current_mode">
					Current Mode: <b>{log[log.length - 1].mode}</b>
				</div>
			)}
			<div className="modes">
				{log.length > 0 &&
					log.map((e) => {
						return (
							<div key={Math.random()}>
								{e.mode} :: {e.start} :: {e.end}
							</div>
						);
					})}
			</div>
		</div>
	);
}

export default App;
