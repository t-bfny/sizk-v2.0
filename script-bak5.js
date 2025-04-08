// script.js

const canvas = document.getElementById("spectrumCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const backgroundMusic = new Audio("assets/aranami.mp3");
backgroundMusic.loop = true;

let audioCtx = null;
let analyser = null;
let source = null;
let frequencyData = null;
let isBgmOn = false;
let droplets = [];

function initializeAudio() {
  // すでに AudioContext がある場合は一度閉じる
  if (audioCtx) {
    audioCtx.close().then(() => {
      console.log("AudioContext closed");
      audioCtx = null;
      setupNewAudio();
    });
  } else {
    setupNewAudio();
  }
}

function setupNewAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  frequencyData = new Uint8Array(analyser.frequencyBinCount);

  source = audioCtx.createMediaElementSource(backgroundMusic);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  console.log("AudioContext initialized");
}

function updateSpectrum() {
  if (!analyser || !frequencyData) return;

  analyser.getByteFrequencyData(frequencyData);
  const avg = frequencyData.reduce((a, b) => a + b) / frequencyData.length;

  if (avg > 100) {
    createDroplet();
  }
}

function createDroplet() {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const radius = Math.random() * 5 + 5;
  //const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
  const hue = 170 + Math.random() * 10; // 水色系（190〜200くらい）
  const saturation = 80 + Math.random() * 10; // 少しばらつきあり
  const lightness = 60 + Math.random() * 10; // 少し明るさにゆらぎ
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  const droplet = { x, y, radius, color };
  droplets.push(droplet);
}

function drawDroplets() {
  for (let i = 0; i < droplets.length; i++) {
    const d = droplets[i];
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
    ctx.fillStyle = d.color;
    ctx.fill();

    d.radius *= 0.96;
    if (d.radius < 0.5) {
      droplets.splice(i, 1);
      i--;
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawDroplets();
  updateSpectrum();
}

animate();

document.getElementById("bgmButton").addEventListener("click", () => {
  if (!isBgmOn) {
    initializeAudio();

    backgroundMusic.currentTime = 0;
    backgroundMusic.play();
    isBgmOn = true;

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    document.getElementById("bgmButton").textContent = "BGM OFF";
    console.log("BGM Playing");
  } else {
    backgroundMusic.pause();
    isBgmOn = false;
    document.getElementById("bgmButton").textContent = "BGM ON";

    if (audioCtx) {
      audioCtx.close().then(() => {
        console.log("AudioContext closed");
        audioCtx = null;
      });
    }
  }
});
