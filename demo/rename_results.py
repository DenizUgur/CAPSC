import os
import shutil
from glob import glob

if __name__ == "__main__":
    files = glob("results/*.json")

    for file in files:
        name = file.split("/")[1].split("-");
        new = "results/{}-{}-{}.json".format(name[0], name[1], name[2])
        new_vis = "results/{}-visualized-{}-{}.json".format(name[0], name[1], name[2])
        shutil.copy(file, new_vis)
        shutil.move(file, new)