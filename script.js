/* Effect switches. */
const ENABLE_TITLE_WAVE = true;
const ENABLE_BUBBLE_CURSOR = true;
const ENABLE_RIPPLES = true;
const ENABLE_CAUSTICS = true;
const ENABLE_PARALLAX = true;
const ENABLE_RISING_BUBBLES = true;
const ENABLE_FALLING_CHARACTER = true;
const LITE_MODE_AUTO = true;

const OCEAN_LINKS = {
  platforms: { spotify: "", appleMusic: "", youtubeMusic: "", amazonMusic: "" },
  socials: { instagram: "", youtube: "" }
};

(function () {
  "use strict";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const page = document.querySelector(".ocean-page");
  const title = document.querySelector("h1");
  const cover = document.querySelector(".cover-art");
  const coverWrap = document.querySelector(".cover-wrap");
  const character = document.querySelector("[data-character]");
  const cursor = document.querySelector(".cursor-bubble");
  const canvas = document.querySelector(".bubble-canvas");
  const state = {
    hidden: document.hidden, lite: false, last: performance.now(), introStart: performance.now(),
    pointer: { x: -100, y: -100, tx: -100, ty: -100, speed: 0, lastX: -100, lastY: -100 },
    target: false, coverRect: null, character: { x: 0, start: 0, duration: 21000, seed: 0, active: false },
    bubbles: [], dpr: 1, resizeQueued: false, qualityFrames: []
  };
  const trailPool = [];
  const ripplePool = [];
  const ctx = canvas ? canvas.getContext("2d") : null;

  function configureLinks(selector, destinations) {
    document.querySelectorAll(selector).forEach((link) => {
      const destination = destinations[link.dataset.platform || link.dataset.social];
      if (typeof destination === "string" && /^https?:\/\/\S+$/i.test(destination.trim())) {
        link.href = destination.trim();
        link.removeAttribute("aria-disabled");
      } else {
        link.href = "#";
        link.setAttribute("aria-disabled", "true");
        link.addEventListener("click", (event) => event.preventDefault());
      }
    });
  }

  function fitText() {
    if (!title) return;
    const width = title.parentElement.getBoundingClientRect().width;
    if (!width) return;
    const size = parseFloat(getComputedStyle(title).fontSize);
    const probe = document.createElement("span");
    const styles = getComputedStyle(title);
    probe.textContent = "OCEAN";
    probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-family:${styles.fontFamily};font-size:${size}px;font-weight:${styles.fontWeight};font-variation-settings:${styles.fontVariationSettings};letter-spacing:${styles.letterSpacing};line-height:1`;
    document.body.appendChild(probe);
    const renderedWidth = probe.getBoundingClientRect().width;
    probe.remove();
    if (renderedWidth > 0 && size > 0) title.style.fontSize = `${Math.max(1, size * width / renderedWidth)}px`;
  }

  function sizeScribbles() {
    document.querySelectorAll(".stream-link").forEach((link) => {
      const label = link.querySelector(".stream-name");
      const scribble = link.querySelector(".scribble");
      if (label && scribble) scribble.style.width = `${label.getBoundingClientRect().width}px`;
    });
  }

  function queueFit() {
    if (state.resizeQueued) return;
    state.resizeQueued = true;
    requestAnimationFrame(() => { state.resizeQueued = false; fitText(); sizeScribbles(); });
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * state.dpr);
    canvas.height = Math.round(canvas.clientHeight * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    state.bubbles = [];
    const count = window.innerWidth < 900 ? 8 : 14;
    for (let i = 0; i < count; i += 1) state.bubbles.push({
      x: Math.random() * canvas.clientWidth, y: Math.random() * canvas.clientHeight,
      size: 2 + Math.random() * 9, speed: 8 + Math.random() * 18, drift: 8 + Math.random() * 18,
      phase: Math.random() * Math.PI * 2, alpha: .16 + Math.random() * .25
    });
  }

  function drawBubbles(dt, now) {
    if (!ctx || !ENABLE_RISING_BUBBLES || reducedMotion || state.hidden || state.lite && state.bubbles.length > 8) return;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    state.bubbles.forEach((bubble) => {
      bubble.y -= bubble.speed * dt;
      if (bubble.y < -bubble.size * 2) { bubble.y = height + bubble.size; bubble.x = Math.random() * width; }
      const x = bubble.x + Math.sin(now * .00035 + bubble.phase) * bubble.drift;
      const fade = Math.min(1, (height - bubble.y) / 80, (bubble.y + 30) / 80);
      ctx.globalAlpha = bubble.alpha * Math.max(0, fade);
      ctx.beginPath();
      ctx.arc(x, bubble.y, bubble.size, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(207,238,219,.8)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }

  function resetCharacter(now) {
    const desktop = window.innerWidth >= 900;
    state.character.x = (Math.random() < .5 ? 8 + Math.random() * 17 : (desktop ? 75 : 65) + Math.random() * 17);
    state.character.start = now; state.character.duration = 18000 + Math.random() * 6000;
    state.character.seed = Math.random() * Math.PI * 2; state.character.active = true;
  }

  function updateCharacter(now) {
    if (!character || !ENABLE_FALLING_CHARACTER || reducedMotion || state.hidden || !state.character.active) return;
    const progress = (now - state.character.start) / state.character.duration;
    if (progress >= 1) { resetCharacter(now); return; }
    const sway = Math.sin(progress * Math.PI * 2 + state.character.seed) * (window.innerWidth >= 900 ? 46 : 28);
    const rotation = Math.sin(progress * Math.PI * 4 + state.character.seed) * 10;
    const fade = Math.min(1, progress / .1, (1 - progress) / .1);
    character.style.transform = `translate3d(${sway}px,${-18 + progress * 136}vh,0) rotate(${rotation}deg)`;
    character.style.left = `${state.character.x}%`;
    character.style.opacity = String(.75 * Math.max(0, fade));
  }

  function updateCursor(dt) {
    if (!cursor || !finePointer || !ENABLE_BUBBLE_CURSOR || reducedMotion) return;
    const factor = 1 - Math.exp(-dt * 12);
    state.pointer.x += (state.pointer.tx - state.pointer.x) * factor;
    state.pointer.y += (state.pointer.ty - state.pointer.y) * factor;
    cursor.style.transform = `translate3d(${state.pointer.x}px,${state.pointer.y}px,0)`;
    cursor.classList.toggle("is-over-target", state.target);
  }

  function updateTilt(dt) {
    if (!cover || !finePointer || reducedMotion || !state.coverRect) return;
    const x = (state.pointer.tx - state.coverRect.left) / state.coverRect.width - .5;
    const y = (state.pointer.ty - state.coverRect.top) / state.coverRect.height - .5;
    const inside = x > -.5 && x < .5 && y > -.5 && y < .5;
    const target = inside ? `rotateX(${y * -5}deg) rotateY(${x * 5}deg)` : "rotateX(0) rotateY(0)";
    cover.style.transform = target;
  }

  function updateParallax() {
    if (!ENABLE_PARALLAX || !finePointer || reducedMotion) return;
    const x = (state.pointer.x / Math.max(1, window.innerWidth) - .5) * 8;
    document.querySelector(".light-rays").style.transform = `translate3d(${x}px,0,0) rotate(-13deg)`;
  }

  function animate(now) {
    const dt = Math.min(.05, Math.max(.001, (now - state.last) / 1000));
    state.last = now;
    if (!state.hidden) {
      updateCursor(dt); updateTilt(dt); updateParallax(); drawBubbles(dt, now); updateCharacter(now);
      if (LITE_MODE_AUTO && now - state.introStart < 2000) {
        state.qualityFrames.push(dt);
        if (state.qualityFrames.length > 20) state.qualityFrames.shift();
        const average = state.qualityFrames.reduce((sum, value) => sum + value, 0) / state.qualityFrames.length;
        if (average > .02 || navigator.hardwareConcurrency <= 4 || navigator.deviceMemory && navigator.deviceMemory <= 4) {
          state.lite = true; state.bubbles = state.bubbles.slice(0, 8); page.classList.add("lite-mode");
        }
      }
    }
    requestAnimationFrame(animate);
  }

  function pooledElement(pool, className) {
    let element = pool.find((item) => !item.parentNode);
    if (!element) { element = document.createElement("i"); element.className = className; pool.push(element); }
    return element;
  }

  function spawnRipple(x, y) {
    if (!ENABLE_RIPPLES) return;
    const layer = document.querySelector(".ripple-layer");
    for (let i = 0; i < 3; i += 1) {
      const ring = pooledElement(ripplePool, "ripple");
      ring.style.left = `${x}px`; ring.style.top = `${y}px`; ring.style.animationDelay = `${i * .08}s`;
      layer.appendChild(ring);
      ring.addEventListener("animationend", () => ring.remove(), { once: true });
    }
  }

  function spawnLinkBubbles(link) {
    const holder = link.querySelector(".link-bubbles");
    if (!holder) return;
    holder.replaceChildren();
    for (let i = 0; i < 4; i += 1) {
      const bubble = document.createElement("i");
      bubble.style.left = `${Math.random() * 22}px`; bubble.style.bottom = `${Math.random() * 8}px`;
      holder.appendChild(bubble);
    }
  }

  function setupInteractions() {
    if (finePointer && ENABLE_BUBBLE_CURSOR && !reducedMotion) {
      document.body.classList.add("has-bubble-cursor");
      page.addEventListener("pointermove", (event) => {
        const dx = event.clientX - state.pointer.lastX, dy = event.clientY - state.pointer.lastY;
        state.pointer.speed = Math.hypot(dx, dy); state.pointer.lastX = event.clientX; state.pointer.lastY = event.clientY;
        state.pointer.tx = event.clientX; state.pointer.ty = event.clientY;
        if (state.pointer.speed > 24 && trailPool.length < 8) {
          const particle = pooledElement(trailPool, "cursor-trail");
          particle.style.left = `${event.clientX}px`; particle.style.top = `${event.clientY}px`;
          particle.style.opacity = "1"; particle.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(.2)" }], { duration: 550, easing: "ease-out" }).finished.then(() => { particle.style.opacity = "0"; particle.remove(); });
        }
      });
      document.querySelectorAll("a, .cover-art, .brand").forEach((target) => {
        target.addEventListener("pointerenter", () => { state.target = true; });
        target.addEventListener("pointerleave", () => { state.target = false; });
      });
      page.addEventListener("pointerdown", () => cursor.classList.add("is-pressed"));
      page.addEventListener("pointerup", () => cursor.classList.remove("is-pressed"));
    }
    document.querySelectorAll(".stream-link").forEach((link) => {
      link.addEventListener("pointerenter", () => spawnLinkBubbles(link));
      link.addEventListener("focus", () => spawnLinkBubbles(link));
      link.addEventListener("pointerdown", (event) => {
        if (link.getAttribute("aria-disabled") !== "true") {
          event.preventDefault(); window.setTimeout(() => { window.location.href = link.href; }, 180);
        }
      });
    });
    page.addEventListener("pointerdown", (event) => spawnRipple(event.clientX, event.clientY));
  }

  function setupIntro() {
    if (reducedMotion) { page.classList.add("intro-ready"); return; }
    page.classList.add("intro-ready");
    window.setTimeout(() => {
      page.querySelectorAll(".brand, .release-label, h1, .cover-wrap, .stream-link").forEach((element) => { element.style.opacity = "1"; });
      page.classList.remove("intro-ready", "intro-complete"); resetCharacter(performance.now());
      document.querySelectorAll(".platform-logo, .cover-art, .falling-character, .cursor-bubble").forEach((element) => { element.style.willChange = "auto"; });
    }, 2400);
  }

  configureLinks("[data-platform]", OCEAN_LINKS.platforms);
  configureLinks("[data-social]", OCEAN_LINKS.socials);
  if (!ENABLE_TITLE_WAVE) page.classList.add("lite-mode");
  if (!ENABLE_CAUSTICS) document.querySelector(".cover-caustic").hidden = true;
  resizeCanvas();
  setupInteractions();
  setupIntro();
  window.addEventListener("resize", () => { resizeCanvas(); state.coverRect = coverWrap && coverWrap.getBoundingClientRect(); queueFit(); });
  window.addEventListener("orientationchange", queueFit);
  document.addEventListener("visibilitychange", () => { state.hidden = document.hidden; page.classList.toggle("is-hidden", state.hidden); });
  document.fonts.ready.then(() => { fitText(); title.classList.add("fonts-ready"); }).catch(() => { title.classList.add("fonts-ready"); });
  window.setTimeout(() => { title.classList.add("fonts-ready"); fitText(); sizeScribbles(); }, 800);
  state.coverRect = coverWrap && coverWrap.getBoundingClientRect();
  requestAnimationFrame(animate);
})();
