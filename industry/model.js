/* Hainan Industry Wind Tunnel — explicit illustrative conditions, never empirical causal coefficients.
   The same seed and disturbance paths are used in the baseline and changed worlds. */
(function(root,factory){const m=factory();if(typeof module!=="undefined"&&module.exports)module.exports=m;root.HainanModel=m;})(typeof globalThis!=="undefined"?globalThis:this,function(){
"use strict";
const DATA=Object.freeze({
  vintage:"2025年统计公报",gdp:8108.85,
  sectors:Object.freeze([1642.55,1463.86,5002.44]),
  growthReal:4.0,
  stats2025:Object.freeze({industrial:9.9,investment:-16.5,goodsTrade:-0.7,servicesTrade:22.1,tourismTrips:9.1,tourismSpend:10.5}),
  stats2026H1:Object.freeze({gdp:3813.45,gdpReal:2.0,industry:-0.2,investment:-9.7,goodsTrade:59.9,highTech:9.4}),
  source2025:"https://stats.hainan.gov.cn/tjj/tjgb/fzgb/2023_88252/202602/t20260226_4032927.html",
  source2026:"https://stats.hainan.gov.cn/tjj/ywdt/xwfb/202607/t20260722_4115237.html",
  sourceClosure:"https://www.hainan.gov.cn/hainan/szfwj/202512/c710b14b805746e2b1d9d68f8bfb305b.shtml"
});
const LABELS=Object.freeze({port:"口岸与物流效率",industry:"制造业项目兑现",service:"本地专业服务承接",agri:"热带农产加工",talent:"人才与知识服务",resilience:"产业替代与韧性"});
const EFFECT=Object.freeze({
 port:[0.08,0.18,0.32], industry:[0.00,0.95,0.16],service:[0.05,0.16,0.64],
 agri:[0.75,0.12,0.12], talent:[0.10,0.34,0.46],resilience:[0.06,0.14,0.20]
});
const LEVERS=Object.keys(EFFECT),BASE_RATES=[3.0,4.0,4.5]; // Assumed nominal percentage growth, NOT official actual GDP growth
const SECTOR_NAMES=["第一产业","第二产业","第三产业"];
const PRESETS={
 neutral:{name:"当前假设",tag:"对照世界",description:"研究者设定的中性条件，并非官方基准预测",knobs:{port:0,industry:0,service:0,agri:0,talent:0,resilience:0},shock:0,breakLink:"none"},
 port:{name:"港口与制造接力",tag:"产业链",description:"通关和制造投资协同改善，服务承接略有增强",knobs:{port:1.3,industry:1.1,service:0.5,agri:0,talent:0.4,resilience:0},shock:0,breakLink:"none"},
 services:{name:"游客之外留住服务",tag:"本地价值",description:"更重视研发、物流、商务服务与人才沉淀",knobs:{port:0.4,industry:0.3,service:1.5,agri:0.4,talent:1.2,resilience:0.4},shock:0,breakLink:"none"},
 agriculture:{name:"热带农业价值链",tag:"城乡连接",description:"加工、冷链与服务协同推进",knobs:{port:0.5,industry:0.3,service:0.7,agri:1.7,talent:0.5,resilience:0.4},shock:0,breakLink:"none"},
 pressure:{name:"增长错位压力",tag:"红队挑战",description:"项目兑现放缓，外部扰动叠加，测试产业替代",knobs:{port:-0.6,industry:-1.5,service:-0.4,agri:-0.4,talent:-0.4,resilience:-0.8},shock:60,breakLink:"port-service"}
};
const BREAKS={
 none:{label:"保持全部假设连接",penalty:[0,0,0],edge:null,why:"全部关系仍是假设传导机制"},
 "port-service":{label:"港口 → 专业服务失联",penalty:[0,-0.25,-0.60],edge:["port","services"],why:"失去港口衍生服务的部分模型溢出"},
 "industry-service":{label:"制造 → 本地服务失联",penalty:[0,-0.22,-0.75],edge:["industry","services"],why:"假设制造采购无法有效在本地转化服务需求"},
 "agri-processing":{label:"农产 → 加工失联",penalty:[-0.60,-0.22,-0.18],edge:["agri","processing"],why:"假设冷链和加工环节无法承接产出"}
};
function clamp(x,a,b){const n=Number(x);return Number.isFinite(n)?Math.max(a,Math.min(b,n)):a;}
function sanitize(raw={}){
 const p=raw||{},knobs={};LEVERS.forEach(k=>knobs[k]=Math.round(clamp((p.knobs||{})[k]??0,-2,2)*10)/10);
 return {knobs,shock:Math.round(clamp(p.shock??0,0,100)),breakLink:BREAKS[p.breakLink]?p.breakLink:"none"};
}
function seedRandom(seed){let a=Number(seed)>>>0;return function(){a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function normal(rng){const u=Math.max(1e-10,rng()),v=rng();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
function quantile(sorted,q){const i=(sorted.length-1)*q,l=Math.floor(i),f=i-l;return sorted[l]+(sorted[Math.min(l+1,sorted.length-1)]-sorted[l])*f;}
function rates(config){
 const c=sanitize(config),g=BASE_RATES.slice();
 LEVERS.forEach(k=>EFFECT[k].forEach((value,i)=>g[i]+=value*c.knobs[k]));
 const b=BREAKS[c.breakLink];b.penalty.forEach((v,i)=>g[i]+=v);
 // Demonstration coupling: no empirically estimated interindustry transmission weights.
 g[1]+=0.06*Math.max(0,c.knobs.port)*Math.max(0,c.knobs.industry);
 g[2]+=0.07*Math.max(0,c.knobs.industry)*Math.max(0,c.knobs.service);
 return g.map(x=>clamp(x,-6,13));
}
function simulate(raw={},options={}){
 const c=sanitize(raw),draws=Math.round(clamp(options.draws??360,80,1200));
 const seed=Number(options.seed??2035)>>>0,rand=seedRandom(seed),rate=rates(c);
 const annual=[2025,2026,2027,2028,2029,2030].map(y=>({year:y,values:[],sectors:[[],[],[]]}));
 for(let n=0;n<draws;n++){
  const values=DATA.sectors.slice();annual[0].values.push(DATA.gdp);values.forEach((x,i)=>annual[0].sectors[i].push(x));
  const parameter=[normal(rand)*0.42,normal(rand)*0.62,normal(rand)*0.52];
  for(let y=2026;y<=2030;y++){
   const shared=normal(rand)*0.55,local=[normal(rand),normal(rand),normal(rand)];
   for(let s=0;s<3;s++){
    const vol=[1.5,2.5,2.0][s],risk=(y===2027||y===2028)?c.shock*[0.014,0.043,0.025][s]:0;
    const annualRate=clamp(rate[s]+parameter[s]+shared*vol*0.5+local[s]*vol*0.5-risk,-16,18);
    values[s]*=1+annualRate/100;
    annual[y-2025].sectors[s].push(values[s]);
   }
   annual[y-2025].values.push(values.reduce((a,b)=>a+b,0));
  }
 }
 const series=annual.map(row=>{
  const q=a=>{const s=a.slice().sort((x,y)=>x-y);return {p10:quantile(s,.1),p50:quantile(s,.5),p90:quantile(s,.9)};};
  return {year:row.year,...q(row.values),sectors:row.sectors.map(q)};
 });
 const end=series[series.length-1],totals=end.sectors.map(x=>x.p50),sum=totals.reduce((a,b)=>a+b,0);
 return {dataVersion:"HAINAN_2025_OFFICIAL+2026H1_SIGNALS",modelVersion:"HI-0.1.0",assumptionVersion:"UNESTIMATED_DEMONSTRATION_V1",
  seed,draws,controls:c,nominalRates:rate,series,finish:end,composition:totals.map(x=>x/sum*100),
  warnings:["全部未来增长率、产业传导系数和随机波动范围均为演示假设，尚未使用海南微观数据标定。","2025年GDP为现价增加值，2025官方实际增速与本模型假设名义增速不可等同。","P10/P90是模型条件下的分位数，并非现实发生概率或统计置信区间。","产业传导连接为结构假设，不是实测企业交易。"]};
}
function compare(raw={},opts={}){
 const base=simulate(PRESETS.neutral,opts),active=simulate(raw,opts);
 const delta=active.finish.p50-base.finish.p50;
 return {base,active,delta,pct:delta/base.finish.p50*100,sectorDelta:active.finish.sectors.map((s,i)=>s.p50-base.finish.sectors[i].p50)};
}
function sensitivity(raw={},opts={}){
 const c=sanitize(raw),base=simulate(c,{...opts,draws:Math.min(160,opts.draws??160)}).finish.p50;
 return LEVERS.map(key=>{const p=sanitize(c);p.knobs[key]=clamp(p.knobs[key]+.5,-2,2);
  const m=sanitize(c);m.knobs[key]=clamp(m.knobs[key]-.5,-2,2);
  const up=simulate(p,{...opts,draws:Math.min(160,opts.draws??160)}).finish.p50;
  const down=simulate(m,{...opts,draws:Math.min(160,opts.draws??160)}).finish.p50;
  return {id:key,name:LABELS[key],high:up-base,low:down-base,span:up-down};
 }).sort((a,b)=>Math.abs(b.span)-Math.abs(a.span));
}
return {DATA,LABELS,EFFECT,LEVERS,PRESETS,BREAKS,SECTOR_NAMES,BASE_RATES,clamp,sanitize,rates,simulate,compare,sensitivity};
});