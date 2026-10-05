(() => {
  const MELODY = [261.63, 261.63, 293.66, 261.63, 349.23, 329.63, 392, 349.23];
  const RING = 188.5;

  const live = document.getElementById("live");
  const topbar = document.getElementById("topbar");
  const flames = Array.from(document.querySelectorAll(".flame"));
  const ring = document.getElementById("ring");
  const fxCanvas = document.getElementById("fx");
  const fxCtx = fxCanvas.getContext("2d");

  const sound = {
    ctx: null,
    whoosh: null,
    ensure() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!this.ctx) this.ctx = new AC();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    note(freq, delay = 0, dur = 0.32, gain = 0.05) {
      const ctx = this.ensure();
      if (!ctx) return;
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(gain, t + 0.02);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },
    phrase() {
      MELODY.forEach((freq, i) => this.note(freq, i * 0.28, 0.4, 0.045));
    },
    startWhoosh() {
      const ctx = this.ensure();
      if (!ctx || this.whoosh) return;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 900;
      filter.Q.value = 0.7;
      const amp = ctx.createGain();
      amp.gain.value = 0.035;
      src.connect(filter);
      filter.connect(amp);
      amp.connect(ctx.destination);
      src.start();
      this.whoosh = { src, amp };
    },
    stopWhoosh() {
      if (!this.whoosh || !this.ctx) return;
      const { src, amp } = this.whoosh;
      amp.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);
      setTimeout(() => {
        try { src.stop(); } catch (err) { /* already stopped */ }
      }, 120);
      this.whoosh = null;
    },
    boom() {
      const ctx = this.ensure();
      if (!ctx) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(190, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.48);
      amp.gain.setValueAtTime(0.18, t);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.52);
    },
    blip(step) {
      this.note(480 + step * 36, 0, 0.07, 0.03);
    }
  };

  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.3 + 0.2,
    a: Math.random() * 0.55 + 0.15,
    tw: Math.random() * Math.PI * 2,
    sp: Math.random() * 0.8 + 0.2
  }));
  const bursts = [];
  const embers = Array.from({ length: 28 }, () => spawnEmber(true));
  let wind = 0;
  let fxW = 0;
  let fxH = 0;

  function spawnEmber(anywhere) {
    return {
      x: Math.random(),
      y: anywhere ? Math.random() : 1.05,
      s: Math.random() * 0.35 + 0.15,
      v: Math.random() * 0.04 + 0.015,
      a: Math.random() * 0.45 + 0.15
    };
  }

  function resizeFx() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    fxW = window.innerWidth;
    fxH = window.innerHeight;
    fxCanvas.width = Math.floor(fxW * dpr);
    fxCanvas.height = Math.floor(fxH * dpr);
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function burstAt(x, y, n = 24) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 180;
      bursts.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 30,
        life: 0.7 + Math.random() * 0.5,
        age: 0,
        r: 1.2 + Math.random() * 2.4,
        gold: Math.random() > 0.25
      });
    }
  }

  function drawFx(dt, reduce) {
    fxCtx.clearRect(0, 0, fxW, fxH);
    const now = performance.now() / 1000;
    stars.forEach((star) => {
      const alpha = reduce ? star.a : star.a * (0.65 + Math.sin(now * star.sp + star.tw) * 0.35);
      fxCtx.fillStyle = `rgba(255, 244, 220, ${alpha})`;
      fxCtx.beginPath();
      fxCtx.arc(star.x * fxW, star.y * fxH, star.r, 0, Math.PI * 2);
      fxCtx.fill();
    });
    embers.forEach((ember) => {
      ember.y -= ember.v * dt;
      ember.x += Math.sin(now + ember.y * 8) * 0.0008;
      if (ember.y < -0.05) Object.assign(ember, spawnEmber(false));
      fxCtx.fillStyle = `rgba(255, 176, 80, ${ember.a})`;
      fxCtx.fillRect(ember.x * fxW, ember.y * fxH, ember.s * 3, ember.s * 3);
    });
    if (wind > 0.04) {
      fxCtx.strokeStyle = `rgba(255, 236, 210, ${0.15 + wind * 0.35})`;
      fxCtx.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) {
        const y = (fxH * 0.35) + i * 18 + Math.sin(now * 6 + i) * 6;
        fxCtx.beginPath();
        fxCtx.moveTo(fxW * 0.15, y);
        fxCtx.bezierCurveTo(fxW * 0.4, y - 12 * wind, fxW * 0.6, y + 10 * wind, fxW * 0.9, y);
        fxCtx.stroke();
      }
    }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const p = bursts[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
      const t = 1 - p.age / p.life;
      if (t <= 0) {
        bursts.splice(i, 1);
        continue;
      }
      fxCtx.fillStyle = p.gold ? `rgba(255, 206, 120, ${t})` : `rgba(255, 120, 70, ${t})`;
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, p.r * t, 0, Math.PI * 2);
      fxCtx.fill();
    }
  }

  let reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let phase = "intro";
  let blowing = false;
  let progress = 0;
  let last = performance.now();
  let ceremony = null;
  let reelTween = null;
  const floatTweens = [];

  function say(text) {
    live.textContent = text;
  }

  function split(el) {
    const text = el.textContent;
    el.textContent = "";
    Array.from(text).forEach((ch) => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch === " " ? "\u00a0" : ch;
      el.appendChild(span);
    });
  }

  split(document.getElementById("line1"));
  split(document.getElementById("line2"));

  function cakeRestScale() {
    const h = window.innerHeight;
    const w = window.innerWidth;
    if (h < 520) return 0.58;
    if (h < 680 || w < 360) return 0.74;
    if (h < 820) return 0.88;
    return 1;
  }

  function setRing(p) {
    ring.style.strokeDashoffset = String(RING * (1 - p));
  }

  function applyFlames(p) {
    const now = performance.now();
    flames.forEach((el, i) => {
      const local = gsap.utils.clamp(0, 1, (p * 1.2 - i * 0.08) / 0.4);
      const idle = p < 0.02;
      const flick = idle ? Math.sin(now / 150 + i * 1.3) * 0.1 : 0;
      const sway = idle ? Math.sin(now / 220 + i) * 7 : 0;
      gsap.set(el, {
        rotation: -local * 38 + sway,
        scaleY: Math.max(0, (1 - local) * (1 + flick)),
        scaleX: (1 + local * 0.25) * (1 - flick * 0.3),
        autoAlpha: 1 - local,
        transformOrigin: "50% 100%"
      });
    });
  }

  function resetVisuals() {
    if (ceremony) ceremony.kill();
    floatTweens.forEach((tween) => tween.kill());
    floatTweens.length = 0;
    progress = 0;
    blowing = false;
    wind = 0;
    setRing(0);
    document.querySelectorAll(".lights i").forEach((bulb) => bulb.classList.remove("lit"));
    gsap.set(".flame", { autoAlpha: 0, scale: 0, rotation: 0, transformOrigin: "50% 100%" });
    gsap.set(".glow", { autoAlpha: 0 });
    gsap.set("#wish-done", { autoAlpha: 0 });
    gsap.set(".wish-ui", { autoAlpha: 1 });
    gsap.set(".balloon, .cake, .candle, .drips span, .lights i", { clearProps: "transform,opacity,visibility" });
  }

  function playIntro() {
    gsap.set("#line1 .char, #line2 .char", { autoAlpha: 0, y: reduce ? 0 : 28 });
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to("#line1 .char", {
      autoAlpha: 1,
      y: 0,
      duration: reduce ? 0 : 0.7,
      stagger: reduce ? 0 : 0.045
    }).to("#line2 .char", {
      autoAlpha: 1,
      y: 0,
      duration: reduce ? 0 : 0.5,
      stagger: reduce ? 0 : 0.03
    }, "-=0.25");
    return tl;
  }

  function lightBulb() {
    this.targets()[0].classList.add("lit");
  }

  function begin() {
    if (phase !== "intro") return;
    sound.ensure();
    phase = "ceremony";
    say("The room is lighting up.");
    const scale = cakeRestScale();
    const dur = reduce ? 0 : 1;

    gsap.set("#scene-cake", { autoAlpha: 1 });
    gsap.set(".flame", { autoAlpha: 0, scale: 0, transformOrigin: "50% 100%" });
    gsap.set(".cake", { scale, transformOrigin: "50% 100%" });

    ceremony = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete() {
        phase = "wish";
        say("Hold to blow out the candles.");
        gsap.to(".glow", { autoAlpha: 1, duration: reduce ? 0 : 0.8 });
      }
    });

    ceremony
      .to("#scene-intro", { autoAlpha: 0, y: reduce ? 0 : -24, duration: 0.7 * dur })
      .from(".lights i", {
        autoAlpha: 0,
        y: -10,
        duration: 0.35 * dur,
        stagger: {
          each: 0.06 * dur,
          onStart: lightBulb
        }
      })
      .from(".balloon", {
        y: reduce ? 0 : 90,
        autoAlpha: 0,
        duration: 0.9 * dur,
        stagger: 0.1 * dur,
        ease: "back.out(1.6)"
      }, "-=0.2")
      .from(".cake", {
        y: reduce ? 0 : 70,
        autoAlpha: 0,
        duration: 1 * dur,
        ease: "back.out(1.5)"
      }, "-=0.45")
      .fromTo(".candle", {
        scaleY: reduce ? 1 : 0,
        autoAlpha: reduce ? 1 : 0,
        rotation: (index, el) => parseFloat(el.style.getPropertyValue("--tilt")) || 0
      }, {
        scaleY: 1,
        autoAlpha: 1,
        rotation: (index, el) => parseFloat(el.style.getPropertyValue("--tilt")) || 0,
        duration: 0.45 * dur,
        stagger: 0.1 * dur,
        transformOrigin: "50% 100%"
      }, "-=0.35")
      .from(".drips span", {
        scaleY: reduce ? 1 : 0,
        duration: 0.45 * dur,
        stagger: 0.05 * dur,
        transformOrigin: "top center"
      }, "<")
      .to(".flame", {
        autoAlpha: 1,
        scale: 1,
        duration: 0.45 * dur,
        stagger: {
          each: 0.16 * dur,
          onStart() {
            const index = flames.indexOf(this.targets()[0]);
            sound.note(MELODY[index] || 392, 0, 0.34, 0.05);
          }
        },
        ease: "back.out(2)",
        transformOrigin: "50% 100%"
      })
      .from(".wish-ui", { autoAlpha: 0, y: 12, duration: 0.45 * dur }, "-=0.1");

    ceremony.add(() => {
      document.querySelectorAll(".lights i").forEach((bulb) => bulb.classList.add("lit"));
      if (reduce) return;
      floatTweens.push(gsap.to(".balloon", {
        y: "-=16",
        duration: 2.1,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        stagger: { each: 0.18, from: "random" }
      }));
    }, "-=0.2");
  }

  function finishWish() {
    if (phase !== "wish") return;
    phase = "celebrating";
    blowing = false;
    wind = 0;
    sound.stopWhoosh();
    sound.phrase();
    say("Happy birthday, Cosmos.");
    flames.forEach((flame) => {
      const rect = flame.getBoundingClientRect();
      burstAt(rect.left + rect.width / 2, rect.top + 10, 20);
    });
    gsap.set(".flame", { autoAlpha: 0, scale: 0 });
    const tl = gsap.timeline();
    tl.to(".wish-ui", { autoAlpha: 0, duration: reduce ? 0 : 0.25 })
      .fromTo("#wish-done", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: reduce ? 0 : 0.6 })
      .add(() => showLetter(), reduce ? 0 : "+=1.15");
  }

  function showLetter() {
    phase = "letter";
    say("A note for Cosmos Rume Ighoraye.");
    gsap.to("#scene-cake", { autoAlpha: 0, duration: reduce ? 0 : 0.55 });
    gsap.set("#scene-letter", { autoAlpha: 1 });
    gsap.fromTo("#scene-letter .rise",
      { autoAlpha: 0, y: reduce ? 0 : 16 },
      { autoAlpha: 1, y: 0, duration: reduce ? 0 : 0.55, stagger: reduce ? 0 : 0.12, ease: "power2.out", overwrite: true }
    );
  }

  const PHOTOS = [
    "WhatsApp Image 2026-10-05 at 9.14.31 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.11.57 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.12.16 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.50 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.49 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.06 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.43 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.46 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.10 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.16 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.16 PM (1).jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.18 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.07 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.19 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.21 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.22 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.23 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.25 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.26 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.47 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.47 PM (1).jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.48 PM.jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.48 PM (1).jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.49 PM (1).jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.49 PM (2).jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.50 PM (1).jpeg",
    "WhatsApp Image 2026-10-05 at 9.14.51 PM.jpeg"
  ];
  const VIDEO = "WhatsApp Video 2026-10-05 at 9.15.41 PM.mp4";

  function mediaUrl(name) {
    return "coach/imgs/" + encodeURIComponent(name);
  }

  function buildReel() {
    const track = document.getElementById("track");
    const film = document.getElementById("film");
    const box = document.getElementById("lightbox");
    const full = document.getElementById("lightboxImg");

    function addPhoto(name) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "shot";
      const img = document.createElement("img");
      img.src = mediaUrl(name);
      img.alt = "Rume";
      img.loading = "lazy";
      button.appendChild(img);
      button.addEventListener("click", () => {
        full.src = img.src;
        full.alt = img.alt;
        box.hidden = false;
        if (reelTween) reelTween.pause();
      });
      track.appendChild(button);
    }

    PHOTOS.slice(0, 3).forEach(addPhoto);

    const video = document.createElement("video");
    video.className = "shot vid";
    video.src = mediaUrl(VIDEO);
    video.controls = true;
    video.playsInline = true;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.setAttribute("playsinline", "");
    video.preload = "metadata";
    track.appendChild(video);

    PHOTOS.slice(3).forEach(addPhoto);

    document.getElementById("lightboxClose").addEventListener("click", () => {
      box.hidden = true;
    });
    box.addEventListener("click", (event) => {
      if (event.target === box) box.hidden = true;
    });
    window.addEventListener("keydown", (event) => {
      if (event.code === "Escape") box.hidden = true;
    });

    film.addEventListener("pointerdown", () => {
      if (reelTween) reelTween.pause();
    });
    film.addEventListener("pointerup", () => {
      if (reelTween && phase === "reel") reelTween.play();
    });
  }

  function startReel() {
    const film = document.getElementById("film");
    const run = () => {
      if (reelTween) reelTween.kill();
      const max = film.scrollWidth - film.clientWidth;
      if (max < 40 || reduce) return;
      gsap.set(film, { scrollLeft: 0 });
      reelTween = gsap.to(film, {
        scrollLeft: max,
        duration: Math.max(26, max / 46),
        ease: "none",
        repeat: -1,
        yoyo: true
      });
    };
    film.querySelectorAll("img").forEach((img) => {
      if (!img.complete) img.addEventListener("load", run, { once: true });
    });
    run();
  }

  function showReel() {
    phase = "reel";
    say("Pictures of Rume. The game is next.");
    gsap.to("#scene-intro, #scene-cake, #scene-letter", { autoAlpha: 0, duration: reduce ? 0 : 0.4 });
    gsap.to("#scene-reel", { autoAlpha: 1, duration: reduce ? 0 : 0.5, overwrite: true });
    startReel();
  }

  function showLight() {
    phase = "light";
    if (reelTween) reelTween.pause();
    say("Catch the light.");
    topbar.classList.add("is-hidden");
    gsap.to("#scene-intro, #scene-cake, #scene-letter, #scene-reel", { autoAlpha: 0, duration: reduce ? 0 : 0.35 });
    gsap.to("#scene-light", {
      autoAlpha: 1,
      duration: reduce ? 0 : 0.45,
      overwrite: true,
      onComplete() {
        window.CosmosLight.enter();
      }
    });
  }

  function resetNight() {
    if (reelTween) reelTween.kill();
    if (window.CosmosLight) window.CosmosLight.leave();
    sound.stopWhoosh();
    resetVisuals();
    topbar.classList.remove("is-hidden");
    const light = document.getElementById("lightbox");
    light.hidden = true;
    gsap.set("#scene-cake, #scene-letter, #scene-reel, #scene-light", { autoAlpha: 0, y: 0 });
    gsap.set("#scene-intro", { autoAlpha: 1, y: 0 });
    phase = "intro";
    playIntro();
    say("Happy birthday, Cosmos Rume Ighoraye.");
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (phase === "wish") {
      if (blowing) progress = Math.min(1, progress + dt / 1.55);
      else progress = Math.max(0, progress - dt / 0.45);
      wind = blowing ? Math.max(wind, progress) : wind * 0.9;
      applyFlames(progress);
      setRing(progress);
      if (progress >= 1) finishWish();
    } else {
      wind *= 0.92;
    }
    drawFx(dt, reduce);
    requestAnimationFrame(frame);
  }

  document.getElementById("begin").addEventListener("click", begin);
  document.getElementById("openReel").addEventListener("click", showReel);
  document.getElementById("catchLight").addEventListener("click", showLight);
  document.getElementById("reelBack").addEventListener("click", resetNight);
  document.getElementById("skip").addEventListener("click", showLight);

  const cakeScene = document.getElementById("scene-cake");
  function startBlow(event) {
    if (phase !== "wish") return;
    blowing = true;
    sound.startWhoosh();
    if (event.pointerId != null && cakeScene.setPointerCapture) {
      try { cakeScene.setPointerCapture(event.pointerId); } catch (err) { /* ignore */ }
    }
  }
  function endBlow() {
    if (!blowing) return;
    blowing = false;
    sound.stopWhoosh();
    if (phase === "wish" && progress > 0.08 && progress < 1) {
      say("Keep holding.");
    }
  }

  cakeScene.addEventListener("pointerdown", startBlow);
  document.getElementById("blow").addEventListener("pointerdown", startBlow);
  window.addEventListener("pointerup", endBlow);
  window.addEventListener("pointercancel", endBlow);

  window.addEventListener("keydown", (event) => {
    if (event.code !== "Space") return;
    event.preventDefault();
    if (phase === "wish") startBlow(event);
    else if (phase === "intro") begin();
  });
  window.addEventListener("keyup", (event) => {
    if (event.code === "Space") endBlow();
  });

  window.CosmosSound = sound;
  window.CosmosNight = { reset: resetNight, showReel };

  const motion = gsap.matchMedia();
  motion.add(
    {
      reduce: "(prefers-reduced-motion: reduce)",
      motion: "(prefers-reduced-motion: no-preference)"
    },
    (context) => {
      reduce = !!context.conditions.reduce;
      gsap.set("#scene-cake, #scene-letter, #scene-reel, #scene-light", { autoAlpha: 0 });
      gsap.set("#scene-intro", { autoAlpha: 1 });
      const intro = playIntro();
      return () => intro.kill();
    }
  );

  buildReel();
  resizeFx();
  window.addEventListener("resize", () => {
    resizeFx();
    if (phase === "wish" || phase === "celebrating") {
      gsap.set(".cake", { scale: cakeRestScale(), transformOrigin: "50% 100%" });
    }
  });
  say("Happy birthday, Cosmos Rume Ighoraye.");
  requestAnimationFrame(frame);
})();
