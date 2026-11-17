# swiss-tools

## net-salary

Net salary in Switzerland for people taxed at source (e.g. B permit), 2026:

- AHV/IV/EO 5.3%, unemployment 1.1% up to CHF 148,200, non-occupational accident (default 1.2%), 2nd pillar at the legal minimum by age band;
- the **official 2026 withholding tax tariffs of all 26 cantons** (ESTV), with the monthly and the annual model (FR, GE, TI, VD, VS) and the 13th salary;
- tariffs A (single), B (married, one income), C (married, two incomes), H (single parent), with or without church tax.

| File | |
|---|---|
| `qst.js` | The engine: `expand(cantonFile)` and `calculate(cantonFile, input)`. Browser (`window.SwissNet`) and Node |
| `index.html` | A standalone calculator page with the 26-canton comparison |
| `data/qst-2026/*.json` | One compact file per canton (rates per income band, minimum tax, model) |
| `tools/parse_qst.py` | Rebuilds the data from the ESTV files every January |
| `test.js` | Reference checks (`node test.js`) |

```js
const { expand, calculate } = require("./qst.js");
const zh = expand(require("./data/qst-2026/zh.json"));
calculate(zh, { gross: 80000, payments: 12, age: "25", situation: "A", children: 0, church: false }).month.net; // ≈ 5,507 CHF
```

`index.html` loads the data with `fetch`, so open it through a web server (`python3 -m http.server`), not as a file.

### Every January

1. Download `https://www.estv2.admin.ch/qst/YYYY/loehne/tarYYYYtxt.zip` and unzip it.
2. `python3 tools/parse_qst.py <folder> YYYY`
3. Update the contribution rates and 2nd pillar thresholds in `qst.js` (sources: AHV/IV leaflets 2.01 and 2.08, FSIO amounts for the year) and the reference values in `test.js`.

**Limits:** an estimate. Not for C permits (taxed through the tax return) or cross-border commuters; above CHF 120,000 a year the final tax comes from a mandatory tax return. Not tax advice.
