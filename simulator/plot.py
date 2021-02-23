import matplotlib.pyplot as plt
import glob
import json

if __name__ == "__main__":
    for file in glob.glob("results/*"):
        with open(file, "r") as fp:
            data = json.load(fp)

            fig, (interval, playback) = plt.subplots(
                2, 1, sharex=True, figsize=(20, 10)
            )

            interval.plot(
                [d["at"] for d in data["testResult"]["intervalMetrics"]],
                [d["liveLatency"] for d in data["testResult"]["intervalMetrics"]],
                label="Live Latency",
            )
            interval.plot(
                [d["at"] for d in data["testResult"]["intervalMetrics"]],
                [d["mediaBuffer"] for d in data["testResult"]["intervalMetrics"]],
                label="Media Buffer",
            )
            interval.grid("on")
            interval.legend()

            playbackModified = []
            prData = data["testResult"]["playbackRateChanges"]
            for i, prChange in enumerate(prData):
                playbackModified.append(
                    (prChange["at"] - 0.001, prData[i - 1]["event"])
                )
                playbackModified.append((prChange["at"], prChange["event"]))

            playback.plot(
                [p for p, _ in playbackModified],
                [e for _, e in playbackModified],
                label="Playback Rate",
            )
            playback.grid("on")
            playback.legend()

            interval.axhline(data["job"]["dashPreset"]["streaming"]["liveDelay"])

            for event in data["testResult"]["playbackEvents"]:
                if event["event"] == "playbackPlaying":
                    interval.axvline(event["at"], c="green", linewidth=2, alpha=0.2)
                    playback.axvline(event["at"], c="green", linewidth=2, alpha=0.2)
                else:
                    interval.axvline(event["at"], c="red", alpha=0.2)
                    playback.axvline(event["at"], c="red", alpha=0.2)

            fig.suptitle(
                "{} {} {}".format(
                    data["job"]["videoFile"],
                    data["job"]["newtorkPreset"],
                    data["job"]["dashPresetName"],
                )
            )
            plt.show()
