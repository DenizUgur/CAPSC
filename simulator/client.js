// OS Related
import { promises as fs } from "fs";

// Worker related
import throng from "throng";
import Queue from "bee-queue";

// Simulation
import puppeteer from "puppeteer";
import { FFmpeg } from "./lib/index.js";
import { DASHJS_PRESETS, NETWORK_PRESETS } from "./config/index.js";

// Misc
import colors from "colors";
import sleep from "sleep";

// Configure
import dotenv from "dotenv";
dotenv.config();

const tests = [
	{
		videoFile: "video.mp4",
		cases: [
			{
				start: 10,
				length: 3,
				newtorkPreset: NETWORK_PRESETS.Regular3G,
			},
		],
	},
];

// Setup Queue
const queue = new Queue("work");
for (const test of tests) {
	let job = queue.createJob(test);
	job.save();
}

(async () => {
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
			sleep.sleep(20);

			const page = await browser.newPage();
			await page.setCacheEnabled(false);

			let url = new URL(`${process.env.BASE_URL}?mpd=${process.env.COMMON_HTTP_CONTEXT}/${encoder.name}/${encoder.name}.mpd`);
			await page.goto(url.toString());
			const client = await page.target().createCDPSession();

			await client.send(
				"Network.emulateNetworkConditions",
				NETWORK_PRESETS.WiFi
			);
			await page.evaluate(function (preset) {
				window.player.updateSettings(preset);
				console.log("Abr rules are applied.");
			}, DASHJS_PRESETS.DEFAULT);

			for (const testCase of job.data.cases) {
				console.info(
					`Sleeping for ${testCase.start} seconds`.bgRed.white
				);
				sleep.sleep(testCase.start);
				await client.send(
					"Network.emulateNetworkConditions",
					testCase.newtorkPreset
				);

				console.log("Network throttling is started.");
				await page.evaluate(function (preset) {
					console.log("Network throttling is started.");
				});
				console.info(
					`Sleeping for ${testCase.length} seconds`.bgRed.white
				);
				sleep.sleep(testCase.length);

				await client.send(
					"Network.emulateNetworkConditions",
					NETWORK_PRESETS.WiFi
				);
				console.log("Network throttling is ended.");
				await page.evaluate(function (preset) {
					console.log("Network throttling is ended.");
				});
			}

			console.info(`Sleeping for ${10} seconds`.bgRed.white);
			sleep.sleep(10);

			// Cleanup
			await page.close();
			await browser.close();
			await encoder.terminate();
		} catch (error) {
			console.error(error);
		}

		return done(null, "done");
	});
})();
