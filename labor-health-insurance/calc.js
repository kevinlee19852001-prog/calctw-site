/* CalcTW 勞健保計算核心（115／116 年）
 * 資料查核日期：2026-11-25
 * 可於瀏覽器以 LaborHealthCalc 使用，亦可由 Node 測試 require 本檔。
 */
(function (root) {
  "use strict";

  var DATA_UPDATED = "2026-11-25";

  /* 115 年全民健保投保金額分級表（115.01.01 生效）。
   * 來源：https://www.nhi.gov.tw/ch/cp-19421-f9533-2569-1.html
   * 截至 2026-11-25，健保署尚未公告 116 年分級表、費率或平均眷口數，116 年暫用本表。 */
  var NHI_LEVELS_115 = [29500,30300,31800,33300,34800,36300,38200,40100,42000,43900,45800,48200,50600,53000,55400,57800,60800,63800,66800,69800,72800,76500,80200,83900,87600,92100,96600,101100,105600,110100,115500,120900,126300,131700,137100,142500,147900,150000,156400,162800,169200,175600,182000,189500,197000,204500,212000,219500,228200,236900,245600,254300,263000,273000,283000,293000,303000,313000];

  /* 115 年勞工退休金月提繳分級表（115.01.01 生效）。
   * 來源：https://www.bli.gov.tw/0102563.html （附件：115年1月1日生效，/Files/25709） */
  var PENSION_LEVELS_115 = [1500,3000,4500,6000,7500,8700,9900,11100,12540,13500,15840,16500,17280,17880,19047,20008,21009,22000,23100,24000,25250,26400,27600,28590,29500,30300,31800,33300,34800,36300,38200,40100,42000,43900,45800,48200,50600,53000,55400,57800,60800,63800,66800,69800,72800,76500,80200,83900,87600,92100,96600,101100,105600,110100,115500,120900,126300,131700,137100,142500,147900,150000];

  /* 116 年勞工退休金月提繳分級表（116.01.01 生效）。
   * 勞動部 115 年 11 月 20 日勞動福 3 字第 1150154418 號令修正發布。
   * 來源：https://www.bli.gov.tw/0102563.html
   * 官方附件：PDF https://www.bli.gov.tw/Files/26719 、ODT https://www.bli.gov.tw/Files/26718
   * 與 115 年表逐級核對後，僅第 26 級實際工資 29,501–30,900 元、月提繳工資 30,900 元
   * （115 年為 29,501–30,300 元、30,300 元）；第 27 級改自 30,901 元起，其餘 61 級金額不變，仍為 62 級。 */
  var PENSION_LEVELS_116 = [1500,3000,4500,6000,7500,8700,9900,11100,12540,13500,15840,16500,17280,17880,19047,20008,21009,22000,23100,24000,25250,26400,27600,28590,29500,30900,31800,33300,34800,36300,38200,40100,42000,43900,45800,48200,50600,53000,55400,57800,60800,63800,66800,69800,72800,76500,80200,83900,87600,92100,96600,101100,105600,110100,115500,120900,126300,131700,137100,142500,147900,150000];

  /* 勞工職業災害保險適用行業別及費率表（114/1/1 起施行，每 3 年調整）— 行業別費率 %，另加上下班 0.07%
   * 來源：https://www.bli.gov.tw/Files/24759 */
  var OA_INDUSTRY = [
    ["01 農、林、牧業",0.18],["02 漁業",0.14],["03 石油及天然氣礦業、砂石採取及其他礦業",0.89],["04 食品及飼品、飲料及菸草製造業",0.15],["05 紡織業（紡織品製造業除外）",0.14],["06 紡織品製造業",0.10],["07 成衣及服飾品製造業",0.08],["08 皮革、毛皮及其製品製造業",0.13],["09 木竹製品及家具製造業",0.36],["10 紙漿、紙及紙製品製造業",0.32],["11 印刷及資料儲存媒體複製業",0.14],["12 石油及煤製品、化學材料、藥品等製造業",0.15],["13 橡膠製品、塑膠製品製造業",0.19],["14 非金屬礦物製品製造業",0.33],["15 基本金屬製造業",0.36],["16 金屬製品製造業",0.27],["17 金屬刀具、手工具及模具、金屬容器製造業",0.20],["18 電子零組件、電腦、電子產品及光學製品、電力設備製造業",0.05],["19 機械設備製造業、產業用機械設備維修及安裝業",0.19],["20 汽車及其零件、其他運輸工具製造業",0.19],["21 其他製造業",0.13],["22 電力及燃氣供應業",0.21],["23 廢水污水處理、廢棄物清除處理及資源回收業",0.32],["24 用水供應業",0.18],["25 建築工程業",0.50],["26 土木工程業",0.30],["27 庭園景觀工程業",0.38],["28 專門營造業",0.46],["29 機電、管道及其他建築設備安裝業",0.37],["30 批發業",0.12],["31 零售業",0.10],["32 陸上運輸業",0.32],["33 水上運輸業",0.80],["34 航空運輸業",0.14],["35 報關業及船務代理業",0.10],["36 運輸輔助業、倉儲業",0.16],["37 陸上運輸輔助業",0.14],["38 郵政及遞送服務業",0.13],["39 住宿業、餐飲業",0.12],["40 出版、影視、廣播電視及傳播業",0.06],["41 電信業",0.06],["42 電腦程式設計、諮詢及資訊服務業",0.05],["43 金融服務業、保險業、證券期貨業",0.05],["44 不動產開發、經營及相關服務業",0.09],["45 法律會計、管理顧問、建築工程服務、廣告、設計等專業服務業",0.08],["46 研究發展服務業",0.06],["47 旅行及其他相關服務業",0.07],["48 租賃、人力仲介、保全、建物及綠化服務等支援服務業",0.18],["49 公共行政及國防、強制性社會安全",0.12],["50 教育業",0.05],["51 醫療保健業、居住型照顧及社會工作服務業",0.05],["52 藝術、娛樂及休閒服務業",0.09],["53 宗教、職業及類似組織",0.07],["54 個人及家庭用品維修業",0.18],["55 未分類其他服務業",0.12]
  ];

  var RATE_COMMON = {
    EI: 100,         // 就業保險 1%
    NHI: 517,        // 健保 5.17%（110/1/1 起；116 年尚未見新公告）
    WAGE_FUND: 2.5,  // 積欠工資墊償基金 0.025%
    COMMUTE: 7       // 職災上下班費率 0.07%
  };
  var LI_SHARE = {emp:20, er:70, gov:10};
  var NHI_SHARE = {emp:30, er:60, gov:10};
  var NHI_AVG_DEP = 0.56; // 113/1/1 起；116 年尚未見新公告

  var YEARS = {
    115: {
      roc: 115,
      adYear: 2026,
      effective: "115年（2026年）1月1日起適用",
      minWage: 29500,
      liLevels: [29500,30300,31800,33300,34800,36300,38200,40100,42000,43900,45800],
      oaLevels: [29500,30300,31800,33300,34800,36300,38200,40100,42000,43900,45800,48200,50600,53000,55400,57800,60800,63800,66800,69800,72800],
      nhiLevels: NHI_LEVELS_115,
      pensionLevels: PENSION_LEVELS_115,
      rateLI: 1150, // 普通事故 11.5%（內含就保 1% 已另計，勞保以 11.5% 計收）
      liRateLabel: "11.5%",
      unpublished: {nhi:false, pension:false}
    },
    116: {
      roc: 116,
      adYear: 2027,
      effective: "116年（2027年）1月1日起適用",
      minWage: 30900,
      /* 勞工保險投保薪資分級表，勞動保2字第1150092891號令，116/1/1 生效。
       * 公報：https://gazette.nat.gov.tw/EG_FileManager/eguploadpub/eg032212/ch08/type1/gov82/num37/Eg.pdf
       * 勞保局：https://www.bli.gov.tw/0100493.html 、公告 https://www.bli.gov.tw/0110324.html
       * 第 1 級 30,900；刪除原第 2 級 30,300，其餘金額未修正、等級依序遞移，共 10 級。 */
      liLevels: [30900,31800,33300,34800,36300,38200,40100,42000,43900,45800],
      /* 勞工職業災害保險投保薪資分級表，勞動保3字第1150157778號令，116/1/1 施行。
       * 勞保局書表：https://www.bli.gov.tw/0106764.html （PDF https://www.bli.gov.tw/Files/26685）
       * 第 1 級 30,900，刪除 30,300，其餘金額未修正、等級依序遞移，共 20 級，最高 72,800。 */
      oaLevels: [30900,31800,33300,34800,36300,38200,40100,42000,43900,45800,48200,50600,53000,55400,57800,60800,63800,66800,69800,72800],
      nhiLevels: NHI_LEVELS_115,
      pensionLevels: PENSION_LEVELS_116,
      /* 勞工保險（普通事故）費率自 116/1/1 由 12.5% 調整為 13%，扣除就業保險 1% 後以 12% 計收。
       * 來源：https://www.bli.gov.tw/0110278.html 、https://www.bli.gov.tw/0110324.html */
      rateLI: 1200,
      liRateLabel: "12%",
      unpublished: {nhi:true, pension:false}
    }
  };

  var SOURCES = [
    ["勞動部勞工保險局｜116年1月1日起適用之勞保、災保投保薪資分級表及保險費分攤金額表已更新（2026-11-17）","https://www.bli.gov.tw/0110324.html"],
    ["勞動部勞工保險局｜自116年1月1日起，勞工保險費率依法調整為13%（含就業保險費率1%）（2026-10-21）","https://www.bli.gov.tw/0110278.html"],
    ["行政院公報｜修正「勞工保險投保薪資分級表」（勞動保2字第1150092891號，116/1/1生效）","https://gazette.nat.gov.tw/EG_FileManager/eguploadpub/eg032212/ch08/type1/gov82/num37/Eg.pdf"],
    ["勞動部勞工保險局｜勞工保險投保薪資分級表（116年1月1日起適用）","https://www.bli.gov.tw/0100493.html"],
    ["勞動部勞工保險局｜勞工職業災害保險投保薪資分級表（116年1月1日起適用）","https://www.bli.gov.tw/0106764.html"],
    ["勞動部勞工保險局｜一般單位保險費分擔金額表（116年1月1日起適用，用於驗證）","https://www.bli.gov.tw/0103196.html"],
    ["勞動部勞工保險局｜勞工保險投保薪資分級表（115年1月1日起適用）","https://www.bli.gov.tw/0005475.htm"],
    ["勞動部勞工保險局｜一般單位保險費分擔金額表（115年1月1日起適用，用於驗證）","https://www.bli.gov.tw/0011588.html"],
    ["勞動部勞工保險局｜勞保、就保、災保保險費試算","https://www.bli.gov.tw/0014162.html"],
    ["勞動部勞工保險局｜勞工職業災害保險適用行業別及費率表（114年1月1日起施行）","https://www.bli.gov.tw/Files/24759"],
    ["勞動部勞工保險局｜勞工退休金月提繳分級表（116年1月1日生效；勞動福3字第1150154418號令）","https://www.bli.gov.tw/0102563.html"],
    ["勞動部勞工保險局｜勞工退休金月提繳分級表（115年1月1日生效）","https://www.bli.gov.tw/0102563.html"],
    ["衛福部中央健康保險署｜投保金額分級表（115.01.01生效；截至2026-11-25尚未見116年表）","https://www.nhi.gov.tw/ch/cp-19421-f9533-2569-1.html"],
    ["衛福部中央健康保險署｜保險費負擔金額表：有一定雇主之受僱者（115.1.1生效）","https://www.nhi.gov.tw/ch/cp-19418-9eefb-2576-1.html"],
    ["衛福部中央健康保險署｜一般保險費計算公式及釋例（費率5.17%、平均眷口數0.56）","https://www.nhi.gov.tw/ch/cp-3277-6c895-2588-1.html"],
    ["行政院公報｜最低工資自116/1/1起月薪30,900元、時薪205元","https://gazette.nat.gov.tw/EG_FileManager/eguploadpub/eg032192/ch08/type1/gov82/num28/Eg.pdf"]
  ];

  function getYear(roc) {
    var y = YEARS[Number(roc)];
    if (!y) throw new Error("unsupported year: " + roc);
    return y;
  }

  /* 依瀏覽器／系統日期：2027-01-01 起預設 116 年，之前預設 115 年。 */
  function defaultYear(now) {
    var d = now ? new Date(now) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    return (d.getFullYear() >= 2027) ? 116 : 115;
  }

  function lookupLevel(levels, salary) {
    var s = Math.max(0, Number(salary) || 0);
    for (var i = 0; i < levels.length; i++) {
      if (s <= levels[i]) return {level: i + 1, amount: levels[i]};
    }
    return {level: levels.length, amount: levels[levels.length - 1]};
  }

  // amount × rate(萬分比) × share(%)，四捨五入
  function prem(amount, rateBp, sharePct) {
    return Math.round(amount * rateBp * sharePct / 1e6 + 1e-9);
  }

  function calcAll(opt) {
    opt = opt || {};
    var year = getYear(opt.year != null ? opt.year : defaultYear());
    var salary = Math.max(0, Number(opt.salary) || 0);
    var deps = Math.min(3, Math.max(0, parseInt(opt.deps, 10) || 0));
    var selfPct = Math.min(6, Math.max(0, Number(opt.selfPct) || 0));
    var oaRatePct = Number(opt.oaRatePct) || 0;
    var withEI = opt.withEI !== false;
    var li = lookupLevel(year.liLevels, salary);
    var oa = lookupLevel(year.oaLevels, salary);
    var nhi = lookupLevel(year.nhiLevels, salary);
    var pen = lookupLevel(year.pensionLevels, salary);
    var r = {year: year.roc, salary: salary, deps: deps, li: li, oa: oa, nhi: nhi, pen: pen, rows: [], unpublished: year.unpublished, minWage: year.minWage, liRateLabel: year.liRateLabel};
    r.rows.push({
      name: "勞保（普通事故 " + year.liRateLabel + "）",
      base: li.amount,
      emp: prem(li.amount, year.rateLI, LI_SHARE.emp),
      er: prem(li.amount, year.rateLI, LI_SHARE.er),
      gov: prem(li.amount, year.rateLI, LI_SHARE.gov)
    });
    if (withEI) {
      r.rows.push({
        name: "就業保險（1%）",
        base: li.amount,
        emp: prem(li.amount, RATE_COMMON.EI, LI_SHARE.emp),
        er: prem(li.amount, RATE_COMMON.EI, LI_SHARE.er),
        gov: prem(li.amount, RATE_COMMON.EI, LI_SHARE.gov)
      });
    }
    var oaBp = Math.round((oaRatePct * 100) + RATE_COMMON.COMMUTE);
    r.oaTotalPct = oaBp / 100;
    r.rows.push({name: "職災保險（" + (oaBp / 100).toFixed(2) + "%）", base: oa.amount, emp: 0, er: prem(oa.amount, oaBp, 100), gov: 0});
    var nhiPer = Math.round(nhi.amount * RATE_COMMON.NHI * NHI_SHARE.emp / 1e6 + 1e-9);
    r.nhiPerPerson = nhiPer;
    r.rows.push({
      name: "健保（本人＋" + deps + "眷口）",
      base: nhi.amount,
      emp: nhiPer * (1 + deps),
      er: Math.round(nhi.amount * RATE_COMMON.NHI / 1e4 * NHI_SHARE.er / 100 * (1 + NHI_AVG_DEP) + 1e-9),
      gov: Math.round(nhi.amount * RATE_COMMON.NHI / 1e4 * NHI_SHARE.gov / 100 * (1 + NHI_AVG_DEP) + 1e-9)
    });
    r.rows.push({name: "勞退雇主提繳（6%）", base: pen.amount, emp: 0, er: Math.round(pen.amount * 0.06), gov: 0, pension: true});
    if (selfPct > 0) r.rows.push({name: "勞退自提（" + selfPct + "%）", base: pen.amount, emp: Math.round(pen.amount * selfPct / 100), er: 0, gov: 0, pension: true});
    r.rows.push({name: "積欠工資墊償基金（0.025%）", base: li.amount, emp: 0, er: prem(li.amount, RATE_COMMON.WAGE_FUND, 100), gov: 0});
    var t = {emp: 0, er: 0, gov: 0};
    r.rows.forEach(function (x) { t.emp += x.emp; t.er += x.er; t.gov += x.gov; });
    r.total = t;
    r.empInsurance = r.rows.filter(function (x) { return !x.pension; }).reduce(function (a, x) { return a + x.emp; }, 0);
    r.empSelfPension = selfPct > 0 ? Math.round(pen.amount * selfPct / 100) : 0;
    r.net = salary - r.empInsurance - r.empSelfPension;
    r.belowMin = salary > 0 && salary < year.minWage;
    return r;
  }


  // 依各分表是否已公告，動態組合提示。已公告的分表不寫「尚未公告」，也不在「尚未公告」提示裡再加「已改採」，以免前後矛盾。
  function unpublishedNote(year) {
    if (year == null) return "";
    if (typeof year === "number") year = getYear(year);
    if (!year || year.roc !== 116) return "";
    var un = year.unpublished || {};
    var parts = [];
    if (un.nhi) parts.push("「全民健康保險投保金額分級表、費率與平均眷口數」尚未見健保署或行政院公報之新公告，健保仍暫以 115 年數字計算，不自行推估");
    if (un.pension) parts.push("「勞工退休金月提繳分級表」尚未見新公告，暫以 115 年數字計算，不自行推估");
    if (!parts.length) return "";
    return "注意：截至 2026-11-25，116 年" + parts.join("；") + "。勞保、職災級距與勞保費率（普通事故改以 12% 計收）則已改採 116 年 1 月 1 日生效的官方表。";
  }

  var api = {
    DATA_UPDATED: DATA_UPDATED,
    YEARS: YEARS,
    NHI_LEVELS_115: NHI_LEVELS_115,
    PENSION_LEVELS_115: PENSION_LEVELS_115,
    PENSION_LEVELS_116: PENSION_LEVELS_116,
    OA_INDUSTRY: OA_INDUSTRY,
    RATE_COMMON: RATE_COMMON,
    LI_SHARE: LI_SHARE,
    NHI_SHARE: NHI_SHARE,
    NHI_AVG_DEP: NHI_AVG_DEP,
    SOURCES: SOURCES,
    getYear: getYear,
    defaultYear: defaultYear,
    lookupLevel: lookupLevel,
    prem: prem,
    calcAll: calcAll,
    unpublishedNote: unpublishedNote
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LaborHealthCalc = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
