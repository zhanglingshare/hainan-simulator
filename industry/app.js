/* Hainan Island Industry Wind Tunnel
 * Zero external runtime dependencies. Public facts and synthetic model always labelled separately.
 */
(function(){
"use strict";
const M=window.HainanModel;
if(!M){document.body.innerHTML='<p style="padding:40px;color:white">模拟器载入失败：核心模型未找到。</p>';return;}
const $=id=>document.getElementById(id);
const fmt=(n,d=1)=>Number(n).toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d});
const signed=(n,d=0)=>(n>0?"+":"")+fmt(n,d);
const esc=s=>String(s).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const STATE_KEY="HAINAN_INDUSTRY_EXPERIMENTS_V1";
const nodes=[
 {id:"port",name:"港口与口岸",icon:"⚓",role:"制度与物理入口",x:147,y:135,desc:"物流通道和制度便利可能改变企业的跨区成本，但港口吞吐增加不代表本地自动获得增加值。",gap:"本岛企业实际使用口岸服务的比例、物流成本变化以及岛内增值活动的核验数据。"},
 {id:"industry",name:"制造与能源",icon:"⚙️",role:"制造环节",x:362,y:120,desc:"工业增加值不仅受项目投产影响，也受能源、检修、价格与全球订单变化影响。",gap:"重点项目从开工到实际产出的时间、制造分行业的可比实际增速与生产成本。"},
 {id:"services",name:"专业服务",icon:"🧩",role:"价值留岛",x:630,y:167,desc:"检测、金融、物流、软件、研发与商务服务可以在岛内发生，也可以在岛外完成。",gap:"制造企业分服务类型、供应商所在地的匿名采购额及供应商增加值率。"},
 {id:"tourism",name:"旅游与消费",icon:"🌴",role:"消费入口",x:643,y:337,desc:"游客人数增长不等于所有商家收入同步增长，旅游花费也不等于GDP增加值。",gap:"游客消费结构、企业利润、劳动者工资与跨区平台结算地。"},
 {id:"talent",name:"人才与知识",icon:"🧠",role:"长期连接",x:431,y:271,desc:"产业长期沉淀更依赖专业人才留存、技能供给与稳定服务市场，而不只是一次性项目。",gap:"核心岗位需求、工资、净流入、离职率与技能缺口的可重复追踪。"},
 {id:"agri",name:"热带农业",icon:"🥥",role:"生产基础",x:155,y:350,desc:"农产品种植、养殖及海洋渔业构成真实底盘，但原料产量增长并不等于加工与品牌价值在本地增长。",gap:"主要农产品分级、出岛/岛内销售流向、采购价格和农户实际所得。"},
 {id:"processing",name:"加工与冷链",icon:"🧊",role:"价值转换",x:323,y:432,desc:"冷链、加工、仓储与品质管理可能缓冲季节性风险；但目前没有可靠数据识别产业链增量效果。",gap:"冷链覆盖率、损耗率、加工企业采购地、加工增值及库存周期。"},
 {id:"income",name:"本地就业收入",icon:"🏠",role:"居民获得感",x:531,y:442,desc:"一项投资或贸易增长如何传到岛内岗位与可支配收入，需要独立的工资、就业和企业经营证据。",gap:"稳定岗位数量、工资分布、居民就业参与和消费变化。"}
];
const edges=[
 {from:"port",to:"industry",label:"通关与加工",lever:"port"},
 {from:"port",to:"services",label:"口岸衍生服务",lever:"port",break:"port-service"},
 {from:"industry",to:"services",label:"制造服务采购",lever:"service",break:"industry-service"},
 {from:"services",to:"tourism",label:"服务体验",lever:"service"},
 {from:"talent",to:"industry",label:"技能支持",lever:"talent"},
 {from:"talent",to:"services",label:"专业人才",lever:"talent"},
 {from:"agri",to:"processing",label:"原料加工",lever:"agri",break:"agri-processing"},
 {from:"processing",to:"port",label:"贸易渠道",lever:"port"},
 {from:"processing",to:"tourism",label:"在岛消费",lever:"agri"},
 {from:"tourism",to:"income",label:"就业与消费",lever:"service"},
 {from:"services",to:"income",label:"高技能岗位",lever:"talent"},
 {from:"industry",to:"income",label:"制造业就业",lever:"industry"},
 {from:"agri",to:"income",label:"农业经营",lever:"agri"}
];
const signals=[
 {id:"industry",period:"2025全年",value:"+9.9%",title:"工业在加速，投资却下行",subtitle:"2025规上工业增加值增速",question:"工业增长究竟来自哪里？下一批项目能否接上？",body:"工业生产增长与投资下行可以同时出现：已有产能释放、行业价格、能源采掘、项目时滞都可能影响表象。必须追到行业与项目，而不是用投资增速代替工业增速。",caveat:"工业增加值实际增速与固定资产投资同比统计口径不同。",node:"industry",source:M.DATA.source2025},
 {id:"trade",period:"2026上半年",value:"+59.9%",title:"外贸跃升，本地留下什么",subtitle:"货物进出口总额同比",question:"货物进出更快，岛内服务和加工价值也增长了吗？",body:"外贸规模增长并不自动证明本地加工增值或产业利润同步增加。要验证的不是进出口有多热闹，而是加工、结算、专业服务和就业在哪些环节发生。",caveat:"2026上半年货物进出口同比，不等于GDP增长率。",node:"port",source:M.DATA.source2026},
 {id:"growth",period:"2026上半年",value:"−0.2%",title:"工业承压，高技术仍增长",subtitle:"规上工业同比",question:"同一个海南，为何总体工业放缓，高技术制造仍然增长？",body:"2026上半年规上工业下降0.2%，高技术制造增长9.4%。这说明内部行业结构与时间窗口很重要，但不意味着高技术制造已足以抵消所有工业波动。",caveat:"高技术制造属于规上工业的部分，不可直接加总；增长幅度不能代替增加值份额。",node:"industry",source:M.DATA.source2026},
 {id:"tourism",period:"2025全年",value:"+10.5%",title:"游客花得更多，谁受益",subtitle:"游客总花费同比",question:"游客消费更多，餐饮、住宿、就业和专业服务都受益吗？",body:"游客总花费增长10.5%，游客人数增长9.1%。消费路径复杂，房租、平台费用、采购渠道和企业利润会改变地方获得感。",caveat:"旅游总花费不是GDP增加值，也不能推出旅游企业平均利润。",node:"tourism",source:M.DATA.source2025}
];
const challenges=[
 {name:"港口更忙，服务未留岛",short:"贸易强，不代表岛内采购、研发、检测和结算同步强化。",why:"港口可以带来物流活动，但若制造企业的专业服务仍主要在岛外购买，岛内增加值留存可能有限。",evidence:"匿名制造企业服务采购地、采购类别及供应商增加值率。",patch:{breakLink:"port-service",knobs:{port:1.2,service:-.5}}},
 {name:"项目投产与投资错位",short:"当前产出增长，也可能来自存量产能，下一批项目尚未兑现。",why:"工业生产与固定投资指标反向变化，可能源于已投产项目释放产能，或行业差异、价格、周期。不能直接宣布未来会断档。",evidence:"按季度的项目投产清单、产能利用率、行业价格和完工兑现率。",patch:{knobs:{industry:-1.6},shock:20}},
 {name:"游客来了，收入没同步",short:"游客总花费与酒店利润、就业质量、居民收入是不同量。",why:"消费支出可能通过采购、平台和结算流向岛外；缺乏企业成本和劳动收入时无法识别价值留存。",evidence:"游客消费分行业、住宿餐饮经营利润、工资以及平台结算归属地。",patch:{knobs:{service:-1.2,talent:-.4}}},
 {name:"农业增加，链条未升级",short:"农产品丰收未必对应农户所得或冷链加工增值。",why:"如果冷链、深加工和订单衔接不足，种养规模提高也可能遭遇损耗、价格与流通环节压力。",evidence:"主要品类农户到手价格、冷链覆盖率、加工率与订单付款周期。",patch:{breakLink:"agri-processing",knobs:{agri:-.8}}}
];
const proof=[
 {tier:"A｜可观察",title:"2025省域增加值",body:"GDP 8108.85亿元；一产1642.55、二产1463.86、三产5002.44亿元。",url:M.DATA.source2025},
 {tier:"A｜可观察",title:"2025产业与投资",body:"规上工业增加值同比+9.9%；固定资产投资同比−16.5%。指标统计对象不同。",url:M.DATA.source2025},
 {tier:"A｜可观察",title:"2026上半年反向变化",body:"货物进出口同比+59.9%；规上工业同比−0.2%；全省固定资产投资同比−9.7%。",url:M.DATA.source2026},
 {tier:"A｜可观察",title:"全岛封关时间",body:"海南自由贸易港自2025年12月18日起正式启动全岛封关。制度变化不代表产业成效已识别。",url:M.DATA.sourceClosure},
 {tier:"C｜模型假设",title:"产业连接与传导",body:"各产业节点之间的连线、传导强度、断裂后损失均是实验机制，不是实测投入产出表或企业交易。",url:null},
 {tier:"C｜模型假设",title:"未来增长与区间",body:"2026—2030名义增长率、随机扰动、P10–P90是条件模拟设定，并非真实概率或政策效应。",url:null}
];
function loadSaved(){try{const a=JSON.parse(localStorage.getItem(STATE_KEY)||"[]");return Array.isArray(a)?a.slice(0,24):[];}catch{return[];}}
function storeSaved(){try{localStorage.setItem(STATE_KEY,JSON.stringify(state.saved));return true;}catch{return false;}}
const query=new URLSearchParams(location.search);
const init=M.sanitize({knobs:Object.fromEntries(M.LEVERS.map(k=>[k,query.has(k)?query.get(k):0])),shock:query.get("shock")||0,breakLink:query.get("cut")||"none"});
const state={controls:init,preset:"neutral",node:"port",signal:0,challenge:0,saved:loadSaved(),seed:20301116,cache:null};
function showToast(msg){const e=$("toast");e.textContent=msg;e.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>e.classList.remove("show"),2700);}
function navigate(id){if(!["discover","network","lab","blindspots","archive"].includes(id))id="discover";document.querySelectorAll(".scene").forEach(x=>x.classList.toggle("active",x.id===id));document.querySelectorAll("[data-nav]").forEach(x=>x.classList.toggle("active",x.dataset.nav===id));if(location.hash!=="#"+id)history.replaceState(null,"","#"+id);window.scrollTo({top:0,behavior:"auto"});if(id==="network")renderNetwork();if(id==="archive")renderArchive();}
function renderSignals(){
 $("signalCards").innerHTML=signals.map((s,i)=>'<button type="button" class="signal-card '+(state.signal===i?"active":"")+'" data-signal="'+i+'" aria-pressed="'+(state.signal===i)+'"><span class="tag">'+s.period+'</span><strong class="'+(s.value.includes("−")?"negative":"positive")+'">'+s.value+'</strong><p>'+s.title+'</p><small>'+s.subtitle+'</small></button>').join("");
 const a=signals[state.signal];$("signalTitle").textContent=a.question;$("signalBody").textContent=a.body;$("signalCaveat").textContent="研究边界 · "+a.caveat;
 document.querySelectorAll("[data-signal]").forEach(b=>b.addEventListener("click",()=>{state.signal=Number(b.dataset.signal);state.node=signals[state.signal].node;renderSignals();}));
}
function nById(id){return nodes.find(n=>n.id===id);}
function curve(a,b,index){const dx=b.x-a.x,dy=b.y-a.y;const bend=(index%2?1:-1)*Math.min(37,Math.hypot(dx,dy)*.12);const mx=(a.x+b.x)/2+(-dy/Math.max(1,Math.hypot(dx,dy)))*bend,my=(a.y+b.y)/2+(dx/Math.max(1,Math.hypot(dx,dy)))*bend;return 'M '+a.x+' '+a.y+' Q '+mx+' '+my+' '+b.x+' '+b.y;}
function renderNetwork(){
 const chosen=state.node,c=state.controls,edgeMarkup=edges.map((e,i)=>{
  const a=nById(e.from),b=nById(e.to),adjacent=e.from===chosen||e.to===chosen,broken=M.BREAKS[c.breakLink].edge&&M.BREAKS[c.breakLink].edge.join("-")===e.from+"-"+e.to;
  const amount=1+Math.max(-2,c.knobs[e.lever]||0)*.35;
  return '<path class="graph-edge '+(adjacent?"connected":"dim")+'" d="'+curve(a,b,i)+'" style="stroke-width:'+(adjacent?Math.max(2,amount*2.7):1.6)+';'+(broken?"stroke:#ff8398;stroke-dasharray:2 10;":"")+'"><title>'+esc(e.label)+(broken?"（模型假设断裂）":"（假设联系）")+'</title></path>';
 }).join("");
 const nodeMarkup=nodes.map(n=>{
  const active=n.id===chosen,rel=edges.some(e=>(e.from===chosen&&e.to===n.id)||(e.to===chosen&&e.from===n.id));
  return '<g class="graph-node '+(active?"selected":!rel?"dim":"")+'" data-node="'+n.id+'" tabindex="0" role="button" aria-label="查看'+n.name+'的产业联系" aria-pressed="'+active+'"><circle class="core" cx="'+n.x+'" cy="'+n.y+'" r="34"/><text class="node-icon" x="'+n.x+'" y="'+(n.y-2)+'">'+n.icon+'</text><text class="node-name" x="'+n.x+'" y="'+(n.y+51)+'">'+n.name+'</text><text class="node-role" x="'+n.x+'" y="'+(n.y+66)+'">'+n.role+'</text></g>';
 }).join("");
 $("networkSvg").innerHTML='<defs><radialGradient id="netbg"><stop stop-color="#1d7080" stop-opacity=".27"/><stop offset="1" stop-color="#0c2038" stop-opacity="0"/></radialGradient></defs><ellipse cx="390" cy="265" rx="325" ry="213" fill="url(#netbg)"/>'+edgeMarkup+nodeMarkup;
 $("nodeEmoji").textContent=nById(chosen).icon;$("nodeTitle").textContent=nById(chosen).name;$("nodeIntro").textContent=nById(chosen).desc;$("nodeGap").textContent=nById(chosen).gap;
 const connected=edges.filter(e=>e.from===chosen||e.to===chosen);
 $("nodeLinks").innerHTML=connected.map(e=>'<span title="机制假设">'+esc(e.label)+' · '+esc(nById(e.from===chosen?e.to:e.from).name)+'</span>').join("");
 $("networkSvg").querySelectorAll("[data-node]").forEach(el=>{
  const click=()=>{state.node=el.dataset.node;renderNetwork();};el.addEventListener("click",click);
  el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();click();}});
 });
}
function renderPresets(){
 $("presets").innerHTML=Object.entries(M.PRESETS).map(([id,p])=>'<button type="button" class="preset '+(state.preset===id?"active":"")+'" data-preset="'+id+'" aria-pressed="'+(state.preset===id)+'">'+p.name+' <span style="opacity:.55">· '+p.tag+'</span></button>').join("");
 $("presets").querySelectorAll("[data-preset]").forEach(el=>el.addEventListener("click",()=>{const id=el.dataset.preset;state.preset=id;state.controls=M.sanitize(M.PRESETS[id]);renderAll();}));
}
function sliderLabel(v){return v===0?"中性 0":v>0?"增强 +"+fmt(v,1):"减弱 "+fmt(v,1);}
function renderControls(){
 $("controls").innerHTML=M.LEVERS.map(k=>{
  const n=state.controls.knobs[k];return '<div class="control-row"><label class="control-label" for="range-'+k+'"><span>'+M.LABELS[k]+'</span><b id="out-'+k+'">'+sliderLabel(n)+'</b></label><input id="range-'+k+'" type="range" min="-2" max="2" step=".1" value="'+n+'" aria-label="'+M.LABELS[k]+'模型条件调整"><div class="range-edge"><span>弱化</span><span>中性</span><span>增强</span></div></div>';
 }).join("");
 M.LEVERS.forEach(k=>$("range-"+k).addEventListener("input",e=>{
  state.controls.knobs[k]=Number(e.target.value);state.preset="custom";$("out-"+k).textContent=sliderLabel(state.controls.knobs[k]);updateOutputs();
 }));
 $("shock").value=state.controls.shock;$("shockLabel").textContent=state.controls.shock+" / 100";
 const breakEl=$("breakLink");breakEl.innerHTML=Object.entries(M.BREAKS).map(([id,v])=>'<option value="'+id+'">'+esc(v.label)+'</option>').join("");
 breakEl.value=state.controls.breakLink;
}
function pathFrom(points,fn){return points.map((p,i)=>(i?"L":"M")+fn(p).join(" ")).join(" ");}
function renderTrajectory(a,b){
 const chart=$("trajectory"),W=760,H=345,L=63,R=26,T=23,B=290;
 const all=[...a.series,...b.series],lower=Math.min(...all.map(s=>s.p10))*.96,upper=Math.max(...all.map(s=>s.p90))*1.04;
 const x=y=>L+(y-2025)/5*(W-L-R),y=v=>B-(v-lower)/(upper-lower)*(B-T);
 const area=s=>pathFrom(s,p=>[x(p.year),y(p.p90)])+" "+pathFrom(s.slice().reverse(),p=>[x(p.year),y(p.p10)]).replace(/^M/,"L")+" Z";
 const line=s=>pathFrom(s,p=>[x(p.year),y(p.p50)]);
 let svg='';
 for(let i=0;i<5;i++){let v=lower+(upper-lower)*i/4;svg+='<line x1="'+L+'" y1="'+y(v)+'" x2="'+(W-R)+'" y2="'+y(v)+'" stroke="#41617a" stroke-opacity=".5" stroke-dasharray="4 7"/><text x="'+(L-12)+'" y="'+(y(v)+4)+'" text-anchor="end" fill="#8cb1c5" font-size="11">'+fmt(v,0)+'</text>';}
 for(let year=2025;year<=2030;year++)svg+='<text x="'+x(year)+'" y="320" text-anchor="middle" fill="#9bbed0" font-size="12">'+year+'</text>';
 svg+='<path d="'+area(a.series)+'" fill="#6cafff" fill-opacity=".13"/><path d="'+area(b.series)+'" fill="#51dcca" fill-opacity=".17"/>';
 svg+='<path d="'+line(a.series)+'" stroke="#76baff" stroke-width="3.4" fill="none"/><path d="'+line(b.series)+'" stroke="#65ebd3" stroke-width="4" fill="none"/>';
 for(const s of [a,b]){const v=s.finish;svg+='<circle cx="'+x(2030)+'" cy="'+y(v.p50)+'" r="5" fill="'+(s===a?"#76baff":"#65ebd3")+'"/>';}
 svg+='<text x="'+(W-R-1)+'" y="'+(y(b.finish.p50)-12)+'" text-anchor="end" font-size="12" fill="#8bf5dc">你的世界</text>';
 svg+='<text x="64" y="13" font-size="11" fill="#829eae">亿元 · 2025现价基数 + 假设名义路径</text>';
 chart.innerHTML=svg;
}
function renderComposition(result){
 const sectors=result.active.finish.sectors.map(x=>x.p50),share=result.active.composition;
 const colors=["#6ec9a7","#78a9ef","#e6b57b"];
 $("composition").innerHTML='<div class="composition-title"><strong>你设定的2030三产结构</strong><span>条件演示 · 份额不等于行业竞争力</span></div><div class="composition-track">'+share.map((v,i)=>'<span style="width:'+v+'%;background:'+colors[i]+'"></span>').join("")+'</div><div class="composition-names">'+share.map((v,i)=>'<span style="color:'+colors[i]+'">● '+M.SECTOR_NAMES[i]+' <b>'+fmt(v,1)+'%</b></span>').join("")+'</div>';
}
function renderSensitivity(){
 const list=M.sensitivity(state.controls,{seed:state.seed}),max=Math.max(.1,...list.map(x=>Math.abs(x.span)));
 $("sensitivityBars").innerHTML=list.map(z=>'<div class="sensitivity-row"><span>'+z.name+'</span><span class="sensitivity-track"><i style="width:'+fmt(Math.abs(z.span)/max*100,1)+'%"></i></span><strong>'+signed(z.span,0)+' 亿</strong></div>').join("");
}
function updateOutputs(){
 const result=M.compare(state.controls,{seed:state.seed}),c=state.controls;
 state.cache=result;
 $("baselineValue").textContent=fmt(result.base.finish.p50,0)+"亿";
 $("scenarioValue").textContent=fmt(result.active.finish.p50,0)+"亿";
 $("deltaValue").className=result.delta>1?"positive":result.delta< -1?"negative":"";
 $("deltaValue").textContent=signed(result.delta,0)+"亿";
 $("deltaPct").textContent="相对对照 "+signed(result.pct,1)+"%（模型内差异）";
 renderTrajectory(result.base,result.active);renderComposition(result);
 const key=Object.keys(c.knobs).sort((a,b)=>Math.abs(c.knobs[b])-Math.abs(c.knobs[a]))[0],strong=Math.abs(c.knobs[key])>.05?M.LABELS[key]:"各项条件中性";
 const diffs=result.sectorDelta.map((d,i)=>({n:M.SECTOR_NAMES[i],d})).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));
 const breakInfo=M.BREAKS[c.breakLink];
 $("deltaNarrative").innerHTML='<strong>当前敏感信号：</strong>'+esc(strong)+'。本轮三次产业的2030模型中位差异，以<strong>'+esc(diffs[0].n)+'</strong>变化幅度最大（'+signed(diffs[0].d,0)+'假设亿元）。'+(c.breakLink!=="none"?"<br>你断开了“"+esc(breakInfo.label)+"”，模型按预设扣减相关环节。":"")+'<br>这只说明<strong>在设定系数下</strong>结果如何变化，不能证明现实中的产业贡献或政策收益。';
 renderSensitivity();renderArchive();renderPresets();renderNetwork();
}
function renderAll(){renderPresets();renderControls();updateOutputs();}
function renderChallenges(){
 $("challengeGrid").innerHTML=challenges.map((z,i)=>'<button type="button" class="challenge '+(i===state.challenge?"active":"")+'" data-challenge="'+i+'" aria-pressed="'+(i===state.challenge)+'"><span class="num">RED TEAM / 0'+(i+1)+'</span><h3>'+z.name+'</h3><p>'+z.short+'</p></button>').join("");
 const c=challenges[state.challenge];$("blindTitle").textContent=c.name;$("blindReason").textContent=c.why;$("blindEvidence").textContent=c.evidence;
 $("challengeGrid").querySelectorAll("[data-challenge]").forEach(el=>el.addEventListener("click",()=>{state.challenge=Number(el.dataset.challenge);renderChallenges();}));
}
function renderEvidence(){
 $("evidenceList").innerHTML=proof.map(p=>'<div class="evidence-item"><span class="evidence-tag '+(p.url?"":"assumption")+'">'+esc(p.tier)+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.body)+'</p>'+(p.url?'<a href="'+p.url+'" target="_blank" rel="noopener noreferrer">查看原始出处 ↗</a>':'<span class="footnote">暂无可识别的实测系数</span>')+'</div>').join("");
}
function renderArchive(){
 const c=state.cache||M.compare(state.controls,{seed:state.seed});
 $("archiveSummary").textContent=state.preset==="custom"?"自定义的海南2030情景":(M.PRESETS[state.preset]||M.PRESETS.neutral).name;
 const data=[["真实起点","2025 GDP "+fmt(M.DATA.gdp,2)+"亿元"],["模型版本",c.active.modelVersion],["假设版本",c.active.assumptionVersion],["随机种子",String(state.seed)],["2030条件中位数",fmt(c.active.finish.p50,0)+"假设亿元"],["对照差异",signed(c.delta,0)+"假设亿元"],["中位模型分位区间",fmt(c.active.finish.p10,0)+"至"+fmt(c.active.finish.p90,0)+"假设亿元"]];
 $("archiveStats").innerHTML=data.map(row=>'<div class="archive-stat"><span>'+row[0]+'</span><strong>'+row[1]+'</strong></div>').join("");
 const list=$("savedList");if(!state.saved.length){list.innerHTML='<div class="empty-state">还没有保存的世界。回到推演页，改变一项条件试试。</div>';return;}
 list.innerHTML=state.saved.map((s,i)=>'<div class="saved-item"><div><strong>'+esc(s.title)+'</strong><small>'+esc(s.timestamp)+' · 2030中位 '+fmt(s.p50,0)+'假设亿元</small></div><button type="button" data-load="'+i+'">重开实验</button></div>').join("");
 list.querySelectorAll("[data-load]").forEach(el=>el.addEventListener("click",()=>{
  const s=state.saved[Number(el.dataset.load)];state.controls=M.sanitize(s.controls);state.seed=s.seed||20301116;state.preset="custom";renderAll();navigate("lab");showToast("已重新运行保存的假设条件");
 }));
}
function saveExperiment(){
 const c=state.cache||M.compare(state.controls,{seed:state.seed});
 const p={title:state.preset==="custom"?"自定义条件":M.PRESETS[state.preset].name,timestamp:new Date().toLocaleString("zh-CN"),controls:M.sanitize(state.controls),seed:state.seed,p50:c.active.finish.p50,dataVersion:c.active.dataVersion,modelVersion:c.active.modelVersion};
 state.saved.unshift(p);state.saved=state.saved.slice(0,24);
 if(storeSaved())showToast("已保存到当前浏览器");else showToast("浏览器禁止本地存储，保存未成功");
 renderArchive();
}
function shareLink(){
 const q=new URLSearchParams();M.LEVERS.forEach(k=>{if(state.controls.knobs[k]!==0)q.set(k,state.controls.knobs[k]);});
 if(state.controls.shock)q.set("shock",state.controls.shock);if(state.controls.breakLink!=="none")q.set("cut",state.controls.breakLink);
 const url=location.origin+location.pathname+"?"+q.toString()+"#lab";
 if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(url).then(()=>showToast("已复制可以复现条件的链接")).catch(()=>window.prompt("复制下面的实验链接",url));}
 else window.prompt("复制下面的实验链接",url);
}
function exportSummary(){
 const c=state.cache||M.compare(state.controls,{seed:state.seed});
 const t=["海南岛产业决策风洞 · 条件实验摘要","记录时间："+new Date().toLocaleString("zh-CN"),
 "数据基准：2025年海南省统计公报，GDP 8108.85亿元，三产1642.55/1463.86/5002.44亿元",
 "2026年上半年官方信号仅供事实观察，不直接用于拟合未来增长","未来年增长率、模型联动系数、随机区间全部是未经经验估计的假设",
 "模型："+c.active.modelVersion+" / "+c.active.assumptionVersion,"种子："+state.seed,
 "参数："+JSON.stringify(state.controls),"2030模型P10/P50/P90："+["p10","p50","p90"].map(k=>fmt(c.active.finish[k],0)).join("/"),
 "相对默认对照P50变化："+signed(c.delta,0)+"假设亿元",
 "研究前提与缺口：需核实真实企业采购来源、项目兑现、产业分类、工资与就业，不得把演示模型当政策效果。",
 "官方来源："+M.DATA.source2025+"；"+M.DATA.source2026].join("\n");
 const blob=new Blob([t],{type:"text/plain;charset=utf-8"});const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download="海南岛产业风洞-条件实验.txt";a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);showToast("研究摘要已生成");
}
function wire(){
 document.querySelectorAll("[data-nav]").forEach(el=>el.addEventListener("click",()=>navigate(el.dataset.nav)));
 document.querySelectorAll("[data-jump]").forEach(el=>el.addEventListener("click",()=>navigate(el.dataset.jump)));
 window.addEventListener("hashchange",()=>navigate(location.hash.slice(1)));
 $("reset").addEventListener("click",()=>{state.controls=M.sanitize(M.PRESETS.neutral);state.preset="neutral";renderAll();showToast("恢复默认研究假设");});
 $("shock").addEventListener("input",e=>{state.controls.shock=Number(e.target.value);state.preset="custom";$("shockLabel").textContent=state.controls.shock+" / 100";updateOutputs();});
 $("breakLink").addEventListener("change",e=>{state.controls.breakLink=e.target.value;state.preset="custom";updateOutputs();});
 $("saveExperiment").addEventListener("click",saveExperiment);$("saveArchive").addEventListener("click",saveExperiment);
 $("shareExperiment").addEventListener("click",shareLink);$("exportArchive").addEventListener("click",exportSummary);
 $("applyChallenge").addEventListener("click",()=>{const p=challenges[state.challenge].patch;
  state.controls=M.sanitize({...state.controls,knobs:{...state.controls.knobs,...(p.knobs||{})},shock:p.shock??state.controls.shock,breakLink:p.breakLink||state.controls.breakLink});
  state.preset="custom";renderAll();navigate("lab");showToast("已将怀疑作为新的假设条件运行");
 });
}
renderSignals();renderEvidence();renderChallenges();wire();renderAll();
navigate(location.hash.replace("#","")||"discover");
})();