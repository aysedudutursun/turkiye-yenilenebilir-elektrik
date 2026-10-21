// Zenginleştirme: ilerleme çubuğu, kaydırınca beliren öğeler, sayaç animasyonları.
// Sayaç değerleri data/ozet_sayilar.json dosyasından okunur; koda elle yazılmaz.
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js-zengin");

// 1) Sayfa ilerleme çubuğu
const cubuk = document.querySelector(".ilerleme span");
if (cubuk) {
  const guncelle = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    cubuk.style.transform = `scaleX(${h > 0 ? Math.min(scrollY / h, 1) : 0})`;
  };
  addEventListener("scroll", guncelle, { passive: true });
  guncelle();
}

// 2) Kaydırınca beliren öğeler (hikâye bölümündeki yapışkan grafiğe dokunulmaz)
const hedefler = document.querySelectorAll(
  ".metin-bolum > *, .kontroller, .kesif-grafikler .sekil, .kart, .foto, .kahramanlar .metin-bolum > *"
);
if ("IntersectionObserver" in window && !RM) {
  const gozlemci = new IntersectionObserver((kayitlar) => {
    kayitlar.forEach((k) => {
      if (k.isIntersecting) { k.target.classList.add("gorunur"); gozlemci.unobserve(k.target); }
    });
  }, { threshold: 0.12 });
  hedefler.forEach((el, i) => {
    el.classList.add("gizli");
    el.style.setProperty("--gecikme", `${(i % 3) * 90}ms`);
    gozlemci.observe(el);
  });
}

// 3) Sayaçlar
const bicim = (v, s) =>
  (s.dataset.on || "") + v.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + (s.dataset.son || "");

fetch("data/ozet_sayilar.json").then((r) => r.json()).then((ozet) => {
  const sayaclar = document.querySelectorAll("[data-say]");
  sayaclar.forEach((s) => {
    const hedef = Number(ozet[s.dataset.say]);
    if (!Number.isFinite(hedef)) return;
    s.textContent = bicim(hedef, s);
    if (RM || !("IntersectionObserver" in window)) return;
    const gozlem = new IntersectionObserver((k) => {
      if (!k[0].isIntersecting) return;
      gozlem.disconnect();
      const t0 = performance.now(), sure = 1300;
      const adim = (t) => {
        const p = Math.min((t - t0) / sure, 1), e = 1 - Math.pow(1 - p, 3);
        s.textContent = bicim(hedef * e, s);
        if (p < 1) requestAnimationFrame(adim); else s.textContent = bicim(hedef, s);
      };
      requestAnimationFrame(adim);
    }, { threshold: 0.6 });
    gozlem.observe(s);
  });
}).catch(() => {});

// ---- 4) Manzara sahnesi: elle çizilmiş illüstrasyon + paralaks ----
const NS = "http://www.w3.org/2000/svg";
const el = (ad, ozn, ebeveyn) => { const e = document.createElementNS(NS, ad); for (const k in ozn) e.setAttribute(k, ozn[k]); if (ebeveyn) ebeveyn.appendChild(e); return e; };
const sahne = document.getElementById("manzara-svg");
if (sahne) {
  const kat = (ad) => el("g", { class: "kat", "data-px": ad }, sahne);
  el("circle", { cx: 170, cy: 95, r: 70, fill: "#fff3cf", opacity: .55 }, sahne);
  el("circle", { cx: 170, cy: 95, r: 34, fill: "#E69F00" }, sahne);
  const bulutlar = kat("0.02");
  [[60, 60, 38, 38], [140, 40, 55, 30], [300, 24, 60, 24]].forEach(([y, s, d, w], i) => {
    const g = el("g", { class: "bulut", style: `animation-duration:${90 + i * 40}s;animation-delay:-${i * 30}s` }, bulutlar);
    el("ellipse", { cx: 0, cy: y, rx: s, ry: s / 3.2, fill: "#fff", opacity: .85 }, g);
    el("ellipse", { cx: s * .5, cy: y - 6, rx: s * .6, ry: s / 3.8, fill: "#fff", opacity: .85 }, g);
  });
  const uzak = kat("0.04");
  el("path", { d: "M0 250 Q150 180 320 232 T640 214 T960 236 T1200 200 V330 H0Z", fill: "#cfe3d9" }, uzak);
  // Rüzgâr türbinleri
  const turbin = (g, x, y, h, sure, renk) => {
    el("path", { d: `M${x - 3} ${y + h} L${x - 1.2} ${y} L${x + 1.2} ${y} L${x + 3} ${y + h}Z`, fill: renk }, g);
    const r = el("g", { class: "rotor", style: `animation-duration:${sure}s` }, g);
    el("circle", { cx: x, cy: y, r: h * .52, fill: "none" }, r);
    [0, 120, 240].forEach((a) => el("line", { x1: x, y1: y, x2: x + Math.sin(a * Math.PI / 180) * h * .5, y2: y - Math.cos(a * Math.PI / 180) * h * .5, stroke: renk, "stroke-width": h / 28 + 1.5, "stroke-linecap": "round" }, r));
    el("circle", { cx: x, cy: y, r: 3.5, fill: renk }, g);
  };
  [[360, 160, 90, 9], [470, 170, 74, 11], [560, 176, 60, 13], [690, 168, 82, 10]].forEach(([x, y, h, s]) => turbin(uzak, x, y, h, s, "#f4f7f9"));
  const orta = kat("0.08");
  el("path", { d: "M0 270 Q200 224 420 262 T820 246 T1200 262 V330 H0Z", fill: "#a9cdb9" }, orta);
  [[240, 200, 120, 7], [900, 190, 130, 6]].forEach(([x, y, h, s]) => turbin(orta, x, y, h, s, "#ffffff"));
  // Baraj ve göl
  const baraj = kat("0.12");
  el("path", { d: "M980 330 L1010 232 L1110 232 L1140 330Z", fill: "#c4ccd2", stroke: "#16232E", "stroke-width": 2 }, baraj);
  el("rect", { x: 1010, y: 226, width: 100, height: 8, fill: "#9aa6b0" }, baraj);
  for (let i = 0; i < 4; i++) el("line", { class: "su-akis", x1: 1030 + i * 22, y1: 244, x2: 1030 + i * 22 + (i - 1.5) * 2, y2: 326, stroke: "#0072B2", "stroke-width": 4, opacity: .8, style: `animation-delay:-${i * .3}s` }, baraj);
  const on = kat("0.18");
  el("path", { d: "M0 300 Q300 270 620 296 T1200 288 V330 H0Z", fill: "#6fae8f" }, on);
  // Güneş paneli tarlası
  for (let sat = 0; sat < 2; sat++) for (let i = 0; i < 9; i++) {
    const x = 40 + i * 56 + sat * 28, y = 284 + sat * 20;
    el("path", { class: "panel", d: `M${x} ${y} l42 0 l-8 -16 l-42 0Z`, fill: "#1f4e79", stroke: "#cfe3f5", "stroke-width": 1, style: `animation-delay:-${(i + sat * 3) * .45}s` }, on);
  }
  // Paralaks
  if (!RM) {
    const katlar = sahne.querySelectorAll(".kat"), kutu = sahne.parentElement;
    const kaydir = () => {
      const r = kutu.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      const d = (r.top + r.height / 2 - innerHeight / 2);
      katlar.forEach((k) => k.style.transform = `translate3d(0,${d * -k.dataset.px * .6}px,0)`);
    };
    addEventListener("scroll", kaydir, { passive: true }); kaydir();
  }
}

// ---- 5) G20 yarışı: 2000'deki sıralama 2024'e nasıl dönüştü? ----
const yarisSvg = document.getElementById("yarisSvg");
if (yarisSvg && window.d3) window.d3.csv("data/g20_karsilastirma.csv", window.d3.autoType).then((v) => {
  const SAT = 28, ETK = 120, rows = v.map((d) => ({ ...d, tr: d.country === "Turkey" }));
  const mx = Math.max(...rows.map((d) => Math.max(d.ren_2000, d.ren_2024))) * 1.08;
  const W = () => yarisSvg.parentElement.clientWidth - 40;
  yarisSvg.setAttribute("height", rows.length * SAT + 20);
  const yil = el("text", { class: "yil", "text-anchor": "end", y: rows.length * SAT - 8 }, yarisSvg);
  rows.forEach((d) => {
    d.g = el("g", { class: "satir" + (d.tr ? " tr" : "") }, yarisSvg);
    d.ad = d.kisa_ad || d.ad;
    d.t1 = el("text", { x: ETK - 8, y: 17, "text-anchor": "end" }, d.g); d.t1.textContent = d.ad;
    d.r = el("rect", { x: ETK, y: 4, height: SAT - 8, rx: 3, fill: d.tr ? "#C8102E" : "#7C8EA0" }, d.g);
    d.t2 = el("text", { y: 17 }, d.g);
  });
  const f1 = (x) => x.toFixed(1).replace(".", ",");
  let t = 0;
  const ciz = (p) => {
    t = p; const w = W();
    yarisSvg.setAttribute("aria-label", `Çubuk grafik: G20 ülkelerinin yenilenebilir payı, ${Math.round(2000 + 24 * p)} yılına yakın değerler.`);
    yil.setAttribute("x", w + 20); yil.textContent = Math.round(2000 + 24 * p);
    const s = rows.map((d) => ({ d, v: d.ren_2000 + (d.ren_2024 - d.ren_2000) * p })).sort((a, b) => b.v - a.v);
    s.forEach((o, i) => {
      o.d.g.style.transform = `translateY(${i * SAT}px)`;
      const bw = Math.max(1, o.v / mx * (w - ETK - 56));
      o.d.r.setAttribute("width", bw); o.d.t2.setAttribute("x", ETK + bw + 6); o.d.t2.textContent = "%" + f1(o.v);
    });
    document.getElementById("kaydirici").value = Math.round(p * 100);
  };
  ciz(0);
  let anim = 0;
  const durdur = () => { cancelAnimationFrame(anim); anim = 0; document.getElementById("oynat").textContent = "▶ 2000'den 2024'e oynat"; };
  document.getElementById("oynat").addEventListener("click", () => {
    if (anim) return durdur();
    document.getElementById("oynat").textContent = "⏸ Durdur";
    const bas = t >= 1 ? 0 : t, t0 = performance.now(), sure = RM ? 1 : 7000 * (1 - bas);
    const adim = (n) => { const q = Math.min((n - t0) / sure, 1); ciz(bas + (1 - bas) * q); if (q < 1) anim = requestAnimationFrame(adim); else durdur(); };
    anim = requestAnimationFrame(adim);
  });
  document.getElementById("kaydirici").addEventListener("input", (e) => { if (anim) durdur(); ciz(e.target.value / 100); });
  addEventListener("resize", () => ciz(t));
});

// ---- 6) Fotoğraflarda hafif paralaks ----
if (!RM) {
  const fotolar = [...document.querySelectorAll(".foto img")];
  const kay = () => fotolar.forEach((im) => {
    const r = im.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const d = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
    im.style.translate = `0 ${(-d * 4).toFixed(1)}px`;
  });
  addEventListener("scroll", kay, { passive: true }); kay();
}
