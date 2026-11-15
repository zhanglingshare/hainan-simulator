"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const M=require("../../model.js"),R=require("../research.js"),C=require("../council-core.js");
const allPages=["index","history","network","sectors","value","worlds","pressure","models","blindspots","archive"];
test("twelve research roles have distinct responsibilities and skepticism",()=>{
 assert.equal(C.AGENTS.length,12);assert.equal(new Set(C.AGENTS.map(x=>x.id)).size,12);
 assert.ok(C.AGENTS.every(x=>x.mission.length>6&&x.skepticism.length>5));
 assert.equal(C.AGENTS.filter(x=>x.home==="全站").length,2);
});
test("ten original research pages each have an independent agent and bounded topics",()=>{
 const ids=["discover","history","network","sectors","value","worlds","pressure","models","blindspots","archive"];
 assert.deepEqual(Object.keys(C.BY_PAGE),ids);
 for(const p of ids){assert.ok(C.agentForPage(p));assert.ok(C.workPage(p).length>=2);for(const id of C.workPage(p))assert.ok(C.CLAIMS[id]);}
});
test("core supports exactly five typed cooperation messages",()=>{
 assert.deepEqual(C.TYPES,["发现","质疑","交接","异见","改判"]);
});
test("all system claims are explicitly H/C level not empirical policy claims",()=>{
 assert.ok(Object.keys(C.CLAIMS).length>=8);
 for(const claim of Object.values(C.CLAIMS)){
  assert.ok(["H","C"].includes(claim.grade),"scientific grade");
  assert.ok(claim.construct.length>10&&claim.challenge.length>15&&claim.rival.length>10&&claim.test.length>8);
  assert.ok(claim.inventor&&claim.reviewer&&claim.dissenter&&claim.target);
 }
});
test("all evidence refs are real indicator IDs and include explicit observation windows",()=>{
 for(const claim of Object.values(C.CLAIMS)){
  for(const id of claim.source){const e=C.evidence(id);assert.ok(e,"bad indicator "+id);assert.ok(e.period&&e.source&&e.tier);}
  assert.equal(C.epistemic(claim).hypothesis,claim.grade);
 }
});
test("initial independent round creates observable build, check, dissent, handoff",()=>{
 const s=C.runRound(C.fresh(),"trade-contrast");
 assert.deepEqual(s.messages.map(x=>x.type),["发现","质疑","异见","交接"]);
 assert.deepEqual(s.messages.map(x=>x.agent),["relation","data","mechanism","host"]);
 assert.ok(s.messages.every(x=>x.claim==="trade-contrast"));
 assert.equal(s.messages[0].tier,"H");
 assert.match(s.messages[1].text,/交叉|直接|观察|指标/);
 assert.match(s.messages[2].text,/竞争假说/);
 assert.equal(s.messages[3].target,"cliff");
});
test("the same initial claim always yields the same logical sequence (timestamps excluded)",()=>{
 const a=C.runRound(C.fresh(),"hidden-services"),b=C.runRound(C.fresh(),"hidden-services");
 const normalize=x=>x.messages.map(m=>[m.type,m.agent,m.target,m.text,m.tier,m.refs,m.parentId]);
 assert.deepEqual(normalize(a),normalize(b));
});
test("challenge and divergent invention are distinct moves without upgrading evidence",()=>{
 let s=C.runRound(C.fresh(),"industry-investment");
 s=C.debate(s,"industry-investment","challenge");assert.equal(s.messages.at(-1).type,"质疑");
 s=C.debate(s,"industry-investment","invent");
 assert.deepEqual(s.messages.slice(-2).map(x=>x.type),["发现","质疑"]);
 assert.ok(s.messages.slice(-2).every(x=>x.tier==="H"));
 assert.equal(s.claims["industry-investment"].status,"challenged");
});
test("dissent is preserved and cannot be averaged into a probability",()=>{
 let s=C.debate(C.fresh(),"tourism-benefit","dissent");
 assert.equal(s.messages.at(-1).type,"异见");
 assert.match(s.messages.at(-1).text,/禁止把多Agent多数票包装成概率/);
});
test("retirement requires explicit reason and preserves debate history",()=>{
 let s=C.runRound(C.fresh(),"agri-chain");const old=s.messages.map(x=>x.text);
 assert.throws(()=>C.revise(s,"agri-chain","retired","错"),/8字/);
 s=C.revise(s,"agri-chain","retired","新证据与原本的关键假设明显不符");
 assert.equal(s.claims["agri-chain"].status,"retired");
 assert.deepEqual(s.messages.slice(0,4).map(x=>x.text),old);
 assert.equal(s.messages.at(-1).type,"改判");
 assert.equal(s.notebook.at(-1).type,"retired");
 s=C.revise(s,"agri-chain","open","有新的独立样本可以重新审查候选机制");
 assert.equal(s.claims["agri-chain"].status,"open");
 assert.equal(s.notebook.length,2);
});
test("users can propose unverified new hypotheses without invented evidence",()=>{
 const {state:s,id}=C.addHypothesis(C.fresh(),"游客消费会影响农业订单周期吗？","若本地餐饮采购变动传到产地订单和回款时间，农户收入可能发生变化");
 assert.ok(id.startsWith("user-"));
 const claim=C.claimFor(s,id);
 assert.equal(claim.grade,"H");assert.deepEqual(claim.source,[]);
 assert.ok(s.messages.every(x=>x.tier==="H"));
 const next=C.runRound(s,id);
 assert.ok(next.messages.length>s.messages.length);
 assert.equal(next.messages.at(-1).type,"交接");
});
test("untrusted user hypotheses cannot be created with empty texts",()=>{
 assert.throws(()=>C.addHypothesis(C.fresh(),"短","一点"),/至少/);
 assert.throws(()=>C.addHypothesis(C.fresh(),"<h1>",""),/至少/);
});
test("state normalize handles malicious/malformed storage safely",()=>{
 assert.deepEqual(C.normalize(null),C.fresh());
 const s=C.normalize({schema:C.VERSION,active:"trade-contrast",messages:[{type:"伪造",text:"bogus"},{type:"发现",agent:"data",claim:"trade-contrast",text:"可信",tier:"Z"}]});
 assert.equal(s.messages.length,1);assert.equal(s.messages[0].tier,"H");
});
test("structured messages carry claim, origin role, evidence keys, message type and parent",()=>{
 const s=C.runRound(C.fresh(),"trade-contrast");
 for(const m of s.messages){
  assert.ok(m.id&&m.claim&&m.agent&&m.date&&C.TYPES.includes(m.type));
  assert.ok(Array.isArray(m.refs));
 }
 assert.equal(s.messages[1].parentId,s.messages[0].id);
});
test("archive export retains conflicting ideas and refuses to claim online LLM",()=>{
 let s=C.runRound(C.fresh(),"scenario-identity");s=C.revise(s,"scenario-identity","retired","这个机制在新数据条件下已不成立");
 const a=C.exportState(s);
 assert.equal(a.schema,C.VERSION);
 assert.equal(a.modelVersion,M.VERSION);
 assert.equal(a.state.notebook.length,1);
 assert.match(a.description,/非联网LLM/);
});
test("the ten HTML pages all load the agent runtime after existing application",()=>{
 for(const page of allPages){
  const html=fs.readFileSync(path.join(__dirname,"..",page+".html"),"utf8");
  assert.match(html,/council-core\.js/);
  assert.match(html,/council-ui\.js/);
  assert.match(html,/council\.css/);
  assert.ok(html.indexOf("research.js")<html.indexOf("council-core.js"),"research before council");
  assert.ok(html.indexOf("council-core.js")<html.indexOf("council-ui.js"),"model before UI");
 }
});
test("core never declares a secret key, endpoint or model API call",()=>{
 const source=fs.readFileSync(path.join(__dirname,"../council-core.js"),"utf8");
 assert.doesNotMatch(source,/api\.openai\.com|Authorization:\s*Bearer|sk-proj-/);
});
