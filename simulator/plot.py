import matplotlib.pyplot as plt
from PIL import Image
import shutil
import os
import img2pdf
import glob
import json
from tqdm import tqdm
from multiprocessing import Pool
import multiprocessing as mp

def worker(args):
    fi, file = args
    comps = file.split("/")[1].split("-")
    video, network, method, offset = comps[0], comps[1], comps[2], comps[3]

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
        interval.plot(
            [d["at"] for d in data["testResult"]["intervalMetrics"]],
            [d["isPlaying"] for d in data["testResult"]["intervalMetrics"]],
            label="Playing",
        )
        interval.axhline(data["job"]["dashPreset"]["streaming"]["liveDelay"], linestyle=":", c="black")
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
            [d["at"] for d in data["testResult"]["intervalMetrics"]],
            [d["playbackRate"] for d in data["testResult"]["intervalMetrics"]],
            label="Playback Rate", c="black"
        )

        tmp = []
        for at in data["testResult"]["intervalMetrics"]:
            if "latestEvent" in at:
                density = at["latestEvent"]["density"]
                if len(tmp) == 0:
                    tmp.append({"density": density, "at_from": at["at"], "at_to": at["at"]})
                    continue

                if tmp[-1]["density"] == density:
                    tmp[-1]["at_to"] = at["at"]
                else:
                    tmp.append({"density": density, "at_from": at["at"], "at_to": at["at"]})

        first_y = True
        first_g = True
        first_r = True
        for at in tmp:
            if at["density"] == 1:
                if first_y:
                    playback.axvspan(at["at_from"], at["at_to"], facecolor="y", alpha=0.5, label="Transition")
                    first_y = False
                else:
                    playback.axvspan(at["at_from"], at["at_to"], facecolor="y", alpha=0.5)
            elif at["density"] == 2:
                if first_g:
                    playback.axvspan(at["at_from"], at["at_to"], facecolor="g", alpha=0.5, label="Movement")
                    first_g = False
                else:
                    playback.axvspan(at["at_from"], at["at_to"], facecolor="g", alpha=0.5)
            else:
                if first_r:
                    playback.axvspan(at["at_from"], at["at_to"], facecolor="r", alpha=0.1, label="No Movement")
                    first_r = False
                else:
                    playback.axvspan(at["at_from"], at["at_to"], facecolor="r", alpha=0.1)

        score_ed2, score_ed0, score_all, score_pb = 0, 0, 0, 0
        total_ed2, total_ed0, total_all, total_pb = 0, 0, 0, 0
        for i, d in enumerate(data["testResult"]["intervalMetrics"]):
            pb = d["playbackRate"]
            ed = d["latestEvent"]["density"] if "latestEvent" in d else 0

            total_pb += 0.25
            if d["isPlaying"] == 0:
                score_pb += 0.25
                continue

            if ed == 2:
                score_ed2 += abs(1 - pb)
                total_ed2 += 1
            else:
                score_ed0 += abs(1 - pb)
                total_ed0 += 1
            score_all += abs(1 - pb)
            total_all += 1
        
        additonal_metrics = """ALL: %{:.2f} ED2: %{:.2f} ED0: %{:.2f} (only played frames)
        Stall duration {:.2f}/{:.2f} (%{:.2f})
        Stall count {}/{} (%{:.2f})
        """.format(
            100 * score_all / total_all if total_all > 0 else -1,
            100 * score_ed2 / total_ed2 if total_ed2 > 0 else -1,
            100 * score_ed0 / total_ed0 if total_ed0 > 0 else -1,
            score_pb, total_pb, 100 * score_pb / total_pb,
            int(score_pb / 0.25), int(total_pb / 0.25), 100 * score_pb / total_pb
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
                current_bw *= 1000
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
            [d for d in bwModified],
            label="Predicted Bandwidth",
        )
        quality.grid("on")
        quality.set_ylim((0, max(networkModified) * 2))
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
            "{} {} {} {}\n{}".format(
                data["job"]["videoFile"],
                data["job"]["newtorkPreset"],
                data["job"]["dashPresetName"],
                data["job"]["startOffset"],
                additonal_metrics
            )
        )

        file_name = f"tmp/img_{fi}"
        plt.savefig(file_name + ".png", dpi=200)

        # Optimize
        result_name = f"{file_name}.{video}.{network}.{method}.{offset}"
        im = Image.open(file_name + ".png").convert("RGB")
        im.save(
            f"{result_name}.jpeg",
            optimize=True,
            quality=30,
        )

        # plt.show()
        plt.close()

        tmp = []
        with open(f"tmp/zip/csv/{video}.{network}.{method}.{offset}.csv", "w") as result_fp:
            for i, interval in enumerate(data["testResult"]["intervalMetrics"]):
                event = 0
                if "latestEvent" in interval:
                    event = interval["latestEvent"]["density"]

                result_fp.write(
                    ",".join(
                        [
                            str(x)
                            for x in [
                                interval["at"],
                                interval["liveLatency"],
                                interval["mediaBuffer"],
                                interval["playbackRate"],
                                event,
                                networkModified[i],
                                bwModified[i],
                                interval["isPlaying"],
                            ]
                        ]
                    )
                )
                result_fp.write("\n")


if __name__ == "__main__":
    if os.path.exists("tmp/"):
        shutil.rmtree("tmp/")
    os.mkdir("tmp/")
    os.mkdir("tmp/zip")
    os.mkdir("tmp/zip/pdf")
    os.mkdir("tmp/zip/csv")

    mp.set_start_method("spawn")
    files = list(enumerate(glob.glob("results/*")))
    with Pool(4) as pool:
        list(tqdm(pool.imap(worker, files), total=len(files)))

    videos, networks = set(), set()
    methods, offsets = set(), set()

    for file in glob.glob("results/*"):
        comps = file.split("/")[1].split("-")
        videos.add(comps[0])
        networks.add(comps[1])
        methods.add(comps[2])
        offsets.add(comps[3])

    for m in list(methods):
        with open(f"tmp/zip/pdf/results-{m}.pdf", "wb") as f:
            f.write(img2pdf.convert(glob.glob(f"tmp/*.{m}.*")))

    for n in list(networks):
        with open(f"tmp/zip/pdf/results-{n}.pdf", "wb") as f:
            f.write(img2pdf.convert(glob.glob(f"tmp/*.{n}.*")))

    for v in list(videos):
        with open(f"tmp/zip/pdf/results-{v}.pdf", "wb") as f:
            f.write(img2pdf.convert(glob.glob(f"tmp/*.{v}.*")))

    for o in list(offsets):
        with open(f"tmp/zip/pdf/results-{o}.pdf", "wb") as f:
            f.write(img2pdf.convert(glob.glob(f"tmp/*.{o}.*")))

    with open(f"tmp/zip/pdf/results-all.pdf", "wb") as f:
        f.write(img2pdf.convert(glob.glob("tmp/*.jpeg")))

    shutil.copytree("results", "tmp/zip/results")
    shutil.make_archive("results", "zip", "tmp/zip")
    shutil.rmtree("tmp/")
    print("done")
