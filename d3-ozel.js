// Sitede yalnızca kullanılan D3 modüllerinden küçük bir paket üretir (Lighthouse performansı için).
// Üretmek için: npm i d3@7.9.0 esbuild
//   npx esbuild tools/d3-ozel.js --bundle --minify --format=iife --global-name=d3 --outfile=site/js/vendor/d3.ozel.v7.9.0.min.js
import "d3-transition";
export { select, selectAll, pointer } from "d3-selection";
export { scaleLinear, scaleBand, scalePoint } from "d3-scale";
export { axisLeft, axisBottom } from "d3-axis";
export { line, area, stack, curveMonotoneX } from "d3-shape";
export { max } from "d3-array";
export { format, formatLocale } from "d3-format";
export { csv, json } from "d3-fetch";
export { autoType } from "d3-dsv";
export { easeCubicInOut } from "d3-ease";
