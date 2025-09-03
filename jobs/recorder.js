// importing neccessary modules and packages
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
require('dotenv').config()
const fs = require('fs').promises;
const fsSync = require('fs');
const { MAX } = require('uuid');
const db = require('../db')


const VIDEOS_DIR = process.env.VIDEOS_DIR;
const MAX_FILE_AGE_DAYS = process.env.MAX_FILE_AGE_DAYS;

const screenshotsDir = process.env.PREVIEW_FOLDER;
const MAX_AGE_MS = process.env.MAX_AGE_MS;

// parsing string of time to delta time
function parseTimeToMs(timeStr) {
  const [minutes, seconds] = timeStr.split(':').map(Number);
  return (minutes * 60 + seconds) * 1000;
}

async function testUrl(link){
  

  try{

    const protocolRegex = /^https?:\/\//i;    
    const parsedLink = new URL(link)
    if (!protocolRegex.test(parsedLink)){
      return false;
    }
  } catch{
    return false
  }

    let browser;
  
  try{
  browser = await puppeteer.launch({
    
    headless: true,
    executablePath:'/usr/bin/chromium-browser',
    dumpio: true,
    defaultViewport:{
	width: 1280,
    height: 720,
    }, 
	args: [
	'--no-sandbox',              // necessary for many CI or restricted envs
    '--disable-setuid-sandbox', // usually paired with --no-sandbox
    '--disable-dev-shm-usage',  // overcome limited /dev/shm space
    '--disable-gpu',            // often recommended in headless
    '--window-size=1280,720',   // optional but good for consistent viewport
    '--autoplay-policy=no-user-gesture-required', // for media playback with pulseaudio
    '--enable-features=NetworkService,NetworkServiceInProcess' // improve stability sometimes
	
	],

    env:{
    	DISPLAY: ':99'
    }
  });
  
      
      const page = await browser.newPage();
      const bbbUrl = link;
      
      await page.goto(bbbUrl);
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const timeelement = await page.$("span.vjs-remaining-time-display")
      const element = await page.$("button.vjs-play-control")
      
    return !!(timeelement && element)
  }catch (err){
    console.log("Error is :",err)
    return false
  }finally{
    if (browser){ await browser.close()}
  }


}

async function deleteFolder(foldersPath) {
  try{

    const folders = await fs.readdir(foldersPath);
    const now = Date.now();
    
  for (const folder of folders){
    const folderpath = path.join(foldersPath,folder)
    const stats = await fs.stat(folderpath)
    
    if (stats.isDirectory()){
      const age = now - stats.ctimeMs;
      if (age > MAX_AGE_MS){
        console.log(`Deleting old preview folder: ${folderpath}`)
        await fs.rm(folderpath,{recursive:true,force:true})
      }
    }
    
    
    

    
  }
}catch(err){
    console.log("Error during clean up:",err)
    
  }
}


async function preview(link,id){


  const screenshotsFolder = screenshotsDir
  await fs.mkdir(path.join(screenshotsFolder,id),{recursive:true})
  
  
  const browser = await puppeteer.launch({ 
	  headless: true, 
	  executablePath:'/usr/bin/chromium-browser',
	args: [
     '--no-sandbox',              // necessary for many CI or restricted envs
    '--disable-setuid-sandbox', // usually paired with --no-sandbox
    '--disable-dev-shm-usage',  // overcome limited /dev/shm space
    '--disable-gpu',            // often recommended in headless
    '--window-size=1280,720',   // optional but good for consistent viewport
    '--autoplay-policy=no-user-gesture-required', // for media playback with pulseaudio
    '--enable-features=NetworkService,NetworkServiceInProcess' // improve stability sometimes
	],


	  env:{
		  
		DISPLAY: ':99',
	  }
 

  });
  const page = await browser.newPage();

  const bbbUrl = link;

  console.log("in the preview some how")
  await page.goto(bbbUrl)


  // await page.waitForSelector(videoSelector)
  await page.waitForSelector('video');

  const fullvideo = page.$("#root")
  const screenshotsCount = 5;
  const interval = 3000;
  
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  
  const duration = await page.evaluate(() => {
    const video = document.querySelector('video');
    return video.duration;
  });
  
  // await page.click("button.vjs-play-control");
  
  

  const count = 5
  const timestamps = [];
  for (let i = 1; i <= count; i++) {
    timestamps.push((duration / (count + 1)) * i);
  }

  let j = 0
  for (const t of timestamps) {
    await page.evaluate(t => {
      const video = document.querySelector('video');
      video.currentTime = t;
    }, t);
    
    // Wait for the video to seek and frame to update
    // await page.waitForTimeout(1000);
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Take screenshot of video element
    
    if (fullvideo){
      const screenshotPath = path.join(screenshotsFolder,id, `screenshot_${j + 1}.png`);
      await page.screenshot({path: screenshotPath,fullPage:false});
      console.log(`Screen shot ${j+1}.png`)
      j++;
    }
    
    else{
      console.log("video element not found")
    }

  }

  await browser.close();
  console.log(screenshotsFolder)
  return screenshotsFolder


}






// screen recording with this
async function startBBBRecording(link,linkid,name) {
  
  // Launch puppeteer browser (Chromium)
  try{
  const browser = await puppeteer.launch({
    headless: false,
    executablePath:'/usr/bin/chromium-browser',
    defaultViewport: null,
    args: [
    '--no-sandbox',              // necessary for many CI or restricted envs
    '--disable-setuid-sandbox', // usually paired with --no-sandbox
    '--disable-dev-shm-usage',  // overcome limited /dev/shm space
    '--disable-gpu',            // often recommended in headless
    '--window-size=1280,720',   // optional but good for consistent viewport
    '--autoplay-policy=no-user-gesture-required', // for media playback with pulseaudio
    '--enable-features=NetworkService,NetworkServiceInProcess' // improve stability sometimes     
    ],
	  

	  env:{
		DISPLAY: ':99',
	  }

  });


  
  const page = await browser.newPage();
  
  // the link that is selected to be recorded
  const bbbUrl = link;
  console.log('Opening BBB session...');

  await page.goto(bbbUrl);

    await new Promise(resolve => setTimeout(resolve, 10000)); // wait for 10 seconds for the page to load
    
    const timestring = await page.$eval("span.vjs-remaining-time-display", el => el.textContent.trim())
    const timeout = parseTimeToMs(timestring); // the delta time of the video that is supposed to be recorded

    // element injection for removing the cursor in the recording
    await page.evaluate(() => {

      const style = document.createElement("style");
      style.innerHTML = '* { cursor : none !important;}';
      document.head.appendChild(style)

    });

    // starting the vidoe
    await page.click("button.vjs-play-control");


  // Start ffmpeg recording process
  const ffmpegProcess = startRecording(linkid,name);

  console.log('Recording started. Join the BBB session and interact!');

  //timeout delta time variable instead of 15000 should be here
  await new Promise(resolve => setTimeout(resolve, 65000)); // this is for the recording to continue until the end of the video


  console.log('Stopping recording...');
  // Stop the ffmpeg process gracefully
//  ffmpegProcess.stdin.write('q');
//	ffmpegProcess.kill();
	process.kill(-ffmpegProcess.pid,'SIGINT');
  // wait for the recording the end completely
  await new Promise(resolve => setTimeout(resolve,15000))


  // closing the browser
  await browser.close();

  console.log('Browser closed, recording stopped.');
  }
  catch(err){
    console.log(err);
  }
}

function startRecording(linkid,name) {
  	process.env.DISPLAY=':99'

   const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  // change this to where the destination of the files should be and what the name of the file should be
  const outputFile = path.resolve('videos/', `${name}.mp4`);

  const platform = os.platform();

  let ffmpegArgs;
  let ffmpegArgs2;
  if (platform === 'win32') {
    
    // Run 'ffmpeg -list_devices true -f dshow -i dummy' to find audio device names

    ffmpegArgs = [
      '-y',
      '-f', 'dshow',
      '-i', 'audio=CABLE Output (VB-Audio Virtual Cable)',  // <-- Change if needed
      '-f', 'gdigrab',
      '-framerate', '30',
      // '-i', 'title=Playback - Google Chrome for Testing', // for only getting the chrome title
      '-i','desktop', // for getting the entire desktop
      '-c:v', 'libx264',
      '-profile:v', 'baseline',
      '-level', '3.0',
      '-pix_fmt', 'yuv420p',
      '-preset', 'fast',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputFile,
    ];
  } else if (platform === 'linux') {
    // Linux: Change display and audio device accordingly

    ffmpegArgs = [
     '-thread_queue_size', '512',
  '-f', 'x11grab',
  '-framerate', '30',
  '-video_size', '1280x720',
  '-i', ':99.0',

  '-thread_queue_size', '512',
  '-f', 'pulse',
  '-ar', '44100',
  '-i', 'virtual_sink.monitor',

  '-map', '0:v:0',
  '-map', '1:a:0',
  '-async', '1',
  '-vsync', '1',
  '-fflags', '+genpts',
  '-start_at_zero',

  '-c:v', 'libx264',
  '-preset', 'veryfast',
  '-crf', '23',
  '-c:a', 'aac',
  '-b:a', '128k',
      outputFile,
    ];
 ffmpegArgs2 = [
  '-thread_queue_size', '1024',
  '-rtbufsize', '100M',
  '-f', 'x11grab',
  '-framerate', '30',
  '-video_size', '1280x720',
  '-i', ':99.0',
  '-thread_queue_size', '1024',
  '-f', 'pulse',
  '-ar', '44100',
  '-i', 'virtual_sink.monitor',
  '-map', '0:v:0',
  '-map', '1:a:0',
  '-c:v', 'libx264',
  '-preset', 'veryfast',
  '-crf', '23',
  '-pix_fmt', 'yuv420p',
  '-flags', '+cgop',
  '-c:a', 'aac',
  '-b:a', '128k',
  '-filter_complex', 'aresample=async=1',
  '-vsync', 'vfr',
  '-use_wallclock_as_timestamps', '1',
  '-movflags', '+faststart',
  '-max_muxing_queue_size', '1024',
  '-fflags', '+genpts',
  '-start_at_zero',
  
	outputFile,
];
  } else {
    throw new Error('Unsupported OS platform for recording');
  }

  console.log('Running ffmpeg with args:', ffmpegArgs2.join(' '));

  // creating an ffmpeg object for recording
  const ffmpeg = spawn('ffmpeg', ffmpegArgs2, { stdio: ['pipe', 'pipe', 'pipe'],detached:true });

  // closing the ffmpeg recording gracefully
  ffmpeg.on('exit', async (code, signal) => {
    console.log(`ffmpeg exited with code ${code} and signal ${signal}`);
    try{

      if(code === null){
        await db.query("UPDATE user_links SET status = $1 WHERE id = $2",["processed",linkid]);  
        console.log("saved in database")  
      }else{
        console.log("the database didn't save it properly something happened with the video")
      }
      
    }catch(err){
    console.log("this is the db error:",err)
  }
});

  // returning the ffmpeg object accordingly
  return ffmpeg;
}
function deleteOldFiles() {
  fs.readdir(VIDEOS_DIR, (err, files) => {
    if (err) {
      return console.error('Error reading videos directory:', err);
    }

    const now = Date.now();
    const maxAgeMs = MAX_FILE_AGE_DAYS * 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      const filePath = path.join(VIDEOS_DIR, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          return console.error('Error stating file:', err);
        }

        const fileAge = now - stats.mtimeMs; // modified time in ms

        if (fileAge > maxAgeMs) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
            } else {
              console.log(`Deleted old file: ${file}`);
            }
          });
        }
      });
    });
  });
}


async function updateVideoStatus(){
  const results = await db.query("SELECT video_id FROM user_links");
  results.rows.forEach(row => {
    if (!fs.existsSync(`${VIDEOS_DIR}/${row.video_id}.mp4`)){
      db.query("UPDATE user_links SET video_status = $1 WHERE video_id = $2",["deleted",row.video_id])
    }
  })
}
// exporting the recorder to be used by the server
module.exports = {startBBBRecording,testUrl,preview,screenshotsDir,deleteFolder,deleteOldFiles};
