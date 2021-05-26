import fs from "fs";

// Profiles are in bytes/sec
export const NETWORK_PROFILES = ["twitch"];

export const applyNetworkProfile = (page, preset) => {
	if (!NETWORK_PROFILES.includes(preset)) {
		throw new Error("Unknown network profile");
	}
	let preset_data = JSON.parse(
		fs.readFileSync(`config/profiles/${preset}.json`)
	);

	(async (page, data) => {
		const sleep = (duration) => {
			return new Promise((resolve, _) => {
				setTimeout(() => resolve(), duration * 1000);
			});
		};

		try {
			while (!page.isClosed()) {
				for (const step of data) {
					if (page.isClosed()) break;
					//console.log(step.data)
					step.data = {
						...step.data,
						download: step.data.download,
						upload: step.data.upload,
					};
					await page.emulateNetworkConditions(step.data);
					await page.evaluate((data) => {
						window.networkConditions = data;
					}, step.data);
					await sleep(step.duration);
				}
			}
		} catch (_) {}
	})(page, preset_data);
};
