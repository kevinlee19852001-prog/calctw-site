/* CalcTW shared helpers (no tracking): ?id=value prefill for calculator inputs, and embed-code copy button. */
(function(){
  function prefill(){
    var q = new URLSearchParams(location.search), n = 0;
    q.forEach(function(v, k){
      if (!/^[A-Za-z][\w-]{0,20}$/.test(k) || v.length > 40) return;
      var el = document.getElementById(k);
      if (!el || !/^(INPUT|SELECT)$/.test(el.tagName) || el.type === "hidden") return;
      if (el.tagName === "SELECT" && !Array.prototype.some.call(el.options, function(o){ return o.value === v; })) return;
      el.value = v; n++;
      el.dispatchEvent(new Event("input", {bubbles:true})); el.dispatchEvent(new Event("change", {bubbles:true}));
    });
    return n;
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
  function go(){ window.CALCTW_PREFILLED = prefill(); copyBtn(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
})();
