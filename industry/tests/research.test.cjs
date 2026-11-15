"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const M=require("../model.js");
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,"Expected "+a+" ≈ "+b);
test("annual data: six consecutive dated official release observations",()=>{
 assert.equal(M.ANNUAL.length,6);assert.deepEqual(M.ANNUAL.map(x=>x.year),[2020,2021,2022,2023,2024,2025]);
 for(const row of M.ANNUAL){assert.ok(/^https:\/\/stats\.hainan\.gov\.cn/.test(M.SOURCES[row.source]));near(row.sectors.reduce((a,b)=>a+b,0),row.gdp,.03);assert.ok(row.vintage);}
 assert.equal(M.integrity().pass,true);
});
test("2025 official base matches announced levels",()=>{
 near(M.DATA.gdp,8108.85);assert.deepEqual(M.DATA.sectors,[1642.55,1463.86,5002.44]);
 near(M.DATA.growthReal,4);near(M.DATA.stats2025.investment,-16.5);near(M.DATA.stats2025.industrial,9.9);
});
test("latest signals retain period and observation unit differences",()=>{
 const keys=["gdpQ3","industrial8","trade8"];for(const k of keys)assert.ok(M.SIGNALS.find(x=>x.id===k));
 assert.equal(M.SIGNALS.find(x=>x.id==="gdpQ3").period,"2026年1—9月");
 assert.equal(M.SIGNALS.find(x=>x.id==="trade8").unitType,"trade_value_yoy");
 assert.equal(M.SIGNALS.find(x=>x.id==="industrial8").unitType,"real_yoy");
});
test("nominal difference is NOT official constant-price growth",()=>{
 const h=M.historical(),last=h[h.length-1];
 near(last.nominalDifference,173.16,.001);
 assert.ok(last.nominalChangePct<3&&last.nominalChangePct>2);
 near(last.sectorDifference[1],-34.06,.001);
 assert.equal(M.DATA.growthReal,4);
});
test("GDP shares sum to 100 and structural distance is symmetric",()=>{
 for(const p of M.historical())near(p.shares.reduce((a,b)=>a+b,0),100,1e-8);
 near(M.structuralDistance(2020,2020),0);
 near(M.structuralDistance(2020,2025),M.structuralDistance(2025,2020));
 assert.ok(M.structuralDistance(2020,2025)>0);
});
test("unknown years rejected",()=>assert.throws(()=>M.structuralDistance(2019,2025)));
test("scenario assumption inputs are bounded and sanitized",()=>{
 let s=M.sanitize({rates:[100,-200,"x"],volatility:90,shock:100,model:"nonsense",breakLink:"fake",localShare:900,supplierVA:-4,diffusion:100});
 assert.deepEqual(s.rates,[10,-8,4.5]);assert.equal(s.volatility,2.5);assert.equal(s.shock,8);assert.equal(s.model,"constant");assert.equal(s.breakLink,"none");assert.equal(s.localShare,100);assert.equal(s.supplierVA,0);assert.equal(s.diffusion,.8);
});
test("seeded simulation is bitwise repeatable",()=>{
 const c={rates:[4,6,8],shock:2,model:"decay",volatility:1.8};
 assert.deepEqual(M.simulate(c,{draws:150,seed:912}),M.simulate(c,{draws:150,seed:912}));
 assert.notDeepEqual(M.simulate(c,{draws:150,seed:913}).finish,M.simulate(c,{draws:150,seed:912}).finish);
});
test("different paths share baseline year and GDP accounting",()=>{
 const v=M.simulate({rates:[5,2,4]},{draws:120,seed:2});
 near(v.series[0].p50,M.DATA.gdp);
 v.series.forEach(y=>{assert.ok(y.p10<=y.p50&&y.p50<=y.p90);assert.ok(y.sectors.every(x=>x.p10>0));});
});
test("neutral to neutral gives zero counterfactual gap",()=>{
 const r=M.compare(M.PRESETS.neutral,{seed:2026,draws:140});
 near(r.delta,0);near(r.pct,0);
});
test("changing selected direct growth rate changes 2030 accounting outcome",()=>{
 const low=M.simulate({rates:[3,2,4.5],volatility:0},{seed:3,draws:100});
 const high=M.simulate({rates:[3,8,4.5],volatility:0},{seed:3,draws:100});
 assert.ok(high.finish.p50>low.finish.p50);
});
test("zero noise matches deterministic five-year capitalization exactly",()=>{
 const c={rates:[3,4,5],volatility:0,shock:0,model:"constant"};
 const v=M.simulate(c,{draws:100,seed:1});
 const formula=M.DATA.sectors.reduce((s,x,i)=>s+x*(1+c.rates[i]/100)**5,0);
 near(v.finish.p50,formula,.000001);
});
test("direct model shock is an explicit change in percentage points",()=>{
 const a=M.simulate({shock:0,volatility:0},{seed:10,draws:100});
 const b=M.simulate({shock:5,volatility:0},{seed:10,draws:100});
 assert.ok(b.finish.p50<a.finish.p50);
});
test("changing hypothetical network break never modifies GDP",()=>{
 const base=M.simulate({breakLink:"none"},{seed:12,draws:150});
 const broken=M.simulate({breakLink:"port-service"},{seed:12,draws:150});
 assert.deepEqual(base.series,broken.series);
});
test("changing unknown local service purchase shares never modifies GDP",()=>{
 const a=M.simulate({localShare:0,supplierVA:0},{seed:15,draws:150});
 const b=M.simulate({localShare:100,supplierVA:100},{seed:15,draws:150});
 assert.deepEqual(a.series,b.series);
});
test("100 units normalized local value ledger must conserve all payment",()=>{
 for(let s=0;s<=100;s+=10)for(let v=0;v<=100;v+=10){
  const a=M.accounting({amount:100,localShare:s,supplierVA:v});
  near(a.check,100);near(a.localPurchase+a.externalPurchase,100);
  near(a.localVA+a.localIntermediate,a.localPurchase);
  assert.deepEqual(a.identification.unrestricted,[0,100]);
 }
});
test("local accounting does not claim empirical identification",()=>{
 assert.equal(M.accounting({}).identification.observedLocalShare,false);
 assert.equal(M.accounting({}).identification.observedSupplierVA,false);
 assert.match(M.accounting({}).interpretation,/不能换算海南GDP/);
});
test("research graph has exactly hypothesized edges, no empirical weights",()=>{
 assert.equal(M.EDGES.length,13);assert.equal(M.NODES.length,8);
 assert.ok(M.EDGES.every(e=>e.grade==="H"&&!Object.hasOwn(e,"estimatedWeight")));
 assert.equal(M.integrity().identifiedNetworkEdges,0);
});
test("graph edge cut removes exactly selected hypothetical connection",()=>{
 const base=M.propagation({breakLink:"none"},"port");
 const cut=M.propagation({breakLink:"port-service"},"port");
 assert.equal(base.edges.length,13);assert.equal(cut.edges.length,12);
 assert.ok(base.exposure.services>cut.exposure.services);
 assert.match(cut.metric,/非经济损失/);
});
test("graph propagation is nonnegative, finite, and reproducible",()=>{
 const a=M.propagation({diffusion:.8},"agri"),b=M.propagation({diffusion:.8},"agri");
 assert.deepEqual(a,b);assert.ok(Object.values(a.exposure).every(x=>Number.isFinite(x)&&x>=0));
});
test("alternate dynamics use different structural assumptions without claiming probability",()=>{
 const v=M.robustness({rates:[6,8,9],volatility:0},{seed:5});
 assert.equal(v.variants.length,3);
 assert.ok(v.span[1]>=v.span[0]);
 assert.match(v.warning,/不能与/);
});
test("sensitivity is only relative to direct scenario rates",()=>{
 const list=M.sensitivity(M.PRESETS.neutral,{seed:4});
 assert.equal(list.length,3);
 assert.ok(list.every(x=>x.span>=0&&x.meaning.includes("不是政策")));
});
test("research safety flags remain false without evidence",()=>{
 const a=M.integrity();
 assert.equal(a.realSurveyObservations,0);assert.equal(a.modelValidated,false);assert.equal(a.causalIdentification,false);
});
test("browser entry points are complete and do not import the existing double-island engine",()=>{
 const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
 const app=fs.readFileSync(path.join(__dirname,"../app.js"),"utf8");
 for(const view of ["discover","network","lab","blindspots","archive"])assert.match(html,new RegExp('id="'+view+'"'));
 for(const file of ["model.js","app.js","style.css"])assert.ok(fs.existsSync(path.join(__dirname,"../"+file)));
 assert.doesNotMatch(html,/assets\/engine\.js/);
 for(const id of ["signalCards","networkSvg","trajectory","controls","evidenceList","savedList","breakLink","modelType"]) {
  if(id==="modelType")assert.match(app,/id="modelType"/);
  else assert.match(html,new RegExp('id="'+id+'"'));
 }
});
test("historical data are not presented as a harmonized/revised series",()=>{
 const src=fs.readFileSync(path.join(__dirname,"../model.js"),"utf8");
 const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
 assert.match(src,/不同年度初始公报版本未经统一修订/);
 assert.match(html,/真实数据与假设模型|假设/);
});
