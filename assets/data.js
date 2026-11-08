/* 真实 v3 数据（来自 v3/ 各模块，逐字段可溯源） */
var YEARS=[2026,2027,2028,2029,2030,2031,2032,2033,2034,2035];
var LV={
  inst:['规则与制度','LV_inst'],conn:['全球连通','LV_conn'],alloc:['资源配置','LV_alloc'],
  resil:['战略韧性','LV_resil'],talent:['人才议程','LV_talent'],diff:['模式示范','LV_diff']};
var LV_ORDER=['inst','conn','alloc','resil','talent','diff'];

/* 多极情景确定性基线（baseline_trajectories.json functional_levels） */
var BASE={
  inst:[38,38.41,38.80,39.18,39.55,39.90,40.25,40.58,40.90,41.22],
  conn:[32,33.79,35.47,37.06,38.56,39.98,41.30,42.55,43.73,44.83],
  alloc:[22,22.91,23.74,24.50,25.19,25.82,26.40,26.92,27.40,27.84],
  resil:[42,42.23,42.45,42.65,42.84,43.01,43.18,43.34,43.48,43.62],
  talent:[28,28.24,28.46,28.67,28.86,29.04,29.21,29.37,29.52,29.66],
  diff:[34.93,35.37,35.79,36.20,36.60,36.98,37.36,37.71,38.06,38.40]
};
/* 2035 六维 fan（p10/p50/p90，四情景，mc_results.json fan_bands_2035） */
var FAN2035={
  multipolar:{
    inst:{p10:34.68,p50:41.52,p90:48.84},conn:{p10:34.93,p50:44.85,p90:55.97},
    alloc:{p10:21.72,p50:28.13,p90:35.20},resil:{p10:40.14,p50:43.74,p90:47.30},
    talent:{p10:22.70,p50:29.85,p90:37.69},diff:{p10:31.12,p50:38.56,p90:46.49}},
  bloc:{
    inst:{p10:35.05,p50:41.96,p90:49.49},conn:{p10:31.44,p50:39.92,p90:49.30},
    alloc:{p10:18.72,p50:24.60,p90:31.14},resil:{p10:39.51,p50:43.04,p90:46.64},
    talent:{p10:21.37,p50:27.87,p90:35.00},diff:{p10:31.48,p50:38.41,p90:45.73}},
  rebound:{
    inst:{p10:35.01,p50:41.95,p90:49.30},conn:{p10:34.49,p50:44.11,p90:54.72},
    alloc:{p10:23.04,p50:30.01,p90:37.22},resil:{p10:39.98,p50:43.63,p90:47.19},
    talent:{p10:22.69,p50:29.73,p90:37.52},diff:{p10:31.45,p50:38.36,p90:45.57}},
  conflict:{
    inst:{p10:33.73,p50:40.34,p90:47.23},conn:{p10:28.30,p50:35.42,p90:43.00},
    alloc:{p10:15.18,p50:20.75,p90:26.59},resil:{p10:38.63,p50:42.17,p90:45.75},
    talent:{p10:20.11,p50:26.23,p90:32.89},diff:{p10:30.57,p50:36.69,p90:42.96}}
};
var SCEN={multipolar:'多极区域化',bloc:'阵营碎片化',rebound:'全球化回潮',conflict:'高烈度冲突'};
/* 角色 2035 达成概率（far，mc_results） */
var ROLE_PROB={
  multipolar:{hub:0.0003,testbed:0,offshore:0,marine:0,south:0},
  bloc:{hub:0,testbed:0,offshore:0,marine:0,south:0},
  rebound:{hub:0.0004,testbed:0.0001,offshore:0,marine:0,south:0},
  conflict:{hub:0,testbed:0,offshore:0,marine:0,south:0}};
var ROLE={hub:'区域中转枢纽',testbed:'制度开放试验田',offshore:'离岸节点',marine:'热带海洋经济基地',south:'全球南方合作平台'};
/* Shapley 贡献（shapley_contributions.csv，取主要杠杆） */
var SHAPLEY=[
 {p:'改革兑现',v:2.79,share:27.87},{p:'连通投资',v:2.53,share:25.29},
 {p:'改革速率',v:2.07,share:20.66},{p:'连通速率',v:1.90,share:19.00},
 {p:'吸收能力',v:1.55,share:15.48},{p:'资本速率',v:1.41,share:14.08},
 {p:'人才速率',v:0.95,share:9.52},{p:'再投资增益',v:0.47,share:4.74},
 {p:'制度摩擦',v:-1.12,share:-11.18},{p:'资本侵蚀',v:-1.28,share:-12.76}];
/* Sobol（sensitivity.json，主要参数） */
var SOBOL=[
 {p:'改革兑现',si:0.363,st:0.243},{p:'连通投资',si:0.211,st:0.190},
 {p:'制度摩擦',si:0.204,st:0.039},{p:'改革速率',si:0.187,st:0.133},
 {p:'吸收能力',si:0.147,st:0.077},{p:'资本侵蚀',si:0.158,st:0.047},
 {p:'连通速率',si:0.694,st:0.128},{p:'资本速率',si:-0.141,st:0.064}];
/* ACH 排序（ach_matrix.json ranking） */
var ACH=[
 {h:'H7',lab:'仅达成1个角色（部分成功）',s:3.547},
 {h:'H2',lab:'制度开放试验田',s:2.862},{h:'H3',lab:'离岸节点',s:2.507},
 {h:'H5',lab:'全球南方合作平台',s:1.956},{h:'H1',lab:'区域中转枢纽',s:1.889},
 {h:'H4',lab:'热带海洋经济基地',s:1.498},{h:'H6',lab:'五角色均不达成',s:-4.625}];
/* 测量模型 CFA 汇总（measurement_model.json cfa_summary） */
var CFA=[
 {lv:'inst',n:43,load:0.457,cr:0.955,ave:0.442},
 {lv:'conn',n:40,load:0.734,cr:0.979,ave:0.546},
 {lv:'alloc',n:38,load:0.528,cr:0.959,ave:0.460},
 {lv:'resil',n:18,load:0.471,cr:0.911,ave:0.363},
 {lv:'talent',n:0,load:0.740,cr:0,ave:0},
 {lv:'diff',n:0,load:0.759,cr:0,ave:0}];
/* 综合分（六维均值） */
function composite(arr){var s=0;LV_ORDER.forEach(function(k){s+=arr[k];});return s/LV_ORDER.length;}

/* ===== SmartPLS 增强（真实数据） ===== */
/* 测量模式 reflective/formative */
var LV_MODE={inst:'reflective',conn:'reflective',alloc:'reflective',resil:'formative',talent:'reflective',diff:'formative'};
/* VIF 汇总（smartpls_measurement vif_summary） */
var VIF_SUM={
  inst:{n:43,max:6.776,mean:1.991,warn:true},conn:{n:40,max:4.174,mean:2.299,warn:false},
  alloc:{n:38,max:4.390,mean:1.962,warn:false},resil:{n:18,max:1.236,mean:1.225,warn:false},
  talent:{n:24,max:8.815,mean:3.434,warn:true},diff:{n:18,max:4.307,mean:2.553,warn:false}};
/* 权重最高的指标（bootstrap top_outer_weights，取前8） */
var TOP_WEIGHTS=[
 {ind:'企业所得税税率',lv:'diff',w:0.0677},{ind:'全口径一般公共预算收入',lv:'diff',w:0.0666},
 {ind:'加工增值30%免关税',lv:'diff',w:0.0665},{ind:'个税优惠累计减免',lv:'diff',w:0.0641},
 {ind:'企业所得税优惠减免',lv:'diff',w:0.0638},{ind:'一线放开二线管住',lv:'diff',w:0.0622},
 {ind:'地方一般公共预算收入',lv:'diff',w:0.0602},{ind:'跨境人民币收付额',lv:'resil',w:0.0596}];
/* R² 角色（smartpls_structural） */
var R2_ROLE={hub:0.572,testbed:0.565,offshore:0.568,marine:0.552,south:0.513};
/* 关键路径 bootstrap 显著性（smartpls_bootstrap，直接路径） */
var BOOT_PATH=[
 {from:'inst',to:'hub',mean:0.203,t:4.06,sig:'***'},{from:'inst',to:'testbed',mean:0.401,t:7.81,sig:'***'},
 {from:'conn',to:'hub',mean:0.449,t:8.82,sig:'***'},{from:'alloc',to:'offshore',mean:0.447,t:8.76,sig:'***'},
 {from:'resil',to:'marine',mean:0.400,t:7.83,sig:'***'},{from:'talent',to:'south',mean:0.253,t:5.01,sig:'***'},
 {from:'diff',to:'south',mean:0.351,t:6.90,sig:'***'},{from:'inst',to:'marine',mean:0.000,t:0.02,sig:'ns'}];
/* 门槛严格度曲线（probability_sensitivity strictness_curve） */
var STRICTNESS=[
 {shift:0,p:0.00098},{shift:-5,p:0.12725},{shift:-10,p:0.72561},{shift:-15,p:0.9865}];
/* k-of-n 达标曲线（probability_sensitivity k_of_n_curve） */
var KOFN=[
 {k:1,p:1.0},{k:2,p:1.0},{k:3,p:1.0},{k:4,p:0.99537},{k:5,p:0.17665},{k:6,p:0.00098}];
/* IPMA 优先级（ipma rows） */
var IPMA=[
 {lv:'alloc',imp:0.225,perf:22.0,gap:17.58,quad:'high_imp_low_perf'},
 {lv:'diff',imp:0.267,perf:35.0,gap:17.34,quad:'high_imp_high_perf'},
 {lv:'inst',imp:0.216,perf:38.0,gap:13.38,quad:'high_imp_high_perf'},
 {lv:'conn',imp:0.185,perf:32.0,gap:12.59,quad:'low_imp_low_perf'},
 {lv:'talent',imp:0.136,perf:28.0,gap:9.80,quad:'low_imp_low_perf'},
 {lv:'resil',imp:0.111,perf:42.0,gap:6.46,quad:'low_imp_high_perf'}];
