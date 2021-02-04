import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { MediaPlayer } from "../../../dashjs";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [state, setState] = useState({
    latency: [],
    mv: 0,
    frame: 0,
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
    });

    player.on("motionVectorReceived", (e) => {
      setState((prevState) => ({
        ...prevState,
        mv: e.mv_data.length > 0 ? e.mv_data.pop().mv : prevState.mv,
        frame: e.mv_data.length > 0 ? e.mv_data.pop().frame : prevState.frame,
        latency: [...prevState.latency, { t: player.getCurrentLiveLatency() }],
      }));
    });

    return () => {};
  }, []);

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
          mv: {state.mv}
          <br />
          frame: {state.frame}
          <br />
        </div>
      </main>
    </div>
  );
}
