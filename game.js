(() => {
  const WORDS = ["light", "gold", "warm", "shine", "glow"];
  const canvas = document.getElementById("playfield");
  const ctx = canvas.getContext("2d");
  const title = document.getElementById("lightTitle");
  const over = document.getElementById("lightOver");
  const hud = document.getElementById("lightHud");
  const hudScore = document.getElementById("hudScore");
  const hudLives = document.getElementById("hudLives");

  const keys = new Set();
  const pointer = { x: 0, y: 0, inside: false };
  const stars = Array.from({ length: 70 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.3 + 0.3,
    a: Math.random() * 0.45 + 0.15
  }));

  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = 0;
  let last = 0;
  let mode = "off";
  let player = null;
  let orbs = [];
  let particles = [];
  let popups = [];
  let trail = [];
  let score = 0;
  let lives = 3;
  let combo = 0;
  let comboLeft = 0;
  let elapsed = 0;
  let spawnIn = 0;
  let shake = 0;
  let invuln = 0;

  function resize() {
    const viewport = window.visualViewport;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = canvas.clientWidth || (viewport ? viewport.width : window.innerWidth);
    h = canvas.clientHeight || (viewport ? viewport.height : window.innerHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!pointer.inside) {
      pointer.x = w * 0.5;
      pointer.y = h * 0.68;
    }
  }

  function updateHud() {
    hudScore.textContent = String(score);
    hudLives.querySelectorAll("em").forEach((pip, index) => {
      pip.classList.toggle("off", index >= lives);
    });
    hudLives.setAttribute("aria-label", `${lives} lives`);
    hud.hidden = mode !== "play" && mode !== "over";
  }

  function reset() {
    score = 0;
    lives = 3;
    combo = 0;
    comboLeft = 0;
    elapsed = 0;
    spawnIn = 0.8;
    shake = 0;
    invuln = 1.2;
    orbs = [];
    particles = [];
    popups = [];
    trail = [];
    player = { x: pointer.x || w * 0.5, y: pointer.y || h * 0.68, r: 16 };
    updateHud();
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 180;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.4,
        age: 0,
        r: 1.2 + Math.random() * 2.2,
        color
      });
    }
  }

  function popup(x, y, text) {
    popups.push({ x, y, text, age: 0, life: 0.7 });
  }

  function spawnOrb() {
    if (orbs.length > 14) return;
    const diff = 1 + elapsed / 48;
    const roll = Math.random();
    const kind = elapsed < 4 ? (roll < 0.82 ? "light" : "shade") : (roll < 0.62 ? "light" : "shade");
    orbs.push({
      kind,
      x: 24 + Math.random() * Math.max(40, w - 48),
      y: -28,
      r: kind === "shade" ? 14 : 18,
      vy: (kind === "shade" ? 145 : 92) * diff * (0.85 + Math.random() * 0.3),
      seed: Math.random() * 10,
      wob: 40 + Math.random() * 70,
      word: WORDS[(Math.random() * WORDS.length) | 0],
      dead: false
    });
  }

  function collect(orb) {
    combo += 1;
    comboLeft = 1.8;
    score += 10 + (combo - 1) * 2;
    popup(orb.x, orb.y - 8, combo > 1 ? `+${10 + (combo - 1) * 2}` : orb.word);
    burst(orb.x, orb.y, "#ffe7a8", 14);
    if (window.CosmosSound) window.CosmosSound.blip(Math.min(combo, 10));
    orb.dead = true;
    updateHud();
  }

  function hurt(orb) {
    if (invuln > 0) return;
    lives -= 1;
    invuln = 1.15;
    combo = 0;
    shake = 12;
    burst(orb.x, orb.y, "#ff5d6c", 16);
    if (window.CosmosSound) window.CosmosSound.note(140, 0, 0.16, 0.04);
    orb.dead = true;
    updateHud();
    if (lives <= 0) endRun();
  }

  function endRun() {
    mode = "over";
    document.getElementById("overScore").textContent = String(score);
    over.hidden = false;
    updateHud();
  }

  function startRun() {
    resize();
    reset();
    mode = "play";
    title.hidden = true;
    over.hidden = true;
    updateHud();
  }

  function update(dt) {
    if (!player) return;
    if (keys.has("ArrowLeft") || keys.has("KeyA")) pointer.x -= 480 * dt;
    if (keys.has("ArrowRight") || keys.has("KeyD")) pointer.x += 480 * dt;
    if (keys.has("ArrowUp") || keys.has("KeyW")) pointer.y -= 480 * dt;
    if (keys.has("ArrowDown") || keys.has("KeyS")) pointer.y += 480 * dt;
    pointer.x = Math.max(18, Math.min(w - 18, pointer.x));
    pointer.y = Math.max(18, Math.min(h - 18, pointer.y));
    player.x += (pointer.x - player.x) * Math.min(1, dt * 12);
    player.y += (pointer.y - player.y) * Math.min(1, dt * 12);
    trail.push({ x: player.x, y: player.y });
    if (trail.length > 12) trail.shift();
    if (mode !== "play") return;

    elapsed += dt;
    if (invuln > 0) invuln -= dt;
    if (comboLeft > 0) {
      comboLeft -= dt;
      if (comboLeft <= 0) combo = 0;
    }
    shake *= 0.86;
    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawnOrb();
      spawnIn = Math.max(0.32, 0.86 - elapsed * 0.01);
    }

    orbs.forEach((orb) => {
      orb.y += orb.vy * dt;
      orb.x += Math.sin(elapsed * 2 + orb.seed) * orb.wob * dt;
      if (orb.kind === "light") {
        const dx = player.x - orb.x;
        const dy = player.y - orb.y;
        const dist = dx * dx + dy * dy;
        if (dist < 110 * 110 && dist > 4) {
          orb.x += dx * dt * 2.2;
          orb.y += dy * dt * 2.2;
        }
      } else if (elapsed > 10) {
        orb.x += (player.x - orb.x) * 0.28 * dt;
      }
      if (orb.y > h + 40) orb.dead = true;
      const reach = player.r + orb.r * (orb.kind === "shade" ? 0.68 : 0.8);
      const dx = orb.x - player.x;
      const dy = orb.y - player.y;
      if (dx * dx + dy * dy < reach * reach) {
        if (orb.kind === "shade") {
          if (invuln > 0) {
            orb.x += Math.sign(dx || 1) * 26;
            orb.y -= 18;
          } else {
            hurt(orb);
          }
        } else {
          collect(orb);
        }
      }
    });
    orbs = orbs.filter((orb) => !orb.dead);
    particles.forEach((bit) => {
      bit.age += dt;
      bit.x += bit.vx * dt;
      bit.y += bit.vy * dt;
    });
    particles = particles.filter((bit) => bit.age < bit.life);
    popups.forEach((pop) => {
      pop.age += dt;
      pop.y -= 24 * dt;
    });
    popups = popups.filter((pop) => pop.age < pop.life);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const ox = shake ? (Math.random() - 0.5) * shake : 0;
    const oy = shake ? (Math.random() - 0.5) * shake : 0;
    ctx.save();
    ctx.translate(ox, oy);
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#120e1c");
    sky.addColorStop(1, "#1a120c");
    ctx.fillStyle = sky;
    ctx.fillRect(-20, -20, w + 40, h + 40);
    stars.forEach((star) => {
      ctx.fillStyle = `rgba(255, 244, 220, ${star.a})`;
      ctx.beginPath();
      ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    orbs.forEach((orb) => {
      if (orb.kind === "shade") {
        ctx.fillStyle = "#16101a";
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ff5a6a";
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }
      const glow = ctx.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, orb.r + 16);
      glow.addColorStop(0, "#fff");
      glow.addColorStop(0.45, "#ffd27a");
      glow.addColorStop(1, "rgba(255, 170, 60, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r + 16, 0, Math.PI * 2);
      ctx.fill();
    });
    particles.forEach((bit) => {
      const t = 1 - bit.age / bit.life;
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillStyle = bit.color;
      ctx.beginPath();
      ctx.arc(bit.x, bit.y, bit.r * t, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    if (player && !(invuln > 0 && Math.sin(performance.now() / 40) > 0)) {
      trail.forEach((point, index) => {
        const t = index / trail.length;
        ctx.fillStyle = `rgba(255, 190, 90, ${t * 0.35})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 7 * t, 0, Math.PI * 2);
        ctx.fill();
      });
      const glow = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, 36);
      glow.addColorStop(0, "#fff8e4");
      glow.addColorStop(0.35, "#ffb03a");
      glow.addColorStop(1, "rgba(255, 90, 20, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(player.x, player.y, 36, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = "600 15px Outfit, sans-serif";
    ctx.textAlign = "center";
    popups.forEach((pop) => {
      ctx.globalAlpha = 1 - pop.age / pop.life;
      ctx.fillStyle = "#fff6e4";
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.globalAlpha = 1;
    });
    ctx.restore();
  }

  function loop(now) {
    if (mode === "off") return;
    if (!last) last = now;
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function enter() {
    resize();
    title.hidden = false;
    over.hidden = true;
    mode = "title";
    player = { x: w * 0.5, y: h * 0.7, r: 16 };
    pointer.x = player.x;
    pointer.y = player.y;
    orbs = [];
    updateHud();
    hud.hidden = true;
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(loop);
    }
  }

  function leave() {
    mode = "off";
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  }

  function point(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.inside = true;
  }

  canvas.addEventListener("pointerdown", point);
  canvas.addEventListener("pointermove", point);
  window.addEventListener("keydown", (event) => keys.add(event.code));
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  document.getElementById("startLight").addEventListener("click", startRun);
  document.getElementById("replayLight").addEventListener("click", startRun);
  document.getElementById("goSlice").addEventListener("click", () => {
    window.location.href = "rume.html";
  });
  window.addEventListener("resize", () => {
    if (mode !== "off") resize();
  });

  window.CosmosLight = { enter, leave };
})();
