/* Yahya Selim Özdamar — kişisel web sitesi */
"use strict";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* Boot ekranı */
function runBoot(done) {
  const boot = $("#boot");
  const log = $("#bootLog");
  let seen = false;
  try { seen = sessionStorage.getItem("ysoBoot") === "1"; } catch (e) {}

  if (reduceMotion || seen) { boot.classList.add("done"); done(); return; }

  const lines = [
    ["> yso.dev başlatılıyor", ""],
    ["> profil yükleniyor ", "[tamam]"],
    ["> projeler yükleniyor ", "[tamam]"],
    ["> yahya selim özdamar ", "[hazır]"],
  ];
  let i = 0;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    try { sessionStorage.setItem("ysoBoot", "1"); } catch (e) {}
    boot.classList.add("done");
    done();
  };
  const step = () => {
    if (finished) return;
    if (i >= lines.length) { setTimeout(finish, 260); return; }
    const [text, ok] = lines[i++];
    log.innerHTML += text + (ok ? `<span class="ok">${ok}</span>` : "") + "\n";
    setTimeout(step, 230);
  };
  boot.addEventListener("click", finish);
  window.addEventListener("keydown", finish, { once: true });
  step();
}

/* Türkiye saati */
function startClock() {
  const el = $("#clock");
  const fmt = new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Istanbul",
  });
  const tick = () => { el.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 1000);
  $("#year").textContent = new Date().getFullYear();
}

/* İsim çözülme (decode) efekti */
const GLYPHS = "アカサタナハマヤラワ01<>/\\#$%&*+=?ΞΔ";
function decode(el, duration = 1100) {
  const final = el.dataset.text;
  const start = performance.now();
  const frame = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const reveal = Math.floor(p * final.length);
    let out = "";
    for (let i = 0; i < final.length; i++) {
      if (final[i] === " ") out += " ";
      else if (i < reveal) out += final[i];
      else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(frame);
    else el.textContent = final;
  };
  requestAnimationFrame(frame);
}
function introName() {
  if (reduceMotion) return;
  const lines = $$("h1.name .line");
  lines.forEach((l, i) => setTimeout(() => decode(l, 900 + i * 250), i * 180));
}

/* Neon şehir (canvas) */
function city() {
  const canvas = $("#city");
  const ctx = canvas.getContext("2d");
  let W, H, DPR, horizon, layers = [], drops = [], signs = [];
  let mouseX = 0, mouseY = 0, curX = 0, curY = 0;
  let t = 0, running = true, raf;

  const C = {
    skyTop: "#0E0B1E",
    skyMid: "#1B1240",
    haze: "rgba(255,46,136,0.42)",
    magenta: "#FF2E88",
    cyan: "#29E6F2",
    amber: "#FFC23D",
  };

  const rand = (a, b) => a + Math.random() * (b - a);

  // Bina katmanları bir kez ekran dışı canvas'a çizilir
  function buildLayer(depth) {
    const off = document.createElement("canvas");
    const extra = 160; // paralaks kayması için yanlardan pay
    off.width = (W + extra * 2) * DPR;
    off.height = horizon * DPR;
    const c = off.getContext("2d");
    c.scale(DPR, DPR);

    const shade = ["#130E2C", "#100B26", "#0B081B"][depth];
    const maxH = [0.62, 0.48, 0.34][depth] * horizon;
    const minH = [0.22, 0.16, 0.1][depth] * horizon;
    const winAlpha = [0.35, 0.55, 0.8][depth];
    let x = 0;
    const totalW = W + extra * 2;

    while (x < totalW) {
      const bw = rand(36, 110) * (1 + depth * 0.25);
      const bh = rand(minH, maxH);
      const by = horizon - bh;
      c.fillStyle = shade;
      c.fillRect(x, by, bw, bh);

      // çatı detayı: anten veya kademe
      if (Math.random() < 0.35) {
        c.fillRect(x + bw * 0.4, by - rand(10, 40), 2, 40);
      } else if (Math.random() < 0.4) {
        c.fillRect(x + bw * 0.15, by - 12, bw * 0.7, 12);
      }

      // pencereler
      const cols = Math.floor(bw / 9);
      const rows = Math.floor(bh / 12);
      for (let r = 1; r < rows; r++) {
        for (let k = 1; k < cols; k++) {
          if (Math.random() < 0.16) {
            const pick = Math.random();
            const col = pick < 0.5 ? C.cyan : pick < 0.85 ? C.magenta : C.amber;
            c.globalAlpha = winAlpha * rand(0.3, 1);
            c.fillStyle = col;
            c.fillRect(x + k * 9 - 2, by + r * 12, 3, 4);
          }
        }
      }
      c.globalAlpha = 1;

      // bina kenarına ince neon çizgi
      if (depth === 2 && Math.random() < 0.25) {
        c.fillStyle = Math.random() < 0.5 ? C.magenta : C.cyan;
        c.globalAlpha = 0.7;
        c.fillRect(x, by, 1.5, bh);
        c.globalAlpha = 1;
      }
      x += bw + rand(2, 14);
    }
    return { canvas: off, depth, extra };
  }

  function setup() {
    DPR = Math.min(window.devicePixelRatio || 1, 2); // yüksek çözünürlükte keskin görüntü
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    horizon = H * 0.7;

    layers = [buildLayer(0), buildLayer(1), buildLayer(2)];

    const count = Math.round((W * H) / 9000);
    drops = Array.from({ length: count }, () => ({
      x: rand(0, W), y: rand(-H, H), len: rand(8, 22), sp: rand(6, 13), a: rand(0.08, 0.35),
    }));

    // yanıp sönen neon tabelalar (ön katmanda)
    signs = Array.from({ length: W < 760 ? 2 : Math.round(W / 320) }, () => ({
      x: rand(W * 0.62, W * 0.97),
      y: rand(horizon * (W < 760 ? 0.82 : 0.55), horizon * 0.9),
      w: rand(8, 14), h: rand(34, 70),
      col: Math.random() < 0.6 ? C.magenta : C.cyan,
      phase: rand(0, 100),
    }));
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, C.skyTop);
    g.addColorStop(0.65, C.skyMid);
    g.addColorStop(1, "#3A1350");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, horizon);

    // ufuk parlaması
    const hz = ctx.createRadialGradient(W * 0.65, horizon, 0, W * 0.65, horizon, W * 0.6);
    hz.addColorStop(0, C.haze);
    hz.addColorStop(1, "rgba(255,46,136,0)");
    ctx.fillStyle = hz;
    ctx.fillRect(0, 0, W, horizon);
  }

  function drawFloor() {
    ctx.fillStyle = "#0B0819";
    ctx.fillRect(0, horizon, W, H - horizon);

    const vx = W * 0.65 + curX * 40;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, horizon, W, H - horizon);
    ctx.clip();

    // derinliğe giden dikey çizgiler
    ctx.strokeStyle = "rgba(41,230,242,0.35)";
    ctx.lineWidth = 1;
    for (let i = -24; i <= 24; i++) {
      ctx.beginPath();
      ctx.moveTo(vx + i * 6, horizon);
      ctx.lineTo(vx + i * 160, H);
      ctx.stroke();
    }
    // bize doğru akan yatay çizgiler
    const speed = (t * 0.6) % 1;
    for (let i = 0; i < 18; i++) {
      const z = (i + speed) / 18;
      const y = horizon + Math.pow(z, 2.6) * (H - horizon);
      ctx.strokeStyle = `rgba(255,46,136,${0.12 + z * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // ufuk çizgisi
    ctx.strokeStyle = "rgba(255,46,136,0.9)";
    ctx.shadowColor = C.magenta;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(W, horizon);
    ctx.stroke();
    ctx.restore();
  }

  function drawLayers() {
    layers.forEach((L) => {
      const k = [0.2, 0.5, 1][L.depth];
      const ox = -L.extra + curX * 60 * k;
      const oy = curY * 8 * k;
      ctx.drawImage(L.canvas, ox, oy, L.canvas.width / DPR, L.canvas.height / DPR);
    });
  }

  function drawSigns() {
    signs.forEach((s) => {
      const flick = Math.sin(t * 3 + s.phase) > -0.85 && Math.random() > 0.02;
      if (!flick) return;
      const x = s.x + curX * 60;
      const y = s.y + curY * 8;
      ctx.save();
      ctx.shadowColor = s.col;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = s.col;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, s.w, s.h);
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = s.col;
      ctx.fillRect(x, y, s.w, s.h);
      ctx.restore();
    });
  }

  function drawRain() {
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 1;
    drops.forEach((d) => {
      ctx.globalAlpha = d.a;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * 0.18, d.y + d.len);
      ctx.stroke();
      d.y += d.sp;
      d.x -= d.sp * 0.18;
      if (d.y > H) { d.y = rand(-60, -10); d.x = rand(0, W + 60); }
    });
    ctx.globalAlpha = 1;
  }

  function render() {
    curX += (mouseX - curX) * 0.05;
    curY += (mouseY - curY) * 0.05;
    ctx.clearRect(0, 0, W, H);
    drawSky();
    drawLayers();
    drawSigns();
    drawFloor();
    drawRain();
  }

  function loop() {
    if (!running) return;
    t += 1 / 60;
    render();
    raf = requestAnimationFrame(loop);
  }

  setup();
  if (reduceMotion) { render(); }
  else { loop(); }

  // fare paralaksı
  window.addEventListener("pointermove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // pencere boyutu değişince yeniden kur
  let rt;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { setup(); if (reduceMotion) render(); }, 150);
  });

  // ekranda değilken animasyonu durdur (pil ve performans)
  new IntersectionObserver(([entry]) => {
    if (reduceMotion) return;
    if (entry.isIntersecting && !running) { running = true; loop(); }
    else if (!entry.isIntersecting) { running = false; cancelAnimationFrame(raf); }
  }).observe(canvas);
}

/* Proje kartlarını fareyle eğme */
function tiltCards() {
  if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;
  $$(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${px * 100}%`);
      card.style.setProperty("--my", `${py * 100}%`);
      card.style.transform = `rotateY(${(px - 0.5) * 10}deg) rotateX(${(0.5 - py) * 8}deg) translateZ(0)`;
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });
}

/* Terminal */
function terminal() {
  const out = $("#termOut");
  const form = $("#termForm");
  const input = $("#termInput");
  const history = [];
  let hIndex = 0;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const commands = {
    yardim: () =>
`Kullanılabilir komutlar:
  <span class="hl">kimim</span>        kısa tanıtım
  <span class="hl">deneyim</span>      staj bilgisi
  <span class="hl">projeler</span>     projelerin listesi
  <span class="hl">yetenekler</span>   teknik yetkinlikler
  <span class="hl">iletisim</span>     iletişim bilgileri
  <span class="hl">cv</span>           CV'yi yeni sekmede açar
  <span class="hl">git</span> &lt;bölüm&gt;  sayfada o bölüme gider (ör. git projeler)
  <span class="hl">tema</span>         neon renklerini değiştirir
  <span class="hl">temizle</span>      ekranı temizler`,
    kimim: () =>
`Yahya Selim Özdamar
Yazılım mühendisliği 4. sınıf, Malatya Turgut Özal Üniversitesi. Konum: Amasya.
C# ile yapay zeka destekli uygulamalar, Kotlin ile native Android uygulamaları geliştiriyorum.
Hedefim yalnızca çalışan değil, okunabilir ve sürdürülebilir kod yazmak.`,
    deneyim: () =>
`<span class="hl">Stajyer yazılım geliştirici</span>, yapay zeka odaklı staj programı
  - TFT oyuncuları için yapay zeka destekli sohbet botu geliştirdi
  - altyapıyı ve masaüstü arayüzünü C# ile kodladı
  - yapay zeka modelinin entegrasyonunu sağladı
  - .NET 9 ve MS SQL ile yapay zeka asistanlı envanter sistemi geliştirdi`,
    projeler: () =>
`<span class="warn">[geliştiriliyor]</span> Resmi Yazı Tercümanı    resmî yazıları sadeleştiren ML uygulaması
<span class="hl">[tamamlandı]</span>     Akıllı Envanter Sistemi .NET 9, React ve yapay zeka asistanı (staj)
<span class="hl">[tamamlandı]</span>     Kuaförüm                konum bazlı kuaför randevu uygulaması (Kotlin)
<span class="hl">[tamamlandı]</span>     E-Ticaret Web Sitesi    3 kişilik ekip, veritabanı entegrasyonlu platform`,
    yetenekler: () =>
`programlama  C#  Kotlin  Java  TypeScript
backend      .NET 9 Web API  MS SQL  Dapper  JWT
mobil/web    Jetpack Compose  MVVM  React  HTML  CSS
yapay zeka   LLM entegrasyonu  tool calling  MCP
diller       Türkçe (ana dil)  İngilizce (B2)`,
    iletisim: () =>
`e-posta   yahya.selm5@gmail.com
linkedin  <a href="https://linkedin.com/in/yahya-selim-%C3%B6zdamar-626578363" target="_blank" rel="noopener noreferrer">linkedin.com/in/yahya-selim-özdamar</a>
github    <a href="https://github.com/yahyaselm5-ux" target="_blank" rel="noopener noreferrer">github.com/yahyaselm5-ux</a>`,
    cv: () => { window.open("assets/Yahya_Selim_Ozdamar_CV.pdf", "_blank", "noopener,noreferrer"); return "CV yeni sekmede açılıyor."; },
    tema: () => {
      const root = document.documentElement;
      const next = root.dataset.theme === "cyan" ? "" : "cyan";
      if (next) root.dataset.theme = next; else delete root.dataset.theme;
      return `Tema değişti: ${next ? "camgöbeği" : "eflatun"}.`;
    },
    temizle: () => { out.innerHTML = ""; return null; },
  };
  // İngilizce ve kısa takma adlar
  Object.assign(commands, {
    help: commands.yardim, whoami: commands.kimim, clear: commands.temizle,
    yardım: commands.yardim, iletişim: commands.iletisim, contact: commands.iletisim,
    projects: commands.projeler, skills: commands.yetenekler, ls: commands.yardim,
  });

  const sections = { hakkimda: "hakkimda", deneyim: "deneyim", projeler: "projeler", yetkinlikler: "yetkinlikler", yetenekler: "yetkinlikler", iletisim: "iletisim", "başa": "top", basa: "top" };

  function print(cmd, res) {
    const c = document.createElement("div");
    c.className = "cmd";
    c.innerHTML = `<b>›</b> ${esc(cmd)}`;
    out.appendChild(c);
    if (res !== null && res !== undefined) {
      const r = document.createElement("div");
      r.className = "res";
      r.innerHTML = res;
      out.appendChild(r);
    }
    out.scrollTop = out.scrollHeight;
  }

  function run(raw) {
    const line = raw.trim();
    if (!line) return;
    history.push(line);
    hIndex = history.length;
    const [name, ...args] = line.toLocaleLowerCase("tr-TR").split(/\s+/);

    if (name === "git" || name === "cd") {
      const target = sections[args[0]];
      if (target) {
        print(line, `${args[0]} bölümüne gidiliyor...`);
        setTimeout(() => document.getElementById(target).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }), 250);
      } else {
        print(line, `Bölüm bulunamadı. Geçerli bölümler: hakkimda, deneyim, projeler, yetkinlikler, iletisim`);
      }
      return;
    }
    const fn = commands[name];
    if (fn) print(line, fn(args));
    else print(line, `Komut bulunamadı: ${esc(name)}. Kullanılabilir komutlar için <span class="hl">yardim</span> yazın.`);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run(input.value);
    input.value = "";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && history.length) {
      hIndex = Math.max(0, hIndex - 1);
      input.value = history[hIndex];
      e.preventDefault();
    } else if (e.key === "ArrowDown" && history.length) {
      hIndex = Math.min(history.length, hIndex + 1);
      input.value = history[hIndex] || "";
      e.preventDefault();
    } else if (e.key === "Tab") {
      const v = input.value.toLocaleLowerCase("tr-TR");
      const match = Object.keys(commands).find((k) => v && k.startsWith(v));
      if (match) { input.value = match; e.preventDefault(); }
    }
  });

  $("#term").addEventListener("click", (e) => { if (e.target.tagName !== "A") input.focus({ preventScroll: true }); });

  out.innerHTML = `<div class="res">Hoş geldiniz. Kullanılabilir komutları görmek için <span class="hl">yardim</span> yazın.</div>`;
}

/* Menü, kopyalama, aktif bölüm */
function ui() {
  const btn = $("#menuBtn");
  const nav = $("#nav");
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", open);
    btn.textContent = open ? "Kapat" : "Menü";
  });
  $$(".nav a").forEach((a) => a.addEventListener("click", () => {
    nav.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "Menü";
  }));

  $$(".copy").forEach((b) => b.addEventListener("click", async () => {
    const text = b.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      b.textContent = "Kopyalandı";
    } catch (e) {
      b.textContent = "Elle kopyala";
    }
    setTimeout(() => (b.textContent = "Kopyala"), 1800);
  }));

  // Menüde o an görünen bölümü vurgula
  const links = new Map($$(".nav a").map((a) => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        links.forEach((a) => a.classList.remove("active"));
        links.get(en.target.id)?.classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => io.observe(s));
}


/* Arka plan yağmuru */
function rain() {
  const canvas = $("#rain");
  const ctx = canvas.getContext("2d");
  const hero = $("#top");
  let W, H, DPR, drops = [], ripples = [], heroFull = false;

  const LAYERS = [
    { len: [6, 12], sp: [3, 5], a: 0.09, w: 1 },
    { len: [10, 18], sp: [5, 8], a: 0.15, w: 1 },
    { len: [16, 28], sp: [8, 12], a: 0.24, w: 1.4 },
  ];
  const rand = (a, b) => a + Math.random() * (b - a);

  function spawn(d, top) {
    const L = LAYERS[d.layer];
    d.x = rand(-40, W + 40);
    d.y = top ? rand(-H, 0) : rand(-H, H);
    d.len = rand(...L.len);
    d.sp = rand(...L.sp);
    d.end = d.layer === 2 ? rand(H * 0.82, H) : H + 30; // ön katman yere çarpıp halka bırakır
    d.cyan = Math.random() < 0.3;
  }

  function setup() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const n = Math.round((W * H) / 11000);
    drops = Array.from({ length: n }, (_, i) => {
      const d = { layer: i % 3 };
      spawn(d, false);
      return d;
    });
  }

  function frame() {
    requestAnimationFrame(frame);
    if (heroFull) return; // hero tamamen ekrandayken kendi yağmuru var
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round";
    for (const d of drops) {
      const L = LAYERS[d.layer];
      ctx.globalAlpha = L.a;
      ctx.strokeStyle = d.cyan ? "#29E6F2" : "#B9B2E6";
      ctx.lineWidth = L.w;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.len * 0.12, d.y + d.len);
      ctx.stroke();
      d.y += d.sp; d.x -= d.sp * 0.12;
      if (d.y > d.end) {
        if (d.layer === 2) ripples.push({ x: d.x, y: d.end + d.len, r: 1, a: 0.35, cyan: d.cyan });
        spawn(d, true);
      }
    }
    ctx.lineWidth = 1;
    ripples = ripples.filter((r) => r.a > 0.01);
    for (const r of ripples) {
      ctx.globalAlpha = r.a;
      ctx.strokeStyle = r.cyan ? "#29E6F2" : "#B9B2E6";
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r * 2.4, r.r * 0.6, 0, 0, Math.PI * 2);
      ctx.stroke();
      r.r += 0.45; r.a *= 0.92;
    }
    ctx.globalAlpha = 1;
  }

  setup();
  if (reduceMotion) return;
  new IntersectionObserver(([e]) => { heroFull = e.intersectionRatio > 0.95; }, { threshold: [0, 0.95, 1] }).observe(hero);
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(setup, 150); });
  requestAnimationFrame(frame);
}

/* İsim merceği */
function nameLens() {
  const wrap = $("#nameWrap");
  if (!window.matchMedia("(pointer: fine)").matches) return;
  let lastX = 0, lastY = 0, split = 1.5, raf = 0;
  const decay = () => {
    split += (1.5 - split) * 0.12;
    wrap.style.setProperty("--split", split.toFixed(2) + "px");
    raf = Math.abs(split - 1.5) > 0.05 ? requestAnimationFrame(decay) : 0;
  };
  wrap.addEventListener("pointerenter", () => wrap.classList.add("active"));
  wrap.addEventListener("pointerleave", () => wrap.classList.remove("active"));
  wrap.addEventListener("pointermove", (e) => {
    const r = wrap.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    wrap.style.setProperty("--lx", x + "px");
    wrap.style.setProperty("--ly", y + "px");
    if (!reduceMotion) {
      const speed = Math.hypot(x - lastX, y - lastY);
      split = Math.min(6, Math.max(split, 1.5 + speed * 0.12)); // hızlı hareket = daha güçlü renk kayması
      if (!raf) raf = requestAnimationFrame(decay);
    }
    lastX = x; lastY = y;
  });
}

/* Buton ve menü yazılarında kısa karakter çözülmesi */
function hoverScramble() {
  if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;
  const CH = "01<>/#$%*+=ΞΔ";
  $$(".btn, .nav a, .repo").forEach((el) => {
    const text = el.textContent;
    let busy = false;
    el.addEventListener("pointerenter", () => {
      if (busy) return;
      busy = true;
      el.style.width = el.getBoundingClientRect().width + "px"; // genişlik sabit kalsın, yazı zıplamasın
      const start = performance.now();
      const step = (now) => {
        const p = Math.min((now - start) / 280, 1);
        const n = Math.floor(p * text.length);
        el.textContent = text.slice(0, n) + [...text.slice(n)].map((c) => (c === " " ? " " : CH[(Math.random() * CH.length) | 0])).join("");
        if (p < 1) requestAnimationFrame(step);
        else { el.textContent = text; el.style.width = ""; busy = false; }
      };
      requestAnimationFrame(step);
    });
  });
}

/* Başlat */
startClock();
city();
rain();
nameLens();
hoverScramble();
ui();
tiltCards();
terminal();
runBoot(introName);
