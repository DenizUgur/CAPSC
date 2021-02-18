export const DASHJS_PRESETS = {
	APR: {
		streaming: {
			lowLatencyEnabled: true,
			liveDelay: 2.0,
			liveCatchup: {
				mode: "liveCatchupModeAPR",
				minDrift: 0.2,
				playbackRate: 0.3,
			},
		},
	},
	DEFAULT: {
		streaming: {
			lowLatencyEnabled: true,
			liveDelay: 2.0,
			liveCatchup: {
				minDrift: 0.2,
				playbackRate: 0.3,
			},
		},
	},
	DISABLED: {
		streaming: {
		  liveDelay: 2.0,
		  liveCatchup: {
			enabled:false
		  },
		},
	},
};
