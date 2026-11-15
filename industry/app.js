/* Hainan Research Wind Tunnel UI 1.0
 * Independent application; all future trajectories explicitly conditional.
 */
(function(){
"use strict";
const M=window.HainanModel,$=id=>document.getElementById(id);
if(!M){document.body.textContent="研究引擎未载入";return;}
const f=(v,d=1)=>Number(v).toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d});
const plus=(v,d=1)=>(v>0?"+":"")+f(v,d);
const esc=s=>String(s).replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const KEY="HAINAN_SCIENTIFIC_WIND_V1",SERIES=M.historical();
function getSaved(){try{let s=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(s)?s.slice(0,25):[];}catch{return[];}}
const query=new URLSearchParams(location.search);
const init=M.sanitize({rates:M.RATE_META.map((p,i)=>query.has("r"+i)?query.get("r"+i):M.BASE_RATES[i]),shock:query.get("shock")??0,model:query.get("model")??"constant",volatility:query.get("vol")??1,breakLink:query.get("cut")??"none",localShare:query.get("local")??50,supplierVA:query.get("va")??45,diffusion:query.get("diffusion")??.45});
const state={controls:init,preset:"neutral",signal:0,node:"port",challenge:0,seed:20261116,saved:getSaved(),result:null,selectedYear:2025};
const SIGNALS=[
 {title:"工业加快了，投资却下滑",period:"2025全年",value:"+9.9%",subtitle:"规上工业增加值",question:"为什么规上工业增长9.9%，第二产业增加值实际只增长1.0%？",body:"规上工业与第二产业GDP不是同一统计对象，第二产业还包括建筑业。2025年建筑业增加值实际下降10.4%。需要核验产业内部权重、采矿与制造分项和价格。",caveat:"不同指标口径不可直接做增速加减。",node:"industry",src:"y2025"},
 {title:"货物贸易跃升，工业承压",period:"2026年1—8月",value:"+55.2%",subtitle:"货物进出口金额同比",question:"进出口增长55.2%，规上工业却下降6.2%，冲突在哪里？",body:"贸易金额与岛内工业增加值既不相同，也不具有直接的因果等价关系。可能存在加工、转口、结构组成、时间错位等多种机制。不能由此断言本地价值流失。",caveat:"进出口金额和工业增加值口径不同，不能通过二者差值计算价值外流。",node:"port",src:"y2026m8"},
 {title:"GDP仍增长，二产压力更大",period:"2026年1—9月",value:"+1.2%",subtitle:"全省GDP不变价同比",question:"为什么总量仍正增长，却不代表每个产业都同步增长？",body:"2026年前三季度实际GDP增速1.2%。产业间权重、增加值变动及会计统计修订可能使总量与分行业走势出现差别；不得直接与2025全年现价GDP作差。",caveat:"三季度累计值不是全年值，不做机械年化。",node:"services",src:"y2026q3"},
 {title:"游客花费增加，但谁得益",period:"2025全年",value:"+10.5%",subtitle:"游客总花费同比",question:"旅游消费增长，岛内企业利润和居民收入也按同样幅度增长吗？",body:"游客总花费不是旅游行业增加值，更不是劳动者收入。要判断谁得到收益，需要企业成本、采购地、平台结算与工资分布。",caveat:"不得将游客花费增长率当成服务业GDP增速。",node:"tourism",src:"y2025"}
];
const NODES=[
 {id:"port",name:"口岸物流",icon:"⚓",x:137,y:137,role:"开放通道",about:"口岸效率可能改变物流与加工机会，但吞吐或贸易扩大不自动等于本地增加值扩大。",need:"岛内企业通关实际成本、货物流向、加工和服务采购地。"},
 {id:"industry",name:"制造与能源",icon:"⚙",x:359,y:122,role:"生产部门",about:"第二产业与规上工业不同；项目从建设到增加值释放具有时滞，不能直接用固定投资同比代替产量。",need:"制造分行业实际增加值、产能利用率、建设与投产时序。"},
 {id:"services",name:"专业服务",icon:"✳",x:626,y:165,role:"能力承接",about:"本地研发、物流、数字服务、检测与外地采购之间的比重目前未知。",need:"匿名企业专业服务采购金额、供应商所在地与增加值率。"},
 {id:"tourism",name:"旅游消费",icon:"☀",x:633,y:332,role:"消费与流量",about:"游客人数和消费不能代替企业利润、岗位质量或当地税收。",need:"企业经营、旅游支出结构、岗位收入与结算去向。"},
 {id:"talent",name:"人才技能",icon:"⌘",x:433,y:271,role:"知识与技能",about:"人才留存可能影响产业配套，但目前尚无可识别的弹性系数。",need:"职业流入流出、工资与技能需求的长期样本。"},
 {id:"agri",name:"热带农业",icon:"◈",x:158,y:348,role:"生产基础",about:"农作物产量、农业增加值和农户实际收入必须分开。",need:"品类生产价格、农户到手收入与加工采购数据。"},
 {id:"processing",name:"加工冷链",icon:"❄",x:319,y:430,role:"链条转换",about:"产地加工与冷链可能减少损耗，但当前网络连接并非实测供应链。",need:"损耗率、冷链覆盖率、加工增值和支付周期。"},
 {id:"income",name:"岛内居民",icon:"⌂",x:537,y:438,role:"获得感",about:"贸易增长对就业和收入的作用需要独立核实，不可用模型网络系数推断。",need:"居民收入分布、稳定就业、城市乡村及行业分组数据。"}
];
const idName=id=>NODES.find(x=>x.id===id)?.name||id;
const edges=M.EDGES;
const CHALLENGES=[
 {title:"港口增长不等于产业增值",short:"贸易在扩张，本地加工与配套是否真的跟上？",evidence:"企业进出口加工环节、本地生产加工占比与结算地点",why:"货物贸易是总额指标，不是增加值。产业链本地留存只能通过采购与增加值证据估计。",patch:{breakLink:"port-service",localShare:30}},
 {title:"投资下行与产能释放错位",short:"项目什么时候投产？存量产能能支撑多久？",evidence:"项目开工完工投产日期、分行业产能、库存与利用率",why:"固定资产投资是流量，工业增加值主要来自当期生产，两者不必同向。",patch:{rates:[3,0,4.5],model:"delay"}},
 {title:"旅游热，居民未必同步受益",short:"游客总花费、商户利润、居民工资分别是多少？",evidence:"住宿餐饮利润、订单渠道、劳动者收入与地方采购比例",why:"花费经过中间投入、税费、平台与人工环节才形成收入；不能把花费当增加值。",patch:{rates:[3,4,2],localShare:20}},
 {title:"冷链断点放大农户风险",short:"产量增加，损耗和账期会改变谁的获得感？",evidence:"农产品实际收购价、冷链利用率、加工成本与账期",why:"农业增加值、企业现金周转与农户收入是不同层级变量，当前不具备跨层估计数据。",patch:{breakLink:"agri-processing",rates:[1,4,4.5]}}
];
const integrity=M.integrity();
function toast(message){let el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2500);}
function goto(page){if(!["discover","network","lab","blindspots","archive"].includes(page))page="discover";document.querySelectorAll(".scene").forEach(el=>el.classList.toggle("active",el.id===page));document.querySelectorAll("[data-nav]").forEach(el=>el.classList.toggle("active",el.dataset.nav===page));if(location.hash!=="#"+page)history.replaceState(null,"","#"+page);window.scrollTo({top:0,behavior:"instant"});if(page==="archive")showArchive();}
function signals(){
 $("signalCards").innerHTML=SIGNALS.map((s,i)=>'<button type="button" class="signal-card '+(state.signal===i?"active":"")+'" data-signal="'+i+'" aria-pressed="'+(state.signal===i)+'"><span class="tag">'+s.period+'</span><strong class="'+(s.value.startsWith("-")?"negative":"positive")+'">'+s.value+'</strong><p>'+s.title+'</p><small>'+s.subtitle+'</small></button>').join("");
 const v=SIGNALS[state.signal];$("signalTitle").textContent=v.question;$("signalBody").textContent=v.body;$("signalCaveat").textContent="边界提醒："+v.caveat;state.node=v.node;
 document.querySelectorAll("[data-signal]").forEach(b=>b.addEventListener("click",()=>{state.signal=Number(b.dataset.signal);signals();graph();}));
}
function historyPanel(){
 const container=document.createElement("section");container.className="card";container.style.padding="24px";container.style.marginTop="22px";container.id="historyPanel";
 container.innerHTML='<div class="section-head tight"><div><span class="kicker">2020—2025 · FACTS ONLY</span><h2>六年产业构成：哪些真正发生变化？</h2></div></div><div class="research-year-tabs" id="yearTabs"></div><svg id="historyChart" viewBox="0 0 840 280" role="img" aria-label="海南三次产业六年增加值及其结构变化" style="width:100%;max-height:310px"></svg><div id="historicalStats" class="fact-ribbon" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-top:0"></div><p class="footnote">2020—2025各点取自对应年度初始统计公报，未进行跨期修订版统一处理。历史现价增加值的差异不能等同实际GDP增长贡献。</p>';
 $("signalCards").before(container);
 const sectorColors=["#7cd6b1","#83b9f3","#f2c48f"],xs=y=>69+(y-2020)*138,yy=v=>230-v/5000*190;
 let markup="";for(let i=0;i<=5;i++){const t=i*1000;markup+='<line x1="60" y1="'+yy(t)+'" x2="790" y2="'+yy(t)+'" stroke="#355470" opacity=".35"/><text x="51" y="'+(yy(t)+3)+'" text-anchor="end" font-size="11" fill="#a6bdce">'+t+'</text>';}
 for(let s=0;s<3;s++){markup+='<path d="'+SERIES.map((row,i)=>(i?"L":"M")+xs(row.year)+" "+yy(row.sectors[s])).join(" ")+'" stroke="'+sectorColors[s]+'" fill="none" stroke-width="3"/>';
  for(const row of SERIES)markup+='<circle cx="'+xs(row.year)+'" cy="'+yy(row.sectors[s])+'" r="4" fill="'+sectorColors[s]+'"><title>'+row.year+" "+M.SECTOR_NAMES[s]+" "+f(row.sectors[s],2)+"亿元</title></circle>";}
 for(const row of SERIES)markup+='<text x="'+xs(row.year)+'" y="260" text-anchor="middle" font-size="12" fill="#a7c9d9">'+row.year+'</text>';
 markup+='<text x="60" y="13" font-size="12" fill="#acc6d1">亿元 · 当年公布的现价增加值</text>';
 $("historyChart").innerHTML=markup;
 $("yearTabs").innerHTML=SERIES.map(row=>'<button type="button" class="preset '+(row.year===state.selectedYear?"active":"")+'" data-year="'+row.year+'">'+row.year+'</button>').join("");
 $("yearTabs").querySelectorAll("[data-year]").forEach(b=>b.addEventListener("click",()=>{state.selectedYear=Number(b.dataset.year);updateHistory();}));
 updateHistory();
}
function updateHistory(){
 const row=SERIES.find(z=>z.year===state.selectedYear);
 $("yearTabs").querySelectorAll("[data-year]").forEach(b=>b.classList.toggle("active",Number(b.dataset.year)===state.selectedYear));
 $("historicalStats").innerHTML=row.sectors.map((v,i)=>'<div><span>'+M.SECTOR_NAMES[i]+' · 现价增加值</span><strong style="font-size:clamp(20px,2vw,26px);color:'+["#7cd6b1","#83b9f3","#f2c48f"][i]+'">'+f(v,1)+'亿</strong><small>结构占比 '+f(row.shares[i],1)+'%</small></div>').join("");
}
function graph(){
 const chosen=state.node,broken=M.BREAKS[state.controls.breakLink];
 const a=new Map(NODES.map(n=>[n.id,n]));
 const edgeMarkup=edges.map((e,i)=>{
  const n=a.get(e.from),m=a.get(e.to),highlight=e.from===chosen||e.to===chosen,isCut=broken.from===e.from&&broken.to===e.to;
  const dx=m.x-n.x,dy=m.y-n.y,dist=Math.max(1,Math.hypot(dx,dy)),bend=(i%2?1:-1)*Math.min(36,dist*.12);
  const qx=(n.x+m.x)/2+(-dy/dist)*bend,qy=(n.y+m.y)/2+(dx/dist)*bend;
  return '<path class="graph-edge '+(highlight?"connected":"dim")+'" d="M'+n.x+' '+n.y+' Q'+qx+' '+qy+' '+m.x+' '+m.y+'" style="'+(isCut?"stroke:#ff8398;stroke-width:4;stroke-dasharray:2 12;":"")+'"><title>假设关系 '+idName(e.from)+' → '+idName(e.to)+(isCut?"【已断开】":"")+'</title></path>';
 }).join("");
 $("networkSvg").innerHTML='<ellipse cx="390" cy="260" rx="330" ry="223" fill="#1b5265" fill-opacity=".10"/>'+edgeMarkup+NODES.map(n=>{
  const selected=n.id===chosen,related=edges.some(e=>(e.from===chosen&&e.to===n.id)||(e.to===chosen&&e.from===n.id));
  return '<g class="graph-node '+(selected?"selected":related?"":"dim")+'" data-node="'+n.id+'" role="button" tabindex="0" aria-label="查看 '+n.name+' 假设网络节点"><circle class="core" cx="'+n.x+'" cy="'+n.y+'" r="34"/><text class="node-icon" x="'+n.x+'" y="'+n.y+'">'+n.icon+'</text><text class="node-name" x="'+n.x+'" y="'+(n.y+54)+'">'+n.name+'</text><text class="node-role" x="'+n.x+'" y="'+(n.y+69)+'">'+n.role+'</text></g>';
 }).join("");
 const n=a.get(chosen),stress=M.propagation(state.controls,chosen),reached=Object.entries(stress.exposure).filter(([k,v])=>k!==chosen&&v>1e-9);
 $("nodeEmoji").textContent=n.icon;$("nodeTitle").textContent=n.name;
 $("nodeIntro").textContent=n.about+"。在当前假设有向图中，三轮内可传至"+reached.length+"个其他功能节点。这是图结构可达，不是经济受损企业数。";
 $("nodeGap").textContent=n.need;
 $("nodeLinks").innerHTML=edges.filter(e=>e.from===chosen||e.to===chosen).map(e=>'<span>'+idName(e.from===chosen?e.to:e.from)+' · 候选关联</span>').join("");
 $("networkSvg").querySelectorAll("[data-node]").forEach(b=>{const fn=()=>{state.node=b.dataset.node;graph();};b.addEventListener("click",fn);b.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();fn();}});});
}
function presets(){
 $("presets").innerHTML=Object.entries(M.PRESETS).map(([id,p])=>'<button class="preset '+(state.preset===id?"active":"")+'" type="button" data-preset="'+id+'" aria-pressed="'+(state.preset===id)+'">'+p.name+' <span style="opacity:.55">· '+p.tag+'</span></button>').join("");
 $("presets").querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>{state.preset=b.dataset.preset;state.controls=M.sanitize(M.PRESETS[state.preset]);drawAll();}));
}
function controls(){
 $("controls").innerHTML=M.RATE_META.map((meta,i)=>'<div class="control-row"><label class="control-label" for="rate'+i+'"><span>'+meta.label+'</span><b id="rateLabel'+i+'">'+plus(state.controls.rates[i],1)+'%</b></label><input type="range" id="rate'+i+'" data-rate="'+i+'" min="'+meta.min+'" max="'+meta.max+'" step=".5" value="'+state.controls.rates[i]+'"><div class="range-edge"><span>−名义变化</span><span>设定假设</span><span>+名义变化</span></div></div>').join("");
 $("controls").querySelectorAll("[data-rate]").forEach(b=>b.addEventListener("input",()=>{const k=Number(b.dataset.rate);state.controls.rates[k]=Number(b.value);state.preset="custom";$("rateLabel"+k).textContent=plus(state.controls.rates[k],1)+"%";renderResults();}));
 $("shock").min="0";$("shock").max="8";$("shock").step=".5";$("shock").value=state.controls.shock;$("shockLabel").textContent=state.controls.shock+"个百分点";
 $("breakLink").innerHTML=Object.entries(M.BREAKS).map(([id,b])=>'<option value="'+id+'">'+b.label+'</option>').join("");$("breakLink").value=state.controls.breakLink;
 const panel=document.createElement("div");panel.id="researchControls";panel.className="research-controls";
 panel.innerHTML='<label class="control-label" for="vol">假设随机扰动幅度 <b id="volOut"></b></label><input type="range" id="vol" min="0" max="2.5" step=".1">'+
 '<label class="control-label" for="modelType">未来条件演化机制</label><select class="select" id="modelType">'+Object.entries(M.MODELS).map(([id,m])=>'<option value="'+id+'">'+m.name+'</option>').join("")+'</select>'+
 '<p class="footnote">三个机制分别是恒定、回归与兑现滞后，均未被现实数据确认。下方单独展示模型结构分歧。</p>'+
 '<div class="info-divider"></div><span class="eyebrow">PARTIAL IDENTIFICATION · 不冒充GDP</span>'+
 '<h3 style="font-size:16px;margin:9px 0">每100单位服务采购，假设价值如何留岛？</h3>'+
 '<label class="control-label" for="localShare">假设本地采购比例 <b id="localOut"></b></label><input type="range" id="localShare" min="0" max="100" step="5">'+
 '<label class="control-label" for="supplierVA">假设本地供应商增加值率 <b id="vaOut"></b></label><input type="range" id="supplierVA" min="0" max="100" step="5">'+
 '<div id="localResult" class="local-result"></div><p class="footnote">真实采购份额及增加值率均尚未观测，无法识别真实留存水平；该实验与GDP路径隔离。</p>';
 $("controls").after(panel);
 for(const [id,key] of [["vol","volatility"],["localShare","localShare"],["supplierVA","supplierVA"]]){
  $(id).value=state.controls[key];$(id).addEventListener("input",e=>{state.controls[key]=Number(e.target.value);state.preset="custom";renderResults();});
 }
 $("modelType").value=state.controls.model;$("modelType").addEventListener("change",e=>{state.controls.model=e.target.value;state.preset="custom";renderResults();});
}
function trajectory(a,b){
 const W=760,H=345,L=64,R=27,T=19,B=286,all=[...a.series,...b.series],min=Math.min(...all.map(s=>s.p10))*.97,max=Math.max(...all.map(s=>s.p90))*1.03;
 const x=year=>L+(year-2025)/5*(W-L-R),y=v=>B-(v-min)/(max-min)*(B-T);
 const path=(rows,key)=>rows.map((p,i)=>(i?"L":"M")+x(p.year)+" "+y(p[key])).join(" ");
 const area=rows=>path(rows,"p90")+" "+path(rows.slice().reverse(),"p10").replace(/^M/,"L")+"Z";
 let svg="";
 for(let i=0;i<5;i++){let v=min+(max-min)*i/4;svg+='<line x1="'+L+'" y1="'+y(v)+'" x2="'+(W-R)+'" y2="'+y(v)+'" stroke="#547086" opacity=".35" stroke-dasharray="3 7"/><text x="'+(L-8)+'" y="'+(y(v)+4)+'" text-anchor="end" fill="#97b2c0" font-size="11">'+f(v,0)+'</text>';}
 for(let y0=2025;y0<=2030;y0++)svg+='<text x="'+x(y0)+'" y="318" text-anchor="middle" fill="#a9c7d4" font-size="12">'+y0+'</text>';
 svg+='<path d="'+area(a.series)+'" fill="#6fafff" fill-opacity=".12"/><path d="'+area(b.series)+'" fill="#65e4d2" fill-opacity=".18"/>';
 svg+='<path d="'+path(a.series,"p50")+'" fill="none" stroke="#81b7ff" stroke-width="3"/><path d="'+path(b.series,"p50")+'" fill="none" stroke="#6cebd7" stroke-width="3.5"/>';
 svg+='<circle cx="'+x(2030)+'" cy="'+y(b.finish.p50)+'" r="5" fill="#6cebd7"/>';
 svg+='<text x="65" y="12" fill="#acc4d2" font-size="11">假设亿元：2025现价起点，非预测</text>';
 $("trajectory").innerHTML=svg;
}
function renderResults(){
 const c=state.controls,r=M.compare(c,{seed:state.seed,draws:400});state.result=r;
 $("baselineValue").textContent=f(r.base.finish.p50,0)+"亿";$("scenarioValue").textContent=f(r.active.finish.p50,0)+"亿";
 $("deltaValue").textContent=plus(r.delta,0)+"亿";$("deltaValue").className=r.delta>1?"positive":r.delta< -1?"negative":"";
 $("deltaPct").textContent="相对中性假设 "+plus(r.pct,1)+"% · 非因果效应";
 trajectory(r.base,r.active);
 const colors=["#6ec9a7","#78a9ef","#e6b57b"];
 $("composition").innerHTML='<div class="composition-title"><strong>你的2030三次产业构成</strong><span>模型中位数的份额</span></div><div class="composition-track">'+r.active.composition.map((v,i)=>'<span style="width:'+v+'%;background:'+colors[i]+'"></span>').join("")+'</div><div class="composition-names">'+r.active.composition.map((v,i)=>'<span style="color:'+colors[i]+'">● '+M.SECTOR_NAMES[i]+' <b>'+f(v,1)+'%</b></span>').join("")+'</div>';
 const d=r.sectorDelta.map((v,i)=>({name:M.SECTOR_NAMES[i],v})).sort((x,y)=>Math.abs(y.v)-Math.abs(x.v));
 const robust=M.robustness(c,{seed:state.seed});
 $("deltaNarrative").innerHTML='<strong>模型内变化最大的部门：</strong>'+d[0].name+'（'+plus(d[0].v,0)+'假设亿元）。<br><strong>换一种演化机制：</strong>2030中位数在'+f(robust.span[0],0)+'—'+f(robust.span[1],0)+'假设亿元之间。此为三种结构假设的分歧，不能当置信区间。';
 const sens=M.sensitivity(c,{seed:state.seed}),max=Math.max(.1,...sens.map(x=>Math.abs(x.span)));
 $("sensitivityBars").innerHTML=sens.map(z=>'<div class="sensitivity-row"><span>'+z.name.replace("：名义年变动假设","")+'</span><span class="sensitivity-track"><i style="width:'+f(Math.abs(z.span)/max*100,1)+'%"></i></span><strong>'+plus(z.span,0)+'亿</strong></div>').join("")+
 '<div class="robustness"><strong>竞争机制对照 · 不是预测准确率</strong>'+
 robust.variants.map(x=>'<div class="archive-stat"><span>'+x.name+'</span><b>'+f(x.p50,0)+'假设亿元</b></div>').join("")+'</div>';
 $("volOut").textContent=f(c.volatility,1);$("localOut").textContent=c.localShare+"%";$("vaOut").textContent=c.supplierVA+"%";
 const a=M.accounting({localShare:c.localShare,supplierVA:c.supplierVA});
 $("localResult").innerHTML='<div class="archive-stat"><span>本地采购支付</span><strong>'+f(a.localPurchase,1)+'/100</strong></div>'+
 '<div class="archive-stat"><span>本地假设增加值</span><strong style="color:#6ce6d4">'+f(a.localVA,1)+'/100</strong></div>'+
 '<div class="archive-stat"><span>跨区采购支付</span><strong>'+f(a.externalPurchase,1)+'/100</strong></div>'+
 '<p class="footnote">无实测约束时，真实本地增加值只可落在0至100单位宽界内；固定假设增加值率后仍为0至'+f(a.identification.fixedVAOnly[1],1)+'单位。</p>';
 presets();graph();showArchive();
}
function drawAll(){
 controlsRefresh();renderResults();
}
function controlsRefresh(){
 M.RATE_META.forEach((meta,i)=>{const el=$("rate"+i);if(el){el.value=state.controls.rates[i];$("rateLabel"+i).textContent=plus(state.controls.rates[i],1)+"%";}});
 $("shock").value=state.controls.shock;$("shockLabel").textContent=state.controls.shock+"个百分点";
 $("breakLink").value=state.controls.breakLink;$("vol").value=state.controls.volatility;$("modelType").value=state.controls.model;
 $("localShare").value=state.controls.localShare;$("supplierVA").value=state.controls.supplierVA;
}
function evidence(){
 const facts=M.SIGNALS.filter(x=>["gdp","industrial","investment","secondary","construction","tradegoods","tradeservices","tourism","gdpQ3","industrial8","trade8","invest8"].includes(x.id));
 $("evidenceList").innerHTML=facts.map(x=>'<article class="evidence-item"><span class="evidence-tag">'+x.tier+' · '+esc(x.period)+'</span><h3>'+esc(x.name)+'</h3><p style="font-size:23px;font-weight:800;color:#dcf7fa">'+plus(x.value,x.unit==="%"?1:2)+x.unit+'</p><p>'+esc(x.unitType)+'，仅是官方披露指标。</p><a href="'+M.SOURCES[x.src]+'" target="_blank" rel="noopener noreferrer">原始来源 ↗</a></article>').join("")+
 '<article class="evidence-item"><span class="evidence-tag assumption">H · 关系假设</span><h3>8节点13条候选关系</h3><p>没有实际企业交易边、没有可识别投入产出权重。</p></article>'+
 '<article class="evidence-item"><span class="evidence-tag assumption">C · 条件假设</span><h3>未来名义轨迹</h3><p>年增速、扰动、传导轮数均由用户或研究者直接假设，未做历史参数校准。</p></article>';
 const panel=document.createElement("div");panel.className="card";panel.style.padding="22px";panel.style.margin="20px 0";
 panel.innerHTML='<span class="eyebrow">METHOD ADMISSION / 研究准入</span><h3 style="margin:8px 0">哪些研究已能运行，哪些必须等证据？</h3><div class="method-grid">'+[
  ["已运行","历史三产描述与结构差异","使用不同年份初始公报，严禁解释为可比不变价增长"],
  ["已运行","规范化采购会计与部分识别","采购份额未知，无法得到实际本地价值留存"],
  ["演示","候选有向网络的三轮传播","8节点13边均为假设，结果是无量纲暴露"],
  ["演示","直接名义增长条件＋三种结构机制","并非历史估计，结果只在假设范围有效"],
  ["禁止宣称","SmartPLS/SEM因果和测量质量","无真实问卷、抽样框、题项及专业软件计算"],
  ["禁止宣称","投入产出乘数与政策净收益","无已核实部门交易矩阵和外生识别"]
 ].map(([tag,title,desc])=>'<div class="method-row"><strong>'+tag+'</strong><div><b>'+title+'</b><small>'+desc+'</small></div></div>').join("")+'</div>';
 $("evidenceList").after(panel);
}
function challenge(){
 $("challengeGrid").innerHTML=CHALLENGES.map((c,i)=>'<button class="challenge '+(i===state.challenge?"active":"")+'" type="button" data-challenge="'+i+'"><span class="num">RED TEAM / 0'+(i+1)+'</span><h3>'+c.title+'</h3><p>'+c.short+'</p></button>').join("");
 const c=CHALLENGES[state.challenge];$("blindTitle").textContent=c.title;$("blindReason").textContent=c.why;$("blindEvidence").textContent=c.evidence;
 $("challengeGrid").querySelectorAll("[data-challenge]").forEach(b=>b.addEventListener("click",()=>{state.challenge=Number(b.dataset.challenge);challenge();}));
}
function showArchive(){
 const r=state.result||M.compare(state.controls,{seed:state.seed});
 $("archiveSummary").textContent=state.preset==="custom"?"自定义海南产业条件":M.PRESETS[state.preset]?.name||"中性对照";
 const rows=[["真实起点","2025 GDP "+f(M.DATA.gdp,2)+"亿元"],["模型版本",M.VERSION],["研究状态","假设未标定"],["2026Q3事实","GDP实际同比+1.2%"],["假设2030年中位数",f(r.active.finish.p50,0)+"亿元"],["对照条件差异",plus(r.delta,0)+"假设亿元"],["假设分位区间",f(r.active.finish.p10,0)+"—"+f(r.active.finish.p90,0)+"亿元"],["模拟共同随机种子",String(state.seed)]];
 $("archiveStats").innerHTML=rows.map(x=>'<div class="archive-stat"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>').join("");
 const root=$("savedList");
 if(!state.saved.length){root.innerHTML='<p class="empty-state">尚未存档。去推演页改一个条件，再保存实验。</p>';return;}
 root.innerHTML=state.saved.map((s,i)=>'<div class="saved-item"><div><strong>'+esc(s.title)+'</strong><small>'+esc(s.date)+' · '+f(s.p50,0)+'假设亿元 · '+esc(s.version)+'</small></div><button type="button" data-load="'+i+'">重跑</button></div>').join("");
 root.querySelectorAll("[data-load]").forEach(b=>b.addEventListener("click",()=>{const p=state.saved[Number(b.dataset.load)];state.controls=M.sanitize(p.controls);state.seed=p.seed;state.preset="custom";drawAll();goto("lab");toast("已按存档条件重新计算");}));
}
function save(){
 const r=state.result||M.compare(state.controls,{seed:state.seed});
 state.saved.unshift({title:state.preset==="custom"?"自定义条件":M.PRESETS[state.preset]?.name||"研究实验",date:new Date().toLocaleString("zh-CN"),controls:M.sanitize(state.controls),seed:state.seed,p50:r.active.finish.p50,version:M.VERSION});
 state.saved=state.saved.slice(0,25);
 try{localStorage.setItem(KEY,JSON.stringify(state.saved));toast("已保存于当前浏览器");}catch{state.saved.shift();toast("无法使用本地存储，保存失败");}
 showArchive();
}
function share(){
 const p=new URLSearchParams();state.controls.rates.forEach((v,i)=>p.set("r"+i,v));p.set("shock",state.controls.shock);p.set("vol",state.controls.volatility);p.set("model",state.controls.model);p.set("cut",state.controls.breakLink);p.set("local",state.controls.localShare);p.set("va",state.controls.supplierVA);
 const url=location.origin+location.pathname+"?"+p.toString()+"#lab";
 if(navigator.clipboard?.writeText)navigator.clipboard.writeText(url).then(()=>toast("可复现条件链接已复制")).catch(()=>window.prompt("复制实验链接",url));
 else window.prompt("复制实验链接",url);
}
function exportText(){
 const r=state.result||M.compare(state.controls,{seed:state.seed});
 const text=["海南岛产业风洞研究实验摘要", "生成："+new Date().toLocaleString("zh-CN"),"版本："+M.VERSION,"2025真实GDP："+M.DATA.gdp+"亿元",
 "真实信号：2026前三季度GDP实际+1.2%，2026年1—8月规上工业−6.2%，货物进出口+55.2%",
 "条件："+JSON.stringify(state.controls),"随机种子："+state.seed,
 "2030模型P10："+f(r.active.finish.p10,1)+"，P50："+f(r.active.finish.p50,1)+"，P90："+f(r.active.finish.p90,1)+"（假设亿元）",
 "与中性对照差异："+f(r.delta,1)+"假设亿元",
 "注意：未来系数未标定；网络关系是假设，不与GDP计算相连；真实服务采购比例未知；跨期公报未经统一修订；不可声称政策因果。",
 "证据："+M.SOURCES.y2025,"近期："+M.SOURCES.y2026q3].join("\n");
 const blob=new Blob([text],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="海南岛产业研究-情景档案.txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);toast("研究摘要已生成");
}
function wire(){
 document.querySelectorAll("[data-nav]").forEach(x=>x.addEventListener("click",()=>goto(x.dataset.nav)));
 document.querySelectorAll("[data-jump]").forEach(x=>x.addEventListener("click",()=>goto(x.dataset.jump)));
 window.addEventListener("hashchange",()=>goto(location.hash.slice(1)));
 $("reset").addEventListener("click",()=>{state.controls=M.sanitize(M.PRESETS.neutral);state.preset="neutral";drawAll();toast("已恢复中性条件");});
 $("shock").addEventListener("input",e=>{state.controls.shock=Number(e.target.value);state.preset="custom";$("shockLabel").textContent=state.controls.shock+"个百分点";renderResults();});
 $("breakLink").addEventListener("change",e=>{state.controls.breakLink=e.target.value;state.preset="custom";renderResults();});
 $("saveExperiment").addEventListener("click",save);$("saveArchive").addEventListener("click",save);
 $("shareExperiment").addEventListener("click",share);$("exportArchive").addEventListener("click",exportText);
 $("applyChallenge").addEventListener("click",()=>{const p=CHALLENGES[state.challenge].patch;state.controls=M.sanitize({...state.controls,...p});state.preset="custom";drawAll();goto("lab");toast("已按竞争假说重新设置条件");});
}
signals();historyPanel();challenge();evidence();controls();wire();renderResults();goto(location.hash.slice(1)||"discover");
})();