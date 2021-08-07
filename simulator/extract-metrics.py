import json
import numpy as np
from glob import glob


def main():
    for file in glob("results/bcn2-lte-*"):
        with open(file, "r") as fp:
            print(file)
            data = json.load(fp)
            intervalMetrics = data["testResult"]["intervalMetrics"]

            playbackSpeed = [d["playbackRate"] for d in intervalMetrics]
            liveLatency = [d["liveLatency"] for d in intervalMetrics]

            prev_state = intervalMetrics[0]["isPlaying"]
            prev_time = intervalMetrics[0]["videoTime"]

            stalls = []
            for d in intervalMetrics:
                s = d["isPlaying"]
                t = d["videoTime"]

                if s != prev_state:
                    prev_state = s
                    if s == 1:
                        stalls.append(t - prev_time)
                    else:
                        prev_time = t

            np.savetxt(f"csv/{file.split('-')[2]}-playbackSpeed.txt", np.array(playbackSpeed))
            np.savetxt(f"csv/{file.split('-')[2]}-liveLatency.txt", np.array(liveLatency[1:]))
            np.savetxt(f"csv/{file.split('-')[2]}-stalls.txt", np.array(stalls))


if __name__ == "__main__":
    main()