// Worker related
import throng from "throng";
import Queue from "bull";

// Simulation
import puppeteer from "puppeteer";
import { FFmpeg } from "./lib/index.js";
import { DASHJS_PRESETS, applyNetworkProfile } from "./config/index.js";

// Misc
import colors from "colors";

// Configure
import dotenv from "dotenv";
dotenv.config();

// Setup Queue
const queue = new Queue("work");

async function master() {
	const tests = [
		{
			videoFile: "video_ss.mp4",
			newtorkPreset: "lte",
			dashPreset: DASHJS_PRESETS.ABR,
		},
	];

	for (const test of tests) {
		queue.add(test);
	}

	let completed = 0;
	queue.on("global:completed", function (job, result) {
		completed++;
		if (tests.length == completed) {
			console.info("All jobs has been processed!".bgGreen.bold.white);
			process.exit(0);
		}
	});
}

async function worker() {
	queue.process(async (job, done) => {
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

			console.info(`Sleeping for ${10} seconds`.bgRed.white);
			await sleep(10);

			// Cleanup
			await page.close();
			await browser.close();
			await encoder.terminate();
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

throng({ master, worker, count: 4 });
