/* ui.js — 调参共享：滑杆/分段/实时SVG渲染/worker/门槛即时重算 */
(function (root) {
  "use strict";
  var UI = {};

  function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}

  /* ---- 滑杆 ---- */
  UI.slider = function (parent, cfg) {
    var row = document.createElement("div");
    row.className = "slider-row";
    var fmt = cfg.format || function (v) { return v; };
    row.innerHTML =
      '<div class="sr-top"><label>'+esc(cfg.label)+'</label>'+
      '<span class="sr-val">'+fmt(cfg.value)+'</span></div>'+
      (cfg.sub ? '<div class="sr-sub">'+esc(cfg.sub)+'</div>' : '')+
      '<input type="range"'+(cfg.color?' class="'+cfg.color+'"':'')+
      ' min="'+cfg.min+'" max="'+cfg.max+'" step="'+cfg.step+'" value="'+cfg.value+'">';
    parent.appendChild(row);
    var input = row.querySelector("input"), val = row.querySelector(".sr-val");
    function fill() {
      var pct = (input.value - cfg.min) / (cfg.max - cfg.min) * 100;
      input.style.setProperty("--fill", pct + "%");
    }
    function get() { return parseFloat(input.value); }
    input.addEventListener("input", function () {
      val.textContent = fmt(get()); fill();
      if (cfg.onChange) cfg.onChange(get());
    });
    fill();
    return {get:get, set:function(v){input.value=v;val.textContent=fmt(v);fill();
      if(cfg.onChange)cfg.onChange(v);}, el:row};
  };

  /* ---- 分段按钮（单选） ---- */
  UI.segment = function (parent, items, onChange, initial) {
    var box = document.createElement("div");
    box.className = "seg-group";
    box.innerHTML = items.map(function (it) {
      return '<button data-v="'+esc(it.value)+'"'+(it.value===initial?' class="active"':'')+'>'+esc(it.label)+'</button>';
    }).join("");
    parent.appendChild(box);
    var current = initial;
    box.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        box.querySelectorAll("button").forEach(function (x){x.classList.remove("active");});
        b.classList.add("active"); current = b.dataset.v;
        onChange(current);
      });
    });
    return {get:function(){return current;}};
  };

  /* ---- 步进器 ---- */
  UI.stepper = function (parent, cfg) {
    var box = document.createElement("div");
    box.className = "stepper";
    box.innerHTML = '<button data-d="-1">−</button><div class="st-val">'+cfg.value+'</div><button data-d="1">+</button>';
    parent.appendChild(box);
    var val = box.querySelector(".st-val"), v = cfg.value;
    function render(){val.textContent=v;if(cfg.onChange)cfg.onChange(v);}
    box.querySelectorAll("button").forEach(function(b){
      b.addEventListener("click",function(){
        v = Math.max(cfg.min, Math.min(cfg.max, v + parseInt(b.dataset.d,10)));
        render();
      });
    });
    return {get:function(){return v;},set:function(x){v=x;render();}};
  };

  /* ---- 通用多线 SVG ---- */
  UI.lineChart = function (svg, series, opts) {
    opts = opts || {};
    var W = 900, H = 380, padL = 46, padR = 18, padT = 18, padB = 34;
    var n = series[0].values.length;
    var yMin = opts.yMin != null ? opts.yMin : 0;
    var yMax = opts.yMax != null ? opts.yMax : 100;
    function X(i){return padL + i * (W - padL - padR) / (n - 1);}
    function Y(v){return padT + (yMax - v) * (H - padT - padB) / (yMax - yMin);}
    var s = "";
    // grid
    for (var g = 0; g <= 4; g++) {
      var gv = yMin + (yMax - yMin) * g / 4, gy = Y(gv);
      s += '<line x1="'+padL+'" y1="'+gy+'" x2="'+(W-padR)+'" y2="'+gy+'" stroke="#eef2f7"/>';
      s += '<text x="'+(padL-8)+'" y="'+(gy+4)+'" text-anchor="end" font-size="11" fill="#93a0b1">'+Math.round(gv)+'</text>';
    }
    if (opts.refLine != null) {
      s += '<line x1="'+padL+'" y1="'+Y(opts.refLine)+'" x2="'+(W-padR)+'" y2="'+Y(opts.refLine)+
        '" stroke="#ed665e" stroke-width="1.5" stroke-dasharray="6 4"/>';
    }
    series.forEach(function (se) {
      var d = se.values.map(function (v, i) { return (i?"L":"M")+X(i).toFixed(1)+","+Y(v).toFixed(1); }).join("");
      s += '<path d="'+d+'" fill="none" stroke="'+se.color+'" stroke-width="'+(se.width||2.2)+'"'+(se.dash?' stroke-dasharray="'+se.dash+'"':'')+'/>';
    });
    if (opts.xLabels) {
      opts.xLabels.forEach(function (lb, i) {
        s += '<text x="'+X(i)+'" y="'+(H-10)+'" text-anchor="middle" font-size="11" fill="#93a0b1">'+lb+'</text>';
      });
    }
    s = '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">'+s+'</svg>';
    svg.innerHTML = s;
  };

  /* ---- 直方图 ---- */
  UI.histogram = function (svg, values, opts) {
    opts = opts || {};
    var W = 900, H = 340, padL = 46, padR = 18, padT = 16, padB = 34;
    var lo = opts.min, hi = opts.max, bins = opts.bins || 24;
    var counts = new Array(bins).fill(0);
    values.forEach(function (v) {
      var b = Math.floor((v - lo) / (hi - lo) * bins);
      b = Math.max(0, Math.min(bins - 1, b)); counts[b]++;
    });
    var maxC = Math.max.apply(null, counts);
    function X(i){return padL + i * (W-padL-padR)/bins;}
    function Y(c){return padT + (1 - c/maxC)*(H-padT-padB);}
    var bw = (W-padL-padR)/bins - 1;
    var s = "";
    counts.forEach(function (c, i) {
      if (c > 0) s += '<rect x="'+X(i).toFixed(1)+'" y="'+Y(c).toFixed(1)+'" width="'+bw.toFixed(1)+
        '" height="'+(H-padB-Y(c)).toFixed(1)+'" fill="'+(opts.color||"#1369eb")+'" opacity=".88" rx="1"/>';
    });
    s += '<text x="'+padL+'" y="'+(H-10)+'" font-size="11" fill="#93a0b1">'+lo.toFixed(0)+'</text>';
    s += '<text x="'+(W-padR)+'" y="'+(H-10)+'" text-anchor="end" font-size="11" fill="#93a0b1">'+hi.toFixed(0)+'</text>';
    svg.innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto">'+s+'</svg>';
  };

  /* ---- 从 draws 即时计算角色 AND 概率（含门槛偏移） ---- */
  UI.roleProbs = function (draws, thresholds) {
    var role = {};
    Object.keys(thresholds).forEach(function (rname) {
      var thr = thresholds[rname], c = 0;
      draws.forEach(function (d) {
        var ok = true;
        for (var i = 0; i < 6; i++) if (d[i] < thr[i]) { ok = false; break; }
        if (ok) c++;
      });
      role[rname] = c / draws.length;
    });
    return role;
  };
  /* ---- k-of-n 概率（以某门槛向量为基准） ---- */
  UI.kProbs = function (draws, thr) {
    var out = {};
    for (var k = 1; k <= 6; k++) {
      var c = 0;
      draws.forEach(function (d) {
        var met = 0;
        for (var i = 0; i < 6; i++) if (d[i] >= thr[i]) met++;
        if (met >= k) c++;
      });
      out[k] = c / draws.length;
    }
    return out;
  };
  /* 门槛整体偏移 */
  UI.shiftThr = function (base, shift) {
    var o = {};
    Object.keys(base).forEach(function (r) {
      o[r] = base[r].map(function (x) { return x + shift; });
    });
    return o;
  };

  /* ---- worker 调度 ---- */
  UI.workerRun = function (query, cbs) {
    var w = new Worker("assets/mc_worker.js");
    w.onmessage = function (ev) {
      if (ev.data.type === "progress" && cbs.onProgress) cbs.onProgress(ev.data);
      else if (ev.data.type === "done") { w.terminate(); cbs.onDone(ev.data.result); }
      else if (ev.data.type === "error") { w.terminate(); if (cbs.onError) cbs.onError(ev.data.message); }
    };
    w.postMessage(query);
    return w;
  };

  UI.esc = esc;
  root.UI = UI;
})(typeof self !== "undefined" ? self : window);
