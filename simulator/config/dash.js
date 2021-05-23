export const DASHJS_PRESETS_KEYS = ["LOLP"];
export const DASHJS_PRESETS = {
	APR: {
		debug: {
			logLevel: 0
		},
		streaming: {
			lowLatencyEnabled: true,
			liveDelay: 2.0,
			stallThreshold: 0.05,
			liveCatchup: {
				mode: "liveCatchupModeLoLP",
				minDrift: 0.2,
				playbackBufferMin: 0.5,
				playbackRate: 0.3,
				respectVideoEvents: true
			},
			abr: {
				useDefaultABRRules: true,
				ABRStrategy: 'abrLoLP',
				fetchThroughputCalculationMode: 'abrFetchThroughputCalculationMoofParsing'
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
				fetchThroughputCalculationMode: 'abrFetchThroughputCalculationMoofParsing'
			}
		},
	},
	DEFAULT: {
		debug: {
			logLevel: 0
		},
		streaming: {
			lowLatencyEnabled: true,
			liveDelay: 2.0,
			liveCatchup: {
				minDrift: 0.2,
				playbackRate: 0.5,
				mode: "liveCatchupModeDefault",
			},
			abr: {
				useDefaultABRRules: true,
				ABRStrategy: 'abrLoLP',
				fetchThroughputCalculationMode: 'abrFetchThroughputCalculationMoofParsing'
			}
		},
	},
	DISABLED: {
		debug: {
			logLevel: 0
		},
		streaming: {
			lowLatencyEnabled: true,
			liveDelay: 2.0,
			liveCatchup: {
				minDrift: 0.2,
				playbackRate: 0,
			}
		},
	},
};
