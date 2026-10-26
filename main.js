/* CARMINE — interacciones.
   Hilo narrativo: «Mira un minuto más». El visitante ve una obra en gris y la enciende (01), ve cómo
   una línea se vuelve dibujo y luego color (02), mira de cerca (03), separa la línea del color (03),
   escucha una obra y recorre la galería (04), termina su propia obra (05) y se lleva una postal (08).
   Lenguaje visual tomado de las obras: contornos negros orgánicos y líneas neón que lo atraviesan todo. */

(() => {
  const C = window.CARMINE, STR = window.CARMINE_STR;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // Los colores de las líneas que cruzan las obras de Carmine
  const NEON = ["#ffd23a", "#ff2fa8", "#2fe0f0", "#ff9a1f"];
  const PALETTE = ["#b3122e", "#ff2fa8", "#ff9a1f", "#ffd23a", "#2fe0f0", "#2b6fe0", "#7b2fbf", "#22b07d"];
  const WORKS = Object.fromEntries(C.works.map((w, i) => [w.id, { ...w, n: i + 1 }]));
  const ROLE = C.roles;

  const state = { lang: "es", seconds: 0, found: new Set(), lastFound: null, notes: 0, colors: new Set() };
  const langHooks = [];
  const t = (k) => (STR[state.lang] && STR[state.lang][k]) ?? STR.es[k] ?? k;
  const L = (o) => o[state.lang] || o.es;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const pad = (n) => String(n).padStart(2, "0");

  /* ---------- Formas orgánicas ---------- */
  // Catmull-Rom → Bézier: curvas suaves que pasan por todos los puntos
  function curve(pts, closed) {
    const n = pts.length, P = (i) => pts[closed ? (i + n) % n : clamp(i, 0, n - 1)];
    let d = "";
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }
  const openPath = (pts) => `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}${curve(pts, false)}`;
  const closedPath = (pts) => `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}${curve(pts, true)}Z`;
  // Una mancha que respira: el radio ondula con el tiempo
  function blob(cx, cy, r, time, seed = 0, n = 9) {
    if (r <= 0.5) return "M0 0Z";
    return closedPath(Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + 0.16 * Math.sin(time * 0.9 + i * 1.7 + seed) + 0.08 * Math.sin(time * 1.6 + i * 2.9 + seed * 2);
      return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k];
    }));
  }
  // Una línea que serpentea de izquierda a derecha
  function strand(w, y, amp, seed, steps = 9) {
    return openPath(Array.from({ length: steps + 1 }, (_, i) => {
      const x = (i / steps) * w;
      return [x, y + Math.sin(i * 0.9 + seed) * amp + Math.sin(i * 2.1 + seed * 1.7) * amp * 0.35];
    }));
  }

  /* ---------- Idioma ---------- */
  function applyLang() {
    document.documentElement.lang = state.lang;
    $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    $$("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
    $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    $$("[data-i18n-title]").forEach((el) => (el.title = t(el.dataset.i18nTitle)));
    $$(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
    langHooks.forEach((fn) => fn());
  }
  function initLang() {
    const saved = store.get("carmine.lang");
    state.lang = saved === "en" || saved === "es" ? saved : "es";
    $$(".lang button").forEach((b) => b.addEventListener("click", () => {
      state.lang = b.dataset.lang; store.set("carmine.lang", state.lang); applyLang();
    }));
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(title, sub) {
    const el = $(".toast");
    $("b", el).textContent = title; $("span", el).textContent = sub || "";
    el.classList.add("on");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("on"), 5200);
  }

  /* ---------- Estallido: líneas neón que salen disparadas en los momentos clave ---------- */
  const burst = (() => {
    const cv = $(".burst"), x = cv.getContext("2d");
    let items = [], raf = 0, dpr = 1;
    function frame(now) {
      raf = 0;
      x.clearRect(0, 0, cv.width, cv.height);
      items = items.filter((it) => {
        const k = (now - it.t0) / it.dur;
        if (k >= 1) return false;
        if (k < 0) return true;
        const head = ease(clamp(k / 0.5)), tail = k > 0.5 ? ease((k - 0.5) / 0.5) : 0;
        const a = Math.floor(tail * (it.pts.length - 1)), b = Math.ceil(head * (it.pts.length - 1));
        if (b - a < 1) return true;
        x.strokeStyle = it.color; x.lineWidth = it.w * dpr; x.lineCap = "round"; x.lineJoin = "round";
        x.beginPath(); x.moveTo(it.pts[a][0], it.pts[a][1]);
        for (let i = a + 1; i <= b; i++) x.lineTo(it.pts[i][0], it.pts[i][1]);
        x.stroke();
        return true;
      });
      if (items.length) raf = requestAnimationFrame(frame);
    }
    return function fire(px, py, n = 11) {
      if (reduce) return;
      dpr = Math.min(devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(innerWidth * dpr) || cv.height !== Math.round(innerHeight * dpr)) { cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); }
      const reach = Math.hypot(innerWidth, innerHeight) * 0.5, now = performance.now();
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + Math.random() * 0.5, len = reach * (0.45 + Math.random() * 0.6);
        const amp = 18 + Math.random() * 46, ph = Math.random() * 6, pts = [];
        for (let s = 0; s <= 48; s++) {
          const d = (len * s) / 48, wob = Math.sin(s * 0.32 + ph) * amp * (s / 48);
          pts.push([(px + Math.cos(ang) * d - Math.sin(ang) * wob) * dpr, (py + Math.sin(ang) * d + Math.cos(ang) * wob) * dpr]);
        }
        items.push({ pts, color: i % 5 === 4 ? "#111" : NEON[i % NEON.length], w: 2 + Math.random() * 4.5, t0: now + Math.random() * 160, dur: 1500 + Math.random() * 700 });
      }
      if (!raf) raf = requestAnimationFrame(frame);
    };
  })();
  const burstAt = (el) => { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); };

  /* ---------- Navegación ---------- */
  function initNav() {
    const nav = $("#nav"), burger = $(".burger"), menu = $("#menu");
    let lastY = scrollY;
    addEventListener("scroll", () => {
      const y = scrollY;
      nav.classList.toggle("is-solid", y > 40);
      const open = burger.getAttribute("aria-expanded") === "true";
      nav.classList.toggle("is-hidden", !open && y > innerHeight * 0.9 && y > lastY + 4);
      if (y < lastY - 4) nav.classList.remove("is-hidden");
      lastY = y;
    }, { passive: true });

    const setMenu = (open) => {
      burger.setAttribute("aria-expanded", String(open));
      document.documentElement.style.overflow = open ? "hidden" : "";
      if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add("is-open")); }
      else { menu.classList.remove("is-open"); setTimeout(() => { if (burger.getAttribute("aria-expanded") === "false") menu.hidden = true; }, 400); }
    };
    burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

    const map = { top: "#top", story: "#story", experience: "#art", art: "#art", sport: "#sport", collections: "#collections", connections: "#contact", contact: "#contact" };
    const links = $$(".nav__links a");
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (!e.isIntersecting) return;
      const href = map[e.target.id];
      links.forEach((a) => a.classList.toggle("is-on", a.getAttribute("href") === href));
    }), { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- El minuto ---------- */
  function initMinute() {
    const root = document.documentElement, label = $(".minute__t");
    setInterval(() => {
      if (document.visibilityState !== "visible") return;
      state.seconds++;
      root.style.setProperty("--minute", Math.min(1, state.seconds / 60).toFixed(3));
      label.textContent = fmt(state.seconds);
      if (state.seconds === 60) {
        toast(t("minute.toast"), t("minute.toast2"));
        document.body.classList.add("is-minute");
        burst(innerWidth / 2, innerHeight / 2, 16);
        hero && hero.bloomAll();
      }
      updateStats();
    }, 1000);
  }

  /* ---------- Obras ---------- */
  const canv = {};
  let lineURL = "";
  function loadImg(src) {
    return new Promise((res, rej) => { const i = new Image(); i.decoding = "async"; i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }
  async function canvasOf(id) {
    if (!canv[id]) canv[id] = loadImg(WORKS[id].src).then((img) => {
      const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext("2d", { willReadFrequently: true }).drawImage(img, 0, 0); return c;
    });
    return canv[id];
  }
  function toGray(src) {
    const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
    const x = c.getContext("2d"); x.drawImage(src, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      let l = (p[i] * 0.3 + p[i + 1] * 0.59 + p[i + 2] * 0.11) / 255;
      l = clamp((l - 0.5) * 1.2 + 0.46) * 255;
      p[i] = l + 3; p[i + 1] = l + 1; p[i + 2] = l - 2;
    }
    x.putImageData(d, 0, 0); return c;
  }
  // La línea debajo del color: se separan los contornos negros de la pintura y se ponen sobre papel
  function lineArt(src) {
    const c = document.createElement("canvas"); c.width = src.width; c.height = src.height;
    const x = c.getContext("2d"); x.drawImage(src, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i], g = p[i + 1], b = p[i + 2];
      const l = (r * 0.3 + g * 0.59 + b * 0.11) / 255, chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
      const ink = clamp((0.34 - l) / 0.2) * clamp((0.42 - chroma) / 0.26);
      const ghost = (1 - l) * 0.07;
      const k = clamp(ink + ghost);
      p[i] = 236 - (236 - 34) * k; p[i + 1] = 230 - (230 - 31) * k; p[i + 2] = 218 - (218 - 28) * k;
    }
    x.putImageData(d, 0, 0); return c;
  }
  function fillArt(root) {
    $$("img[data-work]", root).forEach((img) => {
      const w = WORKS[img.dataset.work]; if (!w) return;
      if (img.dataset.variant === "line") { if (lineURL && img.src !== lineURL) img.src = lineURL; return; }
      if (!img.getAttribute("src")) { if (!img.closest(".hero, .story")) img.loading = "lazy"; img.src = w.src; }
    });
  }
  const caption = (w) => {
    const title = L(w.title);
    return `${title || "Nº " + pad(w.n)} · ${w.kind === "pencil" ? t("gal.pencil") : t("gal.color")} · ${w.year}`;
  };

  /* ---------- 01 Hero: el color se derrama cuando te detienes ---------- */
  let hero = null;
  function initHero(colorSrc) {
    const grayCv = toGray(colorSrc);
    const sec = $(".hero"), cv = $(".hero__canvas"), ctx = cv.getContext("2d");
    const col = document.createElement("canvas"), cctx = col.getContext("2d");
    const mask = document.createElement("canvas"), mctx = mask.getContext("2d");
    const live = document.createElement("canvas"), lctx = live.getContext("2d");
    let dpr = 1, cw = 0, ch = 0, L0 = null, raf = 0, press = null, hover = null, full = -1;
    let walkers = [], trail = [];

    function size() {
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      const nd = Math.min(devicePixelRatio || 1, 1.5), nw = Math.round(w * nd), nh = Math.round(h * nd);
      if (nw === cv.width && nh === cv.height && L0) return;
      let old = null;
      if (mask.width) { old = document.createElement("canvas"); old.width = mask.width; old.height = mask.height; old.getContext("2d").drawImage(mask, 0, 0); }
      dpr = nd; cw = nw; ch = nh;
      [cv, col, mask, live].forEach((c) => { c.width = cw; c.height = ch; });
      if (old) mctx.drawImage(old, 0, 0, cw, ch);
      const sw = colorSrc.width, sh = colorSrc.height;
      if (cw / ch > 1.05) {
        // Pantalla horizontal: la obra entera a la derecha, a toda altura, y el título a la izquierda
        const dh = ch, dw = dh * (sw / sh);
        L0 = { sx: 0, sy: 0, sw, sh, dw, dh, dy: 0, dx: Math.max(cw * 0.36, cw - dw - cw * 0.06) };
      } else {
        const s = Math.max(cw / sw, ch / sh), vw = cw / s, vh = ch / s;
        L0 = { sx: (sw - vw) / 2, sy: clamp(sh * 0.52 - vh / 2, 0, sh - vh), sw: vw, sh: vh, dx: 0, dy: 0, dw: cw, dh: ch };
      }
      draw();
    }
    const imgToCanvas = (u, v) => [L0.dx + ((u * colorSrc.width - L0.sx) / L0.sw) * L0.dw, L0.dy + ((v * colorSrc.height - L0.sy) / L0.sh) * L0.dh];
    // Manchas irregulares: varias gotas superpuestas en vez de un círculo perfecto
    function stamp(x, y, r, a, drops = 5) {
      for (let k = 0; k < drops; k++) {
        const ang = Math.random() * 6.283, d = r * 0.4 * Math.random(), rr = r * (0.45 + Math.random() * 0.55);
        const px = x + Math.cos(ang) * d, py = y + Math.sin(ang) * d;
        const g = mctx.createRadialGradient(px, py, 0, px, py, rr);
        g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.7, `rgba(0,0,0,${a * 0.7})`); g.addColorStop(1, "rgba(0,0,0,0)");
        mctx.fillStyle = g; mctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
      }
    }
    function draw(now = performance.now()) {
      if (!L0) return;
      const { sx, sy, sw, sh, dx, dy, dw, dh } = L0;
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, cw, ch);
      ctx.drawImage(grayCv, sx, sy, sw, sh, dx, dy, dw, dh);
      lctx.clearRect(0, 0, cw, ch); lctx.drawImage(mask, 0, 0);
      if (hover) {
        const r = 120 * dpr, g = lctx.createRadialGradient(hover.x, hover.y, 0, hover.x, hover.y, r);
        g.addColorStop(0, "rgba(0,0,0,.85)"); g.addColorStop(1, "rgba(0,0,0,0)");
        lctx.fillStyle = g; lctx.fillRect(hover.x - r, hover.y - r, r * 2, r * 2);
      }
      cctx.globalCompositeOperation = "source-over"; cctx.clearRect(0, 0, cw, ch);
      cctx.drawImage(colorSrc, sx, sy, sw, sh, dx, dy, dw, dh);
      cctx.globalCompositeOperation = "destination-in"; cctx.drawImage(live, 0, 0);
      ctx.drawImage(col, 0, 0);
      if (dx > 0) {
        const g = ctx.createLinearGradient(dx, 0, dx + dw * 0.3, 0);
        g.addColorStop(0, "rgba(0,0,0,1)"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(dx - 1, 0, dw * 0.3 + 1, ch);
      }
      // Estela neón detrás del cursor (solo con mouse)
      trail = trail.filter((p) => now - p.t < 650);
      if (trail.length > 2) {
        ctx.lineCap = ctx.lineJoin = "round";
        [[7, 0.25], [2.4, 1]].forEach(([w, a]) => {
          ctx.beginPath(); ctx.moveTo(trail[0].x, trail[0].y);
          for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
          ctx.strokeStyle = NEON[0]; ctx.globalAlpha = a; ctx.lineWidth = w * dpr; ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }
    }
    function loop(now) {
      raf = 0;
      let again = false;
      if (press) {
        const held = (now - press.t0) / 1000;
        stamp(press.x, press.y, Math.min((40 + held * 170) * dpr, Math.max(cw, ch)), 0.06);
        // El color se escurre en venas, como las líneas que atraviesan sus obras
        if (Math.random() < 0.35 && walkers.length < 22) walkers.push({ x: press.x, y: press.y, a: Math.random() * 6.283, v: (2.4 + Math.random() * 3.4) * dpr, life: 50 + Math.random() * 90 });
        again = true;
      }
      walkers.forEach((w) => {
        w.a += (Math.random() - 0.5) * 0.55; w.x += Math.cos(w.a) * w.v; w.y += Math.sin(w.a) * w.v; w.life--;
        stamp(w.x, w.y, (10 + Math.random() * 10) * dpr, 0.3, 2);
      });
      walkers = walkers.filter((w) => w.life > 0);
      if (walkers.length || trail.length) again = true;
      if (full >= 0) {
        const k = clamp((now - full) / 2600);
        mctx.fillStyle = `rgba(0,0,0,${0.04 + k * 0.1})`; mctx.fillRect(0, 0, cw, ch);
        if (k < 1) again = true; else full = -1;
      }
      draw(now);
      if (again) raf = requestAnimationFrame(loop);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr }; };

    cv.addEventListener("pointerdown", (e) => { press = { ...pt(e), t0: performance.now() }; sec.classList.add("is-touched"); kick(); });
    cv.addEventListener("pointermove", (e) => {
      if (press) Object.assign(press, pt(e));
      if (e.pointerType === "mouse") { hover = pt(e); trail.push({ ...hover, t: performance.now() }); kick(); }
    });
    ["pointerup", "pointercancel"].forEach((ev) => cv.addEventListener(ev, () => (press = null)));
    cv.addEventListener("pointerleave", () => { press = null; hover = null; kick(); });
    cv.addEventListener("contextmenu", (e) => e.preventDefault());

    let rw = innerWidth;
    addEventListener("resize", () => { if (innerWidth !== rw || !fine) { rw = innerWidth; size(); } }, { passive: true });
    size();

    // Primer encuadre: la obra en gris con el centro ya encendido, como una pupila
    const [fx, fy] = imgToCanvas(0.48, 0.5);
    const fr = Math.min(cw, ch) * 0.16;
    if (reduce) { for (let i = 0; i < 10; i++) stamp(fx, fy, fr, 0.2); draw(); }
    else {
      let i = 0;
      const intro = () => { stamp(fx, fy, fr * (0.35 + i * 0.03), 0.07); draw(); if (++i < 26) requestAnimationFrame(intro); };
      setTimeout(intro, 450);
    }
    return {
      bloomAll() {
        full = performance.now();
        for (let i = 0; i < 18; i++) walkers.push({ x: Math.random() * cw, y: Math.random() * ch, a: Math.random() * 6.283, v: 4 * dpr, life: 80 });
        kick();
      }
    };
  }

  /* ---------- 02 Historia: una línea → un dibujo → una ciudad en gris → una explosión de color ---------- */
  function initStory() {
    const sec = $("#story"), svg = $(".story__svg"), texts = $$(".story__text li"), bar = $(".story__bar");
    const NS = "http://www.w3.org/2000/svg";
    $(".st--pencil", svg).setAttribute("href", WORKS[ROLE.storyPencil].src);
    $(".st--city", svg).setAttribute("href", WORKS[ROLE.storyColor].src);
    $(".st--color", svg).setAttribute("href", WORKS[ROLE.storyColor].src);
    const clips = ["#clipPencil path", "#clipCity path", "#clipColor path"].map((s) => $(s));
    const centers = [[384, 520, 2], [384, 510, 5], [384, 490, 9]], MAXR = [480, 470, 330];
    const pencilImg = $(".st--pencil", svg);
    const mk = (parent, cls, d, w) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("class", cls); if (d) p.setAttribute("d", d); if (w) p.setAttribute("stroke-width", w);
      parent.appendChild(p); return p;
    };

    // 1 · Un trazo de niño que serpentea y termina enrollándose como un sol
    let seed = 11; const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pts = [];
    for (let i = 0; i <= 14; i++) pts.push([60 + i * 22 + (R() - 0.5) * 30, 900 - i * 26 + Math.sin(i * 0.9) * 60]);
    const cx = 400, cy = 470;
    for (let a = 0; a < Math.PI * 2 * 3.2; a += 0.32) {
      const r = 230 * (1 - a / (Math.PI * 2 * 3.4)) * (1 + (R() - 0.5) * 0.08);
      pts.push([cx + Math.cos(a + 2.4) * r, cy + Math.sin(a + 2.4) * r]);
    }
    const lineG = $(".st-line", svg);
    const graphite = mk(lineG, "st-graphite", openPath(pts), 7);
    const neon = mk(lineG, "st-neon", openPath(pts.map(([x, y], i) => [x + Math.sin(i) * 9, y + Math.cos(i * 1.3) * 9])), 3);
    // Contornos vivos de cada mancha: negro y neón, como en sus obras
    const edges = centers.map((_, i) => [mk(lineG, "st-edge", "", i === 0 ? 2 : 5), mk(lineG, "st-edge st-edge--neon", "", 2.5)]);
    edges.forEach(([, n], i) => n.style.stroke = NEON[(i + 1) % 4]);
    const strandsG = $(".st-strands", svg);
    const strands = [0, 1, 2, 3].map((i) => {
      const p = mk(strandsG, "st-strand", strand(768, 180 + i * 210, 60 + i * 12, i * 2.3), 4 - i * 0.5);
      p.style.stroke = NEON[i]; p.setAttribute("pathLength", 1); return p;
    });
    [graphite, neon].forEach((p) => { const len = p.getTotalLength(); p.style.strokeDasharray = len; p.dataset.len = len; });

    let P = 0, visible = false, raf = 0, last = -1;
    function render(now) {
      raf = 0;
      const time = now / 1000, seg = P * 4, idx = Math.min(3, Math.floor(seg)), local = seg - idx;
      if (idx !== last) { texts.forEach((li, i) => li.classList.toggle("on", i === idx)); last = idx; }
      bar.style.setProperty("--p", P.toFixed(4));
      const lineK = idx === 0 ? ease(clamp(local / 0.8)) : 1;
      graphite.style.strokeDashoffset = graphite.dataset.len * (1 - lineK);
      neon.style.strokeDashoffset = neon.dataset.len * (1 - clamp(lineK * 1.15 - 0.15));
      lineG.style.setProperty("--line-op", idx === 0 ? 1 : idx === 1 ? 1 - clamp(local / 0.35) : 0);
      // Cada capítulo abre su imagen con una mancha que crece y respira. Las manchas nunca llegan
      // a ser un rectángulo: al final, el color queda dentro del gris y el gris dentro del papel.
      const radius = (i) => (idx < i + 1 ? 0 : idx > i + 1 ? MAXR[i] : ease(clamp(local / 0.75)) * MAXR[i]);
      centers.forEach(([x, y, s], i) => {
        const r = radius(i), d = blob(x, y, r, time, s);
        clips[i].setAttribute("d", d);
        const [e1, e2] = edges[i];
        e1.setAttribute("d", d); e2.setAttribute("d", blob(x, y, r * 1.05, time * 1.2, s + 1.3));
        e1.style.opacity = e2.style.opacity = r > 1 ? 1 : 0;
      });
      pencilImg.style.opacity = edges[0][0].style.opacity = edges[0][1].style.opacity = idx < 2 ? 1 : idx === 2 ? 1 - clamp(local / 0.5) : 0;
      const sk = idx === 3 ? ease(clamp((local - 0.15) / 0.6)) : 0;
      strands.forEach((p, i) => (p.style.strokeDashoffset = 1 - clamp(sk * 1.3 - i * 0.1)));
      if (visible && !reduce) raf = requestAnimationFrame(render);
    }
    function onScroll() {
      const r = sec.getBoundingClientRect();
      P = clamp(-r.top / (sec.offsetHeight - innerHeight));
      if (!raf) raf = requestAnimationFrame(render);
    }
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) onScroll(); }).observe(sec);
    addEventListener("scroll", () => { if (visible) onScroll(); }, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 03 Lupa: cinco detalles en la obra ---------- */
  function initLoupe() {
    const box = $(".loupe-art"), loupe = $(".loupe"), lens = $(".loupe__lens"), pings = $(".loupe__pings");
    const nEl = $(".finds__n"), dots = $$(".finds__dots li"), card = $(".finds__card"), title = $(".finds__title"), text = $(".finds__text");
    const IDS = Object.keys(C.details), Z = 3;
    text.removeAttribute("data-i18n");
    let pos = { x: 0.2, y: 0.22 }, goal = null, drag = null, raf = 0, current = null;
    lens.style.backgroundImage = `url(${WORKS[ROLE.loupe].src})`;

    function place() {
      const r = box.getBoundingClientRect(), s = loupe.offsetWidth;
      const px = pos.x * r.width, py = pos.y * r.height;
      lens.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
      loupe.style.transform = `translate(${px}px, ${py}px)`;
      lens.style.backgroundPosition = `${-(px * Z - s / 2)}px ${-(py * Z - s / 2)}px`;
      const reach = (s / 2 / Z) * 0.8;
      let hit = null;
      IDS.forEach((id) => {
        const d = C.details[id];
        if (Math.hypot(d.x * r.width - px, d.y * r.height - py) < reach) hit = id;
      });
      loupe.classList.toggle("is-hit", !!hit);
      if (hit && hit !== current) { current = hit; found(hit); }
      if (!hit) current = null;
    }
    function found(id) {
      const isNew = !state.found.has(id), d = C.details[id];
      state.found.add(id); state.lastFound = { id, x: d.x, y: d.y };
      show(id);
      if (!isNew) return;
      const i = document.createElement("i");
      i.style.left = `${d.x * 100}%`; i.style.top = `${d.y * 100}%`;
      pings.appendChild(i);
      nEl.textContent = state.found.size;
      dots.forEach((li, k) => li.classList.toggle("on", k < state.found.size));
      if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(12);
      updateStats();
      if (state.found.size === IDS.length) setTimeout(() => { toast(t("exp.done")); burstAt(box); }, 700);
    }
    function show(id) {
      const [a, b] = L(C.details[id]);
      title.textContent = a; text.textContent = b;
      card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
    }
    langHooks.push(() => {
      if (state.lastFound) show(state.lastFound.id); else { title.textContent = ""; text.textContent = t("exp.empty"); }
    });
    const rel = (e) => { const r = box.getBoundingClientRect(); return { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) }; };
    const glide = () => {
      raf = 0; if (!goal) return;
      pos.x += (goal.x - pos.x) * 0.16; pos.y += (goal.y - pos.y) * 0.16;
      if (Math.hypot(goal.x - pos.x, goal.y - pos.y) < 0.002) { pos = { ...goal }; goal = null; }
      place(); if (goal) raf = requestAnimationFrame(glide);
    };
    loupe.addEventListener("pointerdown", (e) => {
      e.preventDefault(); loupe.setPointerCapture(e.pointerId);
      const p = rel(e); drag = { dx: pos.x - p.x, dy: pos.y - p.y }; goal = null;
    });
    loupe.addEventListener("pointermove", (e) => {
      if (!drag) return; const p = rel(e);
      pos = { x: clamp(p.x + drag.dx), y: clamp(p.y + drag.dy) }; place();
    });
    ["pointerup", "pointercancel"].forEach((ev) => loupe.addEventListener(ev, () => (drag = null)));
    box.addEventListener("click", (e) => {
      if (loupe.contains(e.target)) return;
      goal = rel(e); if (!raf) raf = requestAnimationFrame(glide);
    });
    if (fine) box.addEventListener("pointermove", (e) => {
      if (drag || e.pointerType !== "mouse" || loupe.contains(e.target)) return;
      goal = rel(e); if (!raf) raf = requestAnimationFrame(glide);
    });
    if ("ResizeObserver" in window) new ResizeObserver(place).observe(box);
    place();
  }

  /* ---------- Comparador línea / color ---------- */
  function initCompare() {
    const frame = $(".cmp__frame"), handle = $(".cmp__handle");
    let x = 50, drag = false, anim = 0, touched = false;
    const set = (v) => { x = clamp(v, 0, 100); frame.style.setProperty("--x", `${x}%`); handle.setAttribute("aria-valuenow", Math.round(x)); };
    const fromEvent = (e) => { const r = frame.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
    const tween = (to, ms = 700, cb) => {
      cancelAnimationFrame(anim); const from = x, t0 = performance.now();
      const step = (n) => { const k = clamp((n - t0) / ms); set(from + (to - from) * ease(k)); if (k < 1) anim = requestAnimationFrame(step); else cb && cb(); };
      anim = requestAnimationFrame(step);
    };
    handle.addEventListener("pointerdown", (e) => { e.preventDefault(); handle.setPointerCapture(e.pointerId); drag = true; touched = true; cancelAnimationFrame(anim); });
    handle.addEventListener("pointermove", (e) => { if (drag) set(fromEvent(e)); });
    ["pointerup", "pointercancel"].forEach((ev) => handle.addEventListener(ev, () => (drag = false)));
    frame.addEventListener("click", (e) => { if (handle.contains(e.target)) return; touched = true; tween(fromEvent(e), 500); });
    handle.addEventListener("keydown", (e) => {
      const k = { ArrowLeft: -5, ArrowRight: 5, Home: -100, End: 100 }[e.key];
      if (k !== undefined) { e.preventDefault(); touched = true; set(x + k); }
    });
    if (!reduce) {
      const io = new IntersectionObserver(([en]) => {
        if (!en.isIntersecting) return; io.disconnect();
        setTimeout(() => { if (!touched) tween(22, 900, () => !touched && tween(78, 1100, () => !touched && tween(50, 800))); }, 400);
      }, { threshold: 0.6 });
      io.observe(frame);
    }
    // La versión de línea se genera la primera vez que el comparador se acerca a la pantalla
    const io2 = new IntersectionObserver(async ([en]) => {
      if (!en.isIntersecting) return; io2.disconnect();
      const src = await canvasOf(ROLE.compare);
      lineArt(src).toBlob((b) => { lineURL = URL.createObjectURL(b); fillArt(document); }, "image/jpeg", 0.9);
    }, { rootMargin: "600px 0px" });
    io2.observe(frame);
  }

  /* ---------- 04 CARMINE ART: la obra suena ---------- */
  async function initScore() {
    const box = $(".score"), area = $(".score__art"), scan = $(".score__scan"), sparks = $(".score__sparks");
    const btn = $(".btn--play"), label = $(".btn__l"), poem = $(".poem"), eq = $(".score__eq");
    label.removeAttribute("data-i18n");
    const COLS = 28, ROWS = 10, STEP = 0.46, SCALE = [0, 2, 4, 7, 9];
    for (let i = 0; i < 18; i++) eq.appendChild(document.createElement("i"));
    const bars = $$("i", eq);
    let src = null, grid = null, pix = null;
    async function ready() {
      if (grid) return;
      src = await canvasOf(ROLE.score);
      const g = document.createElement("canvas"); g.width = COLS; g.height = ROWS;
      const gx = g.getContext("2d", { willReadFrequently: true });
      gx.drawImage(src, 0, 0, COLS, ROWS);
      grid = gx.getImageData(0, 0, COLS, ROWS).data;
      pix = src.getContext("2d", { willReadFrequently: true });
    }

    let ac, master, rev, playing = false, timer = 0, raf = 0, t0 = 0, drone = null, lit = 0;
    function hsl(r, g2, b) {
      r /= 255; g2 /= 255; b /= 255;
      const mx = Math.max(r, g2, b), mn = Math.min(r, g2, b), l = (mx + mn) / 2;
      if (mx === mn) return [0, 0, l];
      const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      const h = mx === r ? (g2 - b) / d + (g2 < b ? 6 : 0) : mx === g2 ? (b - r) / d + 2 : (r - g2) / d + 4;
      return [h * 60, s, l];
    }
    function audio() {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
        ac = new AC();
        const comp = ac.createDynamicsCompressor(); comp.connect(ac.destination);
        master = ac.createGain(); master.gain.value = 0.9; master.connect(comp);
        rev = ac.createConvolver();
        const len = ac.sampleRate * 2.8, buf = ac.createBuffer(2, len, ac.sampleRate);
        for (let c = 0; c < 2; c++) { const ch = buf.getChannelData(c); for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
        rev.buffer = buf;
        const wet = ac.createGain(); wet.gain.value = 0.4; rev.connect(wet); wet.connect(comp);
      }
      if (ac.state === "suspended") ac.resume();
      return true;
    }
    function note(freq, vel, pan = 0, when = 0) {
      const at = ac.currentTime + when;
      const o1 = ac.createOscillator(), o2 = ac.createOscillator(), env = ac.createGain();
      o1.type = "sine"; o2.type = "triangle"; o1.frequency.value = freq; o2.frequency.value = freq * 2.001;
      const g2 = ac.createGain(); g2.gain.value = 0.18;
      o1.connect(env); o2.connect(g2).connect(env);
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(vel, at + 0.018);
      env.gain.exponentialRampToValueAtTime(0.0001, at + 2.4);
      let out = env;
      if (ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; env.connect(p); out = p; }
      out.connect(master); out.connect(rev);
      o1.start(at); o2.start(at); o1.stop(at + 2.5); o2.stop(at + 2.5);
      state.notes++;
    }
    function toNote(r, g2, b, row) {
      const [h, s, l] = hsl(r, g2, b);
      if (s < 0.3 || l < 0.13 || l > 0.9) return null;
      const deg = Math.floor(((h + 18) % 360) / 72);
      const oct = row < ROWS * 0.35 ? 2 : row < ROWS * 0.75 ? 1 : 0;
      return { f: 146.83 * Math.pow(2, (SCALE[deg] + 12 * oct) / 12), v: 0.05 + s * 0.11, deg, oct, w: s * (1 - Math.abs(l - 0.55)) };
    }
    function spark(xp, yp, color) {
      const i = document.createElement("i");
      i.style.left = `${xp * 100}%`; i.style.top = `${yp * 100}%`; i.style.color = color;
      sparks.appendChild(i); setTimeout(() => i.remove(), 1700);
    }
    function bump(n) {
      const b = bars[(n.deg * 3 + n.oct * 5) % bars.length];
      b.style.height = `${8 + n.v * 160}px`; b.style.background = NEON[n.deg % 4];
      setTimeout(() => { b.style.height = ""; b.style.background = ""; }, 380);
    }
    function lines() {
      poem.innerHTML = "";
      L(C.poem).forEach((ln, i) => { const s = document.createElement("span"); s.textContent = ln; if (i < lit) s.classList.add("on"); poem.appendChild(s); });
    }
    function step(i) {
      const cands = [];
      for (let row = 0; row < ROWS; row++) {
        const k = (row * COLS + i) * 4, n = toNote(grid[k], grid[k + 1], grid[k + 2], row);
        if (n) cands.push({ ...n, row, rgb: `rgb(${grid[k]},${grid[k + 1]},${grid[k + 2]})` });
      }
      cands.sort((a, b) => b.w - a.w).slice(0, 2).forEach((n, j) => {
        note(n.f, n.v, (i / COLS) * 1.4 - 0.7, j * 0.06);
        spark((i + 0.5) / COLS, (n.row + 0.5) / ROWS, n.rgb); bump(n);
      });
      const per = Math.floor(COLS / L(C.poem).length);
      if (i % per === 0) { lit = Math.min(L(C.poem).length, i / per + 1); $$("span", poem).forEach((s, k) => s.classList.toggle("on", k < lit)); }
      updateStats();
    }
    async function play() {
      if (!audio()) return;
      await ready();
      playing = true; box.classList.add("is-playing"); btn.setAttribute("aria-pressed", "true"); label.textContent = t("art.stop");
      lit = 0; lines();
      const o = ac.createOscillator(), dg = ac.createGain();
      o.type = "sine"; o.frequency.value = 73.42; dg.gain.value = 0.0001; o.connect(dg).connect(master); o.start();
      dg.gain.exponentialRampToValueAtTime(0.05, ac.currentTime + 2);
      drone = { o, dg };
      let i = 0; t0 = performance.now();
      step(i++);
      timer = setInterval(() => { if (i >= COLS) { stop(true); return; } step(i++); }, STEP * 1000);
      const w = area.clientWidth;
      const move = (n) => { if (!playing) return; scan.style.setProperty("--scan", (clamp((n - t0) / (COLS * STEP * 1000)) * w).toFixed(1)); raf = requestAnimationFrame(move); };
      raf = requestAnimationFrame(move);
    }
    function stop(done) {
      playing = false; clearInterval(timer); cancelAnimationFrame(raf);
      box.classList.remove("is-playing"); btn.setAttribute("aria-pressed", "false"); label.textContent = t("art.play");
      if (drone) { const { o, dg } = drone; dg.gain.cancelScheduledValues(ac.currentTime); dg.gain.setTargetAtTime(0.0001, ac.currentTime, 0.6); o.stop(ac.currentTime + 3); drone = null; }
      if (done) { lit = L(C.poem).length; $$("span", poem).forEach((s) => s.classList.add("on")); burstAt(area); }
    }
    btn.addEventListener("click", () => (playing ? stop() : play()));
    area.addEventListener("click", async (e) => {
      if (!audio()) return;
      await ready();
      const r = area.getBoundingClientRect(), xp = (e.clientX - r.left) / r.width, yp = (e.clientY - r.top) / r.height;
      const px = Math.floor(xp * src.width), py = Math.floor(yp * src.height);
      const d = pix.getImageData(clamp(px - 3, 0, src.width - 7), clamp(py - 3, 0, src.height - 7), 7, 7).data;
      let rr = 0, gg = 0, bb = 0; for (let k = 0; k < d.length; k += 4) { rr += d[k]; gg += d[k + 1]; bb += d[k + 2]; }
      rr /= 49; gg /= 49; bb /= 49;
      const n = toNote(rr, gg, bb, Math.floor(yp * ROWS)) || { f: 146.83 * (yp < 0.5 ? 2 : 1), v: 0.05, deg: 0, oct: 0 };
      note(n.f, n.v + 0.03, xp * 1.4 - 0.7);
      spark(xp, yp, `rgb(${rr | 0},${gg | 0},${bb | 0})`); bump(n);
      box.classList.add("is-touched"); updateStats();
    });
    new IntersectionObserver(([en]) => { if (!en.isIntersecting && playing) stop(); }, { threshold: 0 }).observe(box);
    langHooks.push(() => { lines(); label.textContent = playing ? t("art.stop") : t("art.play"); });
    lines();
  }

  /* ---------- Galería: cada obra se enciende cuando te detienes frente a ella ---------- */
  function initGallery() {
    const track = $(".gal__track"), viewer = $(".viewer"), vtrack = $(".viewer__track"), vcap = $(".viewer__cap");
    function render() {
      track.innerHTML = C.works.map((w, i) => `<li class="gal__item gal__item--${w.kind}" style="--r:${w.ratio};--d:${(i % 4) * -2.5}s"><button type="button" class="gal__fig" data-i="${i}" aria-label="${t("gal.open")}: ${caption(WORKS[w.id])}"><img data-work="${w.id}" alt="" draggable="false" /></button><p class="gal__cap">${caption(WORKS[w.id])}</p></li>`).join("");
      vtrack.innerHTML = C.works.map((w) => `<li><img data-work="${w.id}" alt="${caption(WORKS[w.id])}" /></li>`).join("");
      fillArt(track); fillArt(vtrack);
      const io = new IntersectionObserver((ents) => ents.forEach((e) => e.target.classList.toggle("on", e.isIntersecting)), { root: track, rootMargin: "0px -42% 0px -42%", threshold: 0 });
      $$(".gal__item", track).forEach((li) => io.observe(li));
    }
    $$(".gal__btn").forEach((b) => b.addEventListener("click", () => track.scrollBy({ left: Number(b.dataset.dir) * track.clientWidth * 0.7, behavior: reduce ? "auto" : "smooth" })));
    const setCap = () => { const i = Math.round(vtrack.scrollLeft / vtrack.clientWidth); const w = C.works[i]; if (w) vcap.textContent = caption(WORKS[w.id]); };
    vtrack.addEventListener("scroll", setCap, { passive: true });
    track.addEventListener("click", (e) => {
      const b = e.target.closest(".gal__fig"); if (!b) return;
      document.documentElement.style.overflow = "hidden";
      viewer.showModal();
      vtrack.scrollLeft = Number(b.dataset.i) * vtrack.clientWidth; setCap();
    });
    $(".viewer__close").addEventListener("click", () => viewer.close());
    viewer.addEventListener("close", () => (document.documentElement.style.overflow = ""));
    langHooks.push(render);
    render();
  }

  /* ---------- Costuras: bordes ondulados y líneas neón entre secciones ---------- */
  function initSeams() {
    const NS = "http://www.w3.org/2000/svg", W = 1440, H = 160;
    $$("[data-seam]").forEach((sec, si) => {
      const kind = sec.dataset.seam, div = document.createElement("div");
      div.className = `seam seam--${kind}`; div.setAttribute("aria-hidden", "true");
      let body = "";
      if (kind !== "lines") {
        const pts = Array.from({ length: 9 }, (_, i) => [(i / 8) * W, H * 0.55 + Math.sin(i * 1.3 + si) * 26 + Math.sin(i * 2.7 + si * 2) * 10]);
        body += `<path class="seam__fill" d="M0 ${H}L${pts[0][0]} ${pts[0][1]}${curve(pts, false)}L${W} ${H}Z"/>`;
      }
      [0, 1, 2].forEach((k) => {
        body += `<path class="seam__line" pathLength="1" style="stroke:${NEON[(si + k) % 4]};transition-delay:${k * 0.18}s" d="${strand(W, H * (0.36 + k * 0.14), 22 + k * 8, si * 1.9 + k * 2.2)}"/>`;
      });
      div.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" xmlns="${NS}">${body}</svg>`;
      sec.prepend(div);
    });
    const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -15% 0px" });
    $$(".seam").forEach((s) => io.observe(s));
  }

  /* ---------- 05 CARMINE SPORT: página para colorear ---------- */
  const PAPER = "#fbf8f2", INK = "#1c1916";
  function sportRegions() {
    const R = [], N = 7;
    // Fondo en bandas onduladas, como las cintas de sus dibujos a lápiz
    const lineAt = (k) => Array.from({ length: 17 }, (_, i) => {
      const x = -20 + i * 40;
      if (k === 0) return [x, -20];
      if (k === N) return [x, 770];
      return [x, k * (750 / N) + 26 * Math.sin(x / 85 + k * 1.7) + 12 * Math.sin(x / 31 + k * 2.3)];
    });
    for (let k = 0; k < N; k++) {
      const top = lineAt(k), bot = lineAt(k + 1).reverse();
      R.push({ id: `bg${k}`, d: `M${top[0][0]} ${top[0][1]}${curve(top, false)}L${bot[0][0]} ${bot[0][1]}${curve(bot, false)}Z` });
    }
    R.push(
      { id: "sleeveL", d: "M200 228L138 252L108 340L172 368L195 300Z" },
      { id: "sleeveR", d: "M400 228L462 252L492 340L428 368L405 300Z" },
      { id: "body", d: "M260 200Q300 262 340 200L400 228L405 300L392 560Q300 576 208 560L195 300L200 228Z" },
      { id: "stripeL", d: "M212 250H228V560H212Z" },
      { id: "stripeR", d: "M372 250H388V560H372Z" },
      { id: "collar", d: "M260 200Q300 262 340 200Q300 224 260 200Z" },
      { id: "n1", d: "M238 330L266 312H282V470H258V345L244 352Z" },
      { id: "n0", d: "M328 312a34 79 0 1 0 0.01 0ZM328 334a13 57 0 1 1 -0.01 0Z", rule: "evenodd" },
      { id: "ball", d: "M480 585a55 55 0 1 0 0.01 0Z" }
    );
    const pent = Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI * 2) / 5; return [480 + Math.cos(a) * 20, 640 + Math.sin(a) * 20]; });
    R.push({ id: "pent", d: `M${pent.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join("L")}Z` });
    const seams = pent.map(([x, y]) => { const a = Math.atan2(y - 640, x - 480); return `M${x.toFixed(1)} ${y.toFixed(1)}L${(480 + Math.cos(a) * 55).toFixed(1)} ${(640 + Math.sin(a) * 55).toFixed(1)}`; }).join("");
    return { regions: R, extra: [seams, "M108 340L172 368M492 340L428 368"] };
  }
  function sportSVG(stroke, fillMap, vb = "0 0 600 750", only) {
    const { regions, extra } = sportRegions();
    const use = only ? regions.filter((r) => only.includes(r.id)) : regions;
    // Cada zona lleva su relleno y su línea juntos, para que las zonas de delante tapen las líneas de atrás
    const line = `fill="none" stroke="${stroke}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
    const body = use.map((r) => {
      const rule = r.rule ? ` fill-rule="${r.rule}"` : "";
      return `<path d="${r.d}" fill="${(fillMap && fillMap[r.id]) || (only ? "none" : PAPER)}"${rule}/><path d="${r.d}" ${line}/>`;
    }).join("") + (only ? "" : extra.map((d) => `<path d="${d}" ${line}/>`).join(""));
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
  }

  const coloring = { fills: {} };
  function initColoring() {
    const svg = $(".cbook"), sw = $(".swatches"), NS = "http://www.w3.org/2000/svg";
    const { regions, extra } = sportRegions();
    const palette = [...PALETTE, INK, PAPER];
    let current = PALETTE[0], n = 0, celebrated = false;
    const defs = document.createElementNS(NS, "defs"); svg.appendChild(defs);
    const gFill = document.createElementNS(NS, "g");
    svg.append(gFill);
    const els = {};
    regions.forEach((r) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", r.d); p.setAttribute("class", "rg"); p.setAttribute("fill", PAPER);
      if (r.rule) p.setAttribute("fill-rule", r.rule);
      p.dataset.id = r.id; els[r.id] = p; coloring.fills[r.id] = PAPER;
      const l = p.cloneNode(); l.setAttribute("class", "ln"); l.removeAttribute("fill");
      gFill.append(p, l);
    });
    extra.forEach((d) => { const l = document.createElementNS(NS, "path"); l.setAttribute("d", d); l.setAttribute("class", "ln"); gFill.appendChild(l); });

    palette.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("role", "radio"); b.style.setProperty("--c", c);
      b.setAttribute("aria-checked", String(i === 0)); b.setAttribute("aria-label", c === PAPER ? "Borrar / Erase" : c);
      b.addEventListener("click", () => { current = c; $$("button", sw).forEach((x) => x.setAttribute("aria-checked", String(x === b))); });
      sw.appendChild(b);
    });

    function fill(el, color, e) {
      const id = el.dataset.id;
      if (coloring.fills[id] === color) return;
      coloring.fills[id] = color;
      if (color !== PAPER) { state.colors.add(color); updateStats(); }
      if (!celebrated && Object.values(coloring.fills).every((c) => c !== PAPER)) { celebrated = true; setTimeout(() => burstAt(svg), 400); }
      if (reduce || !e) { el.setAttribute("fill", color); return; }
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      const bb = el.getBBox();
      const far = Math.max(...[[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]].map(([x, y]) => Math.hypot(x - p.x, y - p.y)));
      const cid = `rp${n++}`, cp = document.createElementNS(NS, "clipPath"), shape = document.createElementNS(NS, "path");
      cp.id = cid; cp.appendChild(shape); defs.appendChild(cp);
      const clone = el.cloneNode(); clone.setAttribute("fill", color); clone.setAttribute("clip-path", `url(#${cid})`); clone.style.pointerEvents = "none";
      el.after(clone);
      // El color entra como una mancha que se expande, no como un círculo
      const t0 = performance.now(), dur = 460 + Math.min(far, 600) * 0.6, s = Math.random() * 9;
      const tick = (now) => {
        const k = clamp((now - t0) / dur); shape.setAttribute("d", blob(p.x, p.y, ease(k) * far * 1.25, now / 300, s, 7));
        if (k < 1) requestAnimationFrame(tick); else { el.setAttribute("fill", coloring.fills[id]); clone.remove(); cp.remove(); }
      };
      requestAnimationFrame(tick);
    }
    gFill.addEventListener("click", (e) => { const el = e.target.closest(".rg"); if (el) fill(el, current, e); });

    $('[data-act="reset"]').addEventListener("click", () => { celebrated = false; Object.values(els).forEach((el) => fill(el, PAPER)); });
    $('[data-act="save"]').addEventListener("click", async () => {
      const markup = sportSVG(INK, coloring.fills);
      const img = await loadImg(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`);
      const c = document.createElement("canvas"); c.width = 1200; c.height = 1500;
      const x = c.getContext("2d"); x.fillStyle = PAPER; x.fillRect(0, 0, 1200, 1500); x.drawImage(img, 0, 0, 1200, 1500);
      x.fillStyle = INK; x.font = "500 22px 'Inter Tight', sans-serif"; x.fillText("CARMINE SPORT", 40, 1470);
      c.toBlob((b) => download(b, "carmine-sport-mi-pagina.png"), "image/png");
    });
  }
  function download(blob, name) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  /* ---------- 06 Colecciones ---------- */
  function mazeSVG(stroke) {
    let d = "";
    for (let i = 0; i < 6; i++) {
      const m = 20 + i * 26, s = 340 - m * 2, gap = (i * 67) % 4;
      const sides = [`M${m} ${m}H${m + s}`, `M${m + s} ${m}V${m + s}`, `M${m + s} ${m + s}H${m}`, `M${m} ${m + s}V${m}`];
      sides.forEach((p, k) => { if (k !== gap) d += p; });
    }
    return `<svg viewBox="0 0 340 340" aria-hidden="true"><path d="${d}" fill="none" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/><circle cx="170" cy="170" r="10" fill="${stroke}"/></svg>`;
  }
  function coverHTML(b) {
    const k = `<b>${L(b.kicker)}</b>`, s = `<strong>${L(b.title)}</strong>`;
    if (b.cover === "painting") return `<div class="cv cv--painting"><img data-work="${ROLE.book}" alt="">${k}${s}</div>`;
    if (b.cover === "jersey") return `<div class="cv cv--jersey">${k}${sportSVG("#fff", null, "90 180 420 410", ["sleeveL", "sleeveR", "body", "collar", "n1", "n0", "stripeL", "stripeR"])}${s}</div>`;
    if (b.cover === "lines") return `<div class="cv cv--lines">${k}${sportSVG("#2a2622", { body: "#ff2fa8", n1: "#fbf8f2", n0: "#fbf8f2", ball: "#ffd23a", bg2: "#2fe0f0", bg4: "#ffd23a" })}${s}</div>`;
    return `<div class="cv cv--maze">${k}${mazeSVG("#ffd23a")}${s}</div>`;
  }
  const SPINES = { painting: "#2a1440", jersey: "#7e0c20", lines: "#d8d0c0", maze: "#0b1a36" };
  function bookHTML(b) {
    return `<div class="book" style="--spine:${SPINES[b.cover]}"><div class="book__back"></div><div class="book__pages"></div><div class="book__spine"></div><div class="book__cover">${coverHTML(b)}</div></div>`;
  }
  function spreadsHTML(b) {
    const bars = (n) => Array.from({ length: n }, (_, i) => `<div class="bar" style="width:${70 + ((i * 37) % 30)}%"></div>`).join("");
    if (b.line === "art") {
      const poem = L(C.poem).slice(0, 4).map((l) => `<p>${l}</p>`).join("");
      const eye = C.details.eye;
      return [
        `<div class="spread"><div class="pg"><img data-work="${ROLE.book}" alt=""></div><div class="pg">${poem}</div></div>`,
        `<div class="spread"><div class="pg"><img data-work="${ROLE.compare}" data-variant="line" alt=""></div><div class="pg"><img data-work="${ROLE.compare}" alt=""></div></div>`,
        `<div class="spread"><div class="pg"><img data-work="rinoceronte" alt="" style="filter:grayscale(1)"></div><div class="pg"><img data-work="${ROLE.book}" alt="" style="transform:scale(3);transform-origin:${eye.x * 100}% ${eye.y * 100}%"></div></div>`
      ].join("");
    }
    return [
      `<div class="spread"><div class="pg"><p class="ttl">${L(b.title)}</p>${bars(7)}</div><div class="pg">${sportSVG("#1c1916", coloring.fills)}</div></div>`,
      `<div class="spread"><div class="pg">${sportSVG("#1c1916", null)}</div><div class="pg" style="padding:12%">${mazeSVG("#1c1916")}</div></div>`,
      `<div class="spread"><div class="pg" style="background:#b3122e;color:#fff;align-items:center"><p class="ttl" style="font-size:clamp(60px,12vw,120px)">10</p></div><div class="pg"><p class="ttl">${t("sport.p2")}</p>${bars(6)}</div></div>`
    ].join("");
  }
  function initBooks() {
    const shelf = $(".shelf"), sheet = $(".sheet");
    let openId = null, filter = "all";
    function render() {
      shelf.innerHTML = C.books.map((b) => `<li data-line="${b.line}"><button class="book-btn" type="button" data-id="${b.id}">${bookHTML(b)}<span><p class="kicker">${L(b.kicker)}</p><span class="t">${L(b.title)}</span><br><span class="o">${t("col.open")}</span></span></button></li>`).join("");
      fillArt(shelf); applyFilter();
    }
    function applyFilter() { $$("li", shelf).forEach((li) => li.classList.toggle("is-out", filter !== "all" && li.dataset.line !== filter)); }
    $$(".filters button").forEach((b) => b.addEventListener("click", () => {
      filter = b.dataset.f; $$(".filters button").forEach((x) => x.setAttribute("aria-selected", String(x === b))); applyFilter();
      shelf.scrollTo({ left: 0, behavior: reduce ? "auto" : "smooth" });
    }));
    function fillSheet(b) {
      $(".sheet__book").innerHTML = bookHTML(b);
      $(".sheet__kicker").textContent = L(b.kicker);
      $("#sheetTitle").textContent = L(b.title);
      $(".sheet__desc").textContent = L(b.desc);
      const buy = $(".sheet__buy");
      if (b.buy) { buy.href = b.buy; buy.target = "_blank"; buy.rel = "noopener"; buy.textContent = t("book.buy"); }
      else { buy.href = "#contact"; buy.removeAttribute("target"); buy.textContent = t("book.notify"); }
      buy.onclick = b.buy ? null : (e) => {
        e.preventDefault(); closeSheet();
        prefill("books", `${state.lang === "en" ? "I'm interested in" : "Me interesa"} «${L(b.title)}».`);
      };
      $(".spreads").innerHTML = spreadsHTML(b);
      fillArt(sheet);
    }
    function openSheet(id) {
      const b = C.books.find((x) => x.id === id); if (!b) return;
      openId = id; fillSheet(b);
      document.documentElement.style.overflow = "hidden";
      sheet.showModal(); $(".spreads").scrollLeft = 0;
    }
    function closeSheet() { if (sheet.open) sheet.close(); }
    sheet.addEventListener("close", () => { openId = null; document.documentElement.style.overflow = ""; });
    sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
    $(".sheet__close").addEventListener("click", closeSheet);
    shelf.addEventListener("click", (e) => { const b = e.target.closest(".book-btn"); if (b) openSheet(b.dataset.id); });
    langHooks.push(() => { render(); if (openId) fillSheet(C.books.find((x) => x.id === openId)); });
    render();
  }

  /* ---------- 07 Conexiones: una constelación de líneas orgánicas ---------- */
  function initConnections() {
    const svg = $(".web"), chips = $(".con__chips"), card = $(".con__card");
    const keys = ["painting", "poetry", "music", "sport", "culture", "creativity"];
    const pos = {};
    keys.forEach((k, i) => { const a = (i / keys.length) * Math.PI * 2 - Math.PI / 2; pos[k] = [200 + Math.cos(a) * 140, 200 + Math.sin(a) * 140, a]; });
    let current = "galleries";
    function draw() {
      const on = C.connections[current].links;
      const edges = keys.map((k, i) => {
        const [x, y, a] = pos[k], bend = (i % 2 ? 1 : -1) * 38;
        const qx = 200 + Math.cos(a) * 70 - Math.sin(a) * bend, qy = 200 + Math.sin(a) * 70 + Math.cos(a) * bend;
        return `<path class="edge${on.includes(k) ? " on" : ""}" style="--c:${NEON[i % 4]}" d="M200 200Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}"/>`;
      }).join("");
      const loop = closedPath(on.map((k) => pos[k].slice(0, 2)));
      const nodes = keys.map((k, i) => {
        const [x, y, a] = pos[k], c = Math.cos(a), tx = x + c * 18, ty = y + Math.sin(a) * 22 + 4;
        const anchor = c > 0.3 ? "start" : c < -0.3 ? "end" : "middle";
        return `<g class="node floaty${on.includes(k) ? " on" : ""}" style="animation-delay:${-i}s"><circle cx="${x}" cy="${y}" r="9"/><text x="${tx}" y="${ty}" style="text-anchor:${anchor}">${t("d." + k).toUpperCase()}</text></g>`;
      }).join("");
      svg.innerHTML = `<path class="orbit" d="${blob(200, 200, 140, 1, 3, 10)}"/>${edges}<path class="loop" d="${loop}"/>${nodes}<g class="core"><circle cx="200" cy="200" r="38"/><text x="200" y="203">CARMINE</text></g>`;
      const [k, h, d] = L(C.connections[current]);
      $(".con__k").textContent = k; $(".con__t").textContent = h; $(".con__d").textContent = d;
      card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash");
      chips.innerHTML = Object.keys(C.connections).map((id) => `<button type="button" role="tab" data-id="${id}" aria-selected="${id === current}">${L(C.connections[id])[0]}</button>`).join("");
    }
    chips.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { current = b.dataset.id; draw(); } });
    $(".btn", card).addEventListener("click", (e) => {
      e.preventDefault();
      const [k, h] = L(C.connections[current]);
      prefill("collab", `${h} — ${k}.\n`);
    });
    langHooks.push(draw);
    draw();
  }

  /* ---------- 08 Cierre: postal y contacto ---------- */
  function updateStats() {
    const set = (k, v) => { const el = $(`[data-stat="${k}"]`); if (el) el.textContent = v; };
    set("time", fmt(state.seconds)); set("details", `${state.found.size}/5`); set("notes", state.notes); set("colors", state.colors.size);
  }
  function initPostal() {
    const box = $(".postal"), cv = $(".postal__canvas"), x = cv.getContext("2d"), save = $(".postal__save");
    async function make() {
      try { await document.fonts.ready; } catch (e) {}
      const src = await canvasOf(ROLE.loupe);
      const Wc = 1080, Hc = 1350, en = state.lang === "en";
      x.fillStyle = "#0c0b0a"; x.fillRect(0, 0, Wc, Hc);
      // El encuadre: el último detalle que encontró, o el ojo si no buscó ninguno
      const f = state.lastFound || C.details.eye;
      const size = src.width / (state.lastFound ? 2.6 : 1.6);
      const sx = clamp(f.x * src.width - size / 2, 0, src.width - size), sy = clamp(f.y * src.height - size / 2, 0, src.height - size);
      const shape = new Path2D(blob(540, 520, 430, 2.2, 4, 9));
      x.save(); x.clip(shape); x.drawImage(src, sx, sy, size, size, 60, 50, 960, 960); x.restore();
      x.lineJoin = "round"; x.lineCap = "round";
      x.strokeStyle = "#0c0b0a"; x.lineWidth = 14; x.stroke(shape);
      x.strokeStyle = NEON[0]; x.lineWidth = 4; x.stroke(new Path2D(blob(540, 520, 452, 3.1, 6, 9)));
      x.strokeStyle = NEON[1]; x.lineWidth = 3; x.stroke(new Path2D(strand(Wc, 980, 40, 1.4)));
      // Sus colores, si pintó la página de CARMINE SPORT
      const cols = [...state.colors];
      (cols.length ? cols : ["#3a3633", "#4a4541", "#5a5550"]).forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(1000 - i * 40, 1086, 14, 0, 7); x.fill(); });
      x.fillStyle = "rgba(236,230,218,.7)"; x.font = "500 22px 'Inter Tight', sans-serif";
      if ("letterSpacing" in x) x.letterSpacing = "6px";
      x.fillText(en ? "LOOK ONE MINUTE MORE" : "MIRA UN MINUTO MÁS", 60, 1100);
      if ("letterSpacing" in x) x.letterSpacing = "0px";
      x.fillStyle = "#ece6da"; x.font = "400 150px 'Instrument Serif', Georgia, serif";
      x.fillText(fmt(state.seconds), 54, 1262);
      x.font = "400 30px 'Inter Tight', sans-serif"; x.fillStyle = "rgba(236,230,218,.75)"; x.textAlign = "right";
      x.fillText(`${state.found.size}/5 ${en ? "details" : "detalles"}`, 1020, 1180);
      x.fillText(`${state.notes} ${en ? "notes" : "notas"}`, 1020, 1222);
      x.fillText(`${state.colors.size} ${en ? "colors" : "colores"}`, 1020, 1264);
      x.textAlign = "left"; x.font = "500 20px 'Inter Tight', sans-serif"; x.fillStyle = "rgba(236,230,218,.45)";
      if ("letterSpacing" in x) x.letterSpacing = "8px";
      x.fillText("CARMINE", 60, 1310);
      if ("letterSpacing" in x) x.letterSpacing = "0px";
      const first = !box.classList.contains("is-made");
      box.classList.add("is-made"); save.hidden = false;
      if (first) burstAt(cv);
    }
    $(".postal__veil").addEventListener("click", make);
    save.addEventListener("click", () => { make().then(() => cv.toBlob((b) => download(b, "carmine-mi-minuto.png"), "image/png")); });
  }

  function prefill(topic, msg) {
    const form = $(".form");
    const r = $(`input[name="topic"][value="${topic}"]`, form); if (r) r.checked = true;
    const ta = $("textarea", form); if (msg && !ta.value.trim()) ta.value = msg;
    form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setTimeout(() => $('input[name="name"]', form).focus({ preventScroll: true }), 700);
  }
  function initForm() {
    const form = $(".form"), note = $(".form__note");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      $$("input[name], textarea", form).forEach((el) => { if (el.type === "radio") return; const bad = !el.checkValidity(); el.classList.toggle("bad", bad); if (bad) ok = false; });
      if (!ok) return;
      if (!C.email) { note.textContent = t("form.note"); return; }
      const fd = new FormData(form), topic = $(`input[name="topic"]:checked + span`, form).textContent;
      const body = `${fd.get("msg")}\n\n— ${fd.get("name")} (${fd.get("email")})`;
      note.textContent = t("form.ok");
      location.href = `mailto:${C.email}?subject=${encodeURIComponent("CARMINE — " + topic)}&body=${encodeURIComponent(body)}`;
    });
  }

  function initReveal() {
    const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach((el) => io.observe(el));
  }

  /* ---------- Arranque ---------- */
  initLang();
  applyLang();
  initNav();
  initSeams();
  initReveal();
  initForm();
  initConnections();
  initColoring();
  initMinute();
  fillArt(document);
  initStory();
  initLoupe();
  initCompare();
  initScore();
  initGallery();
  initBooks();
  initPostal();
  updateStats();
  canvasOf(ROLE.hero).then((c) => { hero = initHero(c); document.documentElement.classList.add("is-ready"); });
})();
