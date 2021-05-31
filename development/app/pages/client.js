import { useEffect, useRef } from "react";
import { MediaPlayer } from "../../../dashjs";
import querystring from "query-string";

export default function Home() {
  const ref = useRef(null);

  useEffect(() => {
    window.experimentResults = {
      playerTime: null,
      playbackStarted: null,
      errors: [],
      playbackRateChanges: [],
      intervalMetrics: [],
      playbackEvents: [],
      qualityEvents: [],
    };
    const intervalMetricsResolution = 250;
    let intervalCounter = 0;
    let params = querystring.parse(window.location.search);

    window.player = MediaPlayer().create();
    window.player.initialize(ref.current, params.mpd, false);
    window.lastWaiting = null;
    window.player.on(MediaPlayer.events.PLAYBACK_STARTED, function (e) {
     //console.log(e);
      window.experimentResults = {
        ...window.experimentResults,
        playbackStarted: new Date().getTime(),
        playerTime: e.startTime,
        playbackRateChanges: [
          {
            at: 0,
            event: window.player.getPlaybackRate(),
          },
        ],
        qualityEvents: [
          ...window.experimentResults.qualityEvents,
          {
            at: 0,
            bitrateDetail:
              window.player.getBitrateInfoListFor("video")[
                window.player.getQualityFor("video")
              ],
          },
        ],
      };
      window.networkConditions = null;
    });
    setInterval(function () {
      if (window.experimentResults) {
        window.experimentResults = {
          ...window.experimentResults,
          intervalMetrics: [
            ...window.experimentResults.intervalMetrics,
            {
              at: (intervalCounter * intervalMetricsResolution) / 1000,
              liveLatency: window.player.getCurrentLiveLatency(),
              mediaBuffer: window.player.getBufferLength(),
              videoTime: window.player.duration(),
              latestEvent: window._globalLatestEvent,
              bitrate: window.networkConditions,
              predictedBW: Math.round(player.getAverageThroughput('video')),
            },
          ],
        };

        intervalCounter++;
      }
    }, intervalMetricsResolution);

    window.player.on(MediaPlayer.events.PLAYBACK_WAITING, function (e) {
      let now = new Date().getTime();
      // console.log(MediaPlayer.events.PLAYBACK_WAITING +" " + now +" " +window.player.getBufferLength());
      window.lastWaiting=now;
    });

    window.player.getVideoElement().addEventListener("timeupdate", function () {
      let now = new Date().getTime() ;
      // console.log("timeupdate " + now);
      let diff = now - window.lastWaiting;
      if(window.lastWaiting == null){

      }else{
        if(diff > 20){
          // console.log("long stall " + diff +" " + window.player.getBufferLength());
          window.experimentResults = {
            ...window.experimentResults,
            playbackEvents: [
              ...window.experimentResults.playbackEvents,
              {
                at:
                  (window.lastWaiting  -
                    window.experimentResults.playbackStarted) /
                  1000,
                event: "playbackWaiting",
              },
            ],
          };
          window.experimentResults = {
            ...window.experimentResults,
            playbackEvents: [
              ...window.experimentResults.playbackEvents,
              {
                at:
                  (now-
                    window.experimentResults.playbackStarted) /
                  1000,
                event: "playbackPlaying",
              },
            ],
          };

        }
      }
      window.lastWaiting = null;
    });
    window.player.on(MediaPlayer.events.PLAYBACK_PLAYING, function (e) {
    //  console.log(e);
      window.experimentResults = {
        ...window.experimentResults,
        playbackEvents: [
          ...window.experimentResults.playbackEvents,
          {
            at:
              (new Date().getTime() -
                window.experimentResults.playbackStarted) /
              1000,
            event: e.type,
          },
        ],
      };
    });

    window.player.on(MediaPlayer.events.PLAYBACK_RATE_CHANGED, function (e) {
    //  console.log("playbackrate change "+ e.playbackRate+ " " +window.player.getBufferLength());
      window.experimentResults = {
        ...window.experimentResults,
        playbackRateChanges: [
          ...window.experimentResults.playbackRateChanges,
          {
            at:
              (new Date().getTime() -
                window.experimentResults.playbackStarted) /
              1000,
            event: e.playbackRate,
          },
        ],
      };
    });

    window.player.on(MediaPlayer.events.ERROR, function (e) {
     //console.log(e);
      window.experimentResults = {
        ...window.experimentResults,
        errors: [
          ...window.experimentResults.errors,
          {
            at:
              (new Date().getTime() -
                window.experimentResults.playbackStarted) /
              1000,
            detail: e.error,
          },
        ],
      };
    });

    player.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, function (e) {
      if (e.mediaType === "video" && window.experimentResults.playbackStarted) {
       //console.log(e);
        window.experimentResults = {
          ...window.experimentResults,
          qualityEvents: [
            ...window.experimentResults.qualityEvents,
            {
              at:
                (new Date().getTime() -
                  window.experimentResults.playbackStarted) /
                1000,
              bitrateDetail:
                player.getBitrateInfoListFor("video")[e.newQuality],
            },
          ],
        };
      }
    });

    window.player.on(MediaPlayer.events.CAN_PLAY, function (e) {
     //console.log(e);
      if (window.experimentResults.playbackStarted == null) {
        window.player.play();
      }
    });
    return () => {};
  }, []);

  return <video ref={ref} muted></video>;
}
