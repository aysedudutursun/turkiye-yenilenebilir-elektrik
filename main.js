// Giriş noktası: özet veri dosyalarını yükler ve tüm grafikleri başlatır.
// Değerler notebooks/analiz.ipynb tarafından üretilen site/data/* dosyalarından okunur; koda elle yazılmaz.
import { metniDoldur, geciktir } from "./ortak.js";
import { heroSerit, baglamGrafigi } from "./giris.js";
import { hikaye } from "./hikaye.js";
import { kesif } from "./kesif.js";

const d3 = window.d3;

async function basla() {
  const [seri, katki, g20, ozet] = await Promise.all([
    d3.csv("data/turkiye_yillik.csv", d3.autoType),
    d3.csv("data/turkiye_kaynak_katkisi.csv", d3.autoType),
    d3.csv("data/g20_karsilastirma.csv", d3.autoType),
    d3.json("data/ozet_sayilar.json"),
  ]);

  metniDoldur(ozet);
  heroSerit(seri);
  const baglamCiz = baglamGrafigi(seri, ozet);
  window.addEventListener("resize", geciktir(baglamCiz, 200));
  hikaye({ seri, katki, g20, ozet });

  // Keşif verisi (~120 KB) yalnızca okur o bölüme yaklaşınca yüklenir.
  const io = new IntersectionObserver(async (g) => {
    if (!g[0].isIntersecting) return;
    io.disconnect();
    kesif(await d3.json("data/kesif.json"));
  }, { rootMargin: "800px 0px" });
  io.observe(document.getElementById("kesif"));
}

basla().catch((hata) => {
  console.error(hata);
  document.querySelectorAll(".grafik").forEach((el) => {
    el.innerHTML = '<p class="kaynak">Grafik yüklenemedi. Sayfayı bir sunucu üzerinden açtığınızdan emin olun (README: "Yerelde çalıştırma").</p>';
  });
});
