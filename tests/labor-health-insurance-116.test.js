#!/usr/bin/env node
/** Official 116 labor-insurance grade/rate checks for CalcTW.
 *  Sources recorded in labor-health-insurance/calc.js (bli.gov.tw, gazette, nhi.gov.tw).
 *  Run: node tests/labor-health-insurance-116.test.js
 */
"use strict";
const path = require("path");
const fs = require("fs");
const calc = require("../labor-health-insurance/calc.js");

let failed = 0;
function eq(name, got, expected) {
  const g = JSON.stringify(got), e = JSON.stringify(expected);
  if (g !== e) {
    console.error("FAIL", name, "got", g, "expected", e);
    failed++;
  } else {
    console.log("OK  ", name);
  }
}
function ok(name, cond, detail) {
  if (!cond) {
    console.error("FAIL", name, detail || "");
    failed++;
  } else {
    console.log("OK  ", name);
  }
}

// Official 116 LI table from 行政院公報 eg032212 .../num37/Eg.pdf
// and BLI https://www.bli.gov.tw/0100493.html
const LI116_OFFICIAL = [
  { level: 1, lo: 0, hi: 30900, amount: 30900 },
  { level: 2, lo: 30901, hi: 31800, amount: 31800 },
  { level: 3, lo: 31801, hi: 33300, amount: 33300 },
  { level: 4, lo: 33301, hi: 34800, amount: 34800 },
  { level: 5, lo: 34801, hi: 36300, amount: 36300 },
  { level: 6, lo: 36301, hi: 38200, amount: 38200 },
  { level: 7, lo: 38201, hi: 40100, amount: 40100 },
  { level: 8, lo: 40101, hi: 42000, amount: 42000 },
  { level: 9, lo: 42001, hi: 43900, amount: 43900 },
  { level: 10, lo: 43901, hi: Infinity, amount: 45800 }
];
// Official 116 OA table from BLI PDF https://www.bli.gov.tw/Files/26685
const OA116_OFFICIAL = [
  { level: 1, lo: 0, hi: 30900, amount: 30900 },
  { level: 2, lo: 30901, hi: 31800, amount: 31800 },
  { level: 3, lo: 31801, hi: 33300, amount: 33300 },
  { level: 4, lo: 33301, hi: 34800, amount: 34800 },
  { level: 5, lo: 34801, hi: 36300, amount: 36300 },
  { level: 6, lo: 36301, hi: 38200, amount: 38200 },
  { level: 7, lo: 38201, hi: 40100, amount: 40100 },
  { level: 8, lo: 40101, hi: 42000, amount: 42000 },
  { level: 9, lo: 42001, hi: 43900, amount: 43900 },
  { level: 10, lo: 43901, hi: 45800, amount: 45800 },
  { level: 11, lo: 45801, hi: 48200, amount: 48200 },
  { level: 12, lo: 48201, hi: 50600, amount: 50600 },
  { level: 13, lo: 50601, hi: 53000, amount: 53000 },
  { level: 14, lo: 53001, hi: 55400, amount: 55400 },
  { level: 15, lo: 55401, hi: 57800, amount: 57800 },
  { level: 16, lo: 57801, hi: 60800, amount: 60800 },
  { level: 17, lo: 60801, hi: 63800, amount: 63800 },
  { level: 18, lo: 63801, hi: 66800, amount: 66800 },
  { level: 19, lo: 66801, hi: 69800, amount: 69800 },
  { level: 20, lo: 69801, hi: Infinity, amount: 72800 }
];

eq("116 LI level amounts", calc.YEARS[116].liLevels, LI116_OFFICIAL.map(x => x.amount));
eq("116 OA level amounts", calc.YEARS[116].oaLevels, OA116_OFFICIAL.map(x => x.amount));
eq("116 LI has 10 grades", calc.YEARS[116].liLevels.length, 10);
eq("116 OA has 20 grades", calc.YEARS[116].oaLevels.length, 20);
eq("116 LI rate 12%", calc.YEARS[116].rateLI, 1200);
eq("116 min wage 30900", calc.YEARS[116].minWage, 30900);

function checkTable(label, official, lookupFn) {
  official.forEach(function (row) {
    const points = [row.hi === Infinity ? row.lo : row.hi, row.lo];
    if (row.lo > 0) points.push(row.lo, row.hi === Infinity ? row.lo + 1 : row.hi);
    if (row.hi !== Infinity) points.push(row.hi);
    Array.from(new Set(points)).forEach(function (s) {
      if (s < row.lo || s > row.hi) return;
      const got = lookupFn(s);
      eq(label + " salary " + s, got, { level: row.level, amount: row.amount });
    });
    // just below this grade should not map here (except grade 1)
    if (row.lo > 0) {
      const below = lookupFn(row.lo - 1);
      ok(label + " " + (row.lo - 1) + " is not grade " + row.level, below.level === row.level - 1, below);
    }
    // just above this grade
    if (row.hi !== Infinity) {
      const above = lookupFn(row.hi + 1);
      ok(label + " " + (row.hi + 1) + " is not grade " + row.level, above.level === row.level + 1, above);
    }
  });
}

checkTable("116 LI", LI116_OFFICIAL, s => calc.lookupLevel(calc.YEARS[116].liLevels, s));
checkTable("116 OA", OA116_OFFICIAL, s => calc.lookupLevel(calc.YEARS[116].oaLevels, s));

// Official monthly LI+EI share table (一般受僱、30日), BLI /Files/26672 ODS
const FEE116 = {
  30900: { emp: 804, er: 2812 },
  31800: { emp: 827, er: 2894 },
  33300: { emp: 866, er: 3030 },
  34800: { emp: 905, er: 3167 },
  36300: { emp: 944, er: 3303 },
  38200: { emp: 993, er: 3476 },
  40100: { emp: 1042, er: 3649 },
  42000: { emp: 1092, er: 3822 },
  43900: { emp: 1142, er: 3995 },
  45800: { emp: 1191, er: 4168 }
};
Object.keys(FEE116).forEach(function (k) {
  const a = Number(k);
  const r = calc.calcAll({ year: 116, salary: a, deps: 0, oaRatePct: 0.05, withEI: true });
  const emp = r.rows[0].emp + r.rows[1].emp;
  const er = r.rows[0].er + r.rows[1].er;
  eq("116 official fee table emp " + a, emp, FEE116[a].emp);
  eq("116 official fee table er " + a, er, FEE116[a].er);
});

// Worked examples requested: 30,900; 36,000; 45,800
(function () {
  const r = calc.calcAll({ year: 116, salary: 30900, deps: 0, oaRatePct: 0.05, withEI: true });
  eq("ex 30900 LI", r.li, { level: 1, amount: 30900 });
  eq("ex 30900 OA", r.oa, { level: 1, amount: 30900 });
  eq("ex 30900 LI emp/er/gov", [r.rows[0].emp, r.rows[0].er, r.rows[0].gov], [742, 2596, 371]);
  eq("ex 30900 EI emp", r.rows[1].emp, 62);
  eq("ex 30900 LI+EI emp", r.rows[0].emp + r.rows[1].emp, 804);
  // NHI/pension still 115 tables: 30,900 falls in 30,301–31,800 → 31,800
  eq("ex 30900 NHI stays on 115 table", r.nhi, { level: 3, amount: 31800 });
  eq("ex 30900 pension stays on 115 table", r.pen, { level: 27, amount: 31800 });
  ok("ex 30900 flags unpublished", r.unpublished.nhi && r.unpublished.pension);
})();
(function () {
  const r = calc.calcAll({ year: 116, salary: 36000, deps: 0, oaRatePct: 0.05, withEI: true });
  eq("ex 36000 LI", r.li, { level: 5, amount: 36300 });
  eq("ex 36000 LI emp/er/gov", [r.rows[0].emp, r.rows[0].er, r.rows[0].gov], [871, 3049, 436]);
  eq("ex 36000 EI emp", r.rows[1].emp, 73);
  eq("ex 36000 LI+EI emp", r.rows[0].emp + r.rows[1].emp, 944);
  eq("ex 36000 NHI 115 table", r.nhi, { level: 6, amount: 36300 });
})();
(function () {
  const r = calc.calcAll({ year: 116, salary: 45800, deps: 0, oaRatePct: 0.05, withEI: true });
  eq("ex 45800 LI", r.li, { level: 10, amount: 45800 });
  eq("ex 45800 LI emp/er/gov", [r.rows[0].emp, r.rows[0].er, r.rows[0].gov], [1099, 3847, 550]);
  eq("ex 45800 EI emp", r.rows[1].emp, 92);
  eq("ex 45800 LI+EI emp", r.rows[0].emp + r.rows[1].emp, 1191);
})();

// 115 figures must stay unchanged
eq("115 LI levels unchanged", calc.YEARS[115].liLevels, [29500,30300,31800,33300,34800,36300,38200,40100,42000,43900,45800]);
eq("115 OA levels unchanged", calc.YEARS[115].oaLevels, [29500,30300,31800,33300,34800,36300,38200,40100,42000,43900,45800,48200,50600,53000,55400,57800,60800,63800,66800,69800,72800]);
eq("115 LI rate 11.5%", calc.YEARS[115].rateLI, 1150);
eq("115 min wage 29500", calc.YEARS[115].minWage, 29500);
(function () {
  const r = calc.calcAll({ year: 115, salary: 30000, deps: 0, oaRatePct: 0.05, withEI: true });
  eq("115 salary 30000 LI", r.li, { level: 2, amount: 30300 });
  eq("115 salary 30000 LI emp", r.rows[0].emp, 697);
  eq("115 salary 30000 EI emp", r.rows[1].emp, 61);
  eq("115 salary 30000 NHI emp", r.nhiPerPerson, 470);
  eq("115 salary 30000 empInsurance", r.empInsurance, 1228);
  eq("115 salary 30000 net", r.net, 28772);
  eq("115 salary 30000 pension er", r.rows.find(x => x.name.indexOf("勞退雇主") === 0).er, 1818);
})();
(function () {
  const r = calc.calcAll({ year: 115, salary: 52000, deps: 1, oaRatePct: 0.05, withEI: true });
  eq("115 salary 52000 empInsurance (page example)", r.empInsurance, 2789);
  eq("115 salary 52000 employer total", r.total.er, 9828);
  eq("115 salary 52000 gov", r.total.gov, 1000);
  eq("115 salary 52000 net", r.net, 49211);
})();

eq("defaultYear before 2027-01-01 is 115", calc.defaultYear("2026-11-18T08:00:00"), 115);
eq("defaultYear on 2026-12-31 is 115", calc.defaultYear("2026-12-31T23:59:59"), 115);
eq("defaultYear on 2027-01-01 is 116", calc.defaultYear("2027-01-01T00:00:00"), 116);

// 116 still reuses 115 NHI / pension tables (unpublished)
ok("116 NHI table is 115 table", calc.YEARS[116].nhiLevels === calc.NHI_LEVELS_115 || JSON.stringify(calc.YEARS[116].nhiLevels) === JSON.stringify(calc.NHI_LEVELS_115));
ok("116 pension table is 115 table", calc.YEARS[116].pensionLevels === calc.PENSION_LEVELS_115 || JSON.stringify(calc.YEARS[116].pensionLevels) === JSON.stringify(calc.PENSION_LEVELS_115));
eq("NHI rate stays 5.17%", calc.RATE_COMMON.NHI, 517);
eq("avg dependents stays 0.56", calc.NHI_AVG_DEP, 0.56);

// Pages reference the shared module
["labor-health-insurance/index.html", "embed/labor-health-insurance/index.html"].forEach(function (rel) {
  const html = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
  ok(rel + " includes calc.js", html.indexOf("/labor-health-insurance/calc.js") !== -1);
  ok(rel + " has year selector", html.indexOf('id="rocYear"') !== -1);
  ok(rel + " does not inline old 115-only LI_LEVELS", html.indexOf("var LI_LEVELS") === -1);
});

if (failed) {
  console.error("\n" + failed + " test(s) failed");
  process.exit(1);
}
console.log("\nAll tests passed.");
