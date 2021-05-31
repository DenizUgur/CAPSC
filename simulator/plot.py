import matplotlib.pyplot as plt
from PIL import Image
import shutil
import os
import img2pdf
import glob
import json


if __name__ == "__main__":
    if os.path.exists("tmp/"):
        shutil.rmtree("tmp/")
    os.mkdir("tmp/")
    os.mkdir("tmp/pdf")

    for fi, file in enumerate(glob.glob("results/*")):
        comps = file.split("/")[1].split("-")
        video, network, method = comps[0], comps[1], comps[2]
        print(f"Processing file #{fi} M:{method} N:{network}")

        with open(file, "r") as fp:
            data = json.load(fp)

            fig, (interval, playback, quality) = plt.subplots(
                3, 1, sharex=True, figsize=(20, 10)
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
            interval.axhline(data["job"]["dashPreset"]["streaming"]["liveDelay"])
            interval.grid("on")
            interval.legend()

            playbackModified = []
            prData = data["testResult"]["playbackRateChanges"]
            for i, prChange in enumerate(prData):
                playbackModified.append(
                    (prChange["at"] - 0.001, prData[i - 1]["event"])
                )
                playbackModified.append((prChange["at"], prChange["event"]))
            playbackModified.append(
                (data["job"]["testingDuration"], playbackModified[-1][1])
            )

            playback.plot(
                [p for p, _ in playbackModified],
                [e for _, e in playbackModified],
                label="Playback Rate",
            )
            tmp = data["testResult"]["intervalMetrics"]
            for i in range(len(tmp)):
                if not "latestEvent" in tmp[i]:
                    tmp[i]["latestEvent"] = {
                        "playerTime": 12.013568,
                        "density": 0,
                        "empty": True,
                    }

            playback.plot(
                [d["at"] for d in data["testResult"]["intervalMetrics"]],
                [
                    d["latestEvent"]["density"]
                    for d in data["testResult"]["intervalMetrics"]
                ],
                label="Event Density",
            )
            playback.grid("on")
            playback.legend()

            qualityModified = []
            qlData = data["testResult"]["qualityEvents"]
            for i, qlChange in enumerate(qlData):
                qualityModified.append(
                    (qlChange["at"] - 0.001, qlData[i - 1]["bitrateDetail"]["bitrate"])
                )
                qualityModified.append(
                    (qlChange["at"], qlChange["bitrateDetail"]["bitrate"])
                )
            qualityModified.append(
                (data["job"]["testingDuration"], qualityModified[-1][1])
            )

            networkModified = []
            prev = None
            for datas in data["testResult"]["intervalMetrics"]:
                try:
                    current_bit = datas["bitrate"]
                except Exception:
                    networkModified.append(None)
                    continue

                if current_bit is None:
                    if prev is None:
                        networkModified.append(0)
                    else:
                        networkModified.append(prev)
                else:
                    current = int(current_bit["download"]) * 8
                    networkModified.append(current)
                    prev = current

            bwModified = []
            prev = None
            for datas in data["testResult"]["intervalMetrics"]:
                current_bw = datas["predictedBW"]
                if current_bw is None:
                    if prev is None:
                        bwModified.append(0)
                    else:
                        bwModified.append(int(prev))
                else:
                    bwModified.append(int(current_bw))
                    prev = current_bw

            quality.plot(
                [p for p, _ in qualityModified],
                [e for _, e in qualityModified],
                label="Video Bitrate",
            )
            quality.plot(
                [d["at"] for d in data["testResult"]["intervalMetrics"]],
                [d for d in networkModified],
                label="Player Bitrate",
            )
            quality.plot(
                [d["at"] for d in data["testResult"]["intervalMetrics"]],
                [d * 1000 for d in bwModified],
                label="Predicted Bandwidth",
            )
            quality.grid("on")
            quality.legend()

            for event in data["testResult"]["playbackEvents"]:
                if event["event"] == "playbackPlaying":
                    interval.axvline(event["at"], c="green", linewidth=1, alpha=0.4)
                    playback.axvline(event["at"], c="green", linewidth=1, alpha=0.4)
                    quality.axvline(event["at"], c="green", linewidth=1, alpha=0.4)
                else:
                    interval.axvline(event["at"], c="red", linewidth=1, alpha=0.4)
                    playback.axvline(event["at"], c="red", linewidth=1, alpha=0.4)
                    quality.axvline(event["at"], c="red", linewidth=1, alpha=0.4)

            fig.suptitle(
                "{} {} {}".format(
                    data["job"]["videoFile"],
                    data["job"]["newtorkPreset"],
                    data["job"]["dashPresetName"],
                )
            )

            file_name = f"tmp/img_{fi}"
            plt.savefig(file_name + ".png", dpi=200)

            # Optimize
            im = Image.open(file_name + ".png").convert("RGB")
            im.save(file_name + f".{video}.{network}.{method}.jpeg", optimize=True, quality=30)

            # plt.show()
            plt.close()

    for m in ["APR", "DEFAULT", "LOLP", "DISABLED"]:
        with open(f"tmp/pdf/results-{m}.pdf", "wb") as f:
            f.write(img2pdf.convert(glob.glob(f"tmp/*{m}*.jpeg")))

    for n in ["cascade", "twitch", "lte"]:
        with open(f"tmp/pdf/results-{n}.pdf", "wb") as f:
            f.write(img2pdf.convert(glob.glob(f"tmp/*{n}*.jpeg")))

    for v in ["bcn", "bcn2", "bcn3"]:
        with open(f"tmp/pdf/results-{v}.pdf", "wb") as f:
            f.write(img2pdf.convert(glob.glob(f"tmp/*{v}*.jpeg")))

    with open(f"tmp/pdf/results-all.pdf", "wb") as f:
        f.write(img2pdf.convert(glob.glob("tmp/*.jpeg")))

    shutil.make_archive("results", "zip", "tmp/pdf")
    shutil.rmtree("tmp/")
    print("done")
