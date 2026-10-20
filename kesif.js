// Okuyucu keşfi: gösterge seçimi, ülke arama/ekleme, başlangıç yılı kaydırıcısı.
// Çizgi grafik + dağılım grafiği aynı kontrollerle birlikte güncellenir.
import { RENK, yuzde, puan, olc, etiketleriAyir, ipucuGoster, ipucuGizle, geciktir } from "./ortak.js";
const d3 = window.d3;

const METRIK_AD = {
  yenilenebilir: "Yenilenebilir",
  hidro: "Hidroelektrik",
  ruzgar: "Rüzgâr",
  gunes: "Güneş",
  ruzgar_gunes: "Rüzgâr ve güneş",
};
// Renkler kaynak anlamına ayrıldığı için diğer ülkeler mürekkep tonu + çizgi deseniyle ayrılır.
const STILLER = [
  { renk: "#16232E", desen: null },
  { renk: "#16232E", desen: "8 4" },
  { renk: "#5D6B78", desen: null },
  { renk: "#5D6B78", desen: "2 3" },
];
const VARSAYILAN = { metrik: "yenilenebilir", secili: ["World", "European Union (27)", "Greece"], baslangic: 2000 };
const EN_FAZLA = 4;

export function kesif(veri) {
  const { yillar, karsilastirma_yili: KY, ulkeler } = veri;
  const byId = new Map(ulkeler.map((u) => [u.id, u]));
  const trKucuk = (s) => s.toLocaleLowerCase("tr");
  const durum = { ...VARSAYILAN, secili: [...VARSAYILAN.secili] };

  const el = {
    metrik: document.getElementById("metrik"),
    ara: document.getElementById("ulke-ara"),
    ekle: document.getElementById("ulke-ekle"),
    liste: document.getElementById("ulke-listesi"),
    durum: document.getElementById("arama-durum"),
    baslangic: document.getElementById("baslangic"),
    baslangicDeger: document.getElementById("baslangic-deger"),
    sifirla: document.getElementById("sifirla"),
    secili: document.getElementById("secili"),
  };

  // Arama listesi: Türkiye hariç tüm ülkeler ve toplamlar
  d3.select(el.liste).selectAll("option")
    .data(ulkeler.filter((u) => u.id !== "Turkey"))
    .join("option").attr("value", (u) => u.ad);

  const deger = (u, m, y) => {
    const i = yillar.indexOf(y);
    return i < 0 ? null : u[m][i];
  };
  const sonDeger = (u, m) => {
    for (let i = yillar.length - 1; i >= 0; i--) if (u[m][i] != null) return { yil: yillar[i], v: u[m][i] };
    return null;
  };
  const stil = (id) => (id === "Turkey" ? { renk: RENK.tr, desen: null } : STILLER[durum.secili.indexOf(id)] || STILLER[0]);

  function mesaj(t) { el.durum.textContent = t; }

  function ulkeEkle(id) {
    const u = byId.get(id);
    if (!u) return;
    if (id === "Turkey" || durum.secili.includes(id)) { mesaj(`${u.ad} zaten grafikte.`); return; }
    if (durum.secili.length >= EN_FAZLA) { mesaj(`En fazla ${EN_FAZLA} ülke ekleyebilirsiniz. Önce birini kaldırın.`); return; }
    durum.secili.push(id);
    mesaj(`${u.ad} eklendi.`);
    guncelle();
  }
  function aramadanEkle() {
    const q = trKucuk(el.ara.value.trim());
    if (!q) { mesaj("Önce bir ülke adı yazın."); return; }
    let u = ulkeler.find((x) => trKucuk(x.ad) === q || trKucuk(x.kisa || "") === q);
    if (!u) {
      const adaylar = ulkeler.filter((x) => trKucuk(x.ad).startsWith(q));
      if (adaylar.length === 1) u = adaylar[0];
      else if (adaylar.length > 1) { mesaj(`Birden fazla eşleşme var: ${adaylar.slice(0, 4).map((x) => x.ad).join(", ")}…`); return; }
    }
    if (!u) { mesaj(`"${el.ara.value}" adıyla bir ülke bulunamadı. Listeden seçmeyi deneyin.`); return; }
    ulkeEkle(u.id);
    el.ara.value = "";
  }

  el.ekle.addEventListener("click", aramadanEkle);
  el.ara.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); aramadanEkle(); } });
  el.metrik.addEventListener("change", () => { durum.metrik = el.metrik.value; guncelle(); });
  let kare = null;
  el.baslangic.addEventListener("input", () => {
    durum.baslangic = +el.baslangic.value;
    el.baslangicDeger.textContent = durum.baslangic;
    if (kare) cancelAnimationFrame(kare);
    kare = requestAnimationFrame(guncelle);
  });
  el.sifirla.addEventListener("click", () => {
    Object.assign(durum, { ...VARSAYILAN, secili: [...VARSAYILAN.secili] });
    el.metrik.value = durum.metrik;
    el.baslangic.value = durum.baslangic;
    el.baslangicDeger.textContent = durum.baslangic;
    mesaj("Varsayılan görünüme dönüldü.");
    guncelle();
  });

  function cipleriCiz() {
    const veri = ["Turkey", ...durum.secili];
    const li = d3.select(el.secili).selectAll("li").data(veri, (d) => d).join((enter) => {
      const l = enter.append("li");
      l.append("svg").attr("width", 26).attr("height", 10).attr("aria-hidden", "true").append("line")
        .attr("x1", 1).attr("x2", 25).attr("y1", 5).attr("y2", 5).attr("stroke-width", 3);
      l.append("span");
      return l;
    });
    li.classed("sabit", (d) => d === "Turkey");
    li.select("line").attr("stroke", (d) => stil(d).renk).attr("stroke-dasharray", (d) => stil(d).desen);
    li.select("span").text((d) => byId.get(d).ad + (d === "Turkey" ? " (her zaman gösterilir)" : ""));
    li.selectAll("button").remove();
    li.filter((d) => d !== "Turkey").append("button").attr("type", "button")
      .attr("aria-label", (d) => `${byId.get(d).ad} ülkesini grafikten kaldır`)
      .text("×")
      .on("click", (e, d) => {
        durum.secili = durum.secili.filter((x) => x !== d);
        mesaj(`${byId.get(d).ad} kaldırıldı.`);
        guncelle();
        el.ara.focus();
      });
  }

  /* ---------- Çizgi grafik ---------- */
  const cizgiKap = document.querySelector("#kesif-cizgi .grafik");
  function cizgiGrafik() {
    const { w, h } = olc(cizgiKap);
    const kucuk = w < 520;
    const m = { t: 12, r: kucuk ? 86 : 124, b: 28, l: 38 };
    const m_ = durum.metrik;
    const idler = ["Turkey", ...durum.secili];
    const ys = yillar.filter((y) => y >= durum.baslangic);
    const seriler = idler.map((id) => {
      const u = byId.get(id);
      return { id, u, noktalar: ys.map((y) => ({ yil: y, v: deger(u, m_, y) })) };
    });
    const enBuyuk = d3.max(seriler, (s) => d3.max(s.noktalar, (p) => p.v)) || 10;
    const x = d3.scaleLinear().domain([durum.baslangic, yillar[yillar.length - 1]]).range([m.l, w - m.r]);
    const y = d3.scaleLinear().domain([0, Math.max(10, Math.ceil(enBuyuk / 10) * 10)]).range([h - m.b, m.t]);

    const svg = d3.select(cizgiKap).html("").append("svg").attr("width", w).attr("height", h).attr("role", "img");
    svg.append("g").attr("class", "izgara").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-(w - m.l - m.r)).tickFormat(""));
    svg.append("g").attr("class", "eksen").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat((v) => "%" + v).tickSizeOuter(0));
    svg.append("g").attr("class", "eksen").attr("transform", `translate(0,${h - m.b})`)
      .call(d3.axisBottom(x).ticks(Math.min(kucuk ? 4 : 6, ys.length - 1)).tickFormat(d3.format("d")).tickSizeOuter(0));

    const line = d3.line().defined((p) => p.v != null).x((p) => x(p.yil)).y((p) => y(p.v));
    // Türkiye en üstte çizilsin
    [...seriler].reverse().forEach((s) => {
      const st = stil(s.id);
      svg.append("path").attr("fill", "none").attr("stroke", st.renk).attr("stroke-dasharray", st.desen)
        .attr("stroke-width", s.id === "Turkey" ? 3 : 2).attr("stroke-linejoin", "round").attr("d", line(s.noktalar));
    });

    // Doğrudan etiketler
    const etiketler = seriler.map((s) => {
      const son = [...s.noktalar].reverse().find((p) => p.v != null);
      return son ? { s, yil: son.yil, v: son.v, y: y(son.v) } : null;
    }).filter(Boolean);
    etiketleriAyir(etiketler, 28, m.t + 6, h - m.b - 14);
    etiketler.forEach((e) => {
      const t = svg.append("text").attr("class", "halo").attr("x", w - m.r + 8).attr("y", e.y)
        .style("fill", e.s.id === "Turkey" ? RENK.tr : stil(e.s.id).renk).style("font-weight", e.s.id === "Turkey" ? 700 : 600);
      t.append("tspan").attr("x", w - m.r + 8).text(e.s.u.kisa || e.s.u.ad);
      t.append("tspan").attr("x", w - m.r + 8).attr("dy", "1.2em").style("font-weight", 400)
        .text(yuzde(e.v) + (e.yil !== yillar[yillar.length - 1] ? ` (${e.yil})` : ""));
    });

    // Etkileşim: yıla göre ipucu
    const kural = svg.append("line").attr("stroke", RENK.murekkep2).attr("y1", m.t).attr("y2", h - m.b).attr("opacity", 0);
    const noktaG = svg.append("g");
    svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", h - m.t - m.b)
      .attr("fill", "transparent").style("touch-action", "pan-y")
      .on("pointermove pointerdown", (e) => {
        const [px] = d3.pointer(e);
        const yl = Math.round(x.invert(px));
        kural.attr("x1", x(yl)).attr("x2", x(yl)).attr("opacity", 0.6);
        const satirlar = seriler.map((s) => ({ s, v: deger(s.u, m_, yl) })).filter((r) => r.v != null).sort((a, b) => b.v - a.v);
        noktaG.selectAll("circle").data(satirlar).join("circle").attr("r", 4).attr("cx", x(yl)).attr("cy", (r) => y(r.v))
          .attr("fill", (r) => stil(r.s.id).renk).attr("stroke", "#fff").attr("stroke-width", 1.5);
        ipucuGoster(`<b>${yl}</b>${satirlar.map((r) => `${r.s.u.ad}: ${yuzde(r.v)}`).join("<br>") || "Veri yok"}`, e.clientX, e.clientY);
      })
      .on("pointerleave", () => { kural.attr("opacity", 0); noktaG.selectAll("*").remove(); ipucuGizle(); });

    // Bulgu cümlesi başlık
    const sonlar = seriler.map((s) => ({ s, ...(sonDeger(s.u, m_) || {}) })).filter((r) => r.v != null);
    const enYuksek = sonlar.reduce((a, b) => (b.v > a.v ? b : a), sonlar[0]);
    const tr = sonlar.find((r) => r.s.id === "Turkey");
    const metrikAd = METRIK_AD[m_];
    const baslik = enYuksek.s.id === "Turkey"
      ? `${metrikAd} payında seçtiğiniz ülkeler içinde en yüksek değer Türkiye'de: ${yuzde(tr.v)} (${tr.yil})`
      : `${metrikAd} payında seçtiğiniz ülkeler içinde en yüksek değer ${enYuksek.s.u.ad} için ${yuzde(enYuksek.v)} (${enYuksek.yil}); Türkiye ${yuzde(tr.v)}`;
    document.querySelector("#kesif-cizgi .gorsel-baslik").textContent = baslik;
    document.querySelector("#kesif-cizgi .birim").textContent = `${metrikAd} kaynaklı elektriğin üretimdeki payı, %, ${durum.baslangic}–${yillar[yillar.length - 1]}`;
    svg.attr("aria-label", `Çizgi grafik. ${baslik}. ` + sonlar.map((r) => `${r.s.u.ad}: ${yuzde(r.v)} (${r.yil})`).join("; "));
  }

  /* ---------- Dağılım grafiği ---------- */
  const dagKap = document.querySelector("#kesif-dagilim .grafik");
  function dagilimGrafik() {
    const { w, h } = olc(dagKap);
    const kucuk = w < 520;
    const m = { t: 14, r: 18, b: 40, l: 44 };
    const m_ = durum.metrik, b = durum.baslangic;
    const noktalar = ulkeler.filter((u) => u.buyuk && !u.toplam)
      .map((u) => ({ u, x: deger(u, m_, b), y: deger(u, m_, KY) }))
      .filter((p) => p.x != null && p.y != null);
    const ust = Math.max(10, Math.ceil((d3.max(noktalar, (p) => Math.max(p.x, p.y)) || 10) / 10) * 10);
    const x = d3.scaleLinear().domain([0, ust]).range([m.l, w - m.r]);
    const y = d3.scaleLinear().domain([0, ust]).range([h - m.b, m.t]);

    const svg = d3.select(dagKap).html("").append("svg").attr("width", w).attr("height", h).attr("role", "img");
    svg.append("g").attr("class", "izgara").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-(w - m.l - m.r)).tickFormat(""));
    svg.append("g").attr("class", "eksen").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat((v) => "%" + v).tickSizeOuter(0));
    svg.append("g").attr("class", "eksen").attr("transform", `translate(0,${h - m.b})`)
      .call(d3.axisBottom(x).ticks(kucuk ? 4 : 6).tickFormat((v) => "%" + v).tickSizeOuter(0));
    svg.append("text").attr("x", w - m.r).attr("y", h - 6).attr("text-anchor", "end").text(`${b} yılındaki pay →`);
    svg.append("text").attr("x", m.l + 4).attr("y", m.t + 2).attr("dy", "0.7em").text(`↑ ${KY} yılındaki pay`);

    // Değişim yok çizgisi
    svg.append("line").attr("x1", x(0)).attr("y1", y(0)).attr("x2", x(ust)).attr("y2", y(ust))
      .attr("stroke", RENK.murekkep2).attr("stroke-dasharray", "4 4");
    const aci = (Math.atan2(y(ust) - y(0), x(ust) - x(0)) * 180) / Math.PI;
    svg.append("text").attr("class", "not-ince halo")
      .attr("transform", `translate(${x(ust * 0.86)},${y(ust * 0.86) + 14}) rotate(${aci})`)
      .attr("text-anchor", "middle").text("değişim yok");

    const secili = new Set(durum.secili);
    const sirali = [...noktalar].sort((a, b2) => (a.u.id === "Turkey") - (b2.u.id === "Turkey") || secili.has(a.u.id) - secili.has(b2.u.id));
    svg.append("g").selectAll("circle").data(sirali).join("circle")
      .attr("cx", (p) => x(p.x)).attr("cy", (p) => y(p.y))
      .attr("r", (p) => (p.u.id === "Turkey" ? 6.5 : secili.has(p.u.id) ? 5.5 : kucuk ? 3.8 : 4.5))
      .attr("fill", (p) => (p.u.id === "Turkey" ? RENK.tr : secili.has(p.u.id) ? RENK.murekkep : RENK.gri))
      .attr("fill-opacity", (p) => (p.u.id === "Turkey" || secili.has(p.u.id) ? 1 : 0.6))
      .attr("stroke", "#fff").attr("stroke-width", 1)
      .on("pointerenter pointermove", (e, p) => {
        ipucuGoster(`<b>${p.u.ad}</b>${b}: ${yuzde(p.x)}<br>${KY}: ${yuzde(p.y)}<br>Değişim: ${puan(p.y - p.x)}${p.u.id !== "Turkey" && !secili.has(p.u.id) ? "<br><i>Tıklayınca çizgi grafiğe eklenir</i>" : ""}`, e.clientX, e.clientY);
      })
      .on("pointerleave", ipucuGizle)
      .on("click", (e, p) => { ipucuGizle(); ulkeEkle(p.u.id); });

    // Türkiye ve seçili ülkelere etiket
    sirali.filter((p) => p.u.id === "Turkey" || secili.has(p.u.id)).forEach((p) => {
      svg.append("text").attr("class", "halo " + (p.u.id === "Turkey" ? "tr-yazi" : "not-yazi"))
        .attr("x", x(p.x) + 9).attr("y", y(p.y) + 4).text(p.u.kisa || p.u.ad);
    });

    const artan = noktalar.filter((p) => p.y > p.x).length;
    const metrikAd = METRIK_AD[m_].toLocaleLowerCase("tr");
    const baslik = `${b} ile ${KY} arasında ${noktalar.length} büyük üreticiden ${artan} ülke ${metrikAd} payını artırdı`;
    document.querySelector("#kesif-dagilim .gorsel-baslik").textContent = baslik;
    document.querySelector("#kesif-dagilim .birim").textContent = `${METRIK_AD[m_]} payı, %: yatay eksen ${b}, dikey eksen ${KY}`;
    const tr = noktalar.find((p) => p.u.id === "Turkey");
    svg.attr("aria-label", `Dağılım grafiği. ${baslik}. ${tr ? `Türkiye ${b} yılında ${yuzde(tr.x)}, ${KY} yılında ${yuzde(tr.y)}.` : ""}`);
  }

  function guncelle() {
    cipleriCiz();
    cizgiGrafik();
    dagilimGrafik();
  }
  guncelle();
  window.addEventListener("resize", geciktir(() => { cizgiGrafik(); dagilimGrafik(); }, 200));
}
