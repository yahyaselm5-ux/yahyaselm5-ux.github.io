/* Hareket ve etkileşim efektleri */
"use strict";

(() => {
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => [...r.querySelectorAll(s)];
  // Sistem "hareketi azalt" diyorsa efektler kapalı başlar; ziyaretçi FX düğmesiyle açabilir
  const systemReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let pref = null;
  try { pref = localStorage.getItem("ysoFx"); } catch (e) {}
  const reduce = pref === "off" || (systemReduce && pref !== "on");
  window.__reduce = reduce;
  if (!reduce) document.documentElement.classList.add("fx-on");

  const fxBtn = q("#fxToggle");
  if (fxBtn) {
    fxBtn.textContent = reduce ? "FX kapalı" : "FX açık";
    fxBtn.setAttribute("aria-pressed", String(!reduce));
    fxBtn.addEventListener("click", () => {
      try { localStorage.setItem("ysoFx", reduce ? "on" : "off"); } catch (e) {}
      location.reload();
    });
  }
  const fine = window.matchMedia("(pointer: fine)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // Diğer scriptlerin okuyabileceği ortak durum (yağmur, kaydırma hızını buradan alır)
  const fx = (window.__fx = { v: 0 });

  if (reduce) { window.fxIntro = () => {}; return; }
  document.documentElement.classList.add("fx");

  /* Kaydırma durumu */
  let lastY = window.scrollY, vel = 0;

  /* Özel imleç */
  const cursor = q("#cursor");
  const label = q(".cursor-label", cursor);
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, pvx = 0, pvy = 0;
  if (fine) {
    document.documentElement.classList.add("has-cursor");
    window.addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; cursor.classList.add("on"); });
    document.addEventListener("pointerleave", () => cursor.classList.remove("on"));
    window.addEventListener("pointerdown", () => cursor.classList.add("press"));
    window.addEventListener("pointerup", () => cursor.classList.remove("press"));
    document.addEventListener("pointerover", (e) => {
      const t = e.target;
      const name = t.closest("#nameWrap");
      const link = t.closest("a, button, .tilt, input, [data-cursor]");
      cursor.classList.toggle("is-name", !!name);
      cursor.classList.toggle("is-link", !!link && !name);
      cursor.classList.toggle("is-text", !!t.closest("input"));
      let text = "";
      if (link && !name && !link.matches("input")) {
        if (link.dataset.cursor) text = link.dataset.cursor;
        else if (link.matches(".tilt")) text = "incele";
        else if (link.target === "_blank") text = "aç ↗";
        else text = "git";
      }
      label.textContent = text;
    });
  }

  /* Başlıkları harflere böl */
  qa(".section .h2").forEach((h) => {
    const text = h.textContent;
    h.setAttribute("aria-label", text);
    h.textContent = "";
    [...text].forEach((ch, i) => {
      const sp = document.createElement("span");
      sp.className = "ch";
      sp.setAttribute("aria-hidden", "true");
      sp.style.setProperty("--i", i);
      sp.dataset.ch = ch;
      sp.textContent = ch === " " ? " " : ch;
      h.appendChild(sp);
    });
  });

  /* Hayalet (arka plan) yazılar */
  const ghosts = qa("section[data-ghost]").map((sec) => {
    const g = document.createElement("div");
    g.className = "ghost";
    g.setAttribute("aria-hidden", "true");
    g.textContent = `${sec.dataset.ghost} ／ ${sec.dataset.ghost}`;
    sec.prepend(g);
    return { sec, g };
  });

  /* Silme (wipe) ile açılan bloklar */
  const groups = [
    ".about-body p, .facts > div",
    ".job",
    ".ticks li",
    ".project",
    ".slot",
    ".term",
    ".contact-line, .contact-card",
  ];
  groups.forEach((sel) => {
    qa(sel).forEach((el, i) => {
      el.classList.add("rv");
      el.style.setProperty("--d", `${(i % 6) * 0.09}s`);
      if (el.matches(".job, .project, .slot, .term, .contact-card")) {
        const w = document.createElement("i");
        w.className = "wipe";
        w.setAttribute("aria-hidden", "true");
        el.appendChild(w);
      }
    });
  });

  qa(".project").forEach((p) => {
    const s = document.createElement("i");
    s.className = "scan";
    s.setAttribute("aria-hidden", "true");
    p.appendChild(s);
  });

  const GLY = "アカサタナ01<>/#$%*+=ΞΔ";
  function scrambleHeading(h) {
    const chars = qa(".ch", h);
    chars.forEach((c, i) => {
      const final = c.dataset.ch;
      if (final === " ") return;
      let n = 0;
      const total = 6 + i;
      const tick = () => {
        n++;
        c.textContent = n >= total ? final : GLY[(Math.random() * GLY.length) | 0];
        if (n < total) setTimeout(tick, 38);
      };
      setTimeout(tick, i * 40);
    });
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add("in");
      if (el.matches(".h2")) scrambleHeading(el);
      io.unobserve(el);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
  qa(".rv, .section .h2").forEach((el) => io.observe(el));

  /* Akan bantlar: içerik ekranı dolduracak kadar çoğaltılır */
  const tracks = qa(".tape-track").map((t) => {
    const base = t.textContent;
    t.textContent = base.repeat(6);
    return { t, x: 0, w: 0, speed: parseFloat(t.dataset.speed) || 1 };
  });
  const measure = () => tracks.forEach((k) => { k.w = k.t.scrollWidth / 2; });
  measure();
  window.addEventListener("resize", measure);

  /* Mıknatıslı butonlar */
  if (fine) {
    qa(".btn, .copy").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        b.style.setProperty("--tx", `${dx * 0.25}px`);
        b.style.setProperty("--ty", `${dy * 0.35}px`);
      });
      b.addEventListener("pointerleave", () => { b.style.setProperty("--tx", "0px"); b.style.setProperty("--ty", "0px"); });
    });
  }

  /* İsimde ara ara kısa glitch patlaması */
  const nameLines = qa("h1.name .line");
  const burst = () => {
    nameLines.forEach((l) => l.classList.add("burst"));
    setTimeout(() => nameLines.forEach((l) => l.classList.remove("burst")), 320);
    setTimeout(burst, 5000 + Math.random() * 4000);
  };

  /* Hero giriş animasyonu (boot ekranından sonra çağrılır) */
  window.fxIntro = () => {
    document.documentElement.classList.add("intro");
    setTimeout(burst, 2600);
  };

  /* Tek döngü: imleç, kaydırma hızı, paralaks, bantlar */
  const hero = q(".hero-inner");
  const status = q(".status");
  const city = q("#city");
  const prog = q("#progress");
  const vert = q(".hero-vert");

  function loop() {
    requestAnimationFrame(loop);
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;
    vel = lerp(vel, dy, 0.18);
    fx.v = vel;
    const skew = clamp(vel * 0.25, -8, 8);
    document.documentElement.style.setProperty("--skew", `${skew}deg`);

    // ilerleme çubuğu
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    // hero paralaks
    if (y < innerHeight * 1.2) {
      const p = y / innerHeight;
      hero.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
      hero.style.opacity = String(1 - p * 1.1);
      hero.style.filter = p > 0.05 ? `blur(${p * 6}px)` : "";
      if (status) status.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
      city.style.transform = `scale(${1 + p * 0.12})`;
      if (vert) vert.style.transform = `translate3d(0, ${-y * 0.25}px, 0)`;
    }

    // hayalet yazılar bölüm geçtikçe yana kayar
    ghosts.forEach(({ sec, g }) => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) return;
      const p = (innerHeight - r.top) / (innerHeight + r.height);
      g.style.transform = `translate3d(${(0.15 - p) * 60}vw, 0, 0) skewX(${-skew}deg)`;
    });

    // bantlar
    tracks.forEach((k) => {
      k.x -= (1.2 + Math.abs(vel) * 0.35) * k.speed;
      if (k.w) {
        if (k.x <= -k.w) k.x += k.w;
        if (k.x > 0) k.x -= k.w;
      }
      k.t.style.transform = `translate3d(${k.x}px, 0, 0)`;
    });

    // imleç
    if (fine) {
      rx = lerp(rx, mx, 0.18);
      ry = lerp(ry, my, 0.18);
      const vx = mx - rx, vy = my - ry;
      pvx = lerp(pvx, vx, 0.3); pvy = lerp(pvy, vy, 0.3);
      cursor.style.setProperty("--x", `${mx}px`);
      cursor.style.setProperty("--y", `${my}px`);
      cursor.style.setProperty("--rx", `${rx}px`);
      cursor.style.setProperty("--ry", `${ry}px`);
      cursor.style.setProperty("--sx", `${clamp(pvx * 0.25, -10, 10)}px`);
      cursor.style.setProperty("--sy", `${clamp(pvy * 0.25, -10, 10)}px`);
    }
  }
  requestAnimationFrame(loop);

  /* Menü linkleri: bölüm geçişinde kısa ekran glitch'i */
  qa('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", () => {
      document.documentElement.classList.remove("jump");
      void document.documentElement.offsetWidth;
      document.documentElement.classList.add("jump");
      setTimeout(() => document.documentElement.classList.remove("jump"), 450);
    });
  });
})();
