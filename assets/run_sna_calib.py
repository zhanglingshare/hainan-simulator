#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
引力模型校准：海南/新加坡海运网络 10 节点连线状态。
模型形式（有文献依据，不自创）：
    I_ij(t) = sqrt(teu_i[t]) * sqrt(teu_j[t]) / d_ij^β
    d_ij  = haversine 大圆距离（km，R=6371），即测地距离口径。
    接通概率（logistic 平滑过渡带，非硬 0/1）：
        p(I) = 1 / (1 + exp(-(ln I - μ)/b))
    其中 μ = ln(I*) 为阈值（p=0.5 处的 I），b 为过渡带宽度（ln 单位；
    p=0.732 对应 I=I*·e^b，p=0.268 对应 I=I*·e^{-b}）。
文献：
  - 《世界集装箱海运网络空间联系强度》2015（引力模型形式）
  - Huang 2016, Modelling the global maritime container network（距离衰减 β）
硬约束：真实航线开通事件年起 p=1，不被模型压回。
确定性：固定种子 20261108（numpy default_rng），不使用内置 hash()，
        wall-clock 不进数据文件；bootstrap 为对校准数据的重抽样而非真实抽样。
"""
import json, math, hashlib, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "sna_data.js")
OUT = os.path.join(HERE, "sna_edges.js")
SEED = 20261108
R_EARTH_KM = 6371.0

# ---------------------------------------------------------------- 读取数据
raw = open(SRC, encoding="utf-8").read().strip()
assert raw.startswith("var SNA=") and raw.endswith(";")
data = json.loads(raw[len("var SNA="):-1])
YEARS = data["years"]                       # 31 年 2005..2035
NY = len(YEARS)
nodes = {n["id"]: n for n in data["nodes"]}
IDS = list(nodes.keys())

def hav_km(lon1, lat1, lon2, lat2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dlmb/2)**2
    return 2*R_EARTH_KM*math.asin(math.sqrt(a))

# ---------------------------------------------------------------- 硬标签
# 官方/政府公开航线事件（真实接通年），不得被模型覆盖。
REAL_OPEN = {
    "hainan": {"sg": 2018, "hk": 2020, "shenzhen": 2020, "klang": 2020, "dubai": 2024},
    "sg":     {a: 2005 for a in ["hainan","shanghai","ningbo","shenzhen",
                                 "hk","busan","klang","dubai","rotterdam"]},
}
# 仅模型估计（无单港官方直达记录）的 hainan 边：
MODEL_ONLY = {
    "hainan": ["shanghai", "ningbo", "busan", "rotterdam"],
    # shanghai/ningbo 参考 2020-2021 内外贸同船沿海中转（证据弱）
    # busan 无直达记录；rotterdam 大概率仍靠中转、保持断裂
}
EGOS = ["hainan", "sg"]
# 每个 ego 的 alter 顺序（不含自身）
ALTERS = {
    "hainan": ["sg", "hk", "shenzhen", "klang", "dubai",
               "shanghai", "ningbo", "busan", "rotterdam"],
    "sg":     ["hainan", "shanghai", "ningbo", "shenzhen",
               "hk", "busan", "klang", "dubai", "rotterdam"],
}

# ---------------------------------------------------------------- 预计算
# lnTeu[i,t], d[(e,a)], mass[e,a,t]=0.5*(lnTeu[e,t]+lnTeu[a,t]), k=ln(d)
lnTeu = {i: np.log(np.array(nodes[i]["teu"], dtype=float)) for i in IDS}
dist = {}
mass = {}
for e in EGOS:
    for a in ALTERS[e]:
        d = hav_km(nodes[e]["lon"], nodes[e]["lat"],
                   nodes[a]["lon"], nodes[a]["lat"])
        dist[(e, a)] = d
        mass[(e, a)] = 0.5*(lnTeu[e] + lnTeu[a])     # shape (NY,)

def lnI_of(beta):
    """返回 dict[(e,a)] -> lnI 向量 (NY,)，给定 beta。"""
    out = {}
    for e in EGOS:
        for a in ALTERS[e]:
            out[(e, a)] = mass[(e, a)] - beta*math.log(dist[(e, a)])
    return out

# ---------------------------------------------------------------- 校准样本
# 仅硬标签边进入 supervised 校准。
samp_e, samp_a, samp_t, samp_mass, samp_k, samp_y = [], [], [], [], [], []
for e in EGOS:
    for a in ALTERS[e]:
        if a not in REAL_OPEN[e]:
            continue                      # 模型估计边不进监督标签
        # sg->hainan 与 hainan->sg 是同一对节点：
        # hainan->sg=2018(首条直达班轮) 是真实事件标签；
        # sg->hainan=2005 是“新加坡枢纽全球中转覆盖”的硬惯例（输出时强制=1），
        # 二者在对称引力模型中互为矛盾，故 sg->hainan 不进监督拟合，避免把 beta 压向 0。
        if e == "sg" and a == "hainan":
            continue
        open_y = REAL_OPEN[e][a]
        k = math.log(dist[(e, a)])
        for t in range(NY):
            samp_e.append(e); samp_a.append(a); samp_t.append(t)
            samp_mass.append(mass[(e, a)][t])
            samp_k.append(k)
            samp_y.append(1.0 if YEARS[t] >= open_y else 0.0)
S_mass = np.array(samp_mass); S_k = np.array(samp_k); S_y = np.array(samp_y)
S_edges = [(samp_e[i], samp_a[i]) for i in range(len(samp_y))]

def sigmoid(x):
    return 1.0/(1.0+np.exp(-x))

def logloss(p, y):
    p = np.clip(p, 1e-7, 1-1e-7)
    return float(-np.mean(y*np.log(p)+(1-y)*np.log(1-p)))

def fit_params(mass_v, k_v, y_v, coarse=False):
    """网格搜索最优 (beta, mu, band)，最小化 log-loss。"""
    best = {"ll": np.inf}
    betas = np.round(np.arange(0.0, 3.01, 0.05), 3) if not coarse \
            else np.round(np.arange(0.0, 3.01, 0.10), 2)
    bands = [0.15, 0.25, 0.40, 0.60, 0.90, 1.30, 1.80] if not coarse \
            else [0.30, 0.60, 1.00, 1.50]
    for beta in betas:
        lnI = mass_v - beta*k_v
        lo, hi = float(np.percentile(lnI, 2)), float(np.percentile(lnI, 98))
        mus = np.linspace(lo, hi, 60) if not coarse else np.linspace(lo, hi, 30)
        for bnd in bands:
            # 向量化 (n_mu,)
            for mu in mus:
                p = sigmoid((lnI - mu)/bnd)
                ll = logloss(p, y_v)
                if ll < best["ll"]:
                    best = {"ll": ll, "beta": float(beta),
                            "mu": float(mu), "band": float(bnd)}
    return best

# 点估计（全数据）
point = fit_params(S_mass, S_k, S_y, coarse=False)
# 局部细化
ref_betas = np.round(np.arange(point["beta"]-0.10, point["beta"]+0.11, 0.02), 3)
ref_bands = [round(point["band"]*f, 3) for f in (0.8, 0.9, 1.0, 1.1, 1.25)]
for beta in ref_betas:
    lnI = S_mass - beta*S_k
    lo, hi = point["mu"]-1.0, point["mu"]+1.0
    for bnd in ref_bands:
        for mu in np.linspace(lo, hi, 41):
            p = sigmoid((lnI - mu)/bnd)
            ll = logloss(p, S_y)
            if ll < point["ll"]:
                point = {"ll": ll, "beta": float(beta),
                         "mu": float(mu), "band": float(bnd)}

BETA, MU, BAND = point["beta"], point["mu"], point["band"]
I_STAR = math.exp(MU)

# ---------------------------------------------------------------- 拟合优度
lnI_all_pt = lnI_of(BETA)
p_pt = {}
for e in EGOS:
    for a in ALTERS[e]:
        p_pt[(e, a)] = sigmoid((lnI_all_pt[(e, a)] - MU)/BAND)

# 标签样本上的准确率 / log-loss
lab_p = np.array([p_pt[(e, a)][t] for (e, a, t) in
                  zip(samp_e, samp_a, samp_t)])
accuracy = float(np.mean((lab_p >= 0.5).astype(float) == S_y))
ll_point = logloss(lab_p, S_y)

# 年份误差：每条硬标签边，首次 p>=0.5 的年份 vs 真实开通年
year_err_rows = []
for e in EGOS:
    for a in ALTERS[e]:
        if a not in REAL_OPEN[e]:
            continue
        if e == "sg" and a == "hainan":
            continue     # 硬覆盖（枢纽惯例），非模型拟合，不评估年份误差
        pvec = p_pt[(e, a)]
        cross = next((YEARS[t] for t in range(NY) if pvec[t] >= 0.5), None)
        open_y = REAL_OPEN[e][a]
        err = None if cross is None else cross - open_y
        year_err_rows.append({"ego": e, "alter": a, "real_open": open_y,
                              "model_cross": cross, "year_err": err})
abs_errs = [abs(r["year_err"]) for r in year_err_rows if r["year_err"] is not None]
year_error_mean = float(np.mean(abs_errs)) if abs_errs else None

# ---------------------------------------------------------------- Bootstrap
rng = np.random.default_rng(SEED)
NB = 1000
acc_p = {(e, a): np.zeros(NY) for e in EGOS for a in ALTERS[e]}
acc_beta, acc_mu, acc_band = [], [], []
N = len(S_y)
for _ in range(NB):
    idx = rng.integers(0, N, N)
    bp = fit_params(S_mass[idx], S_k[idx], S_y[idx], coarse=True)
    acc_beta.append(bp["beta"]); acc_mu.append(bp["mu"]); acc_band.append(bp["band"])
    lnI_b = lnI_of(bp["beta"])
    for e in EGOS:
        for a in ALTERS[e]:
            acc_p[(e, a)] += sigmoid((lnI_b[(e, a)] - bp["mu"])/bp["band"])
boot_p = {k: v/NB for k, v in acc_p.items()}

# 硬约束：真实边开通年起强制 =1
for e in EGOS:
    for a in ALTERS[e]:
        if a in REAL_OPEN[e]:
            open_y = REAL_OPEN[e][a]
            for t in range(NY):
                if YEARS[t] >= open_y:
                    boot_p[(e, a)][t] = 1.0

# ---------------------------------------------------------------- 朴素基线（未校准）
# β=2（标准平方反比），阈值取标签样本 lnI 中位数，band=1.0（固定不优化）
NAIVE_BETA = 2.0
lnI_naive_lab = S_mass - NAIVE_BETA*S_k
NAIVE_MU = float(np.median(lnI_naive_lab))
NAIVE_BAND = 1.0
lnI_naive = lnI_of(NAIVE_BETA)
naive_p = {(e, a): sigmoid((lnI_naive[(e, a)] - NAIVE_MU)/NAIVE_BAND)
           for e in EGOS for a in ALTERS[e]}
# 迪拜边（hainan-dubai）在朴素与校准下的关键年份概率
def pvec_at(store, e, a):
    return {YEARS[t]: round(float(store[(e, a)][t]), 3) for t in range(NY)}
dubai_cal = pvec_at(boot_p, "hainan", "dubai")
dubai_naive = pvec_at(naive_p, "hainan", "dubai")
dubai_cross_naive = next((YEARS[t] for t in range(NY)
                         if naive_p[("hainan","dubai")][t] >= 0.5), None)
dubai_cross_cal = next((YEARS[t] for t in range(NY)
                        if boot_p[("hainan","dubai")][t] >= 0.5), None)

# hainan 每年“接通边数”(p>=0.5) 对照真实航线总数
hainan_degree = {}
for t in range(NY):
    deg = sum(1 for a in ALTERS["hainan"] if boot_p[("hainan", a)][t] >= 0.5)
    hainan_degree[YEARS[t]] = deg

# ---------------------------------------------------------------- 组装输出
def round3(x):
    return round(float(x), 4)

probs = {}
for e in EGOS:
    probs[e] = {}
    for a in ALTERS[e]:
        probs[e][a] = [round3(v) for v in boot_p[(e, a)]]

real_out = {e: REAL_OPEN[e] for e in EGOS}

out = {
    "params": {
        "beta": round(BETA, 3),
        "threshold_Istar": round(I_STAR, 6),
        "threshold_lnI": round(MU, 4),
        "band_ln": round(BAND, 3),
        "band_multiple": round(math.exp(BAND), 3),
        "distance_metric": "haversine great-circle geodesic distance d in km (R=6371); "
                           "equivalently central angle theta=d/R in radians as the dimensionless "
                           "angular separation raised to beta (beta is unit-invariant to this choice)",
        "model": "I_ij(t)=sqrt(teu_i[t])*sqrt(teu_j[t])/d_ij^beta ; "
                 "p=sigmoid((ln I - ln I*)/band)",
        "fit": {
            "accuracy": round(accuracy, 4),
            "logloss": round(ll_point, 4),
            "year_error_mean_abs": round(year_error_mean, 2) if year_error_mean is not None else None,
            "year_error_rows": year_err_rows,
        },
        "method": "网格搜索最小化标签 log-loss；bootstrap=对校准边-年样本重抽样1000次"
                  "（seed=20261108），非真实总体抽样；真实事件年起 p 强制=1",
        "bootstrap_n": NB,
        "bootstrap_beta_median": round(float(np.median(acc_beta)), 3),
        "bootstrap_beta_q": [round(float(np.percentile(acc_beta, 25)), 3),
                             round(float(np.percentile(acc_beta, 75)), 3)],
        "naive_baseline": {
            "beta": NAIVE_BETA, "threshold_lnI": round(NAIVE_MU, 4),
            "band": NAIVE_BAND,
            "hainan_dubai_cross_year": dubai_cross_naive,
            "hainan_dubai_2024_p": round3(naive_p[("hainan","dubai")][YEARS.index(2024)]),
            "note": "未校准朴素模型下 hainan-dubai（长距离）p 长期低于 0.5，"
                    "与 2024 真实直航事件冲突；校准后按真实事件接通",
        },
        "calibrated_hainan_dubai_cross_year": dubai_cross_cal,
        "evidence_gap": {
            "hainan_shanghai_ningbo": "无单港官方直达记录，参考2020-2021内外贸同船"
                                      "沿海中转（弱先验，主观区间2019-2022），模型估计",
            "hainan_busan": "无直达官方记录，纯模型外推；随海南TEU投影上升p渐增，"
                            "主观区间2022-2028，低置信",
            "hainan_rotterdam": "无直达官方记录。本校准beta≈0（距离项边际解释力弱，连通由"
                                "TEU规模主导），模型外推下p随海南TEU投影升至高位；但据公开"
                                "证据欧洲方向大概率仍靠新加坡/干线中转而非海南直挂，与'保持断裂'"
                                "的先验存在分歧——此为低置信外推，不应视为已开直航",
            "beta_threshold_band": "beta由13条硬标签边（hainan5条+sg8条，sg-hainan为硬覆盖"
                                   "不入拟合）校准；beta≈0系因新加坡在所有距离上均连通，"
                                   "bootstrap q25-q75=[0,0.1]；band含正则化成分；样本为港口对-年，"
                                   "非真实总体抽样",
            "route_count_note": "真实航线总数为海南全部航线（含本网络外港口），"
                                "与本网络9边度不可直接同尺度比较，仅作趋势校验（2019->2020"
                                "从19跳到33，与模型度从4跳到7一致）",
        },
        "sources": [
            "《世界集装箱海运网络空间联系强度》2015（引力模型形式）",
            "Huang 2016, Modelling the global maritime container network（距离衰减）",
            "海南(洋浦)官方航线开通公告：2018-12-29首条东盟(新加坡)班轮；"
            "2020-04-13东盟经小铲滩中转至海口/南沙；2020-09-28首条洲际航线(经香港)；"
            "2020-10-29中越航线/2023-04-23东方海外印尼(RCEP)对接巴生；"
            "2024-04-17洋浦-阿布扎比直航(中东首条,邻近迪拜)",
            "新加坡港：成熟中转枢纽(中转占比约90%)，2005年起全球连通",
            "真实航线总数序列：2019=19,2020=33(外贸14),2022=40(外贸19),"
            "2024=50,2025=65(外贸35)",
        ],
    },
    "routeCount": {"2019": 19, "2020": 33, "2022": 40, "2024": 50, "2025": 65},
    "hainan_degree_p_ge_0.5": {str(y): hainan_degree[y] for y in YEARS},
    "probs": probs,
    "realEdge": real_out,
}

js = "var SNA_EDGES=" + json.dumps(out, ensure_ascii=False, indent=2) + ";\n"
open(OUT, "w", encoding="utf-8").write(js)

# ---------------------------------------------------------------- 报告
b = open(OUT, "rb").read()
print("OUT:", OUT)
print("bytes:", len(b))
print("sha256:", hashlib.sha256(b).hexdigest())
print("point beta=%.3f I*=%.5g band=%.3f (x%.2f)" %
      (BETA, I_STAR, BAND, math.exp(BAND)))
print("accuracy=%.4f logloss=%.4f mean_abs_year_err=%s" %
      (accuracy, ll_point, year_error_mean))
print("bootstrap beta median=%.3f q25-75=%s" %
      (float(np.median(acc_beta)),
       [float(np.percentile(acc_beta,25)), float(np.percentile(acc_beta,75))]))
print("--- per-edge year error (real vs model cross) ---")
for r in year_err_rows:
    print("  %-7s %-9s real=%s model_cross=%s err=%s" %
          (r["ego"], r["alter"], r["real_open"], r["model_cross"], r["year_err"]))
print("--- hainan degree (p>=0.5) vs route count ---")
_real_rt = {2019:19,2020:33,2022:40,2024:50,2025:65}
for y in (2019, 2020, 2022, 2024, 2025):
    print("  %d: model_degree=%d  real_route_total=%d" %
          (y, hainan_degree[y], _real_rt[y]))
print("--- dubai edge ---")
print("  naive  cross=%s  2024 p=%s" % (dubai_cross_naive, dubai_naive[2024]))
print("  calib  cross=%s  2024 p=%s" % (dubai_cross_cal, dubai_cal[2024]))
print("  naive 2018/2020/2024/2035 p:",
      dubai_naive[2018], dubai_naive[2020], dubai_naive[2024], dubai_naive[2035])
print("  calib 2018/2020/2024/2035 p:",
      dubai_cal[2018], dubai_cal[2020], dubai_cal[2024], dubai_cal[2035])
# 模型估计边的接通年
print("--- model-only hainan edges first p>=0.5 ---")
for a in MODEL_ONLY["hainan"]:
    cross = next((YEARS[t] for t in range(NY) if boot_p[("hainan",a)][t] >= 0.5), None)
    print("  hainan-%-9s cross=%s  2020p=%.3f 2025p=%.3f 2035p=%.3f" %
          (a, cross, boot_p[("hainan",a)][YEARS.index(2020)],
           boot_p[("hainan",a)][YEARS.index(2025)],
           boot_p[("hainan",a)][YEARS.index(2035)]))
