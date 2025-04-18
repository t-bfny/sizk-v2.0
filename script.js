let backgroundMusic = document.getElementById('bgm');
let isBgmStarted = false;

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('spectrumCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let droplets = [];

  class Droplet {
    constructor(x, y) {
      this.x = x; //画面の縦に移動
      this.y = y; //音量に基づいて移動
      this.start = performance.now();
      this.duration = 500;
    }

    draw(currentTime) {
      const elapsed = currentTime - this.start;
      if (elapsed > this.duration) return false;

      const progress = elapsed / this.duration;
      const radius = 5 + 20 * progress;
      const opacity = 1 - progress;

      const drawX = this.y;
      const drawY = canvas.height - this.x;

      ctx.beginPath();
      ctx.arc(drawX, drawY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.fill();
      return true;
    }
  }

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
  
  function updateSpectrum(currentTime) {
    if (analyser) {
      analyser.getByteFrequencyData(frequencyData);
  
      const step = 5;
      for (let i = 0; i < frequencyData.length; i += step) {
        const strength = frequencyData[i];
        if (strength > 100) {
          const x = (i / frequencyData.length) * canvas.height; // 横の座標を縦方向に変更
          const y = Math.random() * canvas.width;  // 縦の座標を横方向に変更
          droplets.push(new Droplet(x, y));
        }
      }
    }
  }
  

  function animate(currentTime) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // ← 黒塗りはやめて透明にする
  
    droplets = droplets.filter(d => d.draw(currentTime));
    updateSpectrum(currentTime);
  
    requestAnimationFrame(animate);
  }  

  requestAnimationFrame(animate);

  const volumeSlider = document.getElementById("volumeSlider");
  if (backgroundMusic && volumeSlider) {
    backgroundMusic.volume = volumeSlider.value;
  }
});

let audioCtx, analyser, source, frequencyData;

function setupAudio(backgroundMusic) {
  if (!backgroundMusic) return;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  source = audioCtx.createMediaElementSource(backgroundMusic);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = 512;
  frequencyData = new Uint8Array(analyser.frequencyBinCount);
}

document.getElementById('bgmButton').addEventListener('click', () => {
  if (isBgmStarted) return;

  isBgmStarted = true;
  document.getElementById('bgmButton').textContent = "STARTED";
  document.getElementById('bgmButton').disabled = true;

  setupAudio(backgroundMusic);
  backgroundMusic.loop = true;
  backgroundMusic.play().then(() => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    console.log("BGM Started");
  }).catch(err => {
    console.error("BGM play error:", err);
  });
});

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();
  const clockElement = document.getElementById('clock');
  if (clockElement) {
    clockElement.textContent = timeStr;
  }
}

// 毎秒更新
setInterval(updateClock, 1000);
updateClock(); // 初回即時呼び出し
