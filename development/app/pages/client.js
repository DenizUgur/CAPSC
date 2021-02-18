import { useEffect, useRef } from "react";
import { MediaPlayer } from "../../../dashjs";
import querystring from "query-string";

export default function Home() {
  const ref = useRef(null);

  useEffect(() => {

    window.experimentResults = {
      playerTime:null,
      playbackStarted: null,
      errors:[],
      playbackRateChanges:[],
      intervalMetrics:[],
      playbackEvents:[]
    };
    const intervalMetricsResolution=1000;
    let intervalCounter = 0;
    let params = querystring.parse(window.location.search);

    window.player = MediaPlayer().create();
    window.player.initialize(ref.current, params.mpd, true);
    
    window.player.on(MediaPlayer.events.PLAYBACK_STARTED,function(e){
      console.log(e);
      window.experimentResults={
        ...window.experimentResults,
        playbackStarted : new Date(),
        playerTime:e.startTime,
        playbackRateChanges:[
          {
            at:0,
            playbackRate:window.player.getPlaybackRate()
          }
        ]
      };
      setInterval(function(){
        intervalCounter++;
        window.experimentResults={
          ...window.experimentResults,
          intervalMetrics : [
            ...window.experimentResults.intervalMetrics,
            {
              at:intervalCounter*intervalMetricsResolution/1000,
              liveLatency:window.player.getCurrentLiveLatency(),
              mediaBuffer:window.player.getBufferLength()
            }
          ]
        }
      },intervalMetricsResolution)
    })

    window.player.on(MediaPlayer.events.PLAYBACK_WAITING,function(e){
      console.log(e);
      window.experimentResults={
        ...window.experimentResults,
        playbackEvents : [
          ...window.experimentResults.playbackEvents,
          {
            at: (new Date() - window.experimentResults.playbackStarted)/1000,
            event:e.type
          }
        ]
      }
    })

    window.player.on(MediaPlayer.events.PLAYBACK_PLAYING,function(e){
      console.log(e);
      window.experimentResults={
        ...window.experimentResults,
        playbackEvents : [
          ...window.experimentResults.playbackEvents,
          {
            at: (new Date() - window.experimentResults.playbackStarted)/1000,
            event:e.type
          }
        ]
      }
    })

    window.player.on(MediaPlayer.events.PLAYBACK_RATE_CHANGED,function(e){
      console.log(e);
      window.experimentResults={
        ...window.experimentResults,
        playbackRateChanges : [
          ...window.experimentResults.playbackRateChanges,
          {
            at: (new Date() - window.experimentResults.playbackStarted)/1000,
            event:e.playbackRate
          }
        ]
      }
    })

    window.player.on(MediaPlayer.events.ERROR,function(e){
      window.experimentResults={
        ...window.experimentResults,
        errors : [
          ...window.experimentResults.errors,
          {
            at: (new Date() - window.experimentResults.playbackStarted)/1000,
            detail:e.error
          }
        ]
      }
      console.log(e);
    })
    return () => {};
  }, []);

  return <video ref={ref} muted></video>;
}
