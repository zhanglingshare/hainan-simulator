/* 海南产业风洞 HIN-1.0.0, independent of existing double-island engine.
 * OBSERVED: official aggregate annual releases, distinct release vintages.
 * CONDITIONAL: directly chosen nominal sector rates. NOT an estimated causal policy model.
 * GRAPH: hypothesis topology, no observed firm-level transaction weights.
 * LOCAL VALUE: accounting identity with unobserved shares, not estimated value leakage.
 * Never map public trade/industry growth rates into invented network or GDP multipliers.
 */
(function(root,make){const obj=make();if(typeof module!=="undefined"&&module.exports)module.exports=obj;root.HainanModel=obj;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const SOURCES=Object.freeze({
 y2020:"https://stats.hainan.gov.cn/tjj/tjgb/fzgb/n_81550/202102/t20210220_2936215.html",
 y2021:"https://stats.hainan.gov.cn/tjj/tjgb/fzgb/n_83486/202202/t20220222_3146080.html",
 y2022:"https://stats.hainan.gov.cn/tjj/tjgb/fzgb/n_84743/202302/t20230217_3361879.html",
 y2023:"https://stats.hainan.gov.cn/tjj/tjgb/fzgb/2023/202402/t20240220_3598617.html",
 y2024:"https://stats.hainan.gov.cn/tjj/tjgb/fzgb/2023_87039/202503/t20250313_3832017.html",
 y2025:"https://stats.hainan.gov.cn/tjj/tjgb/fzgb/2023_88252/202602/t20260226_4032927.html",
 y2026h1:"https://stats.hainan.gov.cn/tjj/ywdt/xwfb/202607/t20260722_4115237.html",
 y2026m8:"https://stats.hainan.gov.cn/tjj/ywdt/xwfb/202609/t20260918_4149645.html",
 y2026q3:"https://www.cei.cn/defaultsite/s/article/2026/10/30/4b4ff607-9d914745-01a1-8b8b5a47-08d2_home.html?columnId=4028c7ca-37115425-0137-115c411b-1128&referCode=dqbghaifx"
});
const ANNUAL=Object.freeze([
 {year:2020,gdp:5532.39,sectors:[1135.98,1055.26,3341.15],realGrowth:3.5,source:"y2020",vintage:"2021-02初始公报"},
 {year:2021,gdp:6475.20,sectors:[1254.44,1238.80,3981.96],realGrowth:11.2,source:"y2021",vintage:"2022-02初始公报"},
 {year:2022,gdp:6818.22,sectors:[1417.79,1310.94,4089.49],realGrowth:0.2,source:"y2022",vintage:"2023-02初始公报"},
 {year:2023,gdp:7551.18,sectors:[1507.40,1448.45,4595.33],realGrowth:9.2,source:"y2023",vintage:"2024-02初始公报"},
 {year:2024,gdp:7935.69,sectors:[1627.63,1497.92,4810.14],realGrowth:3.7,source:"y2024",vintage:"2025-03初始公报"},
 {year:2025,gdp:8108.85,sectors:[1642.55,1463.86,5002.44],realGrowth:4.0,source:"y2025",vintage:"2026-02初始公报"}
].map(v=>Object.freeze({...v,sectors:Object.freeze(v.sectors)})));
const SIGNALS=Object.freeze([
 {id:"gdp",name:"GDP总量",value:8108.85,unit:"亿元",period:"2025全年",unitType:"current_CNY",tier:"A",src:"y2025"},
 {id:"industrial",name:"规上工业增加值同比",value:9.9,unit:"%",period:"2025全年",unitType:"real_yoy",tier:"A",src:"y2025"},
 {id:"investment",name:"固定资产投资（不含农户）同比",value:-16.5,unit:"%",period:"2025全年",unitType:"nominal_indicator_yoy",tier:"A",src:"y2025"},
 {id:"secondary",name:"第二产业增加值实际同比",value:1.0,unit:"%",period:"2025全年",unitType:"real_yoy",tier:"A",src:"y2025"},
 {id:"construction",name:"建筑业增加值实际同比",value:-10.4,unit:"%",period:"2025全年",unitType:"real_yoy",tier:"A",src:"y2025"},
 {id:"tradegoods",name:"货物进出口同比",value:-0.7,unit:"%",period:"2025全年",unitType:"trade_value_yoy",tier:"A",src:"y2025"},
 {id:"tradeservices",name:"服务进出口同比",value:22.1,unit:"%",period:"2025全年",unitType:"trade_value_yoy",tier:"A",src:"y2025"},
 {id:"tourism",name:"游客总花费同比",value:10.5,unit:"%",period:"2025全年",unitType:"tourism_spend_yoy",tier:"A",src:"y2025"},
 {id:"gdpQ3",name:"前三季度GDP实际同比",value:1.2,unit:"%",period:"2026年1—9月",unitType:"real_yoy",tier:"A",src:"y2026q3"},
 {id:"industrial8",name:"规上工业增加值同比",value:-6.2,unit:"%",period:"2026年1—8月",unitType:"real_yoy",tier:"A",src:"y2026m8"},
 {id:"trade8",name:"货物进出口同比",value:55.2,unit:"%",period:"2026年1—8月",unitType:"trade_value_yoy",tier:"A",src:"y2026m8"},
 {id:"invest8",name:"固定资产投资同比",value:-10.3,unit:"%",period:"2026年1—8月",unitType:"nominal_indicator_yoy",tier:"A",src:"y2026m8"}
]);
const DATA=Object.freeze({vintage:"2025统计公报（2026-02发布）",gdp:8108.85,sectors:Object.freeze([1642.55,1463.86,5002.44]),growthReal:4.0,
stats2025:{industrial:9.9,investment:-16.5,goodsTrade:-0.7,servicesTrade:22.1,tourismSpend:10.5},
stats2026H1:{gdp:3813.45,gdpReal:2.0,industry:-0.2,investment:-9.7,goodsTrade:59.9,highTech:9.4},
stats2026M8:{industrial:-6.2,goodsTrade:55.2,investment:-10.3},
stats2026Q3:{gdp:5812.55,gdpReal:1.2},
source2025:SOURCES.y2025,source2026:SOURCES.y2026m8,source2026Q3:SOURCES.y2026q3
});
const SECTOR_NAMES=Object.freeze(["第一产业","第二产业","第三产业"]);
const RATE_META=Object.freeze([
 {key:"primary",label:"第一产业：名义年变动假设",min:-6,max:10},
 {key:"secondary",label:"第二产业：名义年变动假设",min:-8,max:13},
 {key:"tertiary",label:"第三产业：名义年变动假设",min:-6,max:11}
]);
const MODELS=Object.freeze({
 constant:{name:"恒定条件",description:"各年的名义变动假设保持不变，作为最简单的会计基准"},
 decay:{name:"条件回归",description:"每年以70%保持原始偏离、30%向中性年增幅回归，非经验估计"},
 delay:{name:"兑现滞后",description:"2026年使用中性条件，2027年起才施加设定差异，非真实项目时滞估计"}
});
const BASE_RATES=Object.freeze([3,4,4.5]);
const PRESETS=Object.freeze({
 neutral:{name:"中性对照",tag:"比较起点",rates:[3,4,4.5],shock:0,volatility:1,model:"constant",breakLink:"none",localShare:50,supplierVA:45},
 industrial:{name:"制造能力增强",tag:"直接变动",rates:[3,6.5,4.5],shock:0,volatility:1,model:"constant",breakLink:"none",localShare:50,supplierVA:45},
 services:{name:"服务承接增强",tag:"直接变动",rates:[3,4,6.5],shock:0,volatility:1,model:"constant",breakLink:"none",localShare:65,supplierVA:45},
 agriculture:{name:"热带农业升级",tag:"直接变动",rates:[5.5,4,4.5],shock:0,volatility:1,model:"constant",breakLink:"agri-processing",localShare:50,supplierVA:45},
 pressure:{name:"投资和需求承压",tag:"红队条件",rates:[1,-1.5,2],shock:2,volatility:1.4,model:"delay",breakLink:"industry-service",localShare:35,supplierVA:45}
});
const BREAKS=Object.freeze({
 none:{label:"保留假设连接",from:null,to:null},
 "port-service":{label:"港口 → 专业服务暂时中断",from:"port",to:"services"},
 "industry-service":{label:"制造 → 专业服务暂时中断",from:"industry",to:"services"},
 "agri-processing":{label:"农业 → 加工冷链暂时中断",from:"agri",to:"processing"}
});
const NODES=Object.freeze(["port","industry","services","tourism","talent","agri","processing","income"]);
const EDGES=Object.freeze([
 ["port","industry"],["port","services"],["industry","services"],["services","tourism"],
 ["talent","industry"],["talent","services"],["agri","processing"],["processing","port"],
 ["processing","tourism"],["tourism","income"],["services","income"],["industry","income"],["agri","income"]
].map(([from,to])=>Object.freeze({from,to,grade:"H",meaning:"候选机制边，尚无真实交易权重"})));
const VERSION="HIN-1.0.0";
function clamp(v,a,b){v=Number(v);return Number.isFinite(v)?Math.max(a,Math.min(b,v)):a;}
function sanitize(raw={}){
 const r=raw||{},src=Array.isArray(r.rates)?r.rates:BASE_RATES;
 const rates=RATE_META.map((spec,i)=>Math.round(clamp(src[i]??BASE_RATES[i],spec.min,spec.max)*10)/10);
 return {rates,shock:Math.round(clamp(r.shock??0,0,8)*10)/10,
  volatility:Math.round(clamp(r.volatility??1,0,2.5)*10)/10,
  model:MODELS[r.model]?r.model:"constant",
  breakLink:BREAKS[r.breakLink]?r.breakLink:"none",
  localShare:Math.round(clamp(r.localShare??50,0,100)),
  supplierVA:Math.round(clamp(r.supplierVA??45,0,100)),
  diffusion:Math.round(clamp(r.diffusion??.45,0,.8)*100)/100};
}
function seeded(seed){let v=Number(seed)>>>0;return()=>{v+=0x6d2b79f5;let t=v;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function gaussian(rng){return Math.sqrt(-2*Math.log(Math.max(rng(),1e-10)))*Math.cos(2*Math.PI*rng());}
function qtile(arr,q){let x=arr.slice().sort((a,b)=>a-b),v=(x.length-1)*q,i=Math.floor(v);return x[i]+(x[Math.min(x.length-1,i+1)]-x[i])*(v-i);}
function historical(){
 return ANNUAL.map((v,i)=>{
  const prev=ANNUAL[i-1],delta=prev?v.gdp-prev.gdp:null;
  return {...v,nominalDifference:delta,nominalChangePct:prev?100*delta/prev.gdp:null,
   shares:v.sectors.map(s=>s/v.sectors.reduce((a,b)=>a+b,0)*100),
   sectorDifference:prev?v.sectors.map((s,j)=>s-prev.sectors[j]):null,
   hhi:v.sectors.reduce((acc,s)=>acc+(s/v.gdp)**2,0),
   warning:"不同年度初始公报版本未经统一修订；跨年现价差不是不变价增速或因果贡献。"};
 });
}
function structuralDistance(yearA,yearB){const rows=historical(),a=rows.find(v=>v.year===yearA),b=rows.find(v=>v.year===yearB);
 if(!a||!b)throw new Error("unknown year");
 const p=a.shares.map(v=>v/100),r=b.shares.map(v=>v/100),m=p.map((v,i)=>(v+r[i])/2);
 const kl=(u,w)=>u.reduce((z,v,i)=>z+(v>0?v*Math.log2(v/w[i]):0),0);
 return Math.sqrt(Math.max(0,(kl(p,m)+kl(r,m))/2));
}
function accounting({localShare=50,supplierVA=45,amount=100}={}){
 const share=clamp(localShare,0,100)/100,va=clamp(supplierVA,0,100)/100,A=clamp(amount,0,1e9);
 const localPurchase=A*share,externalPurchase=A-localPurchase,localVA=localPurchase*va,localIntermediate=localPurchase-localVA;
 return {amount:A,localPurchase,externalPurchase,localVA,localIntermediate,
   check:localVA+localIntermediate+externalPurchase,
   identification:{observedLocalShare:false,observedSupplierVA:false,unrestricted:[0,A],
    fixedVAOnly:[0,A*va]},
   interpretation:"规范化采购会计恒等式。未经实测，不能换算海南GDP或声称真实价值外流。"};
}
function propagation(raw={},start="port"){
 const c=sanitize(raw),active=EDGES.filter(e=>!(e.from===BREAKS[c.breakLink].from&&e.to===BREAKS[c.breakLink].to));
 const out=Object.fromEntries(NODES.map(n=>[n,0]));if(!NODES.includes(start))throw new Error("unknown source node");
 out[start]=1;let wave=Object.assign({},out),rounds=[];
 for(let step=1;step<=3;step++){
  const next=Object.fromEntries(NODES.map(n=>[n,0]));
  for(const e of active){const degree=active.filter(z=>z.from===e.from).length;next[e.to]+=c.diffusion*wave[e.from]/degree;}
  for(const n of NODES)out[n]+=next[n];wave=next;rounds.push({...next});
 }
 return {nodes:NODES,edges:active,broken:c.breakLink,seed:start,exposure:out,rounds,
  countReachable:Object.values(out).filter(v=>v>1e-9).length,
  metric:"单位冲击的假设有向关系暴露指数，非经济损失或真实系数"};
}
function effectiveRate(c,s,y){
 const base=BASE_RATES[s],desired=c.rates[s];
 if(c.model==="constant")return desired;
 if(c.model==="delay")return y===2026?base:desired;
 const pow=Math.pow(.70,y-2026);
 return base+(desired-base)*pow;
}
function simulate(raw={},options={}){
 const c=sanitize(raw),draws=Math.round(clamp(options.draws??400,100,1600));
 const seed=(Number(options.seed??20261116)>>>0),rnd=seeded(seed);
 const years=[2025,2026,2027,2028,2029,2030];
 const accum=years.map(y=>({year:y,total:[],sectors:[[],[],[]]}));
 const volatility=[1.0,1.45,1.1]; // Explicit arbitrary dispersion assumptions, not empirical sigma.
 for(let n=0;n<draws;n++){
  const p=DATA.sectors.slice();accum[0].total.push(DATA.gdp);for(let s=0;s<3;s++)accum[0].sectors[s].push(p[s]);
  const persistent=[gaussian(rnd),gaussian(rnd),gaussian(rnd)];
  for(let y=2026;y<=2030;y++){
   const shared=gaussian(rnd);
   for(let s=0;s<3;s++){
    const eps=gaussian(rnd),noise=c.volatility*volatility[s]*(0.3*persistent[s]+0.35*shared+0.35*eps);
    // Shock is entered directly in percentage-points and applies to all sectors in 2027, 2028.
    const shock=(y===2027||y===2028)?c.shock:0;
    const gr=clamp(effectiveRate(c,s,y)+noise-shock,-20,20);
    p[s]*=1+gr/100;
    accum[y-2025].sectors[s].push(p[s]);
   }
   accum[y-2025].total.push(p[0]+p[1]+p[2]);
  }
 }
 const percentiles=arr=>({p10:qtile(arr,.1),p50:qtile(arr,.5),p90:qtile(arr,.9)});
 const series=accum.map(r=>({year:r.year,...percentiles(r.total),sectors:r.sectors.map(percentiles)}));
 const finish=series[5],sum=finish.sectors.reduce((a,s)=>a+s.p50,0);
 return {modelVersion:VERSION,dataVersion:"INITIAL_RELEASE_2020_2025+2026Q3_SIGNALS",assumptionVersion:"EXPLICIT_USER_RATES_UNESTIMATED",
   seed,draws,controls:c,series,finish,composition:finish.sectors.map(s=>100*s.p50/sum),
   warnings:["模型未校准，未来名义年增速由使用者直接设定。","模型内P10/P90只是给定随机扰动设定下的条件分位，不是现实世界概率或置信区间。","断开网络边不改变GDP：没有真实部门投入产出数据，禁止伪造网络乘数。","年度初始公报不同发布版本，历史名义变化仅供初步探索。"]};
}
function compare(raw={},options={}){
 const base=simulate(PRESETS.neutral,options),active=simulate(raw,options);
 const delta=active.finish.p50-base.finish.p50;
 return {base,active,delta,pct:100*delta/base.finish.p50,sectorDelta:active.finish.sectors.map((s,i)=>s.p50-base.finish.sectors[i].p50)};
}
function sensitivity(raw={},options={}){
 const c=sanitize(raw),s=Number(options.seed??20261116);
 return RATE_META.map((m,i)=>{
  const low=sanitize(c),high=sanitize(c);low.rates[i]=clamp(c.rates[i]-.5,m.min,m.max);high.rates[i]=clamp(c.rates[i]+.5,m.min,m.max);
  const a=simulate(low,{seed:s,draws:160}).finish.p50,b=simulate(high,{seed:s,draws:160}).finish.p50;
  return {id:m.key,name:m.label,low:a,high:b,span:b-a,meaning:"改变一个直接名义增长率假设±0.5个百分点，不是政策边际效应"};
 }).sort((a,b)=>Math.abs(b.span)-Math.abs(a.span));
}
function robustness(raw={},options={}){
 const c=sanitize(raw),seed=Number(options.seed??20261116),list=[];
 for(const name of Object.keys(MODELS)){const v=simulate({...c,model:name},{draws:160,seed});list.push({id:name,name:MODELS[name].name,p50:v.finish.p50,p10:v.finish.p10,p90:v.finish.p90});}
 return {variants:list,span:[Math.min(...list.map(x=>x.p50)),Math.max(...list.map(x=>x.p50))],warning:"不同结构假设形成的模型分歧，不能与单一模型的P10/P90混同。"};
}
function integrity(){
 const checks=ANNUAL.map(x=>({year:x.year,delta:Number((x.sectors.reduce((a,b)=>a+b,0)-x.gdp).toFixed(6))}));
 return {checks,pass:checks.every(x=>Math.abs(x.delta)<.03),signalPeriods:[...new Set(SIGNALS.map(s=>s.period))],identifiedNetworkEdges:0,
  realSurveyObservations:0,modelValidated:false,causalIdentification:false};
}
const LABELS=Object.fromEntries(RATE_META.map(m=>[m.key,m.label]));const LEVERS=RATE_META.map(m=>m.key);
return {SOURCES,ANNUAL,SIGNALS,DATA,SECTOR_NAMES,RATE_META,MODELS,PRESETS,BREAKS,NODES,EDGES,BASE_RATES,VERSION,LABELS,LEVERS,
 clamp,sanitize,historical,structuralDistance,accounting,propagation,simulate,compare,sensitivity,robustness,integrity};
});