const canvas = document.getElementById('spectrumCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let droplets = [];

// クリックで音声が流れないように、audioタグは最初から音声を停止状態に設定しておく
const backgroundMusic = document.getElementById('bgm'); // bgmというIDを持つaudioタグ
let isBgmOn = false; // 初期状態でBGMはオフ

// 雫のクラス（雫ごとに位置や大きさ、時間を持つ）
class Droplet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.start = performance.now();
    this.duration = 500; // 0.5秒
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

//canvasのサイズをCSSと同期
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// 雫の生成ロジック（5Hzごとにチェック）
function updateSpectrum(currentTime) {
  if (analyser) {
    analyser.getByteFrequencyData(frequencyData);

    const step = 5; // 約5Hzごと
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

// アニメーションループ
function animate(currentTime) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  droplets = droplets.filter(d => d.draw(currentTime));
  if (analyser) {
    updateSpectrum(currentTime);
  }
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// オーディオ処理のセットアップ
let audioCtx, analyser, source, frequencyData;

// 初めて音楽の設定を行う
function setupAudio(audioElement) {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  source = audioCtx.createMediaElementSource(audioElement);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = 512; // 分解能（多くすると細かくなる）
  frequencyData = new Uint8Array(analyser.frequencyBinCount);

  console.log(audioCtx, analyser); // 初期化の確認
}

// BGM ON/OFFボタンのイベントリスナー
document.getElementById('bgmButton').addEventListener('click', () => {
  if (!isBgmOn) {
    if (!audioCtx) {
      setupAudio(backgroundMusic); // 初めてBGMの設定を行う
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        console.log('AudioContext resumed');
      });
    }

    backgroundMusic.play(); // 音声を再生
    isBgmOn = true;
    document.getElementById('bgmButton').textContent = "BGM OFF"; // ボタンのラベルを変更
    startAnimation(); // アニメーション開始
    console.log("BGM Playing");
  } else {
    backgroundMusic.pause(); // 音声を停止
    isBgmOn = false;
    document.getElementById('bgmButton').textContent = "BGM ON"; // ボタンのラベルを変更
    audioCtx.close().then(() => {
      console.log("AudioContext closed");
      audioCtx = null;  // 再度音楽を再生するために新しい AudioContext を作成する
    });
    console.log("BGM Paused");
  }
});
