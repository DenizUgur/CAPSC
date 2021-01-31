import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { MediaPlayer } from "../../../dashjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import styles from "../styles/Home.module.css";

export default function Home() {
  const [state, setState] = useState({
    latency: [],
    metric: [],
    chunk_count: 0,
    free_count: 0,
    mdat_count: 0,
    mv_data: [],
  });
  const ref = useRef(null);

  useEffect(() => {
    let player = MediaPlayer().create();
    player.initialize(ref.current, "/content/app.mpd", true);
    player.updateSettings({
      streaming: {
        lowLatencyEnabled: true,
        liveDelay: 2.0,
      },
      debug: {
        logLevel: dashjs.Debug.LOG_LEVEL_DEBUG,
      },
    });

    // performance.mark("t_prev");
    // setInterval(() => {
    //   setState((prevState) => ({
    //     ...prevState,
    //     metric: [
    //       ...prevState.metric,
    //       {
    //         ll: player.getCurrentLiveLatency(),
    //         t: player.timeAsUTC(),
    //         pr: player.getPlaybackRate(),
    //       },
    //     ],
    //   }));
    //   performance.measure("t", "t_prev");
    //   performance.mark("t_prev");
    // }, 40);
    player.on("manifestUpdated", (e) => {
      console.warn("frame_rate", eval(e.manifest.Period.AdaptationSet.find(e => e.contentType === "video").frameRate))
    });

    performance.mark("data_loaded_prev");
    player.on("loadingDataProgress", (e) => {
      setState((prevState) => ({
        ...prevState,
        chunk_count:
          prevState.chunk_count + (e.request.mediaType == "video" ? 1 : 0),
        free_count:
          prevState.free_count +
          (e.request.mediaType == "video" ? e.response.free_boxes.length : 0),
        mdat_count:
          prevState.mdat_count +
          (e.request.mediaType == "video" ? e.response.mdat_boxes.length : 0),
        mv_data:
          e.request.mediaType == "video"
            ? e.response.free_boxes.length != 0
              ? e.response.free_boxes.pop().mv_data
              : prevState.mv_data
            : prevState.mv_data,
        latency: [...prevState.latency, { t: player.getCurrentLiveLatency() }],
      }));
      performance.measure("data_loaded", "data_loaded_prev");
      performance.mark("data_loaded_prev");
    });

    return () => {};
  }, []);

  const download = (content, fileName, contentType) => {
    var a = document.createElement("a");
    var file = new Blob([JSON.stringify(content)], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Live Stream</title>
        <link rel="icon" href="tv/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <video
          id="myMainVideoPlayer"
          width="900px"
          ref={ref}
          controls
          muted
        ></video>
        <div className={styles.latency}>
          <span className={styles.delayBig}>
            {state.latency[state.latency.length - 1] &&
              state.latency[state.latency.length - 1].t}
          </span>
          s
          <br />
          chunk_count: {state.chunk_count}
          <br />
          free_count: {state.free_count}
          <br />
          mdat_count: {state.mdat_count}
          <br />
          mv_data: {state.mv_data}
          <button
            onClick={() => download(state.metric, "metric.json", "text/plain")}
          >
            Download metrics
          </button>
        </div>
      </main>
      {/* <LineChart width={2000} height={300} data={state.mv_data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="a" stroke="#82ca9d" />
      </LineChart> */}
    </div>
  );
}
