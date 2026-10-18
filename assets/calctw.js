/* CalcTW shared helpers (no tracking): ?id=value prefill for calculator inputs, and embed-code copy button. */
(function(){
  // 網址參數優先：等頁面自己的 init（載入預設範例、產生動態欄位與選單）跑完後才套用 ?id=value，
  // 所以沒帶參數時照常顯示預設範例，帶了參數就覆蓋範例值並重新計算。
  function params(){
    var out = [];
    new URLSearchParams(location.search).forEach(function(v, k){
      if (/^[A-Za-z][\w-]{0,20}$/.test(k) && v.length <= 40) out.push([k, v]);
    });
    return out;
  }
  function apply(k, v){
    var el = document.getElementById(k);
    if (!el || !/^(INPUT|SELECT)$/.test(el.tagName) || el.type === "hidden") return false;
    if (el.tagName === "SELECT" && !Array.prototype.some.call(el.options, function(o){ return o.value === v; })) return false;
    el.value = v;
    el.dispatchEvent(new Event("input", {bubbles:true})); el.dispatchEvent(new Event("change", {bubbles:true}));
    return true;
  }
  function prefill(){
    var ps = params(), ok = {};
    if (!ps.length) return 0;
    // 第 1 輪：先套選單（選單的 change 可能會改寫其他欄位，例如縣市 → 起點地價），再套其他欄位
    ps.filter(function(p){ var e = document.getElementById(p[0]); return e && e.tagName === "SELECT"; })
      .concat(ps.filter(function(p){ var e = document.getElementById(p[0]); return !e || e.tagName !== "SELECT"; }))
      .forEach(function(p){ if (apply(p[0], p[1])) ok[p[0]] = p[1]; });
    // 第 2 輪：被別的欄位連動改掉的值再補回去
    Object.keys(ok).forEach(function(k){ var e = document.getElementById(k); if (e && e.value !== ok[k]) apply(k, ok[k]); });
    return Object.keys(ok).length;
  }
  function copyBtn(){
    var b = document.getElementById("embedCopy"); if (!b) return;
    b.addEventListener("click", function(){
      var ta = document.getElementById(b.getAttribute("data-target")), msg = document.getElementById("embedMsg");
      function done(ok){ if (msg) msg.textContent = ok ? "已複製！貼到您網站的 HTML 即可。" : "請手動選取上方代碼複製。"; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(function(){ done(true); }, function(){ ta.select(); done(document.execCommand && document.execCommand("copy")); });
      else { ta.select(); var ok = false; try { ok = document.execCommand("copy"); } catch(e){} done(ok); }
    });
  }
  var ran = false;
  function go(){ if (ran) return; ran = true; window.CALCTW_PREFILLED = prefill(); copyBtn(); }
  // 本檔以 defer 載入，執行時頁面 init 還沒跑（它們掛在 DOMContentLoaded）；
  // 這裡也掛 DOMContentLoaded，因為註冊較晚，會在頁面 init 之後才執行。
  if (document.readyState === "complete") go();
  else { document.addEventListener("DOMContentLoaded", function(){ setTimeout(go, 0); }); window.addEventListener("load", go); }
})();
