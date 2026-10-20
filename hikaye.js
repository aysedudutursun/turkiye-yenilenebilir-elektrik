// Sabit (sticky) hikâye grafiği: 9 kaydırma adımı, 5 grafik biçimi
// (çizgi → hareketli ortalama → yığılmış alan → iki çizgi → çubuk → sapmalı çubuk → halter → lolipop).
// Tüm değerler site/data içindeki özet dosyalardan okunur.
import { RENK, YAZI_RENK, KAYNAK_KISA, yuzde, puan, twh, sayi, ek, sure, olc, etiketleriAyir, geciktir } from "./ortak.js";
const d3 = window.d3;

const KAYNAK_ESLE = { hydro: "hidro", wind: "ruzgar", solar: "gunes", other: "diger", total: "toplam" };
const YIGIN = ["hidro", "diger", "ruzgar", "gunes"];

export function hikaye({ seri, katki, g20, ozet }) {
  const svg = d3.select("#hg-svg");
  const kap = document.querySelector("#hikaye-grafik .grafik");
  const baslikEl = document.getElementById("hg-baslik");
  const birimEl = document.getElementById("hg-birim");
  const notEl = document.getElementById("hg-not");
  const ozetEl = document.getElementById("hg-ozet");

  seri.forEach((d) => { d.ws_pay = d.ruzgar_pay + d.gunes_pay; });
  const ilk = seri[0], son = seri[seri.length - 1];
  const yigin = d3.stack().keys(YIGIN.map((k) => k + "_pay"))(seri);
  const cubukVeri = katki.map((d) => ({ ...d, k: KAYNAK_ESLE[d.kaynak] }));
  const satirlar = g20.map((d) => ({ ...d }));

  // Katmanlar
  const izgara = svg.append("g").attr("class", "izgara");
  const izgaraK = svg.append("g").attr("class", "izgara").attr("opacity", 0);
  const ekX = svg.append("g").attr("class", "eksen");
  const ekY = svg.append("g").attr("class", "eksen");
  const alanG = svg.append("g");
  const cizgiG = svg.append("g").attr("fill", "none");
  const cubukG = svg.append("g");
  const kategoriG = svg.append("g");
  const notG = svg.append("g");

  const alanlar = alanG.selectAll("path").data(yigin).join("path")
    .attr("fill", (d, i) => RENK[YIGIN[i]]).attr("opacity", 0);
  const cYillik = cizgiG.append("path").attr("stroke", RENK.tr).attr("stroke-width", 2.5).attr("stroke-linejoin", "round");
  const cOrt = cizgiG.append("path").attr("stroke", RENK.tr).attr("stroke-width", 3.5).attr("opacity", 0).attr("stroke-linecap", "round");
  const cHidro = cizgiG.append("path").attr("stroke", RENK.hidro).attr("stroke-width", 3).attr("opacity", 0);
  const cWs = cizgiG.append("path").attr("stroke", RENK.ruzgar).attr("stroke-width", 3).attr("opacity", 0);

  let boyut = olc(kap);
  let aktif = -1;
  const kucuk = () => boyut.w < 520;

  /* ---------- Ölçekler ---------- */
  function zamanOlcek() {
    const { w, h } = boyut;
    const m = { t: 10, r: kucuk() ? 84 : 118, b: 26, l: 36 };
    const x = d3.scaleLinear().domain([ilk.yil, son.yil]).range([m.l, w - m.r]);
    const y = d3.scaleLinear().domain([0, 50]).range([h - m.b, m.t]);
    return { x, y, m };
  }
  function zamanEksenleri(t, { x, y, m }, goster) {
    const { w, h } = boyut;
    izgara.transition(t).attr("opacity", goster ? 1 : 0);
    ekY.transition(t).attr("opacity", goster ? 1 : 0);
    if (!goster) return;
    izgara.attr("transform", `translate(${m.l},0)`).transition(t).call(d3.axisLeft(y).ticks(5).tickSize(-(w - m.l - m.r)).tickFormat(""));
    ekY.attr("transform", `translate(${m.l},0)`).transition(t).call(d3.axisLeft(y).ticks(5).tickFormat((v) => "%" + v).tickSizeOuter(0));
    ekX.attr("transform", `translate(0,${h - m.b})`).transition(t).attr("opacity", 1)
      .call(d3.axisBottom(x).tickValues(kucuk() ? [2000, 2010, 2020, 2025] : [2000, 2005, 2010, 2015, 2020, 2025]).tickFormat(d3.format("d")).tickSizeOuter(0));
  }
  const cizgi = (x, y, alan) => d3.line().defined((d) => d[alan] != null).x((d) => x(d.yil)).y((d) => y(d[alan])).curve(d3.curveMonotoneX);

  /* ---------- Not (annotation) yardımcıları ---------- */
  function notlariTemizle() { notG.selectAll("*").interrupt().remove(); }
  function notYaz(x, y, satir, { cls = "not-yazi", anchor = "start", renk = null, gecikme = 0 } = {}) {
    const tx = notG.append("text").attr("class", cls + " halo").attr("x", x).attr("y", y).attr("text-anchor", anchor).attr("opacity", 0);
    if (renk) tx.style("fill", renk);
    [].concat(satir).forEach((s, i) => tx.append("tspan").attr("x", x).attr("dy", i ? "1.2em" : 0).text(s));
    tx.transition().delay(sure(gecikme)).duration(sure(300)).attr("opacity", 1);
    return tx;
  }
  function nokta(x, y, renk, r = 4.5, gecikme = 0) {
    notG.append("circle").attr("cx", x).attr("cy", y).attr("r", r).attr("fill", renk).attr("stroke", "#fff").attr("stroke-width", 1.5)
      .attr("opacity", 0).transition().delay(sure(gecikme)).duration(sure(300)).attr("opacity", 1);
  }
  function notCizgi(d, gecikme = 0, dash = null) {
    notG.append("path").attr("class", "not-cizgi").attr("d", d).attr("stroke-dasharray", dash).attr("opacity", 0)
      .transition().delay(sure(gecikme)).duration(sure(300)).attr("opacity", 1);
  }

  /* ---------- Gizleme yardımcıları ---------- */
  function zamanGizle(t) {
    [cYillik, cOrt, cHidro, cWs].forEach((c) => c.transition(t).attr("opacity", 0));
    alanlar.transition(t).attr("opacity", 0);
  }
  function cubukGizle(t) { cubukG.transition(t).attr("opacity", 0).on("end", () => cubukG.attr("display", "none")); }
  function kategoriGizle(t) { kategoriG.transition(t).attr("opacity", 0).on("end", () => kategoriG.attr("display", "none")); }

  /* ---------- Sahne 0–4: zaman serisi ---------- */
  function zamanSahnesi(t, sahne) {
    const o = zamanOlcek();
    const { x, y, m } = o;
    const { w } = boyut;
    zamanEksenleri(t, o, true);
    cubukGizle(t); kategoriGizle(t);
    izgaraK.transition(t).attr("opacity", 0);
    const alan = (yay) => d3.area().x((d) => x(d.data.yil)).y0((d) => y(yay ? d[0] : 0)).y1((d) => y(yay ? d[1] : 0)).curve(d3.curveMonotoneX);

    // Çizgiler
    cYillik.transition(t).attr("d", cizgi(x, y, "yenilenebilir_pay")(seri))
      .attr("opacity", { 0: 1, 1: 0.3, 2: 1, 3: 0.35, 4: 0.25 }[sahne])
      .attr("stroke", sahne === 4 ? RENK.murekkep2 : RENK.tr)
      .attr("stroke-width", { 0: 2.75, 1: 1.5, 2: 2, 3: 1.5, 4: 1.25 }[sahne]);
    cOrt.transition(t).attr("d", cizgi(x, y, "yenilenebilir_pay_ort3")(seri)).attr("opacity", sahne === 1 ? 1 : 0);
    cHidro.transition(t).attr("d", cizgi(x, y, "hidro_pay")(seri)).attr("opacity", sahne === 4 ? 1 : 0);
    cWs.transition(t).attr("d", cizgi(x, y, "ws_pay")(seri)).attr("opacity", sahne === 4 ? 1 : 0);

    // Alanlar
    const alanAcik = sahne === 2 || sahne === 3;
    alanlar.transition(t)
      .attr("d", alan(alanAcik))
      .attr("opacity", (d, i) => (!alanAcik ? 0 : sahne === 2 ? 0.9 : i === 0 ? 0.95 : 0.16));

    // Notlar
    const g0 = sure(450);
    if (sahne === 0) {
      nokta(x(ilk.yil), y(ilk.yenilenebilir_pay), RENK.tr, 5, g0);
      nokta(x(son.yil), y(son.yenilenebilir_pay), RENK.tr, 5, g0);
      notCizgi(`M${x(ilk.yil)},${y(ilk.yenilenebilir_pay) + 7}V${y(13) - 14}`, g0);
      notYaz(x(ilk.yil) + 6, y(13), [`${ilk.yil}: ${yuzde(ilk.yenilenebilir_pay)}`, "her 4 kWh'den 1'i"], { gecikme: g0 });
      notYaz(w - m.r + 10, y(son.yenilenebilir_pay) - 4,
        kucuk() ? [`${son.yil}:`, yuzde(son.yenilenebilir_pay)] : [`${son.yil}: ${yuzde(son.yenilenebilir_pay)}`, "her 5 kWh'den", "2'sinden fazlası"], { gecikme: g0 });
    } else if (sahne === 1) {
      const bas = seri.find((d) => d.yenilenebilir_pay_ort3 != null);
      nokta(x(bas.yil), y(ozet.ren_ort_bas), RENK.tr, 5, g0);
      nokta(x(son.yil), y(ozet.ren_ort_son), RENK.tr, 5, g0);
      notYaz(x(bas.yil) + 6, y(ozet.ren_ort_bas) + 34, [`${ozet.donem_bas} ortalaması`, yuzde(ozet.ren_ort_bas)], { gecikme: g0 });
      notYaz(x(son.yil) + 8, y(ozet.ren_ort_son) - 4, [`${ozet.donem_son}`, `ortalaması`, yuzde(ozet.ren_ort_son)], { gecikme: g0 });
      notYaz(x(ilk.yil) + 6, y(46), [`3 yıllık ortalama`, `${sayi(ozet.ren_kat)} katına çıktı`], { gecikme: g0 + 150 });
      notYaz(x(2008), y(10), ["İnce çizgi: yıllık değer"], { cls: "not-ince", gecikme: g0 + 150 });
    } else if (sahne === 2 || sahne === 3) {
      // Sağ kenarda katman etiketleri
      const etiketler = YIGIN.map((k, i) => {
        const s = yigin[i][yigin[i].length - 1];
        return { k, y: y((s[0] + s[1]) / 2), v: son[k + "_pay"] };
      });
      etiketleriAyir(etiketler, kucuk() ? 26 : 28, 12, boyut.h - m.b);
      etiketler.forEach((e) => notYaz(w - m.r + 8, e.y - 2, [KAYNAK_KISA[e.k], yuzde(e.v)], {
        renk: YAZI_RENK[e.k], gecikme: g0, cls: sahne === 3 && e.k !== "hidro" ? "not-ince" : "not-yazi",
      }));
      if (sahne === 2) {
        const oran = (ilk.hidro_pay / ilk.yenilenebilir_pay) * 100;
        notCizgi(`M${x(ilk.yil) + 2},${y(ilk.yenilenebilir_pay) - 6}V${y(39)}`, g0);
        notYaz(x(ilk.yil) + 6, y(43), [`${ilk.yil}: yenilenebilirin`, `${yuzde(oran, 0)} kadarı barajlardan`], { gecikme: g0 });
      } else {
        ozet.hidro_dip_yillari.forEach((yl, i) => {
          const d = seri.find((r) => r.yil === yl);
          nokta(x(yl), y(d.hidro_pay), RENK.hidro, 4.5, g0 + i * 80);
          notG.append("text").attr("x", yl === son.yil ? x(yl) - 3 : x(yl)).attr("y", y(d.hidro_pay) + 20).attr("text-anchor", yl === son.yil ? "end" : "middle")
            .style("fill", "#fff").style("font-weight", 700).text(kucuk() ? "'" + String(yl).slice(2) : yl).attr("opacity", 0)
            .transition().delay(g0 + i * 80).duration(sure(300)).attr("opacity", 1);
        });
        notYaz(x(ilk.yil) + 8, y(46), kucuk()
          ? ["Barajların payı (3 yıl ort.)", `${ozet.donem_bas}: ${yuzde(ozet.hidro_ort_bas)}`, `${ozet.donem_son}: ${yuzde(ozet.hidro_ort_son)}`]
          : ["Barajların payı, 3 yıllık ortalama:", `${ozet.donem_bas}: ${yuzde(ozet.hidro_ort_bas)}  →  ${ozet.donem_son}: ${yuzde(ozet.hidro_ort_son)}`], { gecikme: g0 + 300, renk: YAZI_RENK.hidro });
      }
    } else if (sahne === 4) {
      const etiketler = [
        { y: y(son.ws_pay), s: ["Rüzgâr+güneş", yuzde(son.ws_pay)], r: YAZI_RENK.ruzgar },
        { y: y(son.hidro_pay), s: ["Hidro", yuzde(son.hidro_pay)], r: YAZI_RENK.hidro },
        { y: y(son.yenilenebilir_pay), s: ["Toplam", "yenilenebilir"], r: RENK.murekkep2 },
      ];
      etiketleriAyir(etiketler, 30, 12, boyut.h - m.b);
      etiketler.forEach((e, i) => notYaz(w - m.r + 8, e.y - 2, e.s, { renk: e.r, gecikme: g0, cls: i === 2 ? "not-ince" : "not-yazi" }));
      nokta(x(son.yil), y(son.ws_pay), RENK.ruzgar, 5, g0);
      nokta(x(son.yil), y(son.hidro_pay), RENK.hidro, 5, g0);
      notCizgi(`M${x(son.yil) - 3},${y(son.ws_pay) - 8}L${x(son.yil) - 14},${y(33) + 18}`, g0 + 200);
      notYaz(x(son.yil) - 12, y(33), [`${ozet.ilk_gecis_yili}: rüzgâr ve güneş`, "ilk kez barajları geçti"], { anchor: "end", gecikme: g0 + 200 });
      const r2010 = seri.find((r) => r.yil === 2010);
      notYaz(x(2010), y(r2010.ws_pay) - 12, [`2010: ${yuzde(r2010.ws_pay)}`], { renk: YAZI_RENK.ruzgar, gecikme: g0 + 200, anchor: "middle" });
    }
  }

  /* ---------- Sahne 5–6: kaynak katkısı çubukları ---------- */
  function cubukSahnesi(t, sahne) {
    const { w, h } = boyut;
    zamanGizle(t); kategoriGizle(t);
    izgaraK.transition(t).attr("opacity", 0);
    izgara.transition(t).attr("opacity", 0); ekY.transition(t).attr("opacity", 0);
    const m = { t: 16, r: kucuk() ? 64 : 84, b: 34, l: kucuk() ? 104 : 168 };
    const veri = sahne === 5 ? cubukVeri.filter((d) => d.k !== "toplam") : cubukVeri;
    const alanY = Math.min(h - m.t - m.b, veri.length * (kucuk() ? 50 : 62));
    const ust = m.t + (h - m.t - m.b - alanY) / 2;
    const y = d3.scaleBand().domain(cubukVeri.map((d) => d.k)).range([ust, ust + alanY * (cubukVeri.length / veri.length)]).paddingInner(0.32);
    const deger = sahne === 5 ? (d) => d.twh_degisim : (d) => d.pay_degisim_puan;
    const alan = sahne === 5 ? [0, 40] : [kucuk() ? -9 : -12, 22];
    const x = d3.scaleLinear().domain(alan).range([m.l, w - m.r]);

    ekX.attr("transform", `translate(0,${ust + alanY + 6})`).transition(t).attr("opacity", 1)
      .call(d3.axisBottom(x).ticks(kucuk() ? 4 : 6).tickFormat((v) => sayi(v, 0)).tickSizeOuter(0));

    cubukG.attr("display", null).transition(t).attr("opacity", 1);
    const satir = cubukG.selectAll("g.satir").data(cubukVeri, (d) => d.k).join((enter) => {
      const g = enter.append("g").attr("class", "satir");
      g.append("rect").attr("rx", 2);
      g.append("text").attr("class", "ad").attr("text-anchor", "end").attr("dy", "0.35em");
      g.append("text").attr("class", "deger not-yazi").attr("dy", "0.35em");
      return g;
    });
    satir.transition(t).attr("opacity", (d) => (veri.includes(d) ? 1 : 0)).attr("transform", (d) => `translate(0,${y(d.k)})`);
    satir.select("rect").transition(t)
      .attr("x", (d) => x(Math.min(0, deger(d))))
      .attr("width", (d) => Math.abs(x(deger(d)) - x(0)))
      .attr("height", y.bandwidth())
      .attr("fill", (d) => (d.k === "toplam" ? RENK.murekkep : RENK[d.k]));
    satir.select(".ad").attr("x", m.l - 10).attr("y", y.bandwidth() / 2)
      .style("fill", (d) => (d.k === "toplam" ? RENK.murekkep : YAZI_RENK[d.k])).style("font-weight", 600)
      .text((d) => (kucuk() ? (d.k === "toplam" ? "Toplam" : KAYNAK_KISA[d.k]) : d.ad));
    satir.select(".deger").attr("y", y.bandwidth() / 2).transition(t)
      .attr("x", (d) => (deger(d) < 0 ? x(deger(d)) - 6 : x(deger(d)) + 6))
      .attr("text-anchor", (d) => (deger(d) < 0 ? "end" : "start"))
      .text((d) => (sahne === 5 ? "+" + sayi(d.twh_degisim) + (kucuk() ? "" : " TWh") : puan(d.pay_degisim_puan).replace(" puan", kucuk() ? "" : " puan")));

    // Sıfır çizgisi ve notlar
    const g0 = sure(500);
    notCizgi(`M${x(0)},${ust - 6}V${ust + alanY + 6}`, 0);
    const ruz = y("ruzgar"), gun = y("gunes") + y.bandwidth();
    const rg = cubukVeri.filter((d) => d.k === "ruzgar" || d.k === "gunes");
    const notX = x(d3.max(rg, deger)) + (kucuk() ? 44 : 76);
    const parantezX = Math.min(notX, w - 6);
    notCizgi(`M${parantezX - 6},${ruz}h6V${gun}h-6`, g0);
    const metin = sahne === 5
      ? [`Rüzgâr + güneş:`, `artışın ${yuzde(ozet.ws_twh_oran * 100, 0)}'ü`]
      : [`Rüzgâr + güneş:`, `${sayi(ozet.ws_pp)} puan`];
    if (kucuk()) notYaz(m.l - 96, ust + alanY + 46, [metin.join(" ")], { gecikme: g0 });
    else notYaz(parantezX - 10, gun + 22, metin, { anchor: "end", gecikme: g0 });
    if (sahne === 6) {
      const h0 = cubukVeri.find((d) => d.k === "hidro");
      notYaz(x(0) + 8, y("hidro") + y.bandwidth() / 2 + 4, ["← payı düştü"], { cls: "not-yazi", gecikme: g0, renk: YAZI_RENK.hidro });
    }
  }

  /* ---------- Sahne 7–8: G20 karşılaştırması ---------- */
  function kategoriSahnesi(t, sahne) {
    const { w, h } = boyut;
    zamanGizle(t); cubukGizle(t);
    izgara.transition(t).attr("opacity", 0); ekY.transition(t).attr("opacity", 0);
    const m = { t: 6, r: kucuk() ? 52 : 64, b: 28, l: kucuk() ? 104 : 150 };
    const deger = sahne === 7 ? (d) => d.ren_2024 : (d) => d.ws_2024;
    const sirali = [...satirlar].sort((a, b) => deger(b) - deger(a)).map((d) => d.country);
    const y = d3.scalePoint().domain(sirali).range([m.t + 8, h - m.b - 10]);
    const x = d3.scaleLinear().domain(sahne === 7 ? [0, 100] : [0, 50]).range([m.l, w - m.r]);
    const renk = (d) => (d.country === "Turkey" ? RENK.tr : d.tur === "toplam" ? RENK.murekkep : "#7D8B97");

    ekX.attr("transform", `translate(0,${h - m.b})`).transition(t).attr("opacity", 1)
      .call(d3.axisBottom(x).ticks(5).tickFormat((v) => "%" + v).tickSizeOuter(0));
    izgaraK.attr("transform", `translate(0,${h - m.b})`).transition(t).attr("opacity", 1)
      .call(d3.axisBottom(x).ticks(5).tickSize(-(h - m.b - m.t)).tickFormat(""));

    kategoriG.attr("display", null).transition(t).attr("opacity", 1);
    const satir = kategoriG.selectAll("g.satir").data(satirlar, (d) => d.country).join((enter) => {
      const g = enter.append("g").attr("class", "satir").attr("transform", (d) => `translate(0,${y(d.country)})`);
      g.append("line").attr("stroke-width", 2);
      g.append("circle").attr("class", "c0").attr("r", 4).attr("fill", "var(--kagit)").attr("stroke-width", 1.6);
      g.append("circle").attr("class", "c1").attr("r", 4.5);
      g.append("text").attr("class", "ad").attr("text-anchor", "end").attr("dy", "0.35em");
      g.append("text").attr("class", "deger").attr("dy", "0.35em");
      return g;
    });
    satir.transition(t).attr("transform", (d) => `translate(0,${y(d.country)})`);
    satir.select("line").transition(t)
      .attr("x1", (d) => x(sahne === 7 ? d.ren_2000 : 0)).attr("x2", (d) => x(deger(d)))
      .attr("stroke", (d) => (d.country === "Turkey" ? RENK.tr : RENK.acikGri)).attr("opacity", (d) => (d.country === "Turkey" ? 0.55 : 1));
    satir.select(".c0").transition(t).attr("cx", (d) => x(d.ren_2000)).attr("stroke", renk).attr("opacity", sahne === 7 ? 1 : 0);
    satir.select(".c1").transition(t).attr("cx", (d) => x(deger(d))).attr("fill", renk);
    satir.select(".ad").attr("x", m.l - 8)
      .attr("class", (d) => "ad" + (d.country === "Turkey" ? " tr-yazi" : ""))
      .style("font-style", (d) => (d.tur === "toplam" ? "italic" : null))
      .style("fill", (d) => (d.tur === "toplam" ? RENK.murekkep : null))
      .text((d) => d.kisa_ad);
    const vurgulu = new Set(sahne === 7 ? ["Turkey", "World", "European Union (27)", "Brazil"] : ["Turkey", "World", "European Union (27)", "China", "Germany"]);
    satir.select(".deger").transition(t)
      .attr("x", (d) => x(sahne === 7 ? Math.max(d.ren_2000, d.ren_2024) : deger(d)) + 9)
      .attr("opacity", (d) => (vurgulu.has(d.country) ? 1 : 0))
      .attr("class", (d) => "deger " + (d.country === "Turkey" ? "tr-yazi" : "not-yazi"))
      .text((d) => yuzde(deger(d)));

    const tr = satirlar.find((d) => d.country === "Turkey");
    const g0 = sure(550);
    if (sahne === 7 && !kucuk()) {
      notYaz(x(tr.ren_2000) - 9, y("Turkey") + 4, [`2000: ${yuzde(tr.ren_2000)}`], { anchor: "end", cls: "tr-yazi", gecikme: g0 });
    } else {
      const cin = satirlar.find((d) => d.country === "China");
      if (Math.abs(cin.ws_2024 - tr.ws_2024) < 1) {
        notYaz(x(tr.ws_2024) + 54, (y("Turkey") + y("China")) / 2, ["Çin'le", "başa baş"], { cls: "not-ince", gecikme: g0 });
      }
    }
  }

  /* ---------- Sahne tanımları ---------- */
  const p0 = yuzde(ilk.yenilenebilir_pay, 0), p1 = yuzde(son.yenilenebilir_pay, 0);
  const h0 = yuzde(ozet.hidro_ort_bas, 0), h1 = yuzde(ozet.hidro_ort_son, 0);
  const SAHNELER = [
    { tur: "zaman", baslik: `Yenilenebilir payı ${p0}${ek(p0, "den")} ${p1}${ek(p1, "e")} yükseldi`,
      birim: "Elektrik üretiminde yenilenebilir kaynakların payı, %", not: "",
      alt: `Çizgi grafik: Türkiye'de yenilenebilir kaynakların elektrik üretimindeki payı ${ilk.yil}'de ${p0}, ${son.yil}'te ${p1}.` },
    { tur: "zaman", baslik: `Üç yıllık ortalamayla bakınca pay ${sayi(ozet.ren_kat)} katına çıktı`,
      birim: "Elektrik üretiminde yenilenebilir kaynakların payı, %", not: "Kalın çizgi: o yıl ve önceki iki yılın ortalaması.",
      alt: `Kalın çizgi üç yıllık ortalamayı gösteriyor: ${ozet.donem_bas} ortalaması ${yuzde(ozet.ren_ort_bas)}, ${ozet.donem_son} ortalaması ${yuzde(ozet.ren_ort_son)}.` },
    { tur: "zaman", baslik: `${ilk.yil}${ek(String(ilk.yil), "de")} yenilenebilir elektriğin neredeyse tamamı barajlardan geliyordu`,
      birim: "Kaynaklara göre elektrik üretimindeki pay, % (üst üste)", not: "",
      alt: `Yığılmış alan grafik: hidroelektrik, jeotermal ve biyoenerji, rüzgâr ve güneşin payları. ${son.yil}'te hidro ${yuzde(son.hidro_pay)}, rüzgâr ${yuzde(son.ruzgar_pay)}, güneş ${yuzde(son.gunes_pay)}.` },
    { tur: "zaman", baslik: `Barajların payı yıldan yıla dalgalandı ve ${h0}${ek(h0, "den")} ${h1}${ek(h1, "e")} geriledi`,
      birim: "Kaynaklara göre elektrik üretimindeki pay, % (hidroelektrik vurgulu)", not: "Ortalamalar üç yıllıktır.",
      alt: `Hidroelektrik payı en düşük ${ozet.hidro_dip_yillari.join(", ")} yıllarında. Üç yıllık ortalama ${yuzde(ozet.hidro_ort_bas)} düzeyinden ${yuzde(ozet.hidro_ort_son)} düzeyine indi.` },
    { tur: "zaman", baslik: `${ozet.ilk_gecis_yili}${ek(String(ozet.ilk_gecis_yili), "de")} rüzgâr ve güneş ilk kez barajları geçti`,
      birim: "Elektrik üretimindeki pay, %", not: "",
      alt: `İki çizgi: rüzgâr ve güneşin toplam payı ${son.yil}'te ${yuzde(son.ws_pay)}, hidroelektrik ${yuzde(son.hidro_pay)}.` },
    { tur: "cubuk", baslik: "Üretim artışının yarısından fazlasını rüzgâr ve güneş karşıladı",
      birim: `${ozet.donem_bas} ortalamasından ${ozet.donem_son} ortalamasına üretim artışı, TWh`, not: "Dönemler üç yıllık ortalamalarla karşılaştırıldı.",
      alt: "Çubuk grafik: kaynaklara göre üretim artışı. " + cubukVeri.filter((d) => d.k !== "toplam").map((d) => `${d.ad} ${twh(d.twh_degisim)}`).join(", ") + "." },
    { tur: "cubuk", baslik: "Yenilenebilir payındaki artışın neredeyse tamamı rüzgâr ve güneşten geldi",
      birim: "Aynı dönemde elektrik üretimindeki payın değişimi, yüzde puan", not: "Puan: iki yüzde arasındaki fark.",
      alt: "Sapmalı çubuk grafik: paydaki değişim. " + cubukVeri.map((d) => `${d.ad} ${puan(d.pay_degisim_puan)}`).join(", ") + "." },
    { tur: "kategori", baslik: `Türkiye, yenilenebilir payında ${ozet.g20_n} G20 ülkesi içinde ${ozet.g20_sira}. sırada`,
      birim: `Yenilenebilir payı, %. Boş daire: 2000, dolu daire: ${ozet.karsilastirma_yili}`, not: `G20'nin 19 ülke üyesi ile Dünya ve AB-27 toplamları. ${ozet.yil_son} verisi her ülke için yayımlanmadığından ${ozet.karsilastirma_yili} kullanıldı.`,
      alt: `Halter grafik: Türkiye ${yuzde(ozet.tr_ren_2024)}, Dünya ${yuzde(ozet.dunya_ren_2024)}, AB-27 ${yuzde(ozet.ab_ren_2024)}.` },
    { tur: "kategori", baslik: "Rüzgâr ve güneşte Türkiye Çin'le başa baş, AB'nin gerisinde",
      birim: `Rüzgâr ve güneşin elektrik üretimindeki toplam payı, ${ozet.karsilastirma_yili}, %`, not: `G20'nin 19 ülke üyesi ile Dünya ve AB-27 toplamları.`,
      alt: `Lolipop grafik: rüzgâr ve güneş payı Türkiye ${yuzde(ozet.tr_ws_2024)}, Çin ${yuzde(ozet.cin_ws_2024)}, Dünya ${yuzde(ozet.dunya_ws_2024)}, AB-27 ${yuzde(ozet.ab_ws_2024)}.` },
  ];

  function ciz(i, animasyon = true) {
    const s = SAHNELER[i];
    boyut = olc(kap);
    svg.attr("width", boyut.w).attr("height", boyut.h);
    const t = svg.transition().duration(animasyon ? sure(750) : 0).ease(d3.easeCubicInOut);
    notlariTemizle();
    if (s.tur === "zaman") zamanSahnesi(t, i);
    else if (s.tur === "cubuk") cubukSahnesi(t, i);
    else kategoriSahnesi(t, i);
    baslikEl.textContent = s.baslik;
    birimEl.textContent = s.birim;
    notEl.textContent = s.not;
    ozetEl.textContent = s.alt;
  }

  /* ---------- Kaydırma: Intersection Observer ---------- */
  const adimlar = [...document.querySelectorAll(".adim")];
  function etkinlestir(i) {
    if (i === aktif) return;
    aktif = i;
    adimlar.forEach((a, j) => a.classList.toggle("aktif", j === i));
    ciz(i);
  }
  // Intersection Observer, hikâye bölümü ekrandayken kaydırma dinleyicisini açar/kapatır;
  // etkin adım, metin kutusunun tetik çizgisini (ekran yüksekliğinin %62/%75'i) geçip geçmediğine göre seçilir.
  let bekliyor = false;
  function hesapla() {
    bekliyor = false;
    const cizgiY = window.innerHeight * (window.innerWidth < 960 ? 0.75 : 0.62);
    let idx = 0;
    adimlar.forEach((a, i) => { if (a.querySelector("p").getBoundingClientRect().top < cizgiY) idx = i; });
    etkinlestir(idx);
  }
  const kaydirma = () => { if (!bekliyor) { bekliyor = true; requestAnimationFrame(hesapla); } };
  new IntersectionObserver((g) => {
    if (g[0].isIntersecting) { window.addEventListener("scroll", kaydirma, { passive: true }); hesapla(); }
    else window.removeEventListener("scroll", kaydirma);
  }).observe(document.getElementById("hikaye"));
  function gozlemciKur() {}

  etkinlestir(0);
  gozlemciKur();
  let sonGenislik = window.innerWidth;
  window.addEventListener("resize", geciktir(() => {
    const yeni = window.innerWidth;
    if ((yeni < 960) !== (sonGenislik < 960)) gozlemciKur();
    sonGenislik = yeni;
    ciz(aktif, false);
  }, 200));
}
