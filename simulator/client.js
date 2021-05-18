// Worker related
import throng from "throng";
import Queue from "bull";

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

// Configure
import dotenv from "dotenv";
dotenv.config();

// Setup Queue
const queue = new Queue("work");

if (!fs.existsSync(process.env.COMMON_OUTPUT_DIR)) {
	fs.mkdirSync(process.env.COMMON_OUTPUT_DIR);
} else {
	fs.rmSync(process.env.COMMON_OUTPUT_DIR, { force: true, recursive: true });
	fs.mkdirSync(process.env.COMMON_OUTPUT_DIR);
}

if (!fs.existsSync(process.env.RESULT_OUTPUT_DIR)) {
	fs.mkdirSync(process.env.RESULT_OUTPUT_DIR);
} else {
	fs.rmSync(process.env.RESULT_OUTPUT_DIR, { force: true, recursive: true });
	fs.mkdirSync(process.env.RESULT_OUTPUT_DIR);
}

async function master() {
	const tests = [
		{
			videoFile: "bcn.mp4",
			testingDuration: 300,
		},
		{
			videoFile: "bcn2.mp4",
			testingDuration: 300,
		},
		{
			videoFile: "bcn3.mp4",
			testingDuration: 300,
		},
	];

	//Populate Tests

	const populatedTests = [];
	for (const test of tests) {
		for (const networkProfile of NETWORK_PROFILES) {
			for (const dashjsProfileKey of DASHJS_PRESETS_KEYS) {
				populatedTests.push({
					...test,
					newtorkPreset: networkProfile,
					dashPreset: DASHJS_PRESETS[dashjsProfileKey],
					dashPresetName: dashjsProfileKey,
				});
				console.log(`Adding ${test.videoFile} ${networkProfile} ${dashjsProfileKey}`.yellow)
			}
		}
	}

	//Load Populated Tests
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
			console.info("All jobs has been processed!".bgGreen.bold.white);
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
			executablePath: "google-chrome",
			devtools: true,
		});

		try {
			const encoder = new FFmpeg(job.data.videoFile);
			console.info("Starting encoding process".green);
			encoder.run();

			// Wait for second segment
			console.info(`Waiting for second segment file`.bgRed.white);
			let now = Date.now();
			while (!fs.existsSync(`${encoder.outdir}/chunk0-00002.m4s`)) {
				if (Date.now() - now > 40 * 1000) {
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

			job.data.dashPreset.streaming.videoEventSteamURL = `http://192.168.1.100:2323/stream?media=${encoder.videoName}`;
			await page.evaluate((preset) => {
				window.player.updateSettings(preset);
				console.log("DashJS preset rules are applied.");
			}, job.data.dashPreset);
			applyNetworkProfile(page, job.data.newtorkPreset);

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
			}-${job.data.newtorkPreset}-${
				job.data.dashPresetName
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

throng({ master, worker, count: 3 });
