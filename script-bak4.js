// グローバルスコープで背景音楽の要素を定義
let backgroundMusic = document.getElementById('bgm');
let isBgmOn = false;

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('spectrumCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // キャンバスの背景色を設定（描画が見えやすくなる）
  ctx.fillStyle = '#000';  // 黒背景
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let droplets = [];

  if (backgroundMusic instanceof HTMLAudioElement) {
    console.log("背景音楽は正しいHTMLAudioElementです。");
  } else {
    console.error("背景音楽の要素が正しくありません。HTMLAudioElementを取得してください。");
  }

  class Droplet {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.start = performance.now();
      this.duration = 500;
    }

    draw(currentTime) {
      const elapsed = currentTime - this.start;
      if (elapsed > this.duration) return false;

      const progress = elapsed / this.duration;
      const radius = 5 + 20 * progress;
      const opacity = 1 - progress;

      ctx.beginPath();
      ctx.arc(this.x, this.y, radius, 0, 2 * Math.PI);
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
          const x = (i / frequencyData.length) * canvas.width;
          const y = Math.random() * canvas.height;
          droplets.push(new Droplet(x, y));
        }
      }
    }
  }

  function animate(currentTime) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    droplets = droplets.filter(d => d.draw(currentTime));
    if (analyser) {
      updateSpectrum(currentTime);
    }
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  const volumeSlider = document.getElementById("volumeSlider");

  if (backgroundMusic && volumeSlider) {
    backgroundMusic.volume = volumeSlider.value;
    console.log("音量初期化完了", backgroundMusic.volume);
  } else {
    console.warn("backgroundMusicまたはvolumeSliderが見つかりませんでした。");
  }
});

let audioCtx, analyser, source, frequencyData;

function setupAudio(backgroundMusic) {
  if (!backgroundMusic) {
    console.error("オーディオ要素が見つかりません。");
    return;
  }

  if (audioCtx && audioCtx.state !== 'closed') {
    audioCtx.close().then(() => {
      console.log("AudioContext closed");
    });
  }

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  source = audioCtx.createMediaElementSource(backgroundMusic);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = 512;
  frequencyData = new Uint8Array(analyser.frequencyBinCount);

  console.log(audioCtx, analyser);
  console.log("AudioContextとAnalyserNodeが正常にセットアップされました。");
}

document.getElementById('bgmButton').addEventListener('click', () => {
  if (!isBgmOn) {
    if (!audioCtx) {
      setupAudio(backgroundMusic);
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        console.log('AudioContext resumed');
      });
    }

    backgroundMusic.loop = true;  // BGMをループ設定
    backgroundMusic.play();
    isBgmOn = true;
    document.getElementById('bgmButton').textContent = "BGM OFF";
    console.log("BGM Playing");
  } else {
    backgroundMusic.pause();
    isBgmOn = false;
    document.getElementById('bgmButton').textContent = "BGM ON";
    audioCtx.close().then(() => {
      console.log("AudioContext closed");
      audioCtx = null;
    });
    console.log("BGM Paused");
  }
});
