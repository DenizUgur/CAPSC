import fs from "fs";

// Profiles are in bytes/sec
export const NETWORK_PROFILES = [ "lte","twitch"];

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
		let scale = 1.0;
		switch (preset) {
			case "cascade":
				scale = 0.5;
				break;
			case "lte":
				scale = 0.5;
				break;
			case "twitch":
				scale = 0.5;
				break;
		}
		try {
			while (!page.isClosed()) {
				for (const step of data) {
					if (page.isClosed()) break;
					//console.log(step.data)
					step.data = {
						...step.data,
						download: step.data.download * scale,
						upload: step.data.upload * scale,
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
