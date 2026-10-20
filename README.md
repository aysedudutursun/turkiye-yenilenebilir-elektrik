# Türkiye'nin yenilenebilir elektriğini barajlar değil, rüzgâr ve güneş büyüttü

Kaydırarak okunan (scrollytelling) interaktif bir veri hikâyesi.
**Kullanıcı Arayüzü Tasarımı · Veri Hikâyesi Proje Ödevi.** Hazırlayan: Ayşe Dudu Tursun (2516016019).

🔗 **Canlı site:** https://aysedudutursun.github.io/turkiye-yenilenebilir-elektrik/
📓 **Analiz:** [`notebooks/analiz.ipynb`](notebooks/analiz.ipynb)

## Proje özeti

**Çalışma sorusu:** Türkiye'nin elektrik üretiminde yenilenebilir enerjinin payı 2000'den bu yana belirgin biçimde arttı. Bu artışı hidroelektrik mi, yoksa rüzgâr ve güneş mi sağladı ve Türkiye bu yolda diğer ülkelerin neresinde duruyor?

**Ana bulgular**

1. Yenilenebilir payı üç yıllık ortalamalarla %23,8'den (2000–2002) %43,6'ya (2023–2025) çıktı: yaklaşık 1,8 katı.
2. Hidroelektrik üretimi 2,2 katına çıktı, ama toplam üretim 2,7 katına çıktığı için barajların payı %23,6'dan %19,3'e geriledi.
3. Yenilenebilir payındaki 19,8 puanlık net artışın 18,7 puanı rüzgâr ve güneşten geldi.
4. 2025'te rüzgâr ve güneşin toplam payı (%21,7) ilk kez hidroelektriği (%16,2) geçti.
5. Türkiye 2024'te yenilenebilir payında 19 G20 ülkesi içinde 6. sırada (%45,6; Dünya %31,9, AB-27 %48,0). Rüzgâr ve güneşte Çin'le aynı düzeyde (%18,2), AB'nin (%28,8) gerisinde.

## Veri kaynağı ve lisans

- **Our World in Data – Energy Dataset**: https://github.com/owid/energy-data
- Alt kaynaklar: Ember (Yearly Electricity Data, 2026), Energy Institute (Statistical Review of World Energy, 2025), EIA.
- **Lisans:** CC BY 4.0. **Erişim tarihi:** 17 Ekim 2026. Ham verinin kopyası: `data/raw/`.

## Depo yapısı

```
turkiye-yenilenebilir-elektrik/
├── README.md
├── requirements.txt
├── .github/workflows/pages.yml   (site/ klasörünü GitHub Pages'e yayınlar)
├── data/
│   ├── raw/          ham veri (OWID kopyası, kod kitabı, KAYNAK.md)
│   └── processed/    sitede kullanılan özet veriler (notebook üretir)
├── notebooks/
│   └── analiz.ipynb  yükleme → temizleme → keşif → bulgular → dışa aktarım
├── site/
│   ├── index.html
│   ├── css/style.css
│   ├── js/           main.js, ortak.js, giris.js, hikaye.js, kesif.js, vendor/d3
│   ├── data/         özet CSV/JSON (toplam ~125 KB)
│   ├── fonts/        Newsreader, Public Sans (OFL)
│   └── img/          favicon, paylaşım görseli (og:image)
└── docs/
    ├── storyboard.pdf
    └── tasarim-kararlari.pdf
```

## Yerelde çalıştırma

```bash
# 1) Analizi yeniden üretmek (Python 3.10+)
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
jupyter notebook notebooks/analiz.ipynb                 # Kernel → Restart & Run All
# Notebook data/processed/ ve site/data/ klasörlerine özet dosyaları yazar.

# 2) Siteyi açmak (veri dosyaları fetch ile okunduğu için bir sunucu gerekir)
cd site
python -m http.server 8000
# Tarayıcıda: http://localhost:8000
```

## Yayın

`main` dalına her gönderimde GitHub Actions, `site/` klasörünü GitHub Pages'e yayınlar (`.github/workflows/pages.yml`). İlk kurulumda depo ayarlarından **Settings → Pages → Source: GitHub Actions** seçilmelidir.

## Kullanılan kütüphaneler ve araçlar

| Katman | Araç |
|---|---|
| Analiz | Python, pandas, NumPy, Matplotlib, pycountry, Babel, Jupyter |
| Grafikler ve geçişler | D3.js v7.9.0 (ISC lisansı). Yalnızca kullanılan modüllerden üretilmiş küçük paket: `site/js/vendor/d3.ozel.v7.9.0.min.js` (üretim betiği: `tools/d3-ozel.js`, esbuild ile) |
| Kaydırma mekanizması | Saf JavaScript (Intersection Observer API + kaydırma konumu hesabı) |
| Yazı tipleri | Newsreader ve Public Sans, SIL Open Font License; woff2 dosyaları Fontsource paketlerinden |
| Yayın | GitHub Pages (GitHub Actions) |

## Kullanılan kod kaynakları

- Grafik ve kaydırma kodu bu proje için yazıldı; hazır bir şablon ya da Scrollama örneği kopyalanmadı.
- D3 kullanım kalıpları için resmî D3 belgelerinden yararlanıldı: https://d3js.org
- Renk paleti: Okabe–Ito renk körlüğü dostu palet.

## Yapay zekâ kullanım beyanı

Bu projede Anthropic'in Claude adlı yapay zekâ asistanını kullandım: D3.js grafik kodunun ve kaydırma mekanizmasının yazımında, notebook'un iskeletinin kurulmasında, hata ayıklamada ve sayfadaki metinlerin ilk taslaklarında. Veri setini ve çalışma sorusunu kendim seçtim; analizdeki her sayıyı notebook çıktısıyla karşılaştırarak kontrol ettim ve metinleri gözden geçirip düzenledim.

## Lisans

Kod: MIT. Metin ve grafikler: CC BY 4.0. Veri: Our World in Data, CC BY 4.0.
