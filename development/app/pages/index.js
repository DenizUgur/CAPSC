import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { MediaPlayer } from "../../../dashjs";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [state, setState] = useState(0);
  const [density, setDensity] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    let player = MediaPlayer().create();
    player.initialize(ref.current, "/content/app.mpd", true);
    player.updateSettings({
      streaming: {
        lowLatencyEnabled: true,
        liveDelay: 3.0,
        liveCatchup: {
          mode: "liveCatchupModeLoLP",
          minDrift: 0.2,
          playbackRate: 0.3,
          respectVideoEvents: true,
        },
      },
    });

    player.on("playbackProgress", (e) => {
      setState(player.getCurrentLiveLatency());

      if (window._globalLatestEvent)
        setDensity(window._globalLatestEvent.density);
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
          <span className={styles.delayBig}>{state}</span>s :: DENSITY {density}
        </div>
      </main>
    </div>
  );
}
