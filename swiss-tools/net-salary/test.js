// Reference checks: node test.js
const fs = require("fs");
const path = require("path");
const { expand, calculate, CANTONS } = require("./qst.js");
const load = (kt) => expand(JSON.parse(fs.readFileSync(path.join(__dirname, "data/qst-2026", kt.toLowerCase() + ".json"), "utf-8")));

let fail = 0;
const check = (name, got, want, tol) => {
  const ok = Math.abs(got - want) <= tol;
  if (!ok) fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}: ${got.toFixed(2)} (expected ${want} ± ${tol})`);
};

// Single, 80,000 CHF, 12 payments, age 25-34, no church tax, Zurich.
const zh = calculate(load("ZH"), { gross: 80000, payments: 12, age: "25", situation: "A", children: 0, church: false });
check("ZH withholding rate %", zh.rate * 100, 7.46, 0.005);
check("ZH net per month", zh.month.net, 5507, 1);

// Every canton returns a result for the most common cases.
for (const kt of CANTONS) {
  const d = load(kt);
  for (const situation of ["A", "B", "C"]) {
    const r = calculate(d, { gross: 90000, payments: 13, age: "35", situation, children: situation === "A" ? 0 : 1, church: false });
    if (!r || !(r.year.net > 0 && r.year.net < 90000)) { fail++; console.log(`FAIL ${kt} ${situation}: no valid result`); }
  }
}
console.log(fail ? `${fail} check(s) failed` : "All checks passed");
process.exit(fail ? 1 : 0);
