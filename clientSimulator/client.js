const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const kill =  require('tree-kill');
const { spawn } = require('child_process');
const networkPrests = require('./networkpresets');
const dashjsPresets = require('./dashjsSettingPresets');

const videoSetDir= "./videoset";
const commonOutputDir = "../development/content";
const commonHttpContextPath = "/content";
const baseUrl = 'http://localhost/client';

const testConfs = [
  {
    videoFile : "video.mp4",
    cases:[
      {
        start:10000,
        length:3000,
        newtorkPreset: networkPrests.Regular3G
      }
    ]
  }
];

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "google-chrome"
  });
  for (const testConf of testConfs) {
    console.log(`-------BEGIN ${testConf.videoFile} -------` );
    let [httpPath,pid,outputDir]  = startEncoding(testConf.videoFile);
    await delay(20000);
    await runTest(httpPath,testConf);
    stopEncoding(pid,outputDir);
    console.log(`-------END ${testConf.videoFile} -------` );
  }
  await browser.close();
  async function runTest(httpPath,testConf){
    const page = await browser.newPage();
    await page.setCacheEnabled(false);
    let url = new URL(baseUrl);
    url.searchParams.append("mpd",httpPath);
    await page.goto(url.toString());
    const client = await page.target().createCDPSession();
    await client.send('Network.emulateNetworkConditions',networkPrests.WiFi);

    await page.evaluate(function(preset){
      window.player.updateSettings(preset);
      console.log("Abr rules are applied.");
    },dashjsPresets.DEFAULT);
    
    for (const testCase of testConf.cases) {
      await delay(testCase.start);
      await client.send('Network.emulateNetworkConditions',testCase.newtorkPreset);
      console.log("Network throttling is started.");
      await page.evaluate(function(preset){
        console.log("Network throttling is started.");
      });
      await delay(testCase.length);
      await client.send('Network.emulateNetworkConditions',networkPrests.WiFi);
      console.log("Network throttling is ended.");
      await page.evaluate(function(preset){
        console.log("Network throttling is ended.");
      });
    }
    await delay(10000);
    await page.close();
  }
})();

function startEncoding(videoFile){

  const videoOutDir = commonOutputDir + "/" +path.parse(videoFile).name;
  const videoOutputFileName = path.parse(videoFile).name + ".mpd";
  const httpPath = commonHttpContextPath+ "/" + path.parse(videoFile).name + "/"+videoOutputFileName;
  console.log(videoOutDir);
  if(!fs.existsSync(videoOutDir)){
    fs.mkdirSync(videoOutDir);
  }


  const ffmpegCmd = `../FFmpeg/bin/ffmpeg \
  -flags2 +export_mvs \
  -stream_loop -1 -re -i ${videoSetDir+"/"+videoFile} \
  -c:v libx264 \
  -use_template 1 -use_timeline 0 \
  -frag_type every_frame \
  -seg_duration 10 \
  -write_prft 1 \
  -remove_at_exit 1\
  -utc_timing_url "http://time.akamai.com/?iso" \
  -streaming 1 -ldash 1 -tune zerolatency \
  -preset ultrafast \
  -f dash ${videoOutDir+"/"+videoOutputFileName}`

  console.log("encoding start with ffmpeg cmd : " + ffmpegCmd);
  const ls = spawn(ffmpegCmd,[],{shell:true});

  ls.on('error', (error) => {
      console.log(`error: ${error.message}`);
  });

  ls.on("close", code => {
      console.log(`child process exited with code ${code}`);
  });

  return [httpPath, ls.pid,videoOutDir];
}


function stopEncoding(processId,outputDir){
  kill(processId,'SIGINT');
  spawn(`rm -rf ${outputDir}`,[],{shell:true})
}

function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}