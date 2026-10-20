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
  ".metin-bolum > *, .kontroller, .kesif-grafikler .sekil, .kart, .kahramanlar .metin-bolum > *"
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
