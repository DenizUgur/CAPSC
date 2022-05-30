// Worker related
import Queue from "bull";
import throng from "throng";
import { createClient } from "redis";

// Simulation
import puppeteer from "puppeteer";
import { FFmpeg } from "./lib/index.js";
import {
	DASHJS_PRESETS,
	DASHJS_PRESETS_KEYS,
	applyNetworkProfile,
	NETWORK_PROFILES,
} from "./config/index.js";

// Misc
import fs from "fs";
import colors from "colors";
import waitOn from "wait-on";
import kill from "tree-kill";
import { spawn } from "child_process";

// Configure
import dotenv from "dotenv";
dotenv.config();

// Setup Queue
const queue = new Queue("work");

async function master() {
	// Check root access
	if (process.getuid && process.getuid() !== 0) {
		console.error(
			"You must run this simulator with root access".bgRed.white
		);
		process.exit(0);
	}

	// Clean working environment
	if (!fs.existsSync(process.env.COMMON_OUTPUT_DIR)) {
		fs.mkdirSync(process.env.COMMON_OUTPUT_DIR);
	} else {
		fs.rmSync(process.env.COMMON_OUTPUT_DIR, {
			force: true,
			recursive: true,
		});
		fs.mkdirSync(process.env.COMMON_OUTPUT_DIR);
	}

	if (!fs.existsSync(process.env.RESULT_OUTPUT_DIR)) {
		fs.mkdirSync(process.env.RESULT_OUTPUT_DIR);
	} else {
		fs.rmSync(process.env.RESULT_OUTPUT_DIR, {
			force: true,
			recursive: true,
		});
		fs.mkdirSync(process.env.RESULT_OUTPUT_DIR);
	}

	// Clean Redis
	const client = createClient();
	await client.connect();
	await client.flushAll();

	// Start GPAC
	console.log("Starting GPAC".bgBlack.yellow.bold);
	const gpac_process = spawn(
		"/bin/sh",
		[`${process.env.SCRIPTS_DIR}/gpac.sh`],
		{ stdio: false }
	);

	// Start NGINX
	console.log("Starting NGINX".bgBlack.yellow.bold);
	const nginx_process = spawn(
		"/bin/sh",
		[`${process.env.SCRIPTS_DIR}/server.sh`],
		{ stdio: false }
	);

	await waitOn({
		resources: [
			"http://localhost:80", // Nginx
			"http://localhost:8000", // Gpac
			"http://localhost:3000", // Next.js
		],
		validateStatus: (status) => {
			return status >= 200 && status < 500;
		},
	});
	console.log("All services started".bgGreen.black.bold);

	// Listen Ctrl+C for graceful shutdown
	const graceful_exit = () => {
		console.log(
			"\rReceived SIGINT. Killing services and exiting".bgWhite.black.bold
		);
		kill(gpac_process.pid, "SIGINT");
		kill(nginx_process.pid, "SIGINT");
		process.exit(0);
	};
	process.on("SIGINT", graceful_exit);

	// Populate Tests
	const single_shot = true;
	const tests = [
		{
			videoFile: "match.mp4",
			testingDuration: 90,
			networkPresetOffset: 10,
			networkThrottleOffset: 5,
			startOffset: 915,
			mediaTime: 90,
			splitFile: false,
			disabled: false,
		},
		{
			videoFile: "match2.mp4",
			testingDuration: 90,
			networkPresetOffset: 10,
			networkThrottleOffset: 5,
			startOffset: 0,
			mediaTime: 90 * 10,
			splitFile: true,
			disabled: true,
		},
	];

	const populatedTests = [];
	for (const test of tests) {
		if (test.disabled) continue;

		if (
			(test.mediaTime > test.startOffset &&
				test.mediaTime - test.startOffset < test.testingDuration) ||
			test.mediaTime < test.testingDuration
		) {
			console.log(
				`Requested testingDuration is not possible with current mediaTime and startOffset`
					.bgRed.white.bold
			);
			graceful_exit();
		}

		const mediaTime =
			test.mediaTime < test.startOffset
				? test.mediaTime
				: test.mediaTime - test.startOffset;
		const mediaTimeRounded = mediaTime - (mediaTime % test.testingDuration);

		if (mediaTime % test.testingDuration != 0)
			console.log(
				`mediaTime rounded down by ${
					mediaTime % test.testingDuration
				} seconds`.bgBlack.yellow
			);

		for (const networkProfile of NETWORK_PROFILES) {
			for (const dashjsProfileKey of DASHJS_PRESETS_KEYS) {
				for (
					let startOffset = 0;
					startOffset < mediaTimeRounded;
					startOffset += test.testingDuration
				) {
					populatedTests.push({
						...test,
						newtorkPreset: networkProfile,
						dashPreset: DASHJS_PRESETS[dashjsProfileKey],
						dashPresetName: dashjsProfileKey,
						startOffset: startOffset + test.startOffset,
					});

					console.log(
						`Adding ${test.videoFile} ${networkProfile} ${dashjsProfileKey} at ${startOffset} second(s) offset`
							.yellow
					);

					if (!test.splitFile) break;
				}
				if (single_shot) break;
			}
			if (single_shot) break;
		}
	}

	// Load Populated Tests
	for (const test of populatedTests) {
		queue.add(test, { attempts: 3 });
	}

	let completed = 0;
	let failed = 0;
	queue.on("global:failed", function (job, err) {
		failed++;
		console.info(
			`${failed} of the remeaning ${
				populatedTests.length - completed
			} job(s) has failed`.bgRed.bold.white
		);
		if (populatedTests.length == completed + failed) {
			console.info("All jobs has been processed!".bgGreen.bold.white);
			kill(gpac_process.pid, "SIGINT");
			kill(nginx_process.pid, "SIGINT");
			process.exit(0);
		}
	});

	queue.on("global:completed", function (job, result) {
		completed++;
		console.info(
			`${completed} of ${populatedTests.length} job(s) has been completed`
				.bgYellow.bold.black
		);
		if (failed > 0) {
			console.info(
				`${failed} of ${populatedTests.length} jobs has failed`.bgRed
					.bold.white
			);
		}
		if (populatedTests.length == completed + failed) {
			console.info("All jobs have been processed!".bgGreen.bold.black);
			process.exit(0);
		}
	});
}

async function worker() {
	queue.process(async (job, done) => {
		const jobStartDate = new Date();
		console.info(`Started on Job #${job.id}`.bold.green);
		console.log(job.data);

		// Start the browser
		const browser = await puppeteer.launch({
			headless: false,
			executablePath:
				"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
			args: ["--window-size=840,525", "--window-position=840,0"],
		});

		try {
			const encoder = new FFmpeg(
				job.data.videoFile,
				job.data.startOffset
			);
			console.info("Starting encoding process".green);
			encoder.run();

			// Wait for first segment
			console.info(`Waiting for first segment file`.bgRed.white);
			let now = Date.now();
			while (!fs.existsSync(`${encoder.outDir}/chunk0-00001.m4s`)) {
				if (Date.now() - now > 60 * 1000) {
					await encoder.terminate();
					throw new Error("Manifest timeout!");
				}
			}

			const url = new URL(
				`${process.env.BASE_URL}?mpd=${process.env.COMMON_HTTP_CONTEXT}/${encoder.name}/${encoder.name}.mpd`
			);
			const page = await browser.newPage();
			await page.setCacheEnabled(false);
			await page.goto(url.toString());

			await page.evaluate((preset) => {
				window.player.updateSettings(preset);
				console.log("DashJS preset rules are applied.");
			}, job.data.dashPreset);

			applyNetworkProfile(
				page,
				job.data.newtorkPreset,
				job.data.networkPresetOffset,
				job.data.networkThrottleOffset
			);

			console.info(
				`Waiting for ${job.data.testingDuration} seconds`.bgRed.white
			);
			await sleep(job.data.testingDuration);

			// Retrieve Results
			const result = {
				job: job.data,
				testResult: null,
			};
			result.testResult = await page.evaluate(() => {
				return window.experimentResults;
			});

			// Cleanup
			await page.close();
			await browser.close();
			await encoder.terminate();

			if (
				result.testResult.errors.length > 0 ||
				result.testResult.playbackStarted === null
			)
				throw new Error("Playback Error");

			let resultFileName = `${process.env.RESULT_OUTPUT_DIR}/${
				job.data.videoFile.split(".")[0]
			}-${job.data.newtorkPreset}-${job.data.dashPresetName}-${
				job.data.startOffset
			}-${jobStartDate.getTime()}.json`;
			fs.writeFileSync(resultFileName, JSON.stringify(result));

			return done(null, "done");
		} catch (error) {
			console.error(error);
			return done(error, null);
		}
	});
}

const sleep = (duration) => {
	return new Promise((resolve, _) => {
		setTimeout(() => resolve(), duration * 1000);
	});
};

throng({ master, worker, count: 1 });
