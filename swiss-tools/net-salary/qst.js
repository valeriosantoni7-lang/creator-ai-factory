/*
 * Swiss net salary engine (2026): social contributions + withholding tax (Quellensteuer /
 * impôt à la source) for all 26 cantons, from the official ESTV tariff files.
 * Works in the browser (window.SwissNet) and in Node (require("./qst.js")).
 * General information, not tax advice.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.SwissNet = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // 2026 values: AHV/IV information centre (leaflets 2.01 and 2.08) and FSIO amounts valid from 1 January 2026.
  var Y2026 = {
    ahv: 0.053, // OASI/DI/APG employee share
    alv: 0.011, // unemployment insurance, up to the ceiling
    alvCeiling: 148200,
    bvgThreshold: 22680, // 2nd pillar entry threshold
    bvgCoordination: 26460,
    bvgMax: 90720,
    bvgMinCoordinated: 3780,
    bvgCredits: { "18": 0, "25": 0.07, "35": 0.1, "45": 0.15, "55": 0.18 }, // by age band, split 50/50
  };
  var CANTONS = ["AG","AI","AR","BE","BL","BS","FR","GE","GL","GR","JU","LU","NE","NW","OW","SG","SH","SO","SZ","TG","TI","UR","VD","VS","ZG","ZH"];

  // Expand the compact run-length bands of a canton file: [[from, step, count], ...] -> [from, from+step, ...]
  function expand(d) {
    Object.keys(d.t).forEach(function (code) {
      var t = d.t[code], from = [];
      t.f.forEach(function (s) { for (var i = 0; i < s[2]; i++) from.push(Math.round((s[0] + s[1] * i) * 100) / 100); });
      t.from = from;
    });
    return d;
  }

  function rateFor(t, income) {
    var f = t.from, lo = 0, hi = f.length - 1, k = 0;
    while (lo <= hi) { var m = (lo + hi) >> 1; if (f[m] <= income) { k = m; lo = m + 1; } else hi = m - 1; }
    return t.r[k] / 10000;
  }
  function tax(t, income, rate) { return Math.max(t.m || 0, income * rate); }

  // Tariff code: A0 single, B married one income, C married two incomes, H single parent; + Y/N church tax.
  function tariffCode(d, x) {
    var base = x.situation === "A" ? "A0" : x.situation === "H" ? "H" + Math.max(1, x.children) : x.situation + x.children;
    var c = base + (x.church ? "Y" : "N");
    if (!d.t[c]) c = base + (x.church ? "N" : "Y");
    return d.t[c] ? c : null;
  }

  function bvgMinimum(gross, age, P) {
    if (gross < P.bvgThreshold) return 0;
    var coordinated = Math.max(Math.min(gross, P.bvgMax) - P.bvgCoordination, P.bvgMinCoordinated);
    return (coordinated * P.bvgCredits[age]) / 2;
  }

  /*
   * d: canton file (after expand). x: { gross, payments (12|13), age ("18"|"25"|"35"|"45"|"55"),
   *   situation ("A"|"B"|"C"|"H"), children (0-2), church (bool), nbu (% of gross, default 1.2),
   *   other (% of gross, default 0), bvg (% of gross, or null for the legal minimum) }
   */
  function calculate(d, x, P) {
    P = P || Y2026;
    var code = tariffCode(d, x); if (!code) return null;
    var t = d.t[code], S = x.gross, n = x.payments || 12, m = S / n;
    var base = Math.min(S, P.alvCeiling);
    var nbu = x.nbu == null ? 1.2 : x.nbu, other = x.other || 0;
    var year = { ahv: P.ahv * S, alv: P.alv * base, nbu: (nbu / 100) * base, other: (other / 100) * S,
                 bvg: x.bvg == null ? bvgMinimum(S, x.age || "25", P) : (x.bvg / 100) * S };
    var rN, rD, qN, qD = 0;
    if (d.annuale) { rN = rD = rateFor(t, S / 12); qN = tax(t, m, rN); qD = tax(t, 2 * m, rD); }
    else { rN = rateFor(t, m); qN = tax(t, m, rN); if (n === 13) { rD = rateFor(t, 2 * m); qD = tax(t, 2 * m, rD); } }
    function month(g, q) {
      var v = { gross: g, ahv: (year.ahv * g) / S, alv: (year.alv * g) / S, nbu: (year.nbu * g) / S, other: (year.other * g) / S, bvg: year.bvg / 12, withholding: q };
      v.net = g - v.ahv - v.alv - v.nbu - v.other - v.bvg - v.withholding; return v;
    }
    year.gross = S;
    year.withholding = n === 13 ? 11 * qN + qD : 12 * qN;
    year.net = S - year.ahv - year.alv - year.nbu - year.other - year.bvg - year.withholding;
    return { tariff: code, rate: rN, rate13: rD, month: month(m, qN), december: n === 13 ? month(2 * m, qD) : null, year: year, annualModel: d.annuale };
  }

  return { Y2026: Y2026, CANTONS: CANTONS, expand: expand, rateFor: rateFor, tariffCode: tariffCode, calculate: calculate };
});
