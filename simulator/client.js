// Worker related
import throng from "throng";
import Queue from "bull";

// Simulation
import puppeteer from "puppeteer";
import { FFmpeg } from "./lib/index.js";
import { DASHJS_PRESETS,DASHJS_PRESETS_KEYS, applyNetworkProfile,NETWORK_PROFILES } from "./config/index.js";

// Misc
import colors from "colors";

// Configure
import dotenv from "dotenv";
dotenv.config();

// Setup Queue
const queue = new Queue("work");

import fs from "fs";

if (!fs.existsSync(process.env.RESULT_OUTPUT_DIR)){
    fs.mkdirSync(process.env.RESULT_OUTPUT_DIR);
}

async function master() {
	const tests = [
		{
			videoFile: "video_ss.mp4",
			testingDuration: 30
		},
	];

	//Populate Tests

	const populatedTests = [];
	for (const test of tests) {
		for (const networkProfile of NETWORK_PROFILES) {
			for (const dashjsProfileKey of DASHJS_PRESETS_KEYS) {
				populatedTests.push({
					...test,
					newtorkPreset:networkProfile,
					dashPreset: DASHJS_PRESETS[dashjsProfileKey],
					dashPresetName: dashjsProfileKey
				});
				
			}
		}
	}

	//Load Populated Tests
	for (const test of populatedTests) {
		queue.add(test);
	}

	let completed = 0;
	queue.on("global:completed", function (job, result) {
		completed++;
		if (populatedTests.length == completed) {
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

			console.info(`Sleeping for ${20} seconds`.bgRed.white);
			await sleep(20);

			const page = await browser.newPage();
			await page.setCacheEnabled(false);

			let url = new URL(
				`${process.env.BASE_URL}?mpd=${process.env.COMMON_HTTP_CONTEXT}/${encoder.name}/${encoder.name}.mpd`
			);
			await page.goto(url.toString());

			await page.evaluate((preset) => {
				window.player.updateSettings(preset);
				console.log("DashJS preset rules are applied.");
			}, job.data.dashPreset);

			applyNetworkProfile(page, job.data.newtorkPreset);
			console.info(`Sleeping for ${job.data.testingDuration} seconds`.bgRed.white);
			await sleep(job.data.testingDuration);
			//Retrieve Results
			const result ={
				job:job.data,
				testResult:null
			}
			result.testResult = await page.evaluate(() => {
				return window.experimentResults;
			});

			// Cleanup
			await page.close();
			await browser.close();
			await encoder.terminate();

			let resultFileName = process.env.RESULT_OUTPUT_DIR+"/"+job.data.videoFile.split(".")[0]+"-"+job.data.newtorkPreset+"-"+job.data.dashPresetName+"-"+jobStartDate.getTime()+".json"
			fs.writeFileSync(resultFileName,JSON.stringify(result));

		} catch (error) {
			console.error(error);
		}

		return done(null, "done");
	});
}

const sleep = (duration) => {
	return new Promise((resolve, _) => {
		setTimeout(() => resolve(), duration * 1000);
	});
};

throng({ master, worker, count: 1 });