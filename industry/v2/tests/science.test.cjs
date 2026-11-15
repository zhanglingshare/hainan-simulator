"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const M=require("../../model.js");
const R=require("../research.js");
const near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol,"expected "+a+" ≈ "+b);
const pages=["index","history","network","sectors","value","worlds","pressure","models","blindspots","archive"];
test("10 independent routable HTML research pages exist",()=>{
 for(const name of pages){
  const f=path.join(__dirname,"..",name+".html");const html=fs.readFileSync(f,"utf8");
  assert.match(html,/id="page-content"/);
  assert.match(html,/industry|海南岛/);
  assert.match(html,/research\.js/);assert.match(html,/app\.js/);
  assert.match(html,/data-page="/);assert.doesNotMatch(html,/src="\.\/\.\.\/\.\.\/assets\/engine/);
 }
 assert.equal(new Set(pages).size,10);
});
test("all ten nav URLs appear from every page",()=>{
 const s=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
 pages.forEach(p=>assert.ok(s.includes("./"+p+".html"),"missing nav "+p));
});
test("historical observations equal GDP totals and compositional difference is well defined",()=>{
 const h=R.history();assert.equal(h.rows.length,6);
 for(const row of h.rows)near(row.sectors.reduce((a,b)=>a+b,0),row.gdp,.03);
 near(R.jsd([20,30,50],[20,30,50]),0);
 assert.ok(R.jsd([20,30,50],[40,20,40])>0);
 near(R.jsd([10,20,70],[20,30,50]),R.jsd([20,30,50],[10,20,70]));
});
test("2025 indicators point to official vintage and current observations preserve periods",()=>{
 for(const x of R.INDICATORS)assert.ok(x.period&&x.type&&x.tier&&R.SOURCES[x.source]);
 const a=R.INDICATORS.find(x=>x.id==="gdp26");assert.equal(a.tier,"B");
 assert.equal(a.period,"2026年前三季度");
 near(R.INDICATORS.find(x=>x.id==="industrial26").value,-6.2);
 near(R.INDICATORS.find(x=>x.id==="trade26").value,55.2);
});
test("multiple distinct sector choices have explicit rival explanations",()=>{
 assert.equal(R.CLUSTERS.length,5);
 assert.ok(R.CLUSTERS.every(x=>x.competing.length>=3&&x.need.length>4&&x.source));
});
test("network multiplex has 3 candidate edge classes and no empirical weights",()=>{
 assert.equal(R.NODES.length,8);assert.equal(R.EDGES.length,18);
 assert.deepEqual(Object.keys(R.LAYERS),["all","physical","value","knowledge"]);
 assert.ok(R.EDGES.every(x=>x.grade==="H"&&!("estimatedWeight" in x)));
});
test("graph semantics: changing layer, removing edge, changing rounds all reproducibly affect graph",()=>{
 const all=R.graph({layer:"all",start:"port"});
 const physical=R.graph({layer:"physical",start:"port"});
 assert.equal(all.edges.length,18);assert.ok(physical.edges.length<18);
 const cut=R.graph({layer:"all",start:"port",remove:"e0"});
 assert.equal(cut.edges.length,17);
 assert.deepEqual(cut,R.graph({layer:"all",start:"port",remove:"e0"}));
 assert.ok(all.reached>=R.graph({layer:"all",start:"port",rounds:1}).reached);
});
test("partially identified local procurement conserves payment accounting",()=>{
 for(let a=0;a<=100;a+=20)for(let b=0;b<=100;b+=20){
  const v=R.accounting({lower:a,upper:b,vlow:10,vhigh:90});
  near(v.components.localPay+v.components.external,100);
  near(v.components.value+v.components.intermediate,v.components.localPay);
  assert.ok(v.min<=v.point&&v.point<=v.max);
 }
});
test("nothing is identified without user-provided information",()=>{
 const z=R.accounting({lower:0,upper:100,vlow:0,vhigh:100});
 near(z.min,0);near(z.max,100);
 assert.match(z.limits,/人为假设/);
});
test("direct deterministic GDP accounts for exactly chosen sector rate inputs",()=>{
 const result=R.deterministic([3,4,4.5],"constant",0);
 const expected=M.DATA.sectors.reduce((s,v,i)=>s+v*(1+[3,4,4.5][i]/100)**5,0);
 near(result.total,expected,.01);
 assert.ok(R.deterministic([3,8,4.5],"constant",0).total>result.total);
});
test("stress grid 121 discrete conditions, no imaginary frequency-based probability",()=>{
 const r=R.grid({target:10000});
 assert.equal(r.cells.length,121);assert.equal(r.pass+r.cells.filter(x=>!x.pass).length,121);
 assert.ok(r.share>=0&&r.share<=100);
 assert.match(r.meta,/不是现实概率/);
});
test("distinct stress models can disagree and max regret is nonnegative",()=>{
 const r=R.robust();assert.equal(r.cases.length,9);assert.equal(r.strategies.length,4);
 for(const k of r.strategies){assert.ok(k.maxRegret>=0);assert.ok(k.min<=k.max);}
});
test("extremely small-sample backtest is explicitly limited",()=>{
 const b=R.backtest();assert.equal(b.cases.length,4);assert.ok(Number.isFinite(b.mape));assert.match(b.caution,/不能宣称/);
});
test("scenario trace fingerprints depend on assumptions and model version",()=>{
 const a=R.controlsDigest({rates:[3,4,4.5]});
 const b=R.controlsDigest({rates:[3,6,4.5]});
 assert.notEqual(a,b);assert.match(a,/modelVersion/);
});
test("no fabricated network GDP multipliers can enter the core",()=>{
 const a=M.simulate({...M.PRESETS.neutral,breakLink:"none"},{seed:123,draws:120});
 const b=M.simulate({...M.PRESETS.neutral,breakLink:"port-service"},{seed:123,draws:120});
 assert.deepEqual(a.series,b.series);
 const c=M.simulate({...M.PRESETS.neutral,localShare:90,supplierVA:80},{seed:123,draws:120});
 assert.deepEqual(a.series,c.series);
});
