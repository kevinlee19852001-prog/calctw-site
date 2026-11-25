#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const htmlPath = path.join(__dirname, "..", "shopee-seller-profit/index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const m = html.match(/\n\/\* ===== 蝦皮[\s\S]*?(?=\n<\/script>)/);
if (!m) { console.error("calculator script not found"); process.exit(1); }
const ctx = { console, module: { exports: {} }, exports: {}, Math };
vm.runInNewContext(m[0].replace(/if \(typeof document[\s\S]*$/, ""), ctx);
const api = {
  calcShopee: ctx.calcShopee,
  selfTests: ctx.selfTests,
  defaultScheduleId: ctx.defaultScheduleId
};
let failed = 0;
function eq(name, got, expected) {
  if (String(got) !== String(expected)) {
    console.error("FAIL", name, "got", got, "expected", expected);
    failed++;
  } else console.log("OK  ", name);
}
const t = api.selfTests();
t.forEach(function (x) {
  if (!x.pass) { console.error("FAIL self", x.name, "got", x.got, "expected", x.expected); failed++; }
  else console.log("OK  ", x.name);
});
eq("pages mention both effective dates", /2026 年 12 月 10 日/.test(html) && /2026 年 12 月 11 日/.test(html), true);
eq("page has schedule selector", html.indexOf('id="schedule"') !== -1, true);
eq("page links official 12/11 PDF host", html.indexOf("mms.file.susercontent.com") !== -1, true);
eq("does not invent a single 8% default for all 12/11 categories", /12\/11[^%]{0,40}8%/.test(html), false);
["shopee-seller-profit/index.html", "embed/shopee-seller-profit/index.html"].forEach(function (rel) {
  const t = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
  eq(rel + " has old/new schedule", t.indexOf('value="old"') !== -1 && t.indexOf('value="new"') !== -1, true);
  eq(rel + " states 12/10 and 12/11 dates", t.indexOf("12 月 10 日") !== -1 && t.indexOf("12 月 11 日") !== -1, true);
});

["shopee-seller-profit/index.html", "embed/shopee-seller-profit/index.html"].forEach(function (rel) {
  const t = fs.readFileSync(path.join(__dirname, "..", rel), "utf8");
  eq(rel + " footer date is 2026-11-25", t.indexOf("費率更新日期：2026-11-25") !== -1, true);
  eq(rel + " no stale 2026-10-26 rate date", t.indexOf("2026-10-26") === -1, true);
  eq(rel + " plan 2 footer points to 12/11 new rates", t.indexOf("12/11 起見上方新費率") !== -1, true);
  eq(rel + " changelog has no internal wording", t.indexOf("本機") === -1 && t.indexOf("尚未上正式站") === -1, true);
});
if (failed) { console.error("\n" + failed + " test(s) failed"); process.exit(1); }
console.log("\nAll shopee tests passed.");
