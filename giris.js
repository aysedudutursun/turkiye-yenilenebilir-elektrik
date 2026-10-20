// Açılış şeridi (2000 ve son yıl kaynak karışımı) ve bağlam sütun grafiği.
import { RENK, KAYNAK_AD, yuzde, twh, sayi, olc } from "./ortak.js";
const d3 = window.d3;

const SIRA = ["hidro", "diger", "ruzgar", "gunes", "fosil"];

export function heroSerit(seri) {
  const kok = d3.select("#hero-serit");
  const ilk = seri[0];
  const son = seri[seri.length - 1];
  const satirlar = [ilk, son].map((r) => ({
    yil: r.yil,
    yen: r.yenilenebilir_pay,
    parcalar: [
      { k: "hidro", v: r.hidro_pay },
      { k: "diger", v: r.diger_pay },
      { k: "ruzgar", v: r.ruzgar_pay },
      { k: "gunes", v: r.gunes_pay },
      { k: "fosil", v: r.fosil_pay + r.nukleer_pay },
    ],
  }));

  const g = kok.select(".grafik").html("");
  satirlar.forEach((s) => {
    const satir = g.append("div").attr("class", "serit-satir");
    satir.append("div").attr("class", "serit-yil").text(s.yil);
    const alan = satir.append("div").attr("class", "serit-parca-alani");
    alan.append("div").attr("class", "serit-parantez")
      .style("width", `${s.yen}%`)
      .append("span").text(`Yenilenebilir ${yuzde(s.yen)}`);
    const serit = alan.append("div").attr("class", "serit");
    serit.selectAll("span").data(s.parcalar).join("span")
      .style("width", (d) => `${d.v}%`)
      .style("background", (d) => RENK[d.k])
      .classed("koyu-yazi", (d) => d.k !== "hidro")
      .attr("title", (d) => `${KAYNAK_AD[d.k]}: ${yuzde(d.v)}`)
      .text((d) => (d.v >= 9 ? yuzde(d.v, 0) : ""));
  });

  kok.select(".lejant").selectAll("li").data(SIRA).join("li")
    .html((k) => `<i style="background:${RENK[k]}"></i>${KAYNAK_AD[k]}`);
}

export function baglamGrafigi(seri, ozet) {
  const kap = document.querySelector("#baglam-grafik .grafik");
  const ciz = () => {
    const { w, h } = olc(kap);
    const m = { t: 34, r: 12, b: 26, l: 42 };
    const iw = w - m.l - m.r, ih = h - m.t - m.b;
    const svg = d3.select(kap).html("").append("svg").attr("width", w).attr("height", h).attr("aria-hidden", "true");
    const g = svg.append("g").attr("transform", `translate(${m.l},${m.t})`);
    const x = d3.scaleBand().domain(seri.map((d) => d.yil)).range([0, iw]).padding(0.18);
    const y = d3.scaleLinear().domain([0, 400]).range([ih, 0]);

    g.append("g").attr("class", "izgara").call(d3.axisLeft(y).ticks(4).tickSize(-iw).tickFormat(""));
    g.append("g").attr("class", "eksen").call(d3.axisLeft(y).ticks(4).tickFormat((v) => sayi(v, 0)));
    const adim = iw < 420 ? 10 : 5;
    g.append("g").attr("class", "eksen").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).tickValues(seri.map((d) => d.yil).filter((v) => v % adim === 0 || v === seri[seri.length - 1].yil)).tickSizeOuter(0));

    const uc = new Set([seri[0].yil, seri[seri.length - 1].yil]);
    g.selectAll("rect").data(seri).join("rect")
      .attr("x", (d) => x(d.yil)).attr("width", x.bandwidth())
      .attr("y", (d) => y(d.uretim_twh)).attr("height", (d) => ih - y(d.uretim_twh))
      .attr("fill", (d) => (uc.has(d.yil) ? RENK.murekkep : RENK.gri));

    // Açıklamalar
    const a = seri[0], b = seri[seri.length - 1];
    g.append("text").attr("class", "not-yazi halo").attr("x", x(a.yil)).attr("y", y(a.uretim_twh) - 8).text(twh(a.uretim_twh, 0));
    g.append("text").attr("class", "not-yazi halo").attr("x", x(b.yil) + x.bandwidth()).attr("y", y(b.uretim_twh) - 8)
      .attr("text-anchor", "end").text(twh(b.uretim_twh, 0));
    const ortaX = x(seri[Math.floor(seri.length * 0.42)].yil);
    g.append("text").attr("class", "not-ince halo").attr("x", ortaX).attr("y", y(330))
      .text(`25 yılda ${sayi(ozet.uretim_kat)} katı`);
    g.append("path").attr("class", "not-cizgi").attr("marker-end", "")
      .attr("d", `M${ortaX - 6},${y(300)} Q${x(b.yil) - 40},${y(380)} ${x(b.yil) - 4},${y(b.uretim_twh) - 22}`);
  };
  ciz();
  return ciz;
}
