const metadataConf = {
	prefix: "results/",
	extension: ".json",
	seperator: "-",
};
const CHART_COLORS = {
	red: 'rgb(255, 99, 132)',
	orange: 'rgb(255, 159, 64)',
	yellow: 'rgb(255, 205, 86)',
	green: 'rgb(75, 192, 192)',
	blue: 'rgb(54, 162, 235)',
	purple: 'rgb(153, 102, 255)',
	grey: 'rgb(201, 203, 207)'
  }
const formVariables = {
	networkProfiles: [
		{
			val: 0,
			label: "LTE",
			fileNamePart: "lte",
		},
		{
			val: 1,
			label: "Twitch",
			fileNamePart: "twitch",
		},
		{
			val: 2,
			label: "Cascade",
			fileNamePart: "cascade",
		},
	],
	videos: [
		{
			val: 0,
			label: "BCN1",
			fileNamePart: "bcn",
			url:"https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"
		},
		{
			val: 1,
			label: "BCN2",
			fileNamePart: "bcn2",
			url:"https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"
		},
		{
			val: 2,
			label: "BCN3",
			fileNamePart: "bcn3",
			url:"https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd"
		},
	],
	algorithms: [
		{
			val: 0,
			label: "Lolp",
			fileNamePart: "LOLP",
		},
		{
			val: 1,
			label: "CAPSC",
			fileNamePart: "APR",
		},
		{
			val: 2,
			label: "Default",
			fileNamePart: "DEFAULT",
		},
	],
};

$(document).ready(function () {
	initPage();
});
const videoSource = $("#videoSource");
const configurationForm = $("#configurationForm");
const networkProfile = $("#networkProfile");
const player1Algorithm = $("#player1Algorithm");
const player2Algorithm = $("#player2Algorithm");
const formSubmit = $("#formSubmit");
const formCollapse = $("#formCollapse");
const playersSpace = $("#playersSpace");
const contentSpace = $("section[class='content']");
let playerContext = null;
let demoContext = {};
let chartContext ={};

function initPage() {
	const urlParams = new URLSearchParams(window.location.search);
	if (urlParams.has("videoSource")) {
		initVideoPage(urlParams);
	} else {
		initSearchPage();
	}
}

function initSearchPage() {
	formVariables.networkProfiles.forEach((v, i) => {
		networkProfile.append(
			`<option value="${v.val}" ${i == 0 ? "selected" : ""}>${
				v.label
			}</option>`
		);
	});

	formVariables.videos.forEach((v, i) => {
		videoSource.append(
			`<option value="${v.val}" ${i == 0 ? "selected" : ""}>${
				v.label
			}</option>`
		);
	});

	formVariables.algorithms.forEach((v, i) => {
		player1Algorithm.append(
			`<option value="${v.val}" ${i == 0 ? "selected" : ""}>${
				v.label
			}</option>`
		);
		if (i == 0) {
			onPlayer1Select();
		}
	});
}

function initVideoPage(urlParams) {
	const selectedVideo = formVariables.videos.find(
		(v) => v.val == urlParams.get("videoSource")
	);
	const selectedNetwork = formVariables.networkProfiles.find(
		(v) => v.val == urlParams.get("networkProfile")
	);
	const selectedPlayer1Alg = formVariables.algorithms.find(
		(v) => v.val == urlParams.get("player1Algorithm")
	);
	const selectedPlayer2Alg = formVariables.algorithms.find(
		(v) => v.val == urlParams.get("player2Algorithm")
	);
	playerContext = {
		selectedVideo: selectedVideo,
		selectedNetwork: selectedNetwork,
		selectedPlayer1Alg: selectedPlayer1Alg,
		selectedPlayer2Alg: selectedPlayer2Alg,
	};
	console.log(selectedVideo);
	formVariables.networkProfiles.forEach((v, i) => {
		networkProfile.append(
			`<option value="${v.val}" ${
				i == selectedNetwork.val ? "selected" : ""
			}>${v.label}</option>`
		);
	});

	formVariables.videos.forEach((v, i) => {
		videoSource.append(
			`<option value="${v.val}" ${
				i == selectedVideo.val ? "selected" : ""
			}>${v.label}</option>`
		);
	});

	formVariables.algorithms.forEach((v, i) => {
		player1Algorithm.append(
			`<option value="${v.val}" ${
				i == selectedPlayer1Alg.val ? "selected" : ""
			}>${v.label}</option>`
		);
	});

	formVariables.algorithms.forEach((v, i) => {
		if (v.val != selectedPlayer1Alg.val) {
			player2Algorithm.append(
				`<option value="${v.val}" ${
					i == selectedPlayer2Alg.val ? "selected" : ""
				}>${v.label}</option>`
			);
		}
	});
	formCollapse.click();
	loadMetadata();
}
player1Algorithm.change(() => {
	onPlayer1Select();
});

formSubmit.click(() => {
	onFormSubmit();
});

function loadMetadata() {
	const url1 =
		metadataConf.prefix +
		playerContext.selectedVideo.fileNamePart +
		metadataConf.seperator +
		playerContext.selectedNetwork.fileNamePart +
		metadataConf.seperator +
		playerContext.selectedPlayer1Alg.fileNamePart +
		metadataConf.extension;
	const url2 =
		metadataConf.prefix +
		playerContext.selectedVideo.fileNamePart +
		metadataConf.seperator +
		playerContext.selectedNetwork.fileNamePart +
		metadataConf.seperator +
		playerContext.selectedPlayer2Alg.fileNamePart +
		metadataConf.extension;

	$.get(url1)
		.done((data) => {
			playerContext = {
				...playerContext,
				alg1Metadata: data,
			};
			console.log(url1 + " is successfully loaded.");
			$.get(url2)
				.done((data) => {
					playerContext = {
						...playerContext,
						alg2Metadata: data,
					};
					console.log(data);
					console.log(url2 + " is successfully loaded.");
					initPlayers();
				})
				.fail(function () {
					alert(
						"Unable to load metadata from server. Please refresh."
					);
				});
		})
		.fail(function () {
			alert("Unable to load metadata from server. Please refresh.");
		});
}

function initPlayers() {
	let playersTemplate = `<div id="playersSpace" class="card">


		<div class="card-body">
			<div class="progress">
				<div id="progressBar" class="progress-bar bg-primary progress-bar-striped" role="progressbar"
					aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 40%">
				<span class="sr-only">40% Complete (success)</span>
				</div>
			</div>
			<div class="row">
				<div class="col-sm-6" >
					<h4 class="text-center">Player 1</h4>
					<div class="embed-responsive embed-responsive-16by9" style="max-height: 200px;">
						<video id="video1"></video>
					</div> 
				</div>
				<div class="col-sm-6">
					<h4 class="text-center">Player 2</h4>
					<div class="embed-responsive embed-responsive-16by9" style="max-height: 200px;">
						<video id="video2"></video>
					</div>
				</div>
			</div>
			<div class="row mt-3">
				<div class="col-sm-3" >
					<div class="chart">
						<canvas id="chart-rate-1" style=" max-height: 250px; max-width: 100%;"></canvas>
					</div>
				</div>
				<div class="col-sm-3" >
					<div class="chart">
						<canvas id="chart-buffer-1" style=" max-height: 250px; max-width:  100%;"></canvas>
					</div>
				</div>
				<div class="col-sm-3" >
					<div class="chart">
						<canvas id="chart-rate-2" style=" max-height: 250px; max-width: 100%;"></canvas>
					</div>
				</div>
				<div class="col-sm-3" >
					<div class="chart">
						<canvas id="chart-buffer-2" style=" max-height: 250px; max-width: 100%;"></canvas>
					</div>
				</div>
			</div>
			<div class="row mt-3">
				<div class="col-sm-3" >
					<div class="chart">
						<canvas id="chart-event-1" style=" max-height: 250px; max-width: 100%;"></canvas>
					</div>
				</div>
				<div class="col-sm-3" >
					<div class="chart">
						<canvas id="chart-bw-1" style=" max-height: 250px; max-width:  100%;"></canvas>
					</div>
				</div>
				<div class="col-sm-3" >
					<div class="chart">
						<canvas id="chart-event-2" style=" max-height: 250px; max-width: 100%;"></canvas>
					</div>
				</div>
				<div class="col-sm-3" >
					<div class="chart">
						<canvas id="chart-bw-2" style=" max-height: 250px; max-width: 100%;"></canvas>
					</div>
				</div>
			</div>
			
			</div>
	</div>`;
	contentSpace.append(playersTemplate);

	let url = playerContext.selectedVideo.url;
	initCharts();
	for (let i = 1; i < 3; i++) {
		let player = dashjs.MediaPlayer().create();
		player.initialize(document.querySelector("#video"+i), null, false);
		playerContext["player"+i]=player;
	}
	player1 = playerContext.player1;
	player1
		.getOfflineController()
		.loadRecordsFromStorage()
		.then(() => {
			let selectedVideoRecord = player1
				.getOfflineController()
				.getAllRecords()
				.find((od) => od.originalUrl == url);
			if (selectedVideoRecord == null) {
				console.log("Selected video not found in memory");
				downloadContent(player1, url);
			} else {
				console.log("Selected video found in memory");
				if (
					player1
						.getOfflineController()
						.getRecordProgression(selectedVideoRecord.id) < 100
				) {
					console.log(
						selectedVideoRecord.originalUrl +
							" 's download progress not completed, so downloading it again!"
					);
					player1
						.getOfflineController()
						.deleteRecord(selectedVideoRecord.id);
					downloadContent(player1, url);
				} else {
					updateProgressBar(100);
					readyForDemo();
				}
			}
		});

}


function readyForDemo() {
	let progressBar = $(".progress").remove()
	let startButtonContent = `
		<div id="demoButtonSpace" class="row justify-content-center">
			<button
			id="startDemo"
			class="btn btn-primary"
			>
			Start Demo
		</button>
		</div>
	`;
	$("#playersSpace > .card-body").prepend(startButtonContent);
	$("#startDemo").click(()=>{
	  $("#demoButtonSpace").remove();
	  startDemo();
	});
}
function startDemo() {
	let url = playerContext.selectedVideo.url;
	let promise1 = playerContext.player1
		.getOfflineController()
		.loadRecordsFromStorage();

	let promise2 = playerContext.player2
		.getOfflineController()
		.loadRecordsFromStorage();
	Promise.all([promise1, promise2]).then((values) => {
		let selectedVideoRecord = playerContext.player2
			.getOfflineController()
			.getAllRecords()
			.find((od) => od.originalUrl == url);

		playerContext.player1.attachSource(selectedVideoRecord.url);
		playerContext.player2.attachSource(selectedVideoRecord.url);
		demoContext = {
			1: {
				isInitiallyStarted: false,
			},
			2: {
				isInitiallyStarted: false,
			},
		};
		setTimeout(()=>{
			processInterval(2, 0);
			processInterval(1, 0);
		},1000)
	});
}
function processInterval(playerIndex, index) {
	let algMetadata = null;
	let player = null;
	switch (playerIndex) {
		case 1:
			algMetadata = playerContext.alg1Metadata;
			player = playerContext.player1;
			break;
		case 2:
			algMetadata = playerContext.alg2Metadata;
			player = playerContext.player2;
			break;
	}
	if (algMetadata.testResult.intervalMetrics.length - 1 > index) {
		let currentMetadata = algMetadata.testResult.intervalMetrics[index];
		let nextMetadata = algMetadata.testResult.intervalMetrics[index + 1];


		chartContext[playerIndex].bufferChart.data.labels.push(currentMetadata.at);
		chartContext[playerIndex].bufferChart.data.datasets[0].data.push(currentMetadata.mediaBuffer);
		chartContext[playerIndex].bufferChart.data.datasets[1].data.push(currentMetadata.liveLatency);
		chartContext[playerIndex].eventChart.data.labels.push(currentMetadata.at);
		chartContext[playerIndex].bwChart.data.labels.push(currentMetadata.at);
		if(currentMetadata["latestEvent"]!=null){
			chartContext[playerIndex].eventChart.data.datasets[0].data.push(currentMetadata.latestEvent.density);
		}else{
			chartContext[playerIndex].eventChart.data.datasets[0].data.push(0);
		}

		chartContext[playerIndex].rateChart.data.labels.push(currentMetadata.at);
		chartContext[playerIndex].rateChart.data.datasets[0].data.push(currentMetadata.playbackRate);
		if(currentMetadata.bitrate){
			chartContext[playerIndex].bwChart.data.datasets[0].data.push(currentMetadata.bitrate.download);
		}else{
 			chartContext[playerIndex].bwChart.data.datasets[0].data.push(null);
		}

		if(chartContext[playerIndex].bufferChart.data.labels.length>=100){
			chartContext[playerIndex].bufferChart.data.labels.shift();
			chartContext[playerIndex].eventChart.data.labels.shift();
			chartContext[playerIndex].rateChart.data.labels.shift();
			chartContext[playerIndex].bwChart.data.labels.shift();
			chartContext[playerIndex].bufferChart.data.datasets[0].data.shift();
			chartContext[playerIndex].bufferChart.data.datasets[1].data.shift();
			chartContext[playerIndex].eventChart.data.datasets[0].data.shift();
			chartContext[playerIndex].rateChart.data.datasets[0].data.shift();
			chartContext[playerIndex].bwChart.data.datasets[0].data.shift();
		}
		chartContext[playerIndex].bufferChart.update();
		chartContext[playerIndex].eventChart.update();
		chartContext[playerIndex].rateChart.update();
		chartContext[playerIndex].bwChart.update();
		
		if (demoContext[playerIndex].isInitiallyStarted) {

			if(currentMetadata.playbackRate!= demoContext[playerIndex].playbackRate){
				player.setPlaybackRate(currentMetadata.playbackRate);
				demoContext[playerIndex]={
					...demoContext[playerIndex],
					playbackRate:currentMetadata.playbackRate
				}
			}

			if(currentMetadata.isPlaying!= demoContext[playerIndex].isPlaying){
				if(currentMetadata.isPlaying == 1){
					console.log(playerIndex + " play");
					player.play();
					demoContext[playerIndex]={
						...demoContext[playerIndex],
						isPlaying:1
					}
				}else{
					console.log(playerIndex + " pause");
					player.pause();
					demoContext[playerIndex]={
						...demoContext[playerIndex],
						isPlaying:0
					}
				}
			}

		} else {
			if (currentMetadata.videoTime > 0) {

				console.log(playerIndex + " seek " + currentMetadata.videoTime);
				console.log(playerIndex + " duration 1 " + player.duration());
				player.seek(currentMetadata.videoTime);
				player.play();
				console.log(playerIndex + " duration 2 " + player.duration());
				demoContext[playerIndex] = {
					...demoContext[playerIndex],
					isInitiallyStarted: true,
					isPlaying:1,
					playbackRate:currentMetadata.playbackRate
				};
			}
		}
		setTimeout(() => {
			processInterval(playerIndex, index + 1);
		}, 1000 * (nextMetadata.at - currentMetadata.at));
	} else {
		console.log("demo is finished.")
		playerContext.player1.pause();
		playerContext.player2.pause();
	}
}

function updateProgressBar(val) {
	const progressBar = $("#progressBar");
	progressBar.css("width", val + "%").attr("aria-valuenow", val);
}
function downloadContent(player, url) {
	player.getOfflineController().createRecord(url);
	player.on(
		dashjs.MediaPlayer.events.OFFLINE_RECORD_LOADEDMETADATA,
		function (e) {
			player.getOfflineController().startRecord(e.id, e.mediaInfos);
			console.log(e.id);
			let progressBarInterval = setInterval(function () {
				let perc = player
					.getOfflineController()
					.getRecordProgression(e.id);
				updateProgressBar(perc);
				if (perc >= 100) {
					readyForDemo();
					clearInterval(progressBarInterval);
				}
			}, 200);
		}
	);
}

function initCharts() {
	for (let i = 1; i < 3; i++) {
		let bufferChart = new Chart($("#chart-buffer-"+ i).get(0).getContext("2d"), {
			type: "line",
			data: {
				labels: [
				],
				datasets: [
					{
						label: "Buffer Level",
						borderColor: CHART_COLORS.blue,
						fill:false,
						data: [],
					},
					{
						label: "Latency",
						borderColor: CHART_COLORS.red,
						fill:false,
						data: [],
					}
				],
			},
			options: {
				type: 'line',
				responsive: true,

				scales: {
					xAxes: [{
						scaleLabel: {
						  display: true,
						  labelString: 'Wallclock Time(sec)'
						}
					}],
					yAxes: [{
						scaleLabel: {
						  display: true,
						  labelString: 'sec'
						}
					}]
				  }
			},
		});

		let eventChart = new Chart($("#chart-event-"+ i).get(0).getContext("2d"), {
			type: "line",
			data: {
				labels: [
				],
				datasets: [
					{
						label: "Event Density",
						borderColor: CHART_COLORS.orange,
						fill:false,
						stepped: true,
						data: [],
					}
				],
			},
			options: {
				type: 'line',
				scales: {
					xAxes: [{
						scaleLabel: {
						  display: true,
						  labelString: 'Wallclock Time(sec)'
						}
					}]
				  }
			},
		});
		let rateChart = new Chart($("#chart-rate-"+ i).get(0).getContext("2d"), {
			type: "line",
			data: {
				labels: [
				],
				datasets: [
					{
						label: "PlaybackRate",
						borderColor: CHART_COLORS.green,
						fill:false,
						stepped: true,
						data: [],
					}
				],
			},
			options: {
				type: 'line',
				scales: {
					xAxes: [{
						scaleLabel: {
						  display: true,
						  labelString: 'Wallclock Time(sec)'
						}
					}]
				  },
			},
		});
		let bwChart = new Chart($("#chart-bw-"+ i).get(0).getContext("2d"), {
			type: "line",
			data: {
				labels: [
				],
				datasets: [
					{
						label: "Bandwith",
						borderColor: CHART_COLORS.purple,
						fill:false,
						stepped: true,
						data: [],
					}
				],
			},
			options: {
				type: 'line',
				scales: {
					xAxes: [{
						scaleLabel: {
						  display: true,
						  labelString: 'Wallclock Time(sec)'
						}
					}]
				  },
			},
		});
		chartContext[i] = {
			bufferChart:bufferChart,
			eventChart:eventChart,
			rateChart:rateChart,
			bwChart:bwChart
		}
	}
	

	
}


function onFormSubmit() {
	configurationForm.submit();
}

function onPlayer1Select() {
	let isSelected = false;
	player2Algorithm.empty();
	formVariables.algorithms.forEach((v, i) => {
		if (v.val != player1Algorithm.val()) {
			if (!isSelected) {
				player2Algorithm.append(
					`<option value="${v.val}" selected>${v.label}</option>`
				);
				isSelected = true;
			} else {
				player2Algorithm.append(
					`<option value="${v.val}">${v.label}</option>`
				);
			}
		}
	});
}
