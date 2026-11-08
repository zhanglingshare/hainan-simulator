/* ============================================================
 * engine.js — 浏览器内决策推演内核
 * 确定性 SD：忠实移植 v3/dynamics/run_dynamics.py（显式 Euler, dt=.25）
 * MC：结构同 v3/mc/run_mc.py 的精简前端版（独立种子，近似，非 numpy 复现）
 * 精确结论以 Python v3 内核为准；本文件只供实时 what-if。
 * 兼容 Node（module.exports）与浏览器（window.Engine）
 * ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Engine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---------- 常量（与 run_dynamics.py 冻结值逐一对齐） ---------- */
  var SCENARIOS = ["multipolar_regionalization", "bloc_fragmentation",
    "globalization_rebound", "high_intensity_conflict"];

  var SCENARIO_MULTIPLIERS = {
    multipolar_regionalization: {LV_inst:1.05,LV_conn:1.25,LV_alloc:1.10,LV_resil:1.10,LV_talent:1.15,LV_diff:1.30},
    bloc_fragmentation: {LV_inst:1.10,LV_conn:0.90,LV_alloc:0.80,LV_resil:1.15,LV_talent:0.90,LV_diff:1.05},
    globalization_rebound: {LV_inst:1.10,LV_conn:1.20,LV_alloc:1.25,LV_resil:0.95,LV_talent:1.15,LV_diff:1.05},
    high_intensity_conflict: {LV_inst:0.90,LV_conn:0.60,LV_alloc:0.50,LV_resil:1.30,LV_talent:0.70,LV_diff:0.85}
  };

  function defaultParams() {
    return {
      initial_stocks: {institutional_capacity:38.0,connectivity_stock:32.0,talent_stock:28.0,capital_stock:22.0},
      levers: {reform_delivery:0.55,absorptive_capacity:0.40,institutional_friction:0.55,connectivity_investment:0.50},
      rate_constants: {k_reform:6.0,k_conn:5.5,k_talent:4.5,k_cap:5.0},
      erosion: {institutional_capacity:0.02,connectivity_stock:0.03,talent_stock:0.04,capital_stock:0.06},
      delays: {tau_reform:2.0,tau_reinvest:1.0},
      loop_gains: {alpha_r1_reinvest:0.60,alpha_r2_innovation:0.80,r3_trust_weight:0.40},
      balancing: {gamma_cost_talent:0.40,eta_cost_capital:0.20},
      derived_weights: {lv_diff_w_ic:0.83,lv_diff_w_spill:0.17,lv_diff_spill_credibility:0.5,
        lv_resil_endowment:42.0,lv_resil_base_mean:30.0,lv_resil_synergy:0.25},
      annual_growth_cap:8.0,
      diminishing_returns_decay:0.92
    };
  }

  var DT = 0.25;
  var STOCK_KEYS = ["institutional_capacity","connectivity_stock","talent_stock","capital_stock"];
  var LV_IDS = ["LV_inst","LV_conn","LV_alloc","LV_resil","LV_talent","LV_diff"];

  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  function r6(x) { return Math.round(x * 1e6) / 1e6; }

  function resolveMultipliers(scenarioId) {
    if (scenarioId === null || scenarioId === undefined) {
      var one = {}; LV_IDS.forEach(function (k) { one[k] = 1.0; }); return one;
    }
    if (!SCENARIO_MULTIPLIERS[scenarioId]) throw new Error("unknown scenario: " + scenarioId);
    return SCENARIO_MULTIPLIERS[scenarioId];
  }

  /* 参数覆盖：dict 叶子做浅合并，其余直接赋值（对齐 Python 逻辑） */
  function applyOverrides(p, dict) {
    Object.keys(dict).forEach(function (k) {
      var v = dict[k];
      if (v && typeof v === "object" && !Array.isArray(v) && p[k] && typeof p[k] === "object") {
        Object.keys(v).forEach(function (lk) { p[k][lk] = v[lk]; });
      } else p[k] = v;
    });
  }

  /* ---------- 毛流入（移植 _flows） ---------- */
  function flows(s, reformEff, absorptive, connInv, friction, p, m) {
    var ic = s.institutional_capacity, cs = s.connectivity_stock,
      ts = s.talent_stock, cps = s.capital_stock;
    var rc = p.rate_constants, lg = p.loop_gains, bl = p.balancing;

    var gapIc = 1 - ic / 100, gapCs = 1 - cs / 100,
      gapTs = 1 - ts / 100, gapCps = 1 - cps / 100;

    var reinvest = 1 + lg.alpha_r1_reinvest * (cs / 100);
    var innovation = 1 + lg.alpha_r2_innovation * (ts / 100) * (ic / 100);
    var trust = 0.5 + 0.5 * (ic / 100) * (0.5 + lg.r3_trust_weight * reformEff);
    var costPen = 1 - bl.gamma_cost_talent * (ts / 100) - bl.eta_cost_capital * (cps / 100);
    costPen = Math.max(0, costPen);

    return {
      institutional_capacity: rc.k_reform * reformEff * gapIc *
        (1 - lg.r3_trust_weight + lg.r3_trust_weight * ic / 100) * m.LV_inst,
      connectivity_stock: rc.k_conn * connInv * gapCs * reinvest * m.LV_conn,
      talent_stock: rc.k_talent * absorptive * gapTs * innovation * costPen * m.LV_talent,
      capital_stock: rc.k_cap * gapCps * trust * costPen * m.LV_alloc
    };
  }

  /* ---------- 六维功能水平（移植 _functional_levels） ---------- */
  function functionalLevels(s, reformEff, p, mOut, base2026) {
    var ic = s.institutional_capacity, cs = s.connectivity_stock,
      ts = s.talent_stock, cps = s.capital_stock;
    var w = p.derived_weights;

    var diffBase = w.lv_diff_w_ic * ic +
      w.lv_diff_w_spill * 100 * reformEff * w.lv_diff_spill_credibility;
    var meanStocks = (ic + cs + ts + cps) / 4;
    var resilBase = w.lv_resil_endowment +
      w.lv_resil_synergy * (meanStocks - w.lv_resil_base_mean);

    var lvDiff, lvResil;
    if (base2026) {
      lvDiff = base2026.LV_diff + (diffBase - base2026.LV_diff) * mOut.LV_diff;
      lvResil = base2026.LV_resil + (resilBase - base2026.LV_resil) * mOut.LV_resil;
    } else { lvDiff = diffBase; lvResil = resilBase; }

    return {
      LV_inst: clamp(ic,0,100), LV_conn: clamp(cs,0,100), LV_alloc: clamp(cps,0,100),
      LV_resil: clamp(lvResil,0,100), LV_talent: clamp(ts,0,100), LV_diff: clamp(lvDiff,0,100)
    };
  }

  /* ---------- SD 主接口（移植 simulate） ---------- */
  function simulate(parameterDict, scenarioId, years) {
    if (!years) years = [];
    if (!years.length) { for (var y = 2026; y <= 2035; y++) years.push(y); }
    years = years.map(Number);

    var p = defaultParams();
    if (parameterDict) applyOverrides(p, parameterDict);

    var m = resolveMultipliers(scenarioId);
    var s = {};
    Object.keys(p.initial_stocks).forEach(function (k) { s[k] = p.initial_stocks[k]; });
    var levers = p.levers, friction = levers.institutional_friction,
      absorptive = levers.absorptive_capacity, connInv = levers.connectivity_investment;

    function reformEff(delayed) { return delayed * (1 - 0.5 * friction); }

    var delayedReform = levers.reform_delivery;
    var delayedReinvest = 1.0;

    var base2026 = functionalLevels(s, reformEff(delayedReform), p, m, null);

    var stocksOut = {}, flOut = {};
    STOCK_KEYS.forEach(function (k) { stocksOut[k] = []; });
    LV_IDS.forEach(function (k) { flOut[k] = []; });

    var substeps = Math.round(1 / DT);
    for (var yi = 0; yi < years.length; yi++) {
      var reNow = reformEff(delayedReform);
      STOCK_KEYS.forEach(function (k) { stocksOut[k].push(r6(s[k])); });
      var fl = functionalLevels(s, reNow, p, m, base2026);
      LV_IDS.forEach(function (k) { flOut[k].push(r6(fl[k])); });

      if (yi === years.length - 1) break;

      for (var sp = 0; sp < substeps; sp++) {
        delayedReform += (levers.reform_delivery - delayedReform) / p.delays.tau_reform * DT;
        var reinvestSignal = 1 + p.loop_gains.alpha_r1_reinvest * (s.connectivity_stock / 100);
        delayedReinvest += (reinvestSignal - delayedReinvest) / p.delays.tau_reinvest * DT;

        var lrEff = reformEff(delayedReform);
        var flw = flows(s, lrEff, absorptive, connInv, friction, p, m);
        STOCK_KEYS.forEach(function (k) {
          s[k] += (flw[k] - p.erosion[k] * s[k]) * DT;
          s[k] = clamp(s[k], 0, 100);
        });
      }

      STOCK_KEYS.forEach(function (k) {
        var prev = stocksOut[k][stocksOut[k].length - 1];
        var disp = s[k] - prev;
        if (Math.abs(disp) > p.annual_growth_cap) {
          s[k] = prev + (disp > 0 ? p.annual_growth_cap : -p.annual_growth_cap);
          s[k] = clamp(s[k], 0, 100);
        }
      });
    }

    return {years:years, stocks:stocksOut, functional_levels:flOut,
      meta:{method:"explicit-Euler dt=.25", scenario:scenarioId || "none", seed:20261108}};
  }

  /* ============================================================
   * 随机数（独立种子，前端近似）
   * ============================================================ */
  function Rng(seed) {
    var a = seed >>> 0;
    function next() {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    var spare = null;
    function normal() {
      if (spare !== null) { var v = spare; spare = null; return v; }
      var u = 0, v2 = 0;
      while (u === 0) u = next();
      v2 = next();
      var mag = Math.sqrt(-2 * Math.log(u));
      spare = mag * Math.sin(2 * Math.PI * v2);
      return mag * Math.cos(2 * Math.PI * v2);
    }
    function triangular(lo, mode, hi) {
      var r = next(), fc = (mode - lo) / (hi - lo);
      if (r < fc) return lo + Math.sqrt(r * (hi - lo) * (mode - lo));
      return hi - Math.sqrt((1 - r) * (hi - lo) * (hi - mode));
    }
    function gamma(shape) {
      if (shape < 1) { var gg = gamma(shape + 1); return gg * Math.pow(next(), 1 / shape); }
      var d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
      while (true) {
        var x, vv;
        do { x = normal(); vv = 1 + c * x; } while (vv <= 0);
        vv = vv * vv * vv;
        var u2 = next();
        if (u2 < 1 - 0.00000001) return d * vv;
        if (Math.log(u2) < 0.5 * x * x + d * (1 - vv + Math.log(vv))) return d * vv;
      }
    }
    function beta(aa, bb) { var g1 = gamma(aa), g2 = gamma(bb); return g1 / (g1 + g2); }
    function lognormal(mu, sig) { return Math.exp(mu + sig * normal()); }
    function clampN(x, lo, hi) { return clamp(x, lo, hi); }
    return {next:next, normal:normal, triangular:triangular, beta:beta,
      gamma:gamma, lognormal:lognormal, clamp:clampN};
  }

  /* ---------- MC 门槛与不确定源（移植 run_mc 常量） ---------- */
  var ROLE_THRESHOLDS = {
    regional_transshipment_hub:[45,55,40,45,30,35],
    institutional_opening_testbed:[55,40,45,40,35,50],
    offshore_node:[55,45,50,45,45,35],
    tropical_marine_economy_base:[35,45,35,55,35,50],
    global_south_cooperation_platform:[45,50,40,45,45,55]
  };
  var STOCK_TRIANGLES = {
    institutional_capacity:[30,38,48], connectivity_stock:[25,32,42],
    talent_stock:[20,28,38], capital_stock:[15,22,32]
  };
  var LEVER_BETA = {
    reform_delivery:[5.5,4.5], absorptive_capacity:[4.0,6.0],
    institutional_friction:[5.5,4.5], connectivity_investment:[5.0,5.0]
  };
  var VOL = {rate:0.25, erosion:0.30, loop:0.30, balance:0.30, delay:0.20};
  var STAGE_IDX = {near:2, mid:6, far:9};

  /* 单轮参数抽样（移植 _build_parameter_dict） */
  function sampleParams(rng) {
    var init = {};
    STOCK_KEYS.forEach(function (k) {
      var t = STOCK_TRIANGLES[k]; init[k] = rng.triangular(t[0], t[1], t[2]);
    });
    var levers = {};
    Object.keys(LEVER_BETA).forEach(function (k) {
      levers[k] = rng.beta(LEVER_BETA[k][0], LEVER_BETA[k][1]);
    });
    function mult(base, vol, hi) {
      return base * rng.clamp(1 + rng.normal() * vol, 0.5, hi || 1.5);
    }
    var dp = defaultParams();
    var rc = {}, ero = {}, lg = {}, bal = {}, dl = {};
    Object.keys(dp.rate_constants).forEach(function(k){ rc[k]=mult(dp.rate_constants[k],VOL.rate); });
    Object.keys(dp.erosion).forEach(function(k){ ero[k]=mult(dp.erosion[k],VOL.erosion); });
    Object.keys(dp.loop_gains).forEach(function(k){ lg[k]=mult(dp.loop_gains[k],VOL.loop); });
    Object.keys(dp.balancing).forEach(function(k){ bal[k]=mult(dp.balancing[k],VOL.balance); });
    Object.keys(dp.delays).forEach(function(k){
      dl[k]=dp.delays[k]*rng.clamp(1+rng.normal()*VOL.delay,0.5,2.0);
    });
    return {initial_stocks:init,levers:levers,rate_constants:rc,erosion:ero,
      loop_gains:lg,balancing:bal,delays:dl};
  }

  /* 单次 MC：返回最终功能水平（含外层冲击），近似版（vol 用固定主观值） */
  function oneMcDraw(rng, sid, shockStd, opts) {
    var pd = sampleParams(rng);
    var res = simulate(pd, sid, null);
    var fl0 = [], flEnd = [];
    LV_IDS.forEach(function (lv, i) {
      fl0.push(res.functional_levels[lv][0]);
      flEnd.push(res.functional_levels[lv][res.functional_levels[lv].length - 1]);
    });
    var scenVol = 0.18; // 前端固定主观波动（Python 按 params 逐维）
    var out = [];
    for (var i = 0; i < 6; i++) {
      var mUncert = Math.exp(rng.normal() * scenVol);
      var rLv = rng.clamp(rng.beta(5, 2), 0, 1);
      var stdI = shockStd * (1 + 0.5 * (1 - rLv));
      var shock = rng.normal() * stdI;
      var v = fl0[i] + (flEnd[i] - fl0[i]) * mUncert + shock;
      out.push(rng.clamp(v, 0, 100));
    }
    return out;
  }

  /* 判定：给定六维分数与门槛向量，AND 全达标 */
  function allMet(scores, thr) {
    for (var i = 0; i < 6; i++) if (scores[i] < thr[i]) return false;
    return true;
  }
  /* k-of-n：至少 k 维达到对应门槛 */
  function kOfMet(scores, thr, k) {
    var c = 0;
    for (var i = 0; i < 6; i++) if (scores[i] >= thr[i]) c++;
    return c >= k;
  }

  /* 完整 MC 运行（可中断回调）。onProgress(done,total)；返回统计 */
  function runMonteCarlo(sid, n, shockStd, seed, onProgress) {
    var rng = Rng(seed || 20261108);
    var draws = [];
    for (var i = 0; i < n; i++) {
      draws.push(oneMcDraw(rng, sid, shockStd, {}));
      if (onProgress && (i % 200 === 0 || i === n - 1)) onProgress(i + 1, n);
    }
    function pct(p) {
      var arr = draws.map(function (d) { return d; });
      var col = function (i) { return arr.map(function (d) { return d[i]; }).sort(function (a, b) { return a - b; }); };
      var quant = function (sorted, q) {
        var idx = q * (sorted.length - 1), lo = Math.floor(idx), hi = Math.ceil(idx);
        if (lo === hi) return sorted[lo];
        return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
      };
      var bands = {};
      LV_IDS.forEach(function (lv, i) {
        var c = col(i);
        bands[lv] = {p10:r6(quant(c,.1)), p50:r6(quant(c,.5)), p90:r6(quant(c,.9))};
      });
      /* 角色 far 阶段 AND 概率 */
      var roleP = {};
      Object.keys(ROLE_THRESHOLDS).forEach(function (role) {
        var c = 0;
        draws.forEach(function (d) { if (allMet(d, ROLE_THRESHOLDS[role])) c++; });
        roleP[role] = r6(c / draws.length);
      });
      /* k-of-n 以中转枢纽门槛为基准 */
      var kcurve = {};
      for (var k = 1; k <= 6; k++) {
        var cc = 0;
        draws.forEach(function (d) { if (kOfMet(d, ROLE_THRESHOLDS.regional_transshipment_hub, k)) cc++; });
        kcurve[k] = r6(cc / draws.length);
      }
      return {bands:bands, roleP:roleP, kcurve:kcurve, draws:draws, n:draws.length};
    }
    return pct();
  }

  /* SEM do() 干预：对某 LV 施加 Δ，按总效应近似传导到角色（前端示意） */
  function intervene(roleBase, totalEffects, lvIndex, delta) {
    var out = {};
    Object.keys(roleBase).forEach(function (role) {
      var eff = totalEffects[role] && totalEffects[role][lvIndex] ? totalEffects[role][lvIndex] : 0;
      out[role] = r6(roleBase[role] + eff * delta);
    });
    return out;
  }

  return {
    constants:{SCENARIOS:SCENARIOS,LV_IDS:LV_IDS,STOCK_KEYS:STOCK_KEYS,
      ROLE_THRESHOLDS:ROLE_THRESHOLDS,STAGE_IDX:STAGE_IDX},
    Rng:Rng, simulate:simulate, runMonteCarlo:runMonteCarlo,
    allMet:allMet, kOfMet:kOfMet, intervene:intervene,
    defaultParams:defaultParams, r6:r6
  };
});
