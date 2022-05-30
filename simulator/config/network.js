import fs from "fs";

// Profiles are in bytes/sec
export const NETWORK_PROFILES = ["lte", "twitch"];

const offsetNetworkProfile = (data, offset) => {
	let beforeOffsetData = [];
	let offsetData = [];
	let currentTime = 0;

	for (const step of data) {
		if (currentTime >= offset) {
			offsetData.push(step);
		} else {
			beforeOffsetData.push(step);
		}
		currentTime += step.duration;
	}

	return offsetData.concat(beforeOffsetData);
};

export const applyNetworkProfile = (
	page,
	preset,
	presetOffset,
	throttleOffset
) => {
	if (!NETWORK_PROFILES.includes(preset)) {
		throw new Error("Unknown network profile");
	}

	let preset_data = offsetNetworkProfile(
		JSON.parse(fs.readFileSync(`config/profiles/${preset}.json`)),
		presetOffset
	);

	(async (page, data, throttleOffset) => {
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
				scale = 0.75;
				break;
			case "twitch":
				scale = 0.75;
				break;
		}

		try {
			let pos = 0;
			while (!page.isClosed()) {
				for (const step of data) {
					if (page.isClosed()) break;

					step.data = {
						...step.data,
						download: step.data.download * scale,
						upload: step.data.upload * scale,
					};

					if (pos >= throttleOffset)
						await page.emulateNetworkConditions(step.data);
					else
						await page.emulateNetworkConditions({
							download: 1e6,
							upload: 1e6,
							latency: 0,
						});

					await page.evaluate((data) => {
						window.networkConditions = data;
					}, step.data);

					await sleep(step.duration);
					pos += step.duration;
				}
			}
		} catch (_) {}
	})(page, preset_data, throttleOffset);
};
