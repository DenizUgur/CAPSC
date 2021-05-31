export const DASHJS_PRESETS_KEYS = ["APR"];
export const DASHJS_PRESETS = {
	APR: {
		debug: {
			logLevel: 0
		},
		streaming: {
			lowLatencyEnabled: true,
			liveDelay: 3.0,
			stallThreshold: 0.05,
			liveCatchup: {
				minDrift: 0.2,
				playbackRate: 0.3,
				playbackBufferMin: 0.5,
				enabled: true,
				mode: "liveCatchupModeLoLP",
				respectVideoEvents: true
			},
			abr: {
				useDefaultABRRules: true,
				ABRStrategy: 'abrLoLP',
				fetchThroughputCalculationMode: 'abrFetchThroughputCalculationDownloadedData'
			}
		},
	},
	LOLP: {
		debug: {
			logLevel: 0
		},
		streaming: {
			lowLatencyEnabled: true,
			liveDelay: 3.0,
			stallThreshold: 0.05,
			liveCatchup: {
				minDrift: 0.2,
				playbackRate: 0.3,
				playbackBufferMin: 0.5,
				enabled: true,
				mode: "liveCatchupModeLoLP",
			},
			abr: {
				useDefaultABRRules: true,
				ABRStrategy: 'abrLoLP',
				fetchThroughputCalculationMode: 'abrFetchThroughputCalculationDownloadedData'
			}
		},
	},
	DEFAULT: {
		debug: {
			logLevel: 0
		},
		streaming: {
			lowLatencyEnabled: true,
			liveDelay: 3.0,
			stallThreshold: 0.05,
			liveCatchup: {
				minDrift: 0.2,
				playbackRate: 0.3,
				playbackBufferMin: 0.5,
				enabled: true,
				mode: "liveCatchupModeDefault",
			},
			abr: {
				useDefaultABRRules: true,
				ABRStrategy: 'abrLoLP',
				fetchThroughputCalculationMode: 'abrFetchThroughputCalculationDownloadedData'
			}
		},
	},
	DISABLED: {
		debug: {
			logLevel: 0
		},
		streaming: {
			lowLatencyEnabled: true,
			liveDelay: 3.0,
			liveCatchup: {
				minDrift: 0.2,
				playbackRate: 0,
			}
		},
	},
};
