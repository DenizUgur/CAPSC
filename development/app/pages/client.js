import { useEffect, useRef } from "react";
import { MediaPlayer } from "../../../dashjs";
import querystring from "query-string";

export default function Home() {
  const ref = useRef(null);

  useEffect(() => {
    let params = querystring.parse(window.location.search);

    window.player = MediaPlayer().create();
    window.player.initialize(ref.current, params.mpd, true);

    return () => {};
  }, []);

  return <video ref={ref} muted></video>;
}
