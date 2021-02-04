import glob
import pandas as pd
import numpy as np
from tqdm import tqdm


class Processor:
    index = -1

    def __init__(self, file) -> None:
        Processor.index += 1
        self.job_index = Processor.index
        self.name = file
        self.fp = open(file, "r")
        self.data = []
        pass

    def adjust(self, line):
        for column in line.split(","):
            try:
                yield int(column)
            except Exception:
                yield column

    def run(self):
        cur_line = ""
        start = False
        cur_frame = None
        buffer = []

        job_index = Processor.index
        print(f"Running job {job_index}")

        while True:
            cur_line = self.fp.readline()
            if "fps" in cur_line:
                w, h = tuple(map(int, cur_line.split(" ")[14].split("x")))
                d = np.hypot(w, h)
            if "framenum" in cur_line:
                start = True
                columns = cur_line.rstrip("\n").split(",")

            if start:
                for line in tqdm(self.fp.readlines(), ncols=100):
                    adjusted = list(self.adjust(line.rstrip("\n")))

                    if cur_frame == adjusted[0]:
                        buffer.append(adjusted)
                    else:
                        if cur_frame is not None:
                            df = pd.DataFrame(buffer, columns=columns)
                            df["mag"] = (
                                (
                                    (df["srcx"] - df["dstx"]) ** 2
                                    + (df["srcy"] - df["dsty"]) ** 2
                                )
                                ** 0.5
                            ) / d

                            frames = df.groupby(["framenum"]).mean()
                            frames["count"] = df.groupby(["framenum"]).count()["source"]
                            frames["macro"] = frames["blockw"] * frames["blockh"]
                            self.data.append(frames.to_numpy())
                            del df, frames, buffer

                        # Clear and append current line
                        cur_frame = adjusted[0]
                        buffer = [adjusted]
                break

    def end(self):
        np.save(self.name, np.array(self.data))
        self.fp.close()


if __name__ == "__main__":
    # Setup iterator
    files = [
        "data/8_144.mp4.txt",
        "data/5_144.mp4.txt",
        "data/10_144.mp4.txt",
        "data/3_144.mp4.txt",
        "data/9_144.mp4.txt",
    ]
    processors = [Processor(file) for file in files]

    for i, processor in enumerate(processors):
        processor.run()
        processor.end()
        del processor
