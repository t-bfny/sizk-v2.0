const canvas = document.getElementById('spectrumCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let isBgmOn = false; // 初期状態でBGMはオフ
let droplets = [];

// クリックで音声が流れないように、audioタグは最初から音声を停止状態に設定しておく
let audioElement = document.getElementById('audioElement');
audioElement.pause(); // 最初は停止


// 雫のクラス（雫ごとに位置や大きさ、時間を持つ）
class Droplet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.start = performance.now();
    this.duration = 500; // 0.5秒
  }

  draw(currentTime) {
    //console.log("draw called"); // debug
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

//canvas.width / height の描画サイズをCSSと同期
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

//描画確認用
droplets.push(new Droplet(canvas.width / 2, canvas.height / 2));

// オーディオ処理
let audioCtx, analyser, source, frequencyData;

// BGMの要素と連携
const backgroundMusic = document.getElementById('bgm');
const toggleBtn = document.getElementById('toggleBgm');

function setupAudio(audioElement) {
    // 新しい AudioContext を作成
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audioElement);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 512; // 分解能（多くすると細かくなる）
    frequencyData = new Uint8Array(analyser.frequencyBinCount);

    console.log(audioCtx, analyser); // 初期化の確認
    console.log("audioCtx state:", audioCtx.state); // 状態確認
  }

document.getElementById('toggleBgm').addEventListener('click', () => {
    console.log("Button clicked"); // ボタンがクリックされたことを確認

    if (!audioCtx) {
      setupAudio(backgroundMusic); // 初めてBGMの設定を行う
      console.log("setupAudio called"); // setupAudioが呼ばれたことを確認
    }
  
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        console.log('AudioContext resumed');
      });
    }
    
    if (backgroundMusic.paused) {
        backgroundMusic.play();
        toggleBtn.textContent = "BGM OFF";
        console.log("BGM Playing");
      } else {
        backgroundMusic.pause();
        toggleBtn.textContent = "BGM ON";
        console.log("BGM Paused");
        audioCtx.close().then(() => {
          console.log("AudioContext closed");
          audioCtx = null;  // 再度音楽を再生するために新しい AudioContext を作成する
        });
    }
  });

// BGM ONボタンのイベントリスナー
document.getElementById('bgmButton').addEventListener('click', () => {
  if (!isBgmOn) {
    // 音声を再生
    audioElement.play(); // あなたのaudioElementを再生
    isBgmOn = true;

    // アニメーション開始
    startAnimation(); // 雫アニメーション開始関数
  }
});

// 音声とアニメーションをボタンで操作
let isBgmPlaying = false;
document.getElementById('bgmButton').addEventListener('click', () => {
  if (!isBgmPlaying) {
    audioElement.play(); // 音声を再生
    isBgmPlaying = true;
    startAnimation(); // アニメーションをスタート
  }
});

  
// 雫の生成ロジック（5Hzごとにチェック）
function updateSpectrum(currentTime) {
    if (analyser) {
     analyser.getByteFrequencyData(frequencyData);
     console.log("Frequency Data:", frequencyData); // 周波数データの変化を確認
  
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
    //console.log("Animating..."); // ここでアニメーションが呼ばれているか確認
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    droplets = droplets.filter(d => d.draw(currentTime));
    if (analyser) {
      updateSpectrum(currentTime);
    }
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
  