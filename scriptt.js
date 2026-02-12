

/* ===== ENDLESS CAROUSEL LOGIC  ===== */
(() => {
  const track = document.getElementById("carouselTrack");
  if (!track) return;

  // Duplicate content for looping
  track.innerHTML += track.innerHTML;

  let position = 0;
  const speed = 4;

  function moveCarousel() {
    track.style.transform = `translateX(${position}px)`;
    position -= speed;

    if (Math.abs(position) >= track.scrollWidth / 2) {
      position = 0;
    }
    requestAnimationFrame(moveCarousel);
  }

  moveCarousel();
})();

/* ===== CLICK TO CHANGE IMAGE LOGIC ===== */
(() => {
  const img = document.getElementById("changeImage");
  if (!img) return;

  const images = [
    "birds/bird1.png",
    "birds/bird2.png",
    "birds/bird3.png",
    "birds/bird4.png",
    "birds/bird5.png"
  ];

  let currentIndex = 0;

  img.addEventListener("click", () => {
    img.classList.add("fade");

    setTimeout(() => {
      currentIndex = (currentIndex + 1) % images.length;
      img.src = images[currentIndex];
      img.classList.remove("fade");
    }, 300);
  });
})();



/* ===== MUSIC PLAYER LOGIC ===== */
(() => {
  const audioPlayer = document.getElementById("audioPlayer");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const muteBtn = document.getElementById("muteBtn");

  const playPauseIcon = document.getElementById("playPauseIcon");
  const muteIcon = document.getElementById("muteIcon");

  const progressBar = document.getElementById("progressBar");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");


  if (
    !audioPlayer || !playPauseBtn || !muteBtn ||
    !playPauseIcon || !muteIcon || !progressBar ||
    !currentTimeEl || !durationEl
  ) return;

  const ICON_PLAY = "assets/play.png";
  const ICON_PAUSE = "assets/pause.png";
  const ICON_VOL = "assets/volume.png";
  const ICON_MUTE = "assets/mute.png";

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  audioPlayer.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audioPlayer.duration || 0);
  });

  playPauseBtn.addEventListener("click", () => {
    if (audioPlayer.paused) audioPlayer.play();
    else audioPlayer.pause();
  });

  audioPlayer.addEventListener("play", () => {
    playPauseIcon.src = ICON_PAUSE;
    playPauseIcon.alt = "Pause";
  });

  audioPlayer.addEventListener("pause", () => {
    playPauseIcon.src = ICON_PLAY;
    playPauseIcon.alt = "Play";
  });

  muteBtn.addEventListener("click", () => {
    audioPlayer.muted = !audioPlayer.muted;

    if (audioPlayer.muted) {
      muteIcon.src = ICON_MUTE;
      muteIcon.alt = "Unmute";
    } else {
      muteIcon.src = ICON_VOL;
      muteIcon.alt = "Mute";
    }
  });

  audioPlayer.addEventListener("timeupdate", () => {
    if (!audioPlayer.duration) return;

    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = percent;
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
  });

  progressBar.addEventListener("input", () => {
    if (!audioPlayer.duration) return;

    const seekTime = (progressBar.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = seekTime;
  });
})();



/* ===== FULL IMAGE ECHO TRAIL LOGIC =====
 
*/
(() => {
  const echoSection = document.getElementById("echoSection");
  if (!echoSection) return;

  const layers = echoSection.querySelectorAll(".echo-layer");
  if (!layers.length) return;

  let targetX = 0;
  let targetY = 0;
  let started = false;

  const pos = Array.from(layers).map(() => ({ x: 0, y: 0 }));

  echoSection.addEventListener("mousemove", (e) => {
    const rect = echoSection.getBoundingClientRect();
    const moveAmount = 160;

    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    targetX = (px - 0.5) * (moveAmount * 2);
    targetY = (py - 0.5) * (moveAmount * 2);

    started = true;
  });

  function animateEcho() {
    if (started) {
      pos[0].x += (targetX - pos[0].x) * 0.18;
      pos[0].y += (targetY - pos[0].y) * 0.18;

      for (let i = 1; i < pos.length; i++) {
        pos[i].x += (pos[i - 1].x - pos[i].x) * 0.16;
        pos[i].y += (pos[i - 1].y - pos[i].y) * 0.16;
      }

      layers.forEach((layer, i) => {
        layer.style.transform = `translate(${pos[i].x}px, ${pos[i].y}px)`;
      });
    }

    requestAnimationFrame(animateEcho);
  }

  animateEcho();
})();

/* ===== STICKY SCROLL FRAMES + FLOATING FACTS =====
   Uses your frames: assets/timelapse/001.png ... 080.png :contentReference[oaicite:2]{index=2}
*/
(() => {
  const section = document.getElementById("scrollVideo");
  const canvas = document.getElementById("seqCanvas");
  const factEls = Array.from(document.querySelectorAll("#facts .fact"));

  if (!section || !canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });

  // ====== CONFIG (YOUR SETUP) ======
  const FRAME_COUNT = 80;
  const FRAME_PATH = "assets/timelapse";
  const FILE_EXT = "png";
  const PAD = 3;
  // ================================

  function frameUrl(i) {
    const n = String(i).padStart(PAD, "0");
    return `${FRAME_PATH}/${n}.${FILE_EXT}`;
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function clamp01(t) { return clamp(t, 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(t) { t = clamp01(t); return t * t * (3 - 2 * t); }

  const frames = new Array(FRAME_COUNT);
  let currentFrame = 0;
  let targetFrame = 0;
  let rafId = null;
  let lastDrawnIndex = 0;

  function drawCover(img) {
    const rect = canvas.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;

    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;

    ctx.clearRect(0, 0, cw, ch);

    const scale = Math.max(cw / iw, ch / ih);
    const w = iw * scale;
    const h = ih * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    ctx.drawImage(img, x, y, w, h);
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    // draw in CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const img = frames[lastDrawnIndex];
    if (img && img.complete) drawCover(img);
  }

  function getScrollProgress() {
    const rect = section.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const scrolled = -rect.top;
    if (total <= 0) return 0;
    return clamp(scrolled / total, 0, 1);
  }

  function updateFacts(progress) {
    if (!factEls.length) return;

    const n = factEls.length;
    const slice = 1 / n;

    factEls.forEach((el, i) => {
      const start = i * slice;
      const end = (i + 1) * slice;

      const fadeInStart  = start + slice * 0.08;
      const fadeInEnd    = start + slice * 0.28;
      const fadeOutStart = end   - slice * 0.28;
      const fadeOutEnd   = end   - slice * 0.08;

      let opacity = 0;

      if (progress >= fadeInStart && progress <= fadeInEnd) {
        opacity = smoothstep((progress - fadeInStart) / (fadeInEnd - fadeInStart));
      } else if (progress > fadeInEnd && progress < fadeOutStart) {
        opacity = 1;
      } else if (progress >= fadeOutStart && progress <= fadeOutEnd) {
        const t = smoothstep((progress - fadeOutStart) / (fadeOutEnd - fadeOutStart));
        opacity = 1 - t;
      } else {
        opacity = 0;
      }

      // Middle-left start (CSS) + drift up while visible
      const localT = clamp01((progress - start) / (end - start));
      const easeT = smoothstep(localT);

      const x = lerp(-6, 10, easeT);
      const y = lerp(24, -64, easeT);

      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }

  function render() {
    const ease = 0.14;
    currentFrame += (targetFrame - currentFrame) * ease;

    const idx = clamp(Math.round(currentFrame), 0, FRAME_COUNT - 1);
    const img = frames[idx];

    if (img && img.complete && idx !== lastDrawnIndex) {
      drawCover(img);
      lastDrawnIndex = idx;
    } else if (img && img.complete && lastDrawnIndex === 0) {
      // first paint safety
      drawCover(img);
    }

    if (Math.abs(targetFrame - currentFrame) > 0.01) {
      rafId = requestAnimationFrame(render);
    } else {
      rafId = null;
    }
  }

  function setTargetFromScroll() {
    const p = getScrollProgress();
    targetFrame = p * (FRAME_COUNT - 1);
    updateFacts(p);
    if (!rafId) rafId = requestAnimationFrame(render);
  }

  window.addEventListener("scroll", setTargetFromScroll, { passive: true });
  window.addEventListener("resize", () => {
    resizeCanvas();
    setTargetFromScroll();
  });

  // Preload frames
  let firstFrameReady = false;

  for (let i = 1; i <= FRAME_COUNT; i++) {
    const im = new Image();
    im.src = frameUrl(i);
    frames[i - 1] = im;

    im.onload = () => {
      if (!firstFrameReady && i === 1) {
        firstFrameReady = true;
        resizeCanvas();
        drawCover(im);
        setTargetFromScroll();
      }
    };

    im.onerror = () => {
      console.warn("Failed to load frame:", im.src);
    };
  }

  setTargetFromScroll();
})();
