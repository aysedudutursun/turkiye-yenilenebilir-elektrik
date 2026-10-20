// Ortak yardımcılar: Türkçe sayı biçimi, renkler, hareket tercihi, ipucu kutusu.
const d3 = window.d3;

export const yerel = d3.formatLocale({ decimal: ",", thousands: ".", grouping: [3], currency: ["", " ₺"], minus: "−" });
const f1 = yerel.format(",.1f");
const f0 = yerel.format(",.0f");

/** %45,6 biçimi (Türkçede yüzde işareti sayıdan önce gelir). */
export const yuzde = (v, b = 1) => (v == null || isNaN(v) ? "veri yok" : "%" + (b === 0 ? f0(v) : yerel.format(`,.${b}f`)(v)));
/** +10,8 puan / −4,2 puan */
export const puan = (v) => (v > 0 ? "+" : "") + f1(v) + " puan";
export const twh = (v, b = 1) => (b === 0 ? f0(v) : f1(v)) + " TWh";
export const sayi = (v, b = 1) => yerel.format(`,.${b}f`)(v);
export const yil = (v) => String(v);

export const RENK = {
  tr: "#C8102E",
  hidro: "#0072B2",
  ruzgar: "#009E73",
  gunes: "#E69F00",
  diger: "#CC79A7",
  fosil: "#C5CDD4",
  murekkep: "#16232E",
  murekkep2: "#4A5866",
  gri: "#AEB8C1",
  acikGri: "#D3DAE0",
};
export const YAZI_RENK = { hidro: "#0072B2", ruzgar: "#00775A", gunes: "#8A5A00", diger: "#9C3F74", tr: "#C8102E" };

export const KAYNAK_AD = {
  hidro: "Hidroelektrik",
  diger: "Jeotermal ve biyoenerji",
  ruzgar: "Rüzgâr",
  gunes: "Güneş",
  fosil: "Fosil yakıtlar",
};
export const KAYNAK_KISA = { hidro: "Hidro", diger: "Jeotermal+biyo", ruzgar: "Rüzgâr", gunes: "Güneş" };

const hareketAzalt = window.matchMedia("(prefers-reduced-motion: reduce)");
/** Hareket azaltma tercihinde animasyon süresi 0 olur. */
export const sure = (ms) => (hareketAzalt.matches ? 0 : ms);

/** Metin içindeki data-ozet alanlarını özet dosyasından doldurur. */
export function metniDoldur(ozet) {
  const bicim = {
    pct: (v) => yuzde(v),
    puan: (v) => sayi(v) + " puan",
    twh0: (v) => twh(v, 0),
    kat: (v) => sayi(v),
    oran0: (v) => yuzde(v * 100, 0),
  };
  document.querySelectorAll("[data-ozet]").forEach((el) => {
    const v = ozet[el.dataset.ozet];
    const fn = bicim[el.dataset.bicim];
    if (v == null || !fn) return;
    let metin = fn(v);
    // "19,8 puanlık", "18,7 puanı" gibi ekli kullanımlarda eki koru
    if (el.dataset.bicim === "puan") {
      const ek = el.textContent.trim().match(/puan(\S*)$/);
      if (ek) metin += ek[1];
    }
    el.textContent = metin;
  });
}

/** Paylaşılan ipucu kutusu (tooltip). */
const ipucuEl = () => document.getElementById("ipucu");
export function ipucuGoster(html, x, y) {
  const el = ipucuEl();
  el.innerHTML = html;
  el.hidden = false;
  const r = el.getBoundingClientRect();
  let left = x + 14, top = y + 14;
  if (left + r.width > window.innerWidth - 8) left = x - r.width - 14;
  if (top + r.height > window.innerHeight - 8) top = y - r.height - 14;
  el.style.left = Math.max(8, left) + "px";
  el.style.top = Math.max(8, top) + "px";
}
export function ipucuGizle() { ipucuEl().hidden = true; }

/** Çakışan etiketleri dikeyde iter (basit çakışma önleme). */
export function etiketleriAyir(items, minAra, ust, alt) {
  items.sort((a, b) => a.y - b.y);
  for (let i = 1; i < items.length; i++) {
    if (items[i].y - items[i - 1].y < minAra) items[i].y = items[i - 1].y + minAra;
  }
  const tasma = items.length ? items[items.length - 1].y - alt : 0;
  if (tasma > 0) {
    for (let i = items.length - 1; i >= 0; i--) {
      items[i].y -= tasma;
      if (i > 0 && items[i].y - items[i - 1].y >= minAra) break;
    }
  }
  items.forEach((d) => { d.y = Math.max(ust, d.y); });
  return items;
}

/** Konteyner boyutunu ölç. */
export function olc(el) {
  const r = el.getBoundingClientRect();
  return { w: Math.max(260, Math.floor(r.width)), h: Math.max(200, Math.floor(r.height)) };
}

export function geciktir(fn, ms = 150) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

/* Türkçe sayı ekleri: sayının okunuşundaki son kelimeye göre ünlü uyumu ve sertleşme.
   ek("%25", "den") → "'ten", ek("2025", "de") → "'te", ek("%43,6", "e") → "'ya" */
const BIRLER = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const ONLAR = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
function sonKelime(metin) {
  const s = String(metin).replace(/[^\d,]/g, "");
  const parca = s.includes(",") ? s.split(",").pop() : s.replace(/\./g, "");
  const n = parseInt(parca, 10);
  if (!n) return "sıfır";
  if (n % 10) return BIRLER[n % 10];
  if (n % 100) return ONLAR[(n % 100) / 10];
  if (n % 1000) return "yüz";
  return "bin";
}
export function ek(metin, tur) {
  const k = sonKelime(metin);
  const unluler = k.match(/[aeıioöuü]/g);
  const ince = /[eiöü]/.test(unluler[unluler.length - 1]);
  const sert = /[çfhkpsşt]$/.test(k);
  const unluyleBiter = /[aeıioöuü]$/.test(k);
  if (tur === "e") return "'" + (unluyleBiter ? "y" : "") + (ince ? "e" : "a");
  const u = sert ? "t" : "d";
  if (tur === "den") return "'" + u + (ince ? "en" : "an");
  if (tur === "de") return "'" + u + (ince ? "e" : "a");
  return "";
}
