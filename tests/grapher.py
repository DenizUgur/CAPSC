import glob
import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

if __name__ == "__main__":
    data_files = glob.glob("data/*.npy")
    columns = "source,blockw,blockh,srcx,srcy,dstx,dsty,mag,count,macro".split(",")

    with open("data/videos.csv") as file:
        videos = dict(map(lambda x: x.rsplit("\n")[0].split(","), file.readlines()))

    for file in data_files:
        data = np.load(file)
        name = file.split(".txt")[0].lstrip("data/")
        index = name.split("_")[0]
        link = videos[index]

        with open(f"data/{name}.txt", "r") as fp:
            while True:
                cur_line = fp.readline()
                if "fps" in cur_line:
                    fps = int(cur_line.split("fps")[0].split(" ")[21])
                    break

        # Process
        data = data.reshape(-1, 10)
        print(f"# of data points = {len(data)}")
        df = pd.DataFrame(data, columns=columns)

        gs_kw = dict(width_ratios=[1], height_ratios=[3, 1, 1])
        fig, (ax1, ax2, ax3) = plt.subplots(
            3, 1, figsize=(30, 15), gridspec_kw=gs_kw, sharex=True
        )

        ax1.plot(df["mag"], c="#2f28ff")
        ax2.plot(df["count"], c="r")
        ax3.plot(df["macro"], c="g")

        # Functions
        # Method 1: Average from beginning
        _sum = 0
        _function = []
        for i, d in enumerate(df["mag"]):
            _sum += d
            _function.append(_sum / (i + 1))
        ax1.plot(_function, c="#f8ff28")

        # Method 2: Rolling window Average
        _window = []
        _function = []
        window_size = 1000
        for i, d in enumerate(df["mag"]):
            _window.append(d)
            if i < window_size:
                _cur = _window[: i + 1]
            else:
                _cur = _window[i - window_size + 1 : i + 1]
            _function.append(sum(_cur) / len(_cur))
        ax1.plot(_function, c="#28ff2f")

        ax1.set_xticks(np.arange(0, len(df["mag"]), 5000))
        ax2.set_xticks(np.arange(0, len(df["mag"]), 5000))
        ax3.set_xticks(np.arange(0, len(df["mag"]), 5000))

        fig.canvas.draw()
        
        human_readable = lambda t: time.strftime('%H:%M:%S', time.gmtime(t))
        labels = [human_readable((1000/fps)* float(label.get_text()) / 1000) for label in ax3.get_xticklabels()]
        ax3.set_xticklabels(labels)

        fig.tight_layout()
        fig.suptitle(f"#{index} :: {link}")
        plt.show()
