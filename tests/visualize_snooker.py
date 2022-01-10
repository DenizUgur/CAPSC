import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.animation import FuncAnimation

data = []
with open("data.dump", "r") as fp:
    for line in fp:
        raw = line.split("|")

        if len(raw) == 2:
            data.append(None)

        rect = None
        balls = []
        for payload in raw[1:-1]:
            if payload.startswith("rect"):
                rect = list(map(int, payload.split("=")[1].split(":")))
            if payload.startswith("ball"):
                balls.append(list(map(int, payload.split("=")[1].split(":"))))

        data.append([rect, balls])

LOOKUP_TABLE = None
PRECISION = 100
MOMENTUM = 0
MOMENTUM_HIT = 1/5
STATE = False

def logic(rect, balls):
    global LOOKUP_TABLE, MOMENTUM, STATE
    if rect is None:
        return False

    if len(balls) == 0:
        return False

    # ! Now we have rect and balls
    balls = np.array(balls, dtype=float)
    unit_x = rect[0] / PRECISION
    unit_y = rect[1] / PRECISION
    balls[:, 1] /= unit_x
    balls[:, 2] /= unit_y
    balls = np.round(balls).astype(int)
    balls[:, 0] = balls[:, 1] + balls[:, 2] * PRECISION
    balls = balls[:, 0]
    balls.sort()

    if LOOKUP_TABLE is None:
        LOOKUP_TABLE = balls
        return False

    if not np.array_equal(balls, LOOKUP_TABLE) and len(LOOKUP_TABLE) == len(balls):
        MOMENTUM += MOMENTUM_HIT
    else:
        MOMENTUM -= MOMENTUM_HIT

    MOMENTUM = max(min(MOMENTUM, 1), 0)

    if MOMENTUM == 1:
        if not STATE:
            STATE = True
    elif MOMENTUM == 0:
        if STATE:
            STATE = False

    LOOKUP_TABLE = np.copy(balls)
    return STATE

def draw(i):
    ax.cla()

    try:
        if data[i + OFFSET] is None:
            raise Exception("No rect")
        rect = data[i + OFFSET][0]
        balls = data[i + OFFSET][1]

        plt.xlim([0, 1280])
        plt.ylim([720, 0])

        decision = logic(rect, balls)
        plt.suptitle(f"frame={i + OFFSET} t={(i + OFFSET) / 24:.2f}s")
    except Exception:
        return

    if rect:
        p_rect = patches.Rectangle((rect[0], rect[1]), rect[2], rect[3], linewidth=1, edgecolor='r', facecolor='none')
        ax.add_patch(p_rect)

    if len(balls) > 0:
        for b in balls:
            x = b[1] + 7.5
            y = b[2] + 7.5
            p_rect = patches.Rectangle((x, y), 15, 15, linewidth=1, edgecolor='g', facecolor='g')
            ax.annotate(b[0], (x-5, y-5), color='g', weight='bold', fontsize=10, ha='center', va='center')
            ax.add_patch(p_rect)

    # * Draw movement indicator
    color = "g" if decision else "r"
    p_rect = patches.Rectangle((0, 0), 50, 720, linewidth=1, edgecolor=color, facecolor=color)
    ax.add_patch(p_rect)

    p_rect = patches.Rectangle((1280-50, 0), 50, 720, linewidth=1, edgecolor=color, facecolor=color)
    ax.add_patch(p_rect)

OFFSET = 50

fig, ax = plt.subplots(figsize=(12, 6))
fig.tight_layout(rect=[0, 0.03, 1, 0.95])
ani = FuncAnimation(fig, draw, interval=(1/24) * 1000)
plt.show()

